import type { DemoEvidence } from '../types';
import { NON_CLAIMS } from '../constants';

const HEX64_RE = /^[0-9a-f]{64}$/;

/**
 * Build a complete demo evidence object from the collected run data.
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

  const demoPassed =
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
    verify.record_hash === commit.record_hash &&
    verify.decision_id === allowRun.decision_id &&
    denyRun !== null &&
    denyRun.decision === 'deny' &&
    denyRun.allowed === false &&
    negativeEvidence !== null &&
    negativeEvidence.denied === true &&
    negativeEvidence.no_tool_grant === true &&
    negativeEvidence.no_commit === true &&
    negativeEvidence.no_verify === true;

  return {
    health,
    allow_run: allowRun,
    commit,
    verify,
    deny_run: denyRun,
    bounded_demo_artifacts: artifacts,
    negative_evidence: negativeEvidence,
    demo_passed: demoPassed,
    truth_surface: 'bounded local demo gateway path',
    truth_boundaries: [
      'local gateway only',
      'deny-by-default',
      'scope.intent authorization',
      'no external calls',
      'no cloud',
      'no shell',
    ],
    non_claims: NON_CLAIMS,
    source: 'vag-public-demo local gateway run',
    truth_status: demoPassed ? 'bounded_demo_complete' : 'incomplete',
    negative_evidence_scope: 'bounded_demo_path_only',
    negative_evidence_source: 'ui_derived_from_gateway_deny',
    deny_non_claim: 'does_not_prove_system_wide_non_execution',
  };
}
