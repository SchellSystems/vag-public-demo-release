#!/usr/bin/env node
/**
 * Public Demo Probe
 *
 * Validates that the demo-gateway responds correctly to the full
 * bounded demo path: health → allow → commit → verify → deny.
 *
 * No external calls. No cloud. No shell exec. No HTTP client libraries.
 * Uses only Node.js built-in fetch (Node 18+).
 *
 * Usage: node tools/public_demo_probe.mjs [gateway_url]
 */

const GATEWAY = process.argv[2] || 'http://localhost:4400';
const HEX64_RE = /^[0-9a-f]{64}$/;

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) {
    console.log(`  ✓ ${msg}`);
    passed++;
  } else {
    console.error(`  ✗ ${msg}`);
    failed++;
  }
}

async function probe() {
  console.log(`[probe] Gateway: ${GATEWAY}\n`);

  // 1. Health
  console.log('--- Health ---');
  const healthRes = await fetch(`${GATEWAY}/health`);
  const health = await healthRes.json();
  assert(health.status === 'ok', 'health.status === ok');
  assert(health.mode === 'local-bounded-demo', 'health.mode === local-bounded-demo');

  // 2. Propose (allow)
  console.log('\n--- Propose (allow) ---');
  const allowRes = await fetch(`${GATEWAY}/propose`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scope: { intent: 'demo.transform_json' }, intent: 'top_level_ignored' }),
  });
  const allow = await allowRes.json();
  assert(allow.decision === 'allow', 'allow.decision === allow');
  assert(allow.allowed === true, 'allow.allowed === true');
  assert(allow.scope_intent === 'demo.transform_json', 'scope_intent correct');
  assert(typeof allow.proposal_id === 'string', 'proposal_id is string');
  assert(typeof allow.decision_id === 'string' && allow.decision_id.length === 64, 'decision_id present and 64 hex');
  assert(allow.decision_mode_final === 'allow', 'decision_mode_final === allow');
  assert(allow.source === 'demo_gateway', 'allow.source === demo_gateway');
  assert(allow.truth_status === 'runtime_demo_decision', 'allow.truth_status correct');

  // 3. Propose (deny)
  console.log('\n--- Propose (deny) ---');
  const denyRes = await fetch(`${GATEWAY}/propose`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scope: { intent: 'demo.forbidden_action' } }),
  });
  const deny = await denyRes.json();
  assert(deny.decision === 'deny', 'deny.decision === deny');
  assert(deny.allowed === false, 'deny.allowed === false');
  assert(typeof deny.decision_id === 'string' && deny.decision_id.length === 64, 'deny.decision_id present');
  assert(deny.source === 'demo_gateway', 'deny.source === demo_gateway');
  assert(deny.truth_status === 'runtime_demo_decision', 'deny.truth_status correct');

  // 4. Top-level intent must NOT authorize
  console.log('\n--- Top-level intent does not authorize ---');
  const topRes = await fetch(`${GATEWAY}/propose`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ intent: 'demo.transform_json' }),
  });
  const topResult = await topRes.json();
  assert(topResult.error === 'missing_scope_intent', 'top-level intent alone is rejected');

  // 5. Commit
  console.log('\n--- Commit ---');
  const outputDigest = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
  const commitRes = await fetch(`${GATEWAY}/commit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ proposal_id: allow.proposal_id, decision_id: allow.decision_id, output_digest: outputDigest }),
  });
  const commitResult = await commitRes.json();
  assert(commitResult.status === 'committed', 'commit succeeded');
  assert(HEX64_RE.test(commitResult.record_hash), 'record_hash is 64 lowercase hex');
  assert(HEX64_RE.test(commitResult.signature), 'signature is 64 lowercase hex');
  assert(commitResult.decision_id === allow.decision_id, 'commit returns decision_id');
  assert(commitResult.output_digest === outputDigest, 'commit returns output_digest');
  assert(commitResult.source === 'demo_gateway', 'commit.source === demo_gateway');
  assert(commitResult.truth_status === 'runtime_demo_committed', 'commit.truth_status correct');

  // 6. Commit without decision_id
  console.log('\n--- Commit without decision_id ---');
  const noDecIdRes = await fetch(`${GATEWAY}/commit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ proposal_id: 'some-id', output_digest: outputDigest }),
  });
  const noDecId = await noDecIdRes.json();
  assert(noDecId.error === 'missing_decision_id', 'commit without decision_id rejected');

  // 7. Commit with wrong decision_id
  console.log('\n--- Commit with wrong decision_id ---');
  // Need a fresh allow for this
  const freshRes = await fetch(`${GATEWAY}/propose`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scope: { intent: 'demo.ping' } }),
  });
  const fresh = await freshRes.json();
  const wrongDecRes = await fetch(`${GATEWAY}/commit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ proposal_id: fresh.proposal_id, decision_id: 'a'.repeat(64), output_digest: outputDigest }),
  });
  const wrongDec = await wrongDecRes.json();
  assert(wrongDec.error === 'decision_mismatch', 'commit with wrong decision_id returns decision_mismatch');

  // 8. Double commit reject
  console.log('\n--- Double Commit Reject ---');
  const doubleRes = await fetch(`${GATEWAY}/commit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ proposal_id: allow.proposal_id, decision_id: allow.decision_id, output_digest: outputDigest }),
  });
  const doubleResult = await doubleRes.json();
  assert(doubleResult.error === 'double_commit', 'double commit rejected');

  // 9. Commit with short output_digest
  console.log('\n--- Commit with short output_digest ---');
  const fresh2Res = await fetch(`${GATEWAY}/propose`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scope: { intent: 'demo.ping' } }),
  });
  const fresh2 = await fresh2Res.json();
  const shortDigestRes = await fetch(`${GATEWAY}/commit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ proposal_id: fresh2.proposal_id, decision_id: fresh2.decision_id, output_digest: 'short' }),
  });
  const shortDigest = await shortDigestRes.json();
  assert(shortDigest.error === 'invalid_output_digest', 'short output_digest rejected');

  // 10. Commit with non-hex output_digest
  console.log('\n--- Commit with non-hex output_digest ---');
  const nonHexDigestRes = await fetch(`${GATEWAY}/commit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ proposal_id: fresh2.proposal_id, decision_id: fresh2.decision_id, output_digest: 'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz' }),
  });
  const nonHexDigest = await nonHexDigestRes.json();
  assert(nonHexDigest.error === 'invalid_output_digest', 'non-hex output_digest rejected');

  // 11. Verify
  console.log('\n--- Verify ---');
  const verifyRes = await fetch(`${GATEWAY}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ record_hash: commitResult.record_hash, signature: commitResult.signature }),
  });
  const verifyResult = await verifyRes.json();
  assert(verifyResult.status === 'verified', 'verify succeeded');
  assert(verifyResult.valid === true, 'verify.valid === true');
  assert(verifyResult.integrity === true, 'integrity is true');
  assert(verifyResult.hash_integrity === true, 'hash_integrity is true');
  assert(verifyResult.signature_integrity === true, 'signature_integrity is true');
  assert(verifyResult.reference_integrity === true, 'reference_integrity is true');
  assert(verifyResult.decision_id === allow.decision_id, 'verify returns decision_id');
  assert(verifyResult.source === 'demo_gateway', 'verify.source === demo_gateway');
  assert(verifyResult.truth_status === 'runtime_demo_integrity_verified', 'verify.truth_status correct');

  // 12. Verify rejects tampered signature (valid hex but wrong)
  console.log('\n--- Verify Tampered Signature ---');
  const tamperedSig = 'a'.repeat(64);
  const tamperedRes = await fetch(`${GATEWAY}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ record_hash: commitResult.record_hash, signature: tamperedSig }),
  });
  const tampered = await tamperedRes.json();
  assert(tampered.error === 'tampered_signature', 'tampered signature rejected');

  // 13. Verify rejects non-hex hash
  console.log('\n--- Verify non-hex record_hash ---');
  const nonHexHashRes = await fetch(`${GATEWAY}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ record_hash: 'not_hex_at_all!', signature: tamperedSig }),
  });
  const nonHexHash = await nonHexHashRes.json();
  assert(nonHexHash.error === 'invalid_record_hash', 'non-hex record_hash rejected');

  // 14. Verify rejects non-hex signature
  console.log('\n--- Verify non-hex signature ---');
  const nonHexSigRes = await fetch(`${GATEWAY}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ record_hash: commitResult.record_hash, signature: 'not_valid_hex!' }),
  });
  const nonHexSig = await nonHexSigRes.json();
  assert(nonHexSig.error === 'invalid_signature_format', 'non-hex signature rejected');

  // 15. Verify rejects unknown record_hash
  console.log('\n--- Verify Unknown Record Hash ---');
  const unknownHash = 'b'.repeat(64);
  const unknownRes = await fetch(`${GATEWAY}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ record_hash: unknownHash, signature: tamperedSig }),
  });
  const unknown = await unknownRes.json();
  assert(unknown.error === 'unknown_record_hash', 'unknown record_hash rejected');

  // 16. Verify rejects missing hash
  console.log('\n--- Verify Missing Hash ---');
  const missingHashRes = await fetch(`${GATEWAY}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ signature: 'any' }),
  });
  const missingHash = await missingHashRes.json();
  assert(missingHash.error === 'missing_record_hash', 'missing hash rejected');

  // 17. Verify rejects missing signature
  console.log('\n--- Verify Missing Signature ---');
  const missingSigRes = await fetch(`${GATEWAY}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ record_hash: commitResult.record_hash }),
  });
  const missingSig = await missingSigRes.json();
  assert(missingSig.error === 'missing_signature', 'missing signature rejected');

  // 18. Denied proposal cannot be committed
  console.log('\n--- Denied Proposal Commit Reject ---');
  const denyCommitRes = await fetch(`${GATEWAY}/commit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ proposal_id: deny.proposal_id, decision_id: deny.decision_id, output_digest: outputDigest }),
  });
  const denyCommit = await denyCommitRes.json();
  assert(denyCommit.error === 'denied_proposal', 'denied proposal cannot be committed');

  // 19. Unknown proposal reject
  console.log('\n--- Unknown Proposal Commit Reject ---');
  const unknownPropRes = await fetch(`${GATEWAY}/commit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ proposal_id: 'nonexistent-uuid', decision_id: 'a'.repeat(64), output_digest: outputDigest }),
  });
  const unknownProp = await unknownPropRes.json();
  assert(unknownProp.error === 'unknown_proposal', 'unknown proposal rejected');

  // Summary
  console.log(`\n=== Probe Results: ${passed} passed, ${failed} failed ===`);

  if (failed > 0) {
    process.exit(1);
  }
}

probe().catch((err) => {
  console.error(`[probe] FATAL: ${err.message}`);
  console.error('Is the demo-gateway running on', GATEWAY, '?');
  process.exit(1);
});
