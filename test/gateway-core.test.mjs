import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  canonicalJson,
  commit,
  health,
  propose,
  reset,
  sha256,
  verify,
} from '../demo-gateway/src/core.mjs';
import { verifySignatureRelationships } from '../demo-gateway/src/internal/signature-integrity.mjs';

const VALID_DIGEST = 'a'.repeat(64);
const OTHER_VALID_DIGEST = 'b'.repeat(64);
const INVALID_DIGEST = 'A'.repeat(64);
const ZERO_HASH = '0'.repeat(64);

function tamperSignature(signature) {
  return signature.startsWith('0')
    ? `1${signature.slice(1)}`
    : `0${signature.slice(1)}`;
}

function allowProposal() {
  return propose({
    intent: 'demo.forbidden_action',
    scope: { intent: 'demo.transform_json' },
    payload: { example: true },
  });
}

function denyProposal() {
  return propose({
    scope: { intent: 'demo.forbidden_action' },
    payload: { example: true },
  });
}

describe('gateway core health and helpers', () => {
  beforeEach(() => {
    reset();
  });

  it('reports local bounded demo health', () => {
    const result = health();

    assert.equal(result.status, 'ok');
    assert.equal(result.gateway, 'vag-demo-gateway');
    assert.equal(result.mode, 'local-bounded-demo');
    assert.match(result.timestamp, /^\d{4}-\d{2}-\d{2}T/);
  });

  it('canonicalJson sorts object keys recursively while preserving array order', () => {
    const input = {
      z: 1,
      a: {
        d: 4,
        b: 2,
      },
      list: [
        { y: 2, x: 1 },
        { c: 3, a: 1 },
      ],
    };

    assert.deepEqual(canonicalJson(input), {
      a: {
        b: 2,
        d: 4,
      },
      list: [
        { x: 1, y: 2 },
        { a: 1, c: 3 },
      ],
      z: 1,
    });
  });

  it('sha256 returns a lowercase 64-character hex digest', () => {
    assert.match(sha256('vag-demo'), /^[0-9a-f]{64}$/);
  });
});

describe('gateway core proposal decisions', () => {
  beforeEach(() => {
    reset();
  });

  it('authorizes using scope.intent and preserves top-level intent only as context', () => {
    const result = allowProposal();

    assert.equal(result.decision, 'allow');
    assert.equal(result.allowed, true);
    assert.equal(result.reason_code, 'intent_in_allowlist');
    assert.equal(result.scope_intent, 'demo.transform_json');
    assert.match(result.proposal_id, /^[0-9a-f-]{36}$/i);
    assert.match(result.decision_id, /^[0-9a-f]{64}$/);
  });

  it('rejects requests that only provide top-level intent', () => {
    const result = propose({
      intent: 'demo.transform_json',
      payload: { example: true },
    });

    assert.equal(result.error, 'missing_scope_intent');
  });

  it('denies unknown scope.intent by default', () => {
    const result = denyProposal();

    assert.equal(result.decision, 'deny');
    assert.equal(result.allowed, false);
    assert.equal(result.reason_code, 'intent_not_in_allowlist');
  });

  it('rejects invalid proposal bodies', () => {
    assert.equal(propose(null).error, 'invalid_request');
    assert.equal(propose('bad').error, 'invalid_request');
  });
});

describe('gateway core commit behavior', () => {
  beforeEach(() => {
    reset();
  });

  it('commits an allowed proposal with matching decision_id and lowercase hex output digest', () => {
    const proposal = allowProposal();
    const result = commit({
      proposal_id: proposal.proposal_id,
      decision_id: proposal.decision_id,
      output_digest: VALID_DIGEST,
    });

    assert.equal(result.status, 'committed');
    assert.equal(result.proposal_id, proposal.proposal_id);
    assert.equal(result.decision_id, proposal.decision_id);
    assert.equal(result.output_digest, VALID_DIGEST);
    assert.match(result.record_hash, /^[0-9a-f]{64}$/);
    assert.match(result.signature, /^[0-9a-f]{64}$/);
    assert.equal(result.truth_status, 'runtime_demo_committed');
  });

  it('rejects missing commit fields before lookup', () => {
    const proposal = allowProposal();

    assert.equal(commit({ decision_id: proposal.decision_id, output_digest: VALID_DIGEST }).error, 'missing_proposal_id');
    assert.equal(commit({ proposal_id: proposal.proposal_id, output_digest: VALID_DIGEST }).error, 'missing_decision_id');
  });

  it('rejects output digest values that are not lowercase 64-character hex', () => {
    const proposal = allowProposal();

    assert.equal(commit({
      proposal_id: proposal.proposal_id,
      decision_id: proposal.decision_id,
      output_digest: INVALID_DIGEST,
    }).error, 'invalid_output_digest');

    assert.equal(commit({
      proposal_id: proposal.proposal_id,
      decision_id: proposal.decision_id,
      output_digest: 'abc',
    }).error, 'invalid_output_digest');
  });

  it('rejects unknown proposals', () => {
    const result = commit({
      proposal_id: 'missing-proposal',
      decision_id: ZERO_HASH,
      output_digest: VALID_DIGEST,
    });

    assert.equal(result.error, 'unknown_proposal');
  });

  it('rejects denied proposals', () => {
    const proposal = denyProposal();
    const result = commit({
      proposal_id: proposal.proposal_id,
      decision_id: proposal.decision_id,
      output_digest: VALID_DIGEST,
    });

    assert.equal(result.error, 'denied_proposal');
  });

  it('rejects mismatched decision_id values', () => {
    const proposal = allowProposal();
    const result = commit({
      proposal_id: proposal.proposal_id,
      decision_id: ZERO_HASH,
      output_digest: VALID_DIGEST,
    });

    assert.equal(result.error, 'decision_mismatch');
  });

  it('rejects double commits for the same proposal', () => {
    const proposal = allowProposal();

    assert.equal(commit({
      proposal_id: proposal.proposal_id,
      decision_id: proposal.decision_id,
      output_digest: VALID_DIGEST,
    }).status, 'committed');

    assert.equal(commit({
      proposal_id: proposal.proposal_id,
      decision_id: proposal.decision_id,
      output_digest: OTHER_VALID_DIGEST,
    }).error, 'double_commit');
  });
});

describe('gateway core verify behavior', () => {
  beforeEach(() => {
    reset();
  });

  function committedRecord() {
    const proposal = allowProposal();
    return commit({
      proposal_id: proposal.proposal_id,
      decision_id: proposal.decision_id,
      output_digest: VALID_DIGEST,
    });
  }

  it('verifies a committed record hash and signature', () => {
    const record = committedRecord();
    const result = verify({
      record_hash: record.record_hash,
      signature: record.signature,
    });

    assert.equal(result.valid, true);
    assert.equal(result.status, 'verified');
    assert.equal(result.integrity, true);
    assert.equal(result.hash_integrity, true);
    assert.equal(result.signature_integrity, true);
    assert.equal(result.reference_integrity, true);
    assert.equal(result.truth_status, 'runtime_demo_integrity_verified');
  });

  it('rejects missing and malformed verify inputs', () => {
    assert.equal(verify({ signature: ZERO_HASH }).error, 'missing_record_hash');
    assert.equal(verify({ record_hash: 'abc', signature: ZERO_HASH }).error, 'invalid_record_hash');
    assert.equal(verify({ record_hash: ZERO_HASH }).error, 'missing_signature');
    assert.equal(verify({ record_hash: ZERO_HASH, signature: 'abc' }).error, 'invalid_signature_format');
  });

  it('rejects unknown record hashes after format validation', () => {
    const result = verify({
      record_hash: ZERO_HASH,
      signature: ZERO_HASH,
    });

    assert.equal(result.error, 'unknown_record_hash');
  });

  it('detects tampered signatures for known record hashes', () => {
    const record = committedRecord();
    const tamperedSignature = tamperSignature(record.signature);

    const result = verify({
      record_hash: record.record_hash,
      signature: tamperedSignature,
    });

    assert.equal(result.error, 'tampered_signature');
    assert.equal(result.integrity, false);
    assert.equal(result.signature_integrity, false);
  });

  it('checks stored-signature tampering in the pure signature relationship helper', () => {
    const record = committedRecord();
    const tamperedStoredSignature = tamperSignature(record.signature);

    // Helper-level regression: this does not mutate the internal commits Map.
    assert.equal(verifySignatureRelationships(
      record.signature,
      record.signature,
      record.signature,
    ), true);
    assert.equal(verifySignatureRelationships(
      record.signature,
      record.signature,
      tamperedStoredSignature,
    ), false);
  });

  it('rejects invalid verify bodies', () => {
    assert.equal(verify(null).error, 'invalid_request');
    assert.equal(verify('bad').error, 'invalid_request');
  });
});
