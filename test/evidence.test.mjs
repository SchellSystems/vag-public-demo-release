/**
 * Evidence contract tests — whitepaper §15 / §18.3
 *
 * Loads the REAL production function:
 *   demo-ui/src/services/evidence.ts → buildEvidence
 *
 * Uses a test-only resolve/load hook so extensionless TypeScript imports and
 * TypeScript syntax work under the declared Node >=20.19.0 runtime floor.
 * No duplicated production predicates. No no_tool_grant field.
 */

import { register } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));

// Register test-only TypeScript resolve/load hooks before production imports.
await register(
  pathToFileURL(join(here, 'ts-resolve.mjs')).href,
  pathToFileURL(here + '/').href,
);

// Production module under test.
const { buildEvidence } = await import(
  pathToFileURL(join(here, '..', 'demo-ui', 'src', 'services', 'evidence.ts')).href
);

// Prove we loaded the real module path, not a local copy.
assert.equal(typeof buildEvidence, 'function');
assert.equal(buildEvidence.name, 'buildEvidence');

const HEX64 = 'a'.repeat(64);
const HEX64_B = 'b'.repeat(64);

function validNegativeEvidence(proposalId = 'deny-prop-1') {
  return {
    denied: true,
    proposal_id: proposalId,
    no_local_artifact: true,
    no_commit: true,
    no_verify: true,
    scope: 'bounded_ui_path_only',
    source: 'ui_derived_from_gateway_deny',
    reason:
      'Gateway denied the proposal; this UI path created no local follow-on artifact and did not call Commit or Verify.',
    non_claim: 'does_not_prove_system_wide_non_execution',
  };
}

function validHealth() {
  return {
    status: 'ok',
    gateway: 'vag-demo-gateway',
    mode: 'local-bounded-demo',
    timestamp: '2026-07-22T00:00:00.000Z',
  };
}

function validAllowRun() {
  return {
    proposal_id: 'allow-prop-1',
    decision: 'allow',
    decision_id: HEX64,
    decision_mode_final: 'allowlist',
    allowed: true,
    reason_code: 'intent_in_allowlist',
    scope_intent: 'demo.transform_json',
    source: 'demo-gateway',
    truth_status: 'runtime_demo_decision',
    message: 'allowed',
  };
}

function validDenyRun() {
  return {
    proposal_id: 'deny-prop-1',
    decision: 'deny',
    decision_id: HEX64_B,
    decision_mode_final: 'deny-by-default',
    allowed: false,
    reason_code: 'intent_not_in_allowlist',
    scope_intent: 'demo.forbidden_action',
    source: 'demo-gateway',
    truth_status: 'runtime_demo_decision',
    message: 'denied',
  };
}

function validCommit() {
  return {
    status: 'committed',
    proposal_id: 'allow-prop-1',
    decision_id: HEX64,
    output_digest: HEX64,
    record_hash: HEX64,
    signature: HEX64,
    source: 'demo-gateway',
    truth_status: 'runtime_demo_committed',
    committed_at: '2026-07-22T00:00:01.000Z',
  };
}

function validVerify() {
  return {
    valid: true,
    status: 'verified',
    integrity: true,
    hash_integrity: true,
    signature_integrity: true,
    reference_integrity: true,
    record_hash: HEX64,
    proposal_id: 'allow-prop-1',
    decision_id: HEX64,
    scope_intent: 'demo.transform_json',
    source: 'demo-gateway',
    truth_status: 'runtime_demo_integrity_verified',
    verified_at: '2026-07-22T00:00:02.000Z',
  };
}

function validArtifacts() {
  return {
    artifact_kind: 'synthetic_local_json',
    controlled_demo_path: 'demo.transform_json',
    output_digest: HEX64,
    proposal_id: 'allow-prop-1',
    committed: true,
    verified: true,
    gateway_observed_artifact_content: false,
  };
}

function fullEvidence(overrides = {}) {
  return buildEvidence({
    health: validHealth(),
    allowRun: validAllowRun(),
    commit: validCommit(),
    verify: validVerify(),
    denyRun: validDenyRun(),
    artifacts: validArtifacts(),
    negativeEvidence: validNegativeEvidence(),
    ...overrides,
  });
}

function denyEvidence(overrides = {}) {
  return buildEvidence({
    health: validHealth(),
    allowRun: null,
    commit: null,
    verify: null,
    denyRun: validDenyRun(),
    artifacts: null,
    negativeEvidence: validNegativeEvidence(),
    ...overrides,
  });
}

describe('evidence contract — production module binding', () => {
  it('buildEvidence is the exported production function', () => {
    assert.equal(typeof buildEvidence, 'function');
    assert.equal(buildEvidence.name, 'buildEvidence');
  });
});

describe('evidence contract — full allow path (§18.3 #44)', () => {
  it('sets the full-path result, integrity markers, and assembly order', () => {
    const evidence = fullEvidence();

    assert.equal(evidence.path_result, 'full_demo_passed');
    assert.equal(evidence.full_demo_passed, true);
    assert.equal(evidence.demo_passed, true);
    assert.equal(evidence.deny_path_passed, false);
    assert.equal(evidence.evidence_assembly_order, 'commit_verify_then_evidence');
    assert.equal(evidence.schema_version, 'vag-demo-evidence/1.0');
    assert.equal(evidence.truth_status, 'bounded_demo_complete');
    assert.equal(evidence.commit.status, 'committed');
    assert.equal(evidence.verify.status, 'verified');
    assert.equal(evidence.verify.integrity, true);
    assert.equal(
      evidence.bounded_demo_artifacts.gateway_observed_artifact_content,
      false,
    );
    assert.equal(
      evidence.bounded_demo_artifacts.artifact_kind,
      'synthetic_local_json',
    );
    assert.equal(
      evidence.bounded_demo_artifacts.controlled_demo_path,
      'demo.transform_json',
    );
  });

  it('contains no no_tool_grant key anywhere in the evidence object', () => {
    const evidence = fullEvidence();
    const json = JSON.stringify(evidence);

    assert.equal(json.includes('no_tool_grant'), false);
    assert.equal(Object.hasOwn(evidence.negative_evidence, 'no_tool_grant'), false);
  });
});

describe('evidence contract — deny-only path (§18.3 #45)', () => {
  it('sets deny_path_passed and bounded negative-evidence fields', () => {
    const evidence = denyEvidence();
    const negative = evidence.negative_evidence;

    assert.equal(evidence.path_result, 'deny_path_passed');
    assert.equal(evidence.deny_path_passed, true);
    assert.equal(evidence.full_demo_passed, false);
    assert.equal(evidence.demo_passed, false);
    assert.equal(evidence.truth_status, 'bounded_deny_path_complete');
    assert.equal(negative.denied, true);
    assert.equal(negative.no_local_artifact, true);
    assert.equal(negative.no_commit, true);
    assert.equal(negative.no_verify, true);
    assert.equal(negative.scope, 'bounded_ui_path_only');
    assert.equal(negative.source, 'ui_derived_from_gateway_deny');
    assert.equal(
      negative.non_claim,
      'does_not_prove_system_wide_non_execution',
    );
  });
});

describe('evidence contract — negative evidence completeness', () => {
  for (const field of ['no_local_artifact', 'no_commit', 'no_verify']) {
    it(`fails deny_path_passed when ${field} is false`, () => {
      const negativeEvidence = {
        ...validNegativeEvidence(),
        [field]: false,
      };
      const evidence = denyEvidence({ negativeEvidence });

      assert.equal(evidence.deny_path_passed, false);
      assert.equal(evidence.path_result, 'incomplete');
    });

    it(`fails full_demo_passed when ${field} is false`, () => {
      const negativeEvidence = {
        ...validNegativeEvidence(),
        [field]: false,
      };
      const evidence = fullEvidence({ negativeEvidence });

      assert.equal(evidence.full_demo_passed, false);
      assert.equal(evidence.path_result, 'incomplete');
    });
  }

  it('fails when negativeEvidence is null', () => {
    const evidence = denyEvidence({ negativeEvidence: null });

    assert.equal(evidence.deny_path_passed, false);
    assert.equal(evidence.path_result, 'incomplete');
  });
});

describe('evidence contract — incomplete invalid paths (§18.3 #46–#48)', () => {
  const cases = [
    ['missing verify', { verify: null }],
    [
      'digest mismatch',
      { commit: { ...validCommit(), output_digest: HEX64_B } },
    ],
    [
      'record_hash mismatch',
      { verify: { ...validVerify(), record_hash: HEX64_B } },
    ],
    [
      'decision_id mismatch',
      { verify: { ...validVerify(), decision_id: HEX64_B } },
    ],
    [
      'invalid record_hash format',
      { commit: { ...validCommit(), record_hash: 'not-a-hash' } },
    ],
    [
      'verify integrity false',
      { verify: { ...validVerify(), integrity: false } },
    ],
  ];

  for (const [name, overrides] of cases) {
    it(`${name} yields incomplete`, () => {
      const evidence = fullEvidence(overrides);

      assert.equal(evidence.full_demo_passed, false);
      assert.equal(evidence.path_result, 'incomplete');
    });
  }
});

describe('evidence contract — schema markers (§18.3 #49–#50)', () => {
  it('keeps the fixed schema and bounded deny markers', () => {
    const evidence = denyEvidence();

    assert.equal(evidence.schema_version, 'vag-demo-evidence/1.0');
    assert.equal(evidence.evidence_assembly_order, 'commit_verify_then_evidence');
    assert.equal(evidence.negative_evidence_scope, 'bounded_ui_path_only');
    assert.equal(
      evidence.negative_evidence_source,
      'ui_derived_from_gateway_deny',
    );
    assert.equal(
      evidence.deny_non_claim,
      'does_not_prove_system_wide_non_execution',
    );
  });

  it('keeps gateway_observed_artifact_content false', () => {
    const evidence = fullEvidence();

    assert.equal(
      evidence.bounded_demo_artifacts.gateway_observed_artifact_content,
      false,
    );
  });
});

describe('evidence contract — path_result semantics (item 8)', () => {
  it('emits only full_demo_passed, deny_path_passed, or incomplete', () => {
    const allowed = new Set([
      'full_demo_passed',
      'deny_path_passed',
      'incomplete',
    ]);
    const cases = [
      fullEvidence(),
      denyEvidence(),
      fullEvidence({ commit: null, verify: null, denyRun: null }),
    ];

    for (const evidence of cases) {
      assert.ok(
        allowed.has(evidence.path_result),
        `unexpected path_result: ${evidence.path_result}`,
      );
    }
  });
});
