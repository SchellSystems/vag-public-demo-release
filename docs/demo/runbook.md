# Demo Runbook

## Local Development

### Prerequisites

- Node.js 18+
- npm

### Install Dependencies

```bash
npm ci
```

This installs dependencies for both `demo-gateway` and `demo-ui` via workspaces.

### Start Gateway

```bash
npm run gateway
```

Or directly:

```bash
cd demo-gateway && node src/server.mjs
```

### Start UI (dev mode)

```bash
npm run dev
```

Or directly:

```bash
cd demo-ui && npm run dev
```

### Run Probe

With gateway running:

```bash
npm run probe:public
```

### Run Gateway Smoke (local procedure)

The gateway smoke test starts the gateway, runs the probe, and verifies end-to-end gateway behavior:

```bash
node tools/gateway_smoke.mjs
```

> **Note:** Gateway smoke is a local validation procedure. It is not included in CI
> because the probe step already covers gateway validation. Run it manually before submitting changes.

## Validation Checklist

Before submitting any changes, run:

```bash
python tools/check_claims.py .
python tools/export_audit.py .
npm ci
npm run build
npm run probe:public
git diff --check
```

All must pass without hard failures.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Gateway won't start | Check port 4400 is free |
| UI can't reach gateway | Ensure gateway is running, check CORS |
| Probe fails | Ensure gateway is running on localhost:4400 |
| Claim audit fails | Check for overclaiming phrases in changed files |
| Export audit fails | Check for paths, workspace refs, or pattern matches |

## Non-Claims

This runbook does not claim that running these steps proves compliance, provides a sandbox,
or constitutes system-wide enforcement. See the Non-Claims section in README.md.
