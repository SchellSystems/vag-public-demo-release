import { useState } from 'react';
import { copyToClipboard } from '../utils/clipboard';
import type { DemoEvidence } from '../types';

interface EvidencePanelProps {
  evidence: DemoEvidence;
}

export function EvidencePanel({ evidence }: EvidencePanelProps) {
  const [copied, setCopied] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const json = JSON.stringify(evidence, null, 2);

  const summary = [
    evidence.health?.status === 'ok' ? 'Health check passed' : 'Health check incomplete',
    evidence.allow_run?.decision === 'allow' ? 'Proposal allowed' : null,
    evidence.commit?.status === 'committed' ? 'Commit recorded' : null,
    evidence.verify?.integrity ? 'Integrity verified' : null,
    evidence.deny_run?.decision === 'deny' ? 'Deny issued' : null,
    evidence.negative_evidence?.denied ? 'Negative evidence: bounded deny path only' : null,
  ].filter(Boolean);

  async function handleCopy() {
    const ok = await copyToClipboard(json);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const resultColor = evidence.full_demo_passed
    ? '#059669'
    : evidence.deny_path_passed
      ? '#d97706'
      : '#dc2626';

  return (
    <section style={{
      marginBottom: 24,
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: 8,
      padding: 20,
    }}>
      <h3 style={{ margin: '0 0 12px', fontSize: 16, color: '#0f172a' }}>Evidence Summary</h3>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
        padding: '8px 12px',
        background: '#f8fafc',
        borderRadius: 6,
      }}>
        <span style={{
          display: 'inline-block',
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: resultColor,
        }} />
        <span style={{ fontWeight: 700, fontSize: 14, color: resultColor }}>
          {evidence.path_result.replace(/_/g, ' ')}
        </span>
        <span style={{ fontSize: 13, color: '#64748b', marginLeft: 'auto' }}>
          {evidence.truth_status.replace(/_/g, ' ')}
        </span>
      </div>

      <ul style={{ margin: '0 0 16px', paddingLeft: 20, fontSize: 13, color: '#475569' }}>
        {summary.map((item) => (
          <li key={item} style={{ marginBottom: 4 }}>{item}</li>
        ))}
      </ul>

      <div>
        <button
          onClick={() => setShowJson(!showJson)}
          style={{
            background: 'none',
            border: '1px solid #e2e8f0',
            borderRadius: 4,
            padding: '6px 14px',
            fontSize: 13,
            cursor: 'pointer',
            color: '#475569',
            fontWeight: 500,
          }}
        >
          {showJson ? 'Hide' : 'Show'} Evidence JSON
        </button>
        {showJson && (
          <button
            onClick={handleCopy}
            style={{
              marginLeft: 8,
              background: copied ? '#dcfce7' : '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: 4,
              padding: '6px 14px',
              fontSize: 13,
              cursor: 'pointer',
              color: copied ? '#059669' : '#475569',
              fontWeight: 500,
            }}
          >
            {copied ? 'Copied!' : 'Copy JSON'}
          </button>
        )}
      </div>

      {showJson && (
        <pre style={{
          marginTop: 12,
          background: '#1e293b',
          color: '#e2e8f0',
          padding: 16,
          borderRadius: 6,
          overflow: 'auto',
          maxHeight: 400,
          fontSize: 11,
          lineHeight: 1.5,
        }}>
          {json}
        </pre>
      )}
    </section>
  );
}
