/**
 * VAG Demo Gateway — Core Logic
 *
 * Deny-by-default bounded demo gateway.
 * No external calls, no shell, no cloud, no HTTP client imports.
 */

import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

// --- Allowlist ---
const ALLOWED_INTENTS = new Set(['demo.transform_json', 'demo.ping']);

// --- Demo HMAC key (not for production, hardcoded intentionally) ---
const DEMO_HMAC_KEY = "demo-public-local-not-for-production";

// --- In-memory stores ---
const proposals = new Map();
const commits = new Map();

// --- Hex validation ---
const HEX64_RE = /^[0-9a-f]{64}$/;

/**
 * Compute SHA-256 hex digest of a string.
 */
export function sha256(data) {
  return createHash('sha256').update(data, 'utf8').digest('hex');
}

/**
 * Compute HMAC-SHA256 hex digest.
 */
function hmacSha256(data) {
  return createHmac('sha256', DEMO_HMAC_KEY).update(data, 'utf8').digest('hex');
}

/**
 * Check supplied and stored signatures against the expected record HMAC.
 * Pure helper used by verify and targeted integrity regression tests.
 */
export function verifySignatureRelationships(recordHash, suppliedSignature, storedSignature) {
  if (!HEX64_RE.test(recordHash)) {
    return false;
  }

  const expectedSignature = hmacSha256(recordHash);
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');
  const matchesExpected = (candidate) => (
    typeof candidate === 'string' &&
    HEX64_RE.test(candidate) &&
    timingSafeEqual(Buffer.from(candidate, 'hex'), expectedBuffer)
  );

  return matchesExpected(suppliedSignature) && matchesExpected(storedSignature);
}

/**
 * Recursively sort object keys for canonical JSON serialization.
 */
export function canonicalJson(value) {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(canonicalJson);
  }
  const sorted = {};
  for (const key of Object.keys(value).sort()) {
    sorted[key] = canonicalJson(value[key]);
  }
  return sorted;
}

/**
 * Health check.
 */
export function health() {
  return {
    status: 'ok',
    gateway: 'vag-demo-gateway',
    mode: 'local-bounded-demo',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Propose an action to the gateway.
 * Authorization uses scope.intent (canonical), NOT top-level intent.
 */
export function propose(body) {
  if (!body || typeof body !== 'object') {
    return { error: 'invalid_request', message: 'Request body must be an object.' };
  }

  const scopeIntent = body.scope?.intent;
  if (!scopeIntent) {
    return { error: 'missing_scope_intent', message: 'scope.intent is required for authorization.' };
  }

  const allowed = ALLOWED_INTENTS.has(scopeIntent);
  const proposalId = randomUUID();
  const decision = allowed ? 'allow' : 'deny';
  const decisionModeFinal = decision;

  const decisionMaterial = JSON.stringify(canonicalJson({
    proposal_id: proposalId,
    scope_intent: scopeIntent,
    decision,
  }));
  const decisionId = sha256(decisionMaterial);

  const record = {
    proposal_id: proposalId,
    scope_intent: scopeIntent,
    top_level_intent: body.intent || null,
    decision,
    decision_id: decisionId,
    decision_mode_final: decisionModeFinal,
    allowed,
    timestamp: new Date().toISOString(),
    input_hash: sha256(JSON.stringify(canonicalJson(body))),
  };

  proposals.set(proposalId, record);

  return {
    proposal_id: proposalId,
    decision,
    decision_id: decisionId,
    decision_mode_final: decisionModeFinal,
    allowed,
    reason_code: allowed ? 'intent_in_allowlist' : 'intent_not_in_allowlist',
    scope_intent: scopeIntent,
    source: 'demo_gateway',
    truth_status: 'runtime_demo_decision',
    message: allowed
      ? 'Proposal allowed. You may commit with output_digest and decision_id.'
      : 'Proposal denied. Denied proposals cannot be committed.',
  };
}

/**
 * Commit an allowed proposal with output digest.
 */
export function commit(body) {
  if (!body || typeof body !== 'object') {
    return { error: 'invalid_request', message: 'Request body must be an object.' };
  }

  const { proposal_id, decision_id, output_digest } = body;

  if (!proposal_id) {
    return { error: 'missing_proposal_id', message: 'proposal_id is required.' };
  }

  if (!decision_id) {
    return { error: 'missing_decision_id', message: 'decision_id is required.' };
  }

  if (!output_digest || typeof output_digest !== 'string' || !HEX64_RE.test(output_digest)) {
    return { error: 'invalid_output_digest', message: 'output_digest must be 64 lowercase hex characters.' };
  }

  const proposal = proposals.get(proposal_id);
  if (!proposal) {
    return { error: 'unknown_proposal', message: 'No proposal found for this ID.' };
  }

  if (proposal.decision !== 'allow') {
    return { error: 'denied_proposal', message: 'Denied proposals cannot be committed.' };
  }

  if (decision_id !== proposal.decision_id) {
    return { error: 'decision_mismatch', message: 'Provided decision_id does not match the stored decision.' };
  }

  if (commits.has(proposal_id)) {
    return { error: 'double_commit', message: 'This proposal has already been committed.' };
  }

  const canonicalRecord = canonicalJson({
    proposal_id,
    decision_id,
    output_digest,
    scope_intent: proposal.scope_intent,
  });
  const record_hash = sha256(JSON.stringify(canonicalRecord));
  const signature = hmacSha256(record_hash);

  const commitRecord = {
    proposal_id,
    decision_id,
    output_digest,
    record_hash,
    signature,
    scope_intent: proposal.scope_intent,
    committed_at: new Date().toISOString(),
  };

  commits.set(proposal_id, commitRecord);

  return {
    status: 'committed',
    proposal_id,
    decision_id,
    output_digest,
    record_hash,
    signature,
    source: 'demo_gateway',
    truth_status: 'runtime_demo_committed',
    committed_at: commitRecord.committed_at,
  };
}

/**
 * Verify integrity of a committed record.
 */
export function verify(body) {
  if (!body || typeof body !== 'object') {
    return { error: 'invalid_request', message: 'Request body must be an object.' };
  }

  const { record_hash, signature } = body;

  if (!record_hash || typeof record_hash !== 'string') {
    return { error: 'missing_record_hash', message: 'record_hash is required.' };
  }

  if (!HEX64_RE.test(record_hash)) {
    return { error: 'invalid_record_hash', message: 'record_hash must be 64 lowercase hex characters.' };
  }

  if (!signature || typeof signature !== 'string') {
    return { error: 'missing_signature', message: 'signature is required.' };
  }

  if (!HEX64_RE.test(signature)) {
    return { error: 'invalid_signature_format', message: 'signature must be 64 lowercase hex characters.' };
  }

  // Find the commit by record_hash
  let found = null;
  for (const [, rec] of commits) {
    if (rec.record_hash === record_hash) {
      found = rec;
      break;
    }
  }

  if (!found) {
    return { error: 'unknown_record_hash', message: 'No committed record matches this hash.' };
  }

  const canonicalRecord = canonicalJson({
    proposal_id: found.proposal_id,
    decision_id: found.decision_id,
    output_digest: found.output_digest,
    scope_intent: found.scope_intent,
  });
  const reconstructedHash = sha256(JSON.stringify(canonicalRecord));
  const proposal = proposals.get(found.proposal_id);
  const hashIntegrity = reconstructedHash === found.record_hash && found.record_hash === record_hash;
  const referenceIntegrity =
    Boolean(proposal) &&
    proposal.decision === 'allow' &&
    proposal.decision_id === found.decision_id &&
    proposal.scope_intent === found.scope_intent;

  const signatureIntegrity = verifySignatureRelationships(
    record_hash,
    signature,
    found.signature,
  );
  const valid = hashIntegrity && signatureIntegrity && referenceIntegrity;

  if (!signatureIntegrity) {
    return {
      error: 'tampered_signature',
      message: 'Signature does not match. Integrity check failed.',
      integrity: false,
      hash_integrity: hashIntegrity,
      signature_integrity: false,
      reference_integrity: referenceIntegrity,
    };
  }

  if (!valid) {
    return {
      error: 'tampered_record',
      message: 'Record hash or proposal reference integrity check failed.',
      integrity: false,
      hash_integrity: hashIntegrity,
      signature_integrity: signatureIntegrity,
      reference_integrity: referenceIntegrity,
    };
  }

  return {
    valid: true,
    status: 'verified',
    integrity: true,
    hash_integrity: true,
    signature_integrity: true,
    reference_integrity: true,
    record_hash,
    proposal_id: found.proposal_id,
    decision_id: found.decision_id,
    scope_intent: found.scope_intent,
    source: 'demo_gateway',
    truth_status: 'runtime_demo_integrity_verified',
    verified_at: new Date().toISOString(),
  };
}

/**
 * Reset in-memory state (for testing).
 */
export function reset() {
  proposals.clear();
  commits.clear();
}
