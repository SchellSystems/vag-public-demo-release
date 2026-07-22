/** Evidence structure from a bounded demo run — whitepaper §15.1 */
export interface DemoEvidence {
  schema_version: 'vag-demo-evidence/1.0';
  health: HealthResult | null;
  allow_run: ProposeResult | null;
  commit: CommitResult | null;
  verify: VerifyResult | null;
  deny_run: ProposeResult | null;
  bounded_demo_artifacts: BoundedDemoArtifacts | null;
  negative_evidence: NegativeEvidence | null;
  path_result: 'full_demo_passed' | 'deny_path_passed' | 'incomplete';
  full_demo_passed: boolean;
  deny_path_passed: boolean;
  demo_passed: boolean;
  truth_surface: 'bounded local demo gateway path';
  truth_boundaries: string[];
  non_claims: string[];
  source: 'vag-public-demo local gateway run';
  truth_status:
    | 'bounded_demo_complete'
    | 'bounded_deny_path_complete'
    | 'incomplete';
  evidence_assembly_order: 'commit_verify_then_evidence';
  negative_evidence_scope: 'bounded_ui_path_only';
  negative_evidence_source: 'ui_derived_from_gateway_deny';
  deny_non_claim: 'does_not_prove_system_wide_non_execution';
}

export interface HealthResult {
  status: string;
  gateway: string;
  mode: string;
  timestamp: string;
}

export interface ProposeResult {
  proposal_id: string;
  decision: 'allow' | 'deny';
  decision_id: string;
  decision_mode_final: string;
  allowed: boolean;
  reason_code: string;
  scope_intent: string;
  source: string;
  truth_status: string;
  message: string;
}

export interface CommitResult {
  status: string;
  proposal_id: string;
  decision_id: string;
  output_digest: string;
  record_hash: string;
  signature: string;
  source: string;
  truth_status: string;
  committed_at: string;
}

export interface VerifyResult {
  valid: boolean;
  status: string;
  integrity: boolean;
  hash_integrity: boolean;
  signature_integrity: boolean;
  reference_integrity: boolean;
  record_hash: string;
  proposal_id: string;
  decision_id: string;
  scope_intent: string;
  source: string;
  truth_status: string;
  verified_at: string;
}

/** Artifact schema — whitepaper §15.2 */
export interface BoundedDemoArtifacts {
  artifact_kind: 'synthetic_local_json';
  controlled_demo_path: 'demo.transform_json';
  output_digest: string;
  proposal_id: string;
  committed: true;
  verified: true;
  gateway_observed_artifact_content: false;
}

/** Negative evidence — whitepaper §15.3; no_tool_grant is forbidden */
export interface NegativeEvidence {
  denied: true;
  proposal_id: string;
  no_local_artifact: true;
  no_commit: true;
  no_verify: true;
  scope: 'bounded_ui_path_only';
  source: 'ui_derived_from_gateway_deny';
  reason: string;
  non_claim: 'does_not_prove_system_wide_non_execution';
}

export interface GatewayError {
  error: string;
  message: string;
}

export type DemoPhase = 'idle' | 'running' | 'complete' | 'error';

export type FlowStatus = 'pending' | 'allowed' | 'denied' | 'committed' | 'verified' | 'blocked';

export interface FlowStep {
  label: string;
  status: FlowStatus;
}
