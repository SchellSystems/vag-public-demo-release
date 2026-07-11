# Demo Runbook

## Local Development

### Prerequisites

- Node.js `>=20.19.0`
- npm (included with Node.js)

The public demo audit workflow uses Node.js 22.

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
npm run smoke
```

> **Note:** Gateway smoke is the CI-aligned local validation procedure. It starts the gateway before running the probe.

## Validation Checklist

Before submitting any changes, run:

```bash
python tools/check_claims.py .
python tools/export_audit.py .
npm ci
npm audit --omit=dev
npm test
npm run build
npm run smoke
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
