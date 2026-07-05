import type { DemoPhase } from '../types';

interface DemoControlsProps {
  phase: DemoPhase;
  onAllow: () => void;
  onDeny: () => void;
  onRunFull: () => void;
}

export function DemoControls({ phase, onAllow, onDeny, onRunFull }: DemoControlsProps) {
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
      <button style={buttonStyle('#2563eb')} onClick={onAllow} disabled={disabled}>
        Allow Demo
      </button>
      <button style={buttonStyle('#dc2626')} onClick={onDeny} disabled={disabled}>
        Deny Demo
      </button>
      <button style={buttonStyle('#059669')} onClick={onRunFull} disabled={disabled}>
        Run Gateway-Bound Demo
      </button>
    </section>
  );
}
