import { useState } from 'react';
import { DemoHeader } from './components/DemoHeader';
import { NonClaimsPanel } from './components/NonClaimsPanel';
import { DemoControls } from './components/DemoControls';
import { EvidencePanel } from './components/EvidencePanel';
import { StatusLog } from './components/StatusLog';
import { GATEWAY_URL, DEMO_MODE, NON_CLAIMS } from './constants';
import { checkHealth, proposeAllow, proposeDeny, commitProposal, verifyRecord } from './services/gateway';
import { buildEvidence } from './services/evidence';
import { createHash } from './utils/hash';
import type { DemoEvidence, DemoPhase, FlowStep } from './types';

const INITIAL_FLOW: FlowStep[] = [
  { label: 'Proposal', status: 'pending' },
  { label: 'Gateway Decision', status: 'pending' },
  { label: 'Bounded Artifact', status: 'pending' },
  { label: 'Commit', status: 'pending' },
  { label: 'Verify', status: 'pending' },
  { label: 'Evidence', status: 'pending' },
];

function DemoFlow({ steps }: { steps: FlowStep[] }) {
  const colors: Record<FlowStep['status'], { bg: string; border: string; text: string }> = {
    pending: { bg: '#f1f5f9', border: '#cbd5e1', text: '#64748b' },
    allowed: { bg: '#eff6ff', border: '#2563eb', text: '#1d4ed8' },
    denied: { bg: '#fef2f2', border: '#dc2626', text: '#b91c1c' },
    committed: { bg: '#ecfdf5', border: '#059669', text: '#047857' },
    verified: { bg: '#f0fdf4', border: '#16a34a', text: '#15803d' },
    blocked: { bg: '#fef2f2', border: '#991b1b', text: '#7f1d1d' },
  };

  const statusLabels: Record<FlowStep['status'], string> = {
    pending: 'Waiting',
    allowed: 'Allowed',
    denied: 'Denied',
    committed: 'Committed',
    verified: 'Verified',
    blocked: 'Blocked',
  };

  return (
    <section style={{ marginBottom: 24 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        overflowX: 'auto',
        padding: '4px 0',
      }}>
        {steps.map((step, idx) => {
          const c = colors[step.status];
          return (
            <div key={step.label} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                background: c.bg,
                border: `2px solid ${c.border}`,
                borderRadius: 8,
                padding: '12px 16px',
                minWidth: 110,
                textAlign: 'center',
                transition: 'all 0.3s ease',
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: c.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {step.label}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginTop: 4 }}>
                  {statusLabels[step.status]}
                </div>
              </div>
              {idx < steps.length - 1 && (
                <div style={{ color: '#94a3b8', fontSize: 18, margin: '0 2px', flexShrink: 0 }}>
                  {'\u2192'}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function App() {
  const [phase, setPhase] = useState<DemoPhase>('idle');
  const [evidence, setEvidence] = useState<DemoEvidence | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [flow, setFlow] = useState<FlowStep[]>(INITIAL_FLOW);

  function log(msg: string) {
    setLogs((prev) => [...prev, `[${new Date().toISOString()}] ${msg}`]);
  }

  function setFlowStatus(label: string, status: FlowStep['status']) {
    setFlow((prev) => prev.map((step) => step.label === label ? { ...step, status } : step));
  }

  function resetDemo() {
    setPhase('idle');
    setEvidence(null);
    setLogs([]);
    setFlow(INITIAL_FLOW);
  }

  async function runAllowPath() {
    setPhase('running');
    setLogs([]);
    setEvidence(null);
    setFlow(INITIAL_FLOW);

    try {
      // 1. Health
      log('Checking gateway health...');
      const healthResult = await checkHealth();
      log(`Health: ${healthResult.status}`);

      // 2. Propose (allow path)
      log('Submitting allow proposal (scope.intent: demo.transform_json)...');
      const allowResult = await proposeAllow();
      log(`Proposal decision: ${allowResult.decision} (id: ${allowResult.proposal_id})`);
      setFlowStatus('Proposal', 'allowed');
      setFlowStatus('Gateway Decision', 'allowed');

      if (allowResult.decision !== 'allow') {
        throw new Error('Expected allow but got deny');
      }

      // 3. Create bounded demo artifacts (only after gateway allow)
      const artifactData = JSON.stringify({
        transformed: { record_subject: 'DEMO_RECORD', review_action: 'reviewed', status: 'demo_complete' },
        proposal_id: allowResult.proposal_id,
      });
      const outputDigest = await createHash(artifactData);
      log(`Bounded demo artifact created, digest: ${outputDigest.slice(0, 16)}...`);
      setFlowStatus('Bounded Artifact', 'allowed');

      // 4. Commit
      log('Committing to gateway...');
      const commitResult = await commitProposal(allowResult.proposal_id, allowResult.decision_id, outputDigest);
      log(`Committed: record_hash=${commitResult.record_hash.slice(0, 16)}...`);
      setFlowStatus('Commit', 'committed');

      // 5. Verify
      log('Verifying integrity...');
      const verifyResult = await verifyRecord(commitResult.record_hash, commitResult.signature);
      log(`Verified: integrity=${verifyResult.integrity}`);
      setFlowStatus('Verify', 'verified');

      // 6. Deny path (separate; produces UI-derived negative evidence only)
      log('Submitting deny proposal (scope.intent: demo.forbidden_action)...');
      const denyResult = await proposeDeny();
      log(`Deny decision: ${denyResult.decision}`);

      const negativeEvidence = {
        denied: true as const,
        proposal_id: denyResult.proposal_id,
        no_local_artifact: true as const,
        no_commit: true as const,
        no_verify: true as const,
        scope: 'bounded_ui_path_only' as const,
        source: 'ui_derived_from_gateway_deny' as const,
        reason: 'Gateway denied the proposal; this UI path created no local follow-on artifact and did not call Commit or Verify.',
        non_claim: 'does_not_prove_system_wide_non_execution' as const,
      };
      log('Negative evidence recorded (no local artifact, no Commit, no Verify).');

      // 7. Evidence Assembly (after Commit and Verify)
      const fullEvidence = buildEvidence({
        health: healthResult,
        allowRun: allowResult,
        commit: commitResult,
        verify: verifyResult,
        denyRun: denyResult,
        artifacts: {
          artifact_kind: 'synthetic_local_json',
          controlled_demo_path: 'demo.transform_json',
          output_digest: outputDigest,
          proposal_id: allowResult.proposal_id,
          committed: true,
          verified: true,
          gateway_observed_artifact_content: false,
        },
        negativeEvidence,
      });

      setEvidence(fullEvidence);
      setPhase('complete');
      setFlowStatus('Evidence', 'verified');
      log(`Demo complete. demo_passed=${fullEvidence.demo_passed}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log(`ERROR: ${msg}`);
      setPhase('error');
      setFlow((prev) => prev.map((step) => step.status === 'pending' ? { ...step, status: 'blocked' } : step));
    }
  }

  async function runDenyOnly() {
    setPhase('running');
    setLogs([]);
    setEvidence(null);
    setFlow(INITIAL_FLOW);

    try {
      log('Checking gateway health...');
      const healthResult = await checkHealth();
      log(`Health: ${healthResult.status}`);

      log('Submitting deny proposal (scope.intent: demo.forbidden_action)...');
      const denyResult = await proposeDeny();
      log(`Deny decision: ${denyResult.decision}`);
      setFlowStatus('Proposal', 'denied');
      setFlowStatus('Gateway Decision', 'denied');
      setFlowStatus('Bounded Artifact', 'blocked');
      setFlowStatus('Commit', 'blocked');
      setFlowStatus('Verify', 'blocked');

      const negativeEvidence = {
        denied: true as const,
        proposal_id: denyResult.proposal_id,
        no_local_artifact: true as const,
        no_commit: true as const,
        no_verify: true as const,
        scope: 'bounded_ui_path_only' as const,
        source: 'ui_derived_from_gateway_deny' as const,
        reason: 'Gateway denied the proposal; this UI path created no local follow-on artifact and did not call Commit or Verify.',
        non_claim: 'does_not_prove_system_wide_non_execution' as const,
      };
      log('Negative evidence: no local artifact, no Commit, no Verify.');

      const denyEvidence = buildEvidence({
        health: healthResult,
        allowRun: null,
        commit: null,
        verify: null,
        denyRun: denyResult,
        artifacts: null,
        negativeEvidence,
      });

      setEvidence(denyEvidence);
      setPhase('complete');
      setFlowStatus('Evidence', 'verified');
      log(`Deny path complete. path_result=${denyEvidence.path_result}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log(`ERROR: ${msg}`);
      setPhase('error');
      setFlow((prev) => prev.map((step) => step.status === 'pending' ? { ...step, status: 'blocked' } : step));
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
    }}>
      <div style={{
        maxWidth: 960,
        margin: '0 auto',
        padding: '32px 24px',
      }}>
        <DemoHeader mode={DEMO_MODE} gatewayUrl={GATEWAY_URL} />

        <DemoControls
          phase={phase}
          onDeny={runDenyOnly}
          onRunFull={runAllowPath}
          onReset={resetDemo}
        />

        <DemoFlow steps={flow} />

        <StatusLog logs={logs} />

        {evidence && <EvidencePanel evidence={evidence} />}

        <NonClaimsPanel claims={NON_CLAIMS} />
      </div>
    </div>
  );
}

export default App;
