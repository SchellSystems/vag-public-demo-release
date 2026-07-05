import { useState } from 'react';
import { copyToClipboard } from '../utils/clipboard';
import type { DemoEvidence } from '../types';

interface EvidencePanelProps {
  evidence: DemoEvidence;
}

export function EvidencePanel({ evidence }: EvidencePanelProps) {
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(evidence, null, 2);

  async function handleCopy() {
    const ok = await copyToClipboard(json);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <section style={{ marginTop: 24 }}>
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
