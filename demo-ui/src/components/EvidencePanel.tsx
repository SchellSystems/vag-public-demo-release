import { useState } from 'react';
import { copyToClipboard } from '../utils/clipboard';
import type { DemoEvidence } from '../types';

interface EvidencePanelProps {
  evidence: DemoEvidence;
}

export function EvidencePanel({ evidence }: EvidencePanelProps) {
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(evidence, null, 2);
  const summary = [
    evidence.health?.status === 'ok' ? 'Health check passed' : 'Health check incomplete',
    evidence.allow_run?.decision === 'allow' ? 'Proposal allowed' : null,
    evidence.commit?.status === 'committed' ? 'Commit recorded' : null,
    evidence.verify?.integrity ? 'Commit verified' : null,
    evidence.deny_run?.decision === 'deny' ? 'Deny issued' : null,
    evidence.negative_evidence?.denied ? 'Negative evidence recorded for bounded deny path' : null,
  ].filter(Boolean);

  async function handleCopy() {
    const ok = await copyToClipboard(json);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <section style={{ marginTop: 24 }}>
      <h3>Evidence Summary</h3>
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: 12, marginBottom: 16 }}>
        <p style={{ margin: '0 0 8px', fontWeight: 700 }}>Path result: {evidence.path_result}</p>
        <p style={{ margin: '0 0 8px' }}>
          Full demo: {String(evidence.full_demo_passed)} | Deny path: {String(evidence.deny_path_passed)}
        </p>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {summary.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <h3>Evidence JSON</h3>
      <div style={{ position: 'relative' }}>
        <button
          onClick={handleCopy}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            padding: '4px 12px',
            fontSize: 12,
            cursor: 'pointer',
            background: copied ? '#22c55e' : '#e5e7eb',
            border: 'none',
            borderRadius: 4,
          }}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <pre
          style={{
            background: '#1e293b',
            color: '#e2e8f0',
            padding: 16,
            borderRadius: 6,
            overflow: 'auto',
            maxHeight: 500,
            fontSize: 12,
          }}
        >
          {json}
        </pre>
      </div>
    </section>
  );
}
