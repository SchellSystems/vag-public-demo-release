import type { DemoPhase } from '../types';

interface DemoControlsProps {
  phase: DemoPhase;
  onDeny: () => void;
  onRunFull: () => void;
  onReset: () => void;
}

export function DemoControls({ phase, onDeny, onRunFull, onReset }: DemoControlsProps) {
  const disabled = phase === 'running';

  const buttonBase: React.CSSProperties = {
    padding: '10px 24px',
    fontSize: 14,
    fontWeight: 600,
    border: 'none',
    borderRadius: 6,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    color: '#fff',
    transition: 'opacity 0.2s ease',
  };

  return (
    <section style={{ marginBottom: 28 }}>
      <div style={{
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        <button
          style={{ ...buttonBase, background: '#059669' }}
          onClick={onRunFull}
          disabled={disabled}
        >
          Allow + Deny (Full Demo)
        </button>
        <button
          style={{ ...buttonBase, background: '#dc2626' }}
          onClick={onDeny}
          disabled={disabled}
        >
          Deny Only
        </button>
        <button
          style={{ ...buttonBase, background: '#475569' }}
          onClick={onReset}
          disabled={phase === 'idle' || disabled}
        >
          Reset
        </button>
        {phase === 'running' && (
          <span style={{ fontSize: 13, color: '#64748b', fontStyle: 'italic' }}>
            Running...
          </span>
        )}
        {phase === 'complete' && (
          <span style={{ fontSize: 13, color: '#059669', fontWeight: 600 }}>
            Complete
          </span>
        )}
        {phase === 'error' && (
          <span style={{ fontSize: 13, color: '#dc2626', fontWeight: 600 }}>
            Error (see log)
          </span>
        )}
      </div>
    </section>
  );
}
