interface StatusLogProps {
  logs: string[];
}

export function StatusLog({ logs }: StatusLogProps) {
  if (logs.length === 0) return null;

  return (
    <section style={{ marginBottom: 24 }}>
      <h3>Status Log</h3>
      <div
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          padding: 12,
          borderRadius: 6,
          maxHeight: 200,
          overflow: 'auto',
          fontFamily: 'monospace',
          fontSize: 12,
        }}
      >
        {logs.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </section>
  );
}
