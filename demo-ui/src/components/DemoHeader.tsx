interface DemoHeaderProps {
  mode: string;
  gatewayUrl: string;
}

export function DemoHeader({ mode, gatewayUrl }: DemoHeaderProps) {
  return (
    <header style={{ marginBottom: 24, borderBottom: '2px solid #333', paddingBottom: 16 }}>
      <h1 style={{ margin: 0 }}>VAG Public Demo</h1>
      <p style={{ margin: '8px 0 0', color: '#555' }}>
        Use Case: <strong>Controlled Business Record Review</strong>
      </p>
      <p style={{ margin: '4px 0 0' }}>
        Mode: <code style={{ background: '#f0f0f0', padding: '2px 6px' }}>{mode}</code>
      </p>
      <p style={{ margin: '4px 0 0' }}>
        Gateway: <code style={{ background: '#f0f0f0', padding: '2px 6px' }}>{gatewayUrl}</code>
      </p>
    </header>
  );
}
