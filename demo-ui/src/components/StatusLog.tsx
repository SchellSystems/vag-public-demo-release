import { useState } from 'react';

interface StatusLogProps {
  logs: string[];
}

export function StatusLog({ logs }: StatusLogProps) {
  const [expanded, setExpanded] = useState(true);

  if (logs.length === 0) return null;

  return (
    <section style={{ marginBottom: 24 }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px 0',
          fontSize: 14,
          fontWeight: 600,
          color: '#334155',
          gap: 8,
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 12 }}>{expanded ? '\u25BC' : '\u25B6'}</span>
        Activity Log ({logs.length} entries)
      </button>
      {expanded && (
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          padding: 12,
          borderRadius: 6,
          maxHeight: 180,
          overflow: 'auto',
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
          fontSize: 12,
          lineHeight: 1.6,
        }}>
          {logs.map((line, i) => (
            <div key={i} style={{
              color: line.includes('ERROR') ? '#dc2626' : '#475569',
              fontWeight: line.includes('ERROR') ? 600 : 400,
            }}>
              {line}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
