interface DemoHeaderProps {
  mode: string;
  gatewayUrl: string;
}

export function DemoHeader({ mode, gatewayUrl }: DemoHeaderProps) {
  return (
    <header style={{
      marginBottom: 32,
      borderBottom: '1px solid #e2e8f0',
      paddingBottom: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#0f172a' }}>
          VAG Bounded Demo
        </h1>
        <span style={{
          fontSize: 12,
          fontWeight: 600,
          color: '#64748b',
          background: '#f1f5f9',
          padding: '4px 10px',
          borderRadius: 4,
          border: '1px solid #e2e8f0',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          {mode}
        </span>
      </div>
      <p style={{ margin: '12px 0 0', color: '#475569', fontSize: 15 }}>
        Demonstrates the bounded verification flow: Proposal, Gateway Decision,
        Artifact Digest, Commit, Verify, and Evidence Assembly.
      </p>
      <div style={{ marginTop: 8, fontSize: 13, color: '#64748b' }}>
        Gateway: <code style={{
          background: '#f1f5f9',
          padding: '2px 8px',
          borderRadius: 3,
          fontSize: 12,
          border: '1px solid #e2e8f0',
        }}>{gatewayUrl}</code>
      </div>
    </header>
  );
}
