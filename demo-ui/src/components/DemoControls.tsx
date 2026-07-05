import type { DemoPhase } from '../types';

interface DemoControlsProps {
  phase: DemoPhase;
  onDeny: () => void;
  onRunFull: () => void;
  onReset: () => void;
}

export function DemoControls({ phase, onDeny, onRunFull, onReset }: DemoControlsProps) {
  const disabled = phase === 'running';

  const buttonStyle = (color: string) => ({
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 600 as const,
    border: 'none',
    borderRadius: 4,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    background: color,
    color: '#fff',
    marginRight: 12,
  });

  return (
    <section style={{ marginBottom: 24 }}>
      <h3 style={{ marginBottom: 12 }}>Demo Controls</h3>
      <button style={buttonStyle('#059669')} onClick={onRunFull} disabled={disabled}>
        Run Full Demo
      </button>
      <button style={buttonStyle('#dc2626')} onClick={onDeny} disabled={disabled}>
        Run Deny-Only Demo
      </button>
      <button style={buttonStyle('#475569')} onClick={onReset} disabled={disabled}>
        Reset
      </button>
    </section>
  );
}
