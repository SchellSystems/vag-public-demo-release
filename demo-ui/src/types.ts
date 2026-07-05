/** Evidence structure from a bounded demo run */
export interface DemoEvidence {
  health: HealthResult | null;
  allow_run: ProposeResult | null;
  commit: CommitResult | null;
  verify: VerifyResult | null;
  deny_run: ProposeResult | null;
  bounded_demo_artifacts: BoundedDemoArtifacts | null;
  negative_evidence: NegativeEvidence | null;
  demo_passed: boolean;
  truth_surface: string;
  truth_boundaries: string[];
  non_claims: string[];
  source: string;
  truth_status: string;
  negative_evidence_scope: string;
  negative_evidence_source: string;
  deny_non_claim: string;
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
  record_hash: string;
  proposal_id: string;
  decision_id: string;
  scope_intent: string;
  source: string;
  truth_status: string;
  verified_at: string;
}

export interface BoundedDemoArtifacts {
  controlled_tool_path: string;
  output_digest: string;
  proposal_id: string;
  committed: boolean;
  verified: boolean;
}

export interface NegativeEvidence {
  denied: boolean;
  proposal_id: string;
  no_tool_grant: boolean;
  no_commit: boolean;
  no_verify: boolean;
  reason: string;
}

export interface GatewayError {
  error: string;
  message: string;
}

export type DemoPhase = 'idle' | 'running' | 'complete' | 'error';
