import type { DemoEvidence } from '../types';
import { NON_CLAIMS } from '../constants';

const HEX64_RE = /^[0-9a-f]{64}$/;

/**
 * Build a complete demo evidence object from the collected run data.
 * Assembly order is always Commit → Verify → Evidence (whitepaper §15).
 * Negative evidence is UI-derived and bounded to the observed UI path only.
 * No ToolGrant subsystem exists; no ToolGrant field is emitted or checked.
 */
export function buildEvidence(params: {
  health: DemoEvidence['health'];
  allowRun: DemoEvidence['allow_run'];
  commit: DemoEvidence['commit'];
  verify: DemoEvidence['verify'];
  denyRun: DemoEvidence['deny_run'];
  artifacts: DemoEvidence['bounded_demo_artifacts'];
  negativeEvidence: DemoEvidence['negative_evidence'];
}): DemoEvidence {
  const { health, allowRun, commit, verify, denyRun, artifacts, negativeEvidence } = params;

  const fullDemoPassed =
    health !== null &&
    health.status === 'ok' &&
    allowRun !== null &&
    allowRun.decision === 'allow' &&
    allowRun.allowed === true &&
    typeof allowRun.decision_id === 'string' && allowRun.decision_id.length > 0 &&
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
