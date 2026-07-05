interface NonClaimsPanelProps {
  claims: string[];
}

export function NonClaimsPanel({ claims }: NonClaimsPanelProps) {
  return (
    <section style={{ marginBottom: 24, background: '#fff3cd', padding: 16, borderRadius: 6 }}>
      <h3 style={{ margin: '0 0 8px' }}>⚠️ Non-Claims (always visible)</h3>
      <ul style={{ margin: 0, paddingLeft: 20 }}>
        {claims.map((claim, i) => (
          <li key={i} style={{ marginBottom: 4, fontSize: 14 }}>{claim}</li>
        ))}
      </ul>
    </section>
  );
}
