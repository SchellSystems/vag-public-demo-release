/**
 * Evidence contract tests — whitepaper §15 / §18.3
 *
 * Pure predicate checks against the normative DemoEvidence schema.
 * Mirrors buildEvidence semantics without importing TypeScript sources.
 * No ToolGrant field is permitted or asserted.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const HEX64 = 'a'.repeat(64);
const HEX64_B = 'b'.repeat(64);

const NON_CLAIMS = [
  'not production-ready',
  'not a sandbox',
  'not OS/browser/network/process/filesystem isolation',
  'not system-wide enforcement',
  'not compliance proof',
  'not security proof',
  'not full telemetry',
  'Verify does not approve',
  'Verify does not authorize',
  'Evidence does not certify compliance',
  'Deny does not prove system-wide non-execution',
  'Gateway does not grant global tool capability',
  'no external platform integration',
];

/**
 * Contract evaluator — mirrors demo-ui/src/services/evidence.ts predicates
 * and whitepaper §15.1–§15.5. Kept local so tests stay pure .mjs.
 */
function evaluateEvidence(params) {
  const {
    health,
    allowRun,
    commit,
    verify,
    denyRun,
    artifacts,
    negativeEvidence,
  } = params;

  const HEX64_RE = /^[0-9a-f]{64}$/;

  const fullDemoPassed =
    health !== null &&
    health.status === 'ok' &&
    allowRun !== null &&
    allowRun.decision === 'allow' &&
    allowRun.allowed === true &&
    typeof allowRun.decision_id === 'string' &&
    allowRun.decision_id.length > 0 &&
    commit !== null &&
    commit.status === 'committed' &&
    artifacts !== null &&
    commit.output_digest === artifacts.output_digest &&
    HEX64_RE.test(commit.record_hash) &&
    HEX64_RE.test(commit.signature) &&
    verify !== null &&
    verify.status === 'verified' &&
    verify.valid === true &&
    verify.integrity === true &&
    verify.hash_integrity === true &&
    verify.signature_integrity === true &&
    verify.reference_integrity === true &&
    verify.record_hash === commit.record_hash &&
    verify.decision_id === allowRun.decision_id &&
    denyRun !== null &&
    denyRun.decision === 'deny' &&
    denyRun.allowed === false &&
    negativeEvidence !== null &&
    negativeEvidence.denied === true &&
    negativeEvidence.no_local_artifact === true &&
    negativeEvidence.no_commit === true &&
    negativeEvidence.no_verify === true;

  const denyPathPassed =
    health !== null &&
    health.status === 'ok' &&
    allowRun === null &&
    commit === null &&
    verify === null &&
    artifacts === null &&
    denyRun !== null &&
    denyRun.decision === 'deny' &&
    denyRun.allowed === false &&
    negativeEvidence !== null &&
    negativeEvidence.denied === true &&
    negativeEvidence.no_local_artifact === true &&
    negativeEvidence.no_commit === true &&
    negativeEvidence.no_verify === true;

  const pathResult = fullDemoPassed
    ? 'full_demo_passed'
    : denyPathPassed
      ? 'deny_path_passed'
      : 'incomplete';

  return {
    schema_version: 'vag-demo-evidence/1.0',
    health,
    allow_run: allowRun,
    commit,
    verify,
    deny_run: denyRun,
    bounded_demo_artifacts: artifacts,
    negative_evidence: negativeEvidence,
    path_result: pathResult,
    full_demo_passed: fullDemoPassed,
    deny_path_passed: denyPathPassed,
    demo_passed: fullDemoPassed,
    truth_surface: 'bounded local demo gateway path',
    truth_boundaries: [
      'local gateway only',
      'deny-by-default',
      'scope.intent authorization',
      'caller-supplied artifact digest',
      'no external calls in current gateway implementation',
      'no cloud SDK path',
      'no shell path',
      'no persistent evidence store',
      'no authentication',
      'no system-wide observation',
    ],
    non_claims: NON_CLAIMS,
    source: 'vag-public-demo local gateway run',
    truth_status: fullDemoPassed
      ? 'bounded_demo_complete'
      : denyPathPassed
        ? 'bounded_deny_path_complete'
        : 'incomplete',
    evidence_assembly_order: 'commit_verify_then_evidence',
    negative_evidence_scope: 'bounded_ui_path_only',
    negative_evidence_source: 'ui_derived_from_gateway_deny',
    deny_non_claim: 'does_not_prove_system_wide_non_execution',
  };
}

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

describe('evidence contract — full allow path (§18.3 #44)', () => {
  it('sets full_demo_passed, demo_passed, and assembly order', () => {
    const evidence = evaluateEvidence({
      health: validHealth(),
      allowRun: validAllowRun(),
      commit: validCommit(),
      verify: validVerify(),
      denyRun: validDenyRun(),
      artifacts: validArtifacts(),
      negativeEvidence: validNegativeEvidence(),
    });

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
    assert.equal(evidence.bounded_demo_artifacts.gateway_observed_artifact_content, false);
    assert.equal(evidence.bounded_demo_artifacts.artifact_kind, 'synthetic_local_json');
    assert.equal(evidence.bounded_demo_artifacts.controlled_demo_path, 'demo.transform_json');
  });

  it('contains no no_tool_grant key anywhere in the evidence object', () => {
    const evidence = evaluateEvidence({
      health: validHealth(),
      allowRun: validAllowRun(),
      commit: validCommit(),
      verify: validVerify(),
      denyRun: validDenyRun(),
      artifacts: validArtifacts(),
      negativeEvidence: validNegativeEvidence(),
    });

    const json = JSON.stringify(evidence);
    assert.equal(json.includes('no_tool_grant'), false);
    assert.equal(Object.hasOwn(evidence.negative_evidence, 'no_tool_grant'), false);
  });
});

describe('evidence contract — deny-only path (§18.3 #45)', () => {
  it('sets deny_path_passed and bounded negative evidence fields', () => {
    const evidence = evaluateEvidence({
      health: validHealth(),
      allowRun: null,
      commit: null,
      verify: null,
      denyRun: validDenyRun(),
      artifacts: null,
      negativeEvidence: validNegativeEvidence(),
    });

    assert.equal(evidence.path_result, 'deny_path_passed');
    assert.equal(evidence.deny_path_passed, true);
    assert.equal(evidence.full_demo_passed, false);
    assert.equal(evidence.demo_passed, false);
    assert.equal(evidence.truth_status, 'bounded_deny_path_complete');

    const neg = evidence.negative_evidence;
    assert.equal(neg.denied, true);
    assert.equal(neg.no_local_artifact, true);
    assert.equal(neg.no_commit, true);
    assert.equal(neg.no_verify, true);
    assert.equal(neg.scope, 'bounded_ui_path_only');
    assert.equal(neg.source, 'ui_derived_from_gateway_deny');
    assert.equal(neg.non_claim, 'does_not_prove_system_wide_non_execution');
  });
});

describe('evidence contract — negative evidence completeness', () => {
  for (const field of ['no_local_artifact', 'no_commit', 'no_verify']) {
    it(`fails deny_path_passed when ${field} is false`, () => {
      const broken = { ...validNegativeEvidence(), [field]: false };
      const evidence = evaluateEvidence({
        health: validHealth(),
        allowRun: null,
        commit: null,
        verify: null,
        denyRun: validDenyRun(),
        artifacts: null,
        negativeEvidence: broken,
      });

      assert.equal(evidence.deny_path_passed, false);
      assert.equal(evidence.path_result, 'incomplete');
    });

    it(`fails full_demo_passed when ${field} is false`, () => {
      const broken = { ...validNegativeEvidence(), [field]: false };
      const evidence = evaluateEvidence({
        health: validHealth(),
        allowRun: validAllowRun(),
        commit: validCommit(),
        verify: validVerify(),
        denyRun: validDenyRun(),
        artifacts: validArtifacts(),
        negativeEvidence: broken,
      });

      assert.equal(evidence.full_demo_passed, false);
      assert.equal(evidence.path_result, 'incomplete');
    });
  }

  it('fails when negativeEvidence is null', () => {
    const evidence = evaluateEvidence({
      health: validHealth(),
      allowRun: null,
      commit: null,
      verify: null,
      denyRun: validDenyRun(),
      artifacts: null,
      negativeEvidence: null,
    });

    assert.equal(evidence.deny_path_passed, false);
    assert.equal(evidence.path_result, 'incomplete');
  });
});

describe('evidence contract — incomplete on missing/invalid commit or verify (§18.3 #46–#48)', () => {
  it('missing verify yields incomplete', () => {
    const evidence = evaluateEvidence({
      health: validHealth(),
      allowRun: validAllowRun(),
      commit: validCommit(),
      verify: null,
      denyRun: validDenyRun(),
      artifacts: validArtifacts(),
      negativeEvidence: validNegativeEvidence(),
    });

    assert.equal(evidence.full_demo_passed, false);
    assert.equal(evidence.path_result, 'incomplete');
  });

  it('digest mismatch yields incomplete', () => {
    const evidence = evaluateEvidence({
      health: validHealth(),
      allowRun: validAllowRun(),
      commit: { ...validCommit(), output_digest: HEX64_B },
      verify: validVerify(),
      denyRun: validDenyRun(),
      artifacts: validArtifacts(),
      negativeEvidence: validNegativeEvidence(),
    });

    assert.equal(evidence.full_demo_passed, false);
    assert.equal(evidence.path_result, 'incomplete');
  });

  it('record_hash mismatch between commit and verify yields incomplete', () => {
    const evidence = evaluateEvidence({
      health: validHealth(),
      allowRun: validAllowRun(),
      commit: validCommit(),
      verify: { ...validVerify(), record_hash: HEX64_B },
      denyRun: validDenyRun(),
      artifacts: validArtifacts(),
      negativeEvidence: validNegativeEvidence(),
    });

    assert.equal(evidence.full_demo_passed, false);
    assert.equal(evidence.path_result, 'incomplete');
  });

  it('decision_id mismatch between verify and allow yields incomplete', () => {
    const evidence = evaluateEvidence({
      health: validHealth(),
      allowRun: validAllowRun(),
      commit: validCommit(),
      verify: { ...validVerify(), decision_id: HEX64_B },
      denyRun: validDenyRun(),
      artifacts: validArtifacts(),
      negativeEvidence: validNegativeEvidence(),
    });

    assert.equal(evidence.full_demo_passed, false);
    assert.equal(evidence.path_result, 'incomplete');
  });

  it('invalid (non-hex64) record_hash yields incomplete', () => {
    const evidence = evaluateEvidence({
      health: validHealth(),
      allowRun: validAllowRun(),
      commit: { ...validCommit(), record_hash: 'not-a-hash' },
      verify: validVerify(),
      denyRun: validDenyRun(),
      artifacts: validArtifacts(),
      negativeEvidence: validNegativeEvidence(),
    });

    assert.equal(evidence.full_demo_passed, false);
    assert.equal(evidence.path_result, 'incomplete');
  });

  it('verify.integrity false yields incomplete', () => {
    const evidence = evaluateEvidence({
      health: validHealth(),
      allowRun: validAllowRun(),
      commit: validCommit(),
      verify: { ...validVerify(), integrity: false },
      denyRun: validDenyRun(),
      artifacts: validArtifacts(),
      negativeEvidence: validNegativeEvidence(),
    });

    assert.equal(evidence.full_demo_passed, false);
    assert.equal(evidence.path_result, 'incomplete');
  });
});

describe('evidence contract — schema markers (§18.3 #49–#50)', () => {
  it('schema_version and evidence_assembly_order are fixed literals', () => {
    const evidence = evaluateEvidence({
      health: validHealth(),
      allowRun: null,
      commit: null,
      verify: null,
      denyRun: validDenyRun(),
      artifacts: null,
      negativeEvidence: validNegativeEvidence(),
    });

    assert.equal(evidence.schema_version, 'vag-demo-evidence/1.0');
    assert.equal(evidence.evidence_assembly_order, 'commit_verify_then_evidence');
    assert.equal(evidence.negative_evidence_scope, 'bounded_ui_path_only');
    assert.equal(evidence.negative_evidence_source, 'ui_derived_from_gateway_deny');
    assert.equal(evidence.deny_non_claim, 'does_not_prove_system_wide_non_execution');
  });

  it('gateway_observed_artifact_content is always false on artifacts', () => {
    const artifacts = validArtifacts();
    assert.equal(artifacts.gateway_observed_artifact_content, false);

    const evidence = evaluateEvidence({
      health: validHealth(),
      allowRun: validAllowRun(),
      commit: validCommit(),
      verify: validVerify(),
      denyRun: validDenyRun(),
      artifacts,
      negativeEvidence: validNegativeEvidence(),
    });

    assert.equal(
      evidence.bounded_demo_artifacts.gateway_observed_artifact_content,
      false,
    );
  });
});

describe('evidence contract — path_result semantics (item 8)', () => {
  it('path_result has exactly three values; error and incomplete are not distinguished', () => {
    // Whitepaper §15.1 defines only:
    //   'full_demo_passed' | 'deny_path_passed' | 'incomplete'
    // There is no 'failed' value. Both true runtime errors and partial
    // runs collapse to 'incomplete'. This matches the normative schema;
    // restoring 'failed' would require an Owner decision and a type change,
    // which is out of scope for this test step.
    const allowed = new Set([
      'full_demo_passed',
      'deny_path_passed',
      'incomplete',
    ]);

    const cases = [
      evaluateEvidence({
        health: validHealth(),
        allowRun: validAllowRun(),
        commit: validCommit(),
        verify: validVerify(),
        denyRun: validDenyRun(),
        artifacts: validArtifacts(),
        negativeEvidence: validNegativeEvidence(),
      }),
      evaluateEvidence({
        health: validHealth(),
        allowRun: null,
        commit: null,
        verify: null,
        denyRun: validDenyRun(),
        artifacts: null,
        negativeEvidence: validNegativeEvidence(),
      }),
      evaluateEvidence({
        health: validHealth(),
        allowRun: validAllowRun(),
        commit: null,
        verify: null,
        denyRun: null,
        artifacts: null,
        negativeEvidence: null,
      }),
    ];

    for (const evidence of cases) {
      assert.ok(
        allowed.has(evidence.path_result),
        `unexpected path_result: ${evidence.path_result}`,
      );
    }

    // Documented limitation (not a test failure):
    // a genuine runtime error and a merely incomplete run both yield
    // path_result === 'incomplete'. Distinction would need a 'failed'
    // value in the type contract (Owner decision required).
  });
});
