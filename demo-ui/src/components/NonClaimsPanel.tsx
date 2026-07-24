import { useState } from 'react';

interface NonClaimsPanelProps {
  claims: string[];
}

export function NonClaimsPanel({ claims }: NonClaimsPanelProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section style={{
      marginBottom: 24,
      background: '#fffbeb',
      border: '1px solid #fcd34d',
      borderRadius: 8,
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          padding: '12px 16px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          fontSize: 14,
          fontWeight: 600,
          color: '#92400e',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 16 }}>{expanded ? '\u25BC' : '\u25B6'}</span>
        Non-Claims (this demo does not provide or guarantee the following)
      </button>
      {expanded && (
        <div style={{ padding: '0 16px 12px' }}>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#78350f' }}>
            {claims.map((claim, i) => (
              <li key={i} style={{ marginBottom: 3 }}>{claim}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
