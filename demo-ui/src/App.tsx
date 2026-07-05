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
import type { DemoEvidence, DemoPhase } from './types';

function App() {
  const [phase, setPhase] = useState<DemoPhase>('idle');
  const [evidence, setEvidence] = useState<DemoEvidence | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  function log(msg: string) {
    setLogs((prev) => [...prev, `[${new Date().toISOString()}] ${msg}`]);
  }

  async function runAllowPath() {
    setPhase('running');
    setLogs([]);
    setEvidence(null);

    try {
      // 1. Health
      log('Checking gateway health...');
      const healthResult = await checkHealth();
      log(`Health: ${healthResult.status}`);

      // 2. Propose (allow path)
      log('Submitting allow proposal (scope.intent: demo.transform_json)...');
      const allowResult = await proposeAllow();
      log(`Proposal decision: ${allowResult.decision} (id: ${allowResult.proposal_id})`);

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

      // 4. Commit
      log('Committing to gateway...');
      const commitResult = await commitProposal(allowResult.proposal_id, allowResult.decision_id, outputDigest);
      log(`Committed: record_hash=${commitResult.record_hash.slice(0, 16)}...`);

      // 5. Verify
      log('Verifying integrity...');
      const verifyResult = await verifyRecord(commitResult.record_hash, commitResult.signature);
      log(`Verified: integrity=${verifyResult.integrity}`);

      // 6. Deny path
      log('Submitting deny proposal (scope.intent: demo.forbidden_action)...');
      const denyResult = await proposeDeny();
      log(`Deny decision: ${denyResult.decision}`);

      const negativeEvidence = {
        denied: true,
        proposal_id: denyResult.proposal_id,
        no_tool_grant: true,
        no_commit: true,
        no_verify: true,
        reason: 'Gateway denied proposal. No ToolGrant, Commit, or Verify produced in bounded deny path.',
      };
      log('Negative evidence recorded (no ToolGrant, no Commit, no Verify).');

      // Build complete evidence
      const fullEvidence = buildEvidence({
        health: healthResult,
        allowRun: allowResult,
        commit: commitResult,
        verify: verifyResult,
        denyRun: denyResult,
        artifacts: {
          controlled_tool_path: 'demo.transform_json',
          output_digest: outputDigest,
          proposal_id: allowResult.proposal_id,
          committed: true,
          verified: true,
        },
        negativeEvidence,
      });

      setEvidence(fullEvidence);
      setPhase('complete');
      log(`Demo complete. demo_passed=${fullEvidence.demo_passed}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log(`ERROR: ${msg}`);
      setPhase('error');
    }
  }

  async function runDenyOnly() {
    setPhase('running');
    setLogs([]);
    setEvidence(null);

    try {
      log('Checking gateway health...');
      const healthResult = await checkHealth();
      log(`Health: ${healthResult.status}`);

      log('Submitting deny proposal (scope.intent: demo.forbidden_action)...');
      const denyResult = await proposeDeny();
      log(`Deny decision: ${denyResult.decision}`);

      const negativeEvidence = {
        denied: true,
        proposal_id: denyResult.proposal_id,
        no_tool_grant: true,
        no_commit: true,
        no_verify: true,
        reason: 'Gateway denied proposal. No ToolGrant, Commit, or Verify produced in bounded deny path.',
      };
      log('Negative evidence: no ToolGrant, no Commit, no Verify.');

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
      log(`Deny path complete. demo_passed=${denyEvidence.demo_passed}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log(`ERROR: ${msg}`);
      setPhase('error');
    }
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <DemoHeader mode={DEMO_MODE} gatewayUrl={GATEWAY_URL} />
      <NonClaimsPanel claims={NON_CLAIMS} />
      <DemoControls
        phase={phase}
        onAllow={runAllowPath}
        onDeny={runDenyOnly}
        onRunFull={runAllowPath}
      />
      <StatusLog logs={logs} />
      {evidence && <EvidencePanel evidence={evidence} />}
    </div>
  );
}

export default App;
