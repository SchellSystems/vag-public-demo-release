# VAG Demo Gateway

Local bounded demo gateway for the VAG public demo.

## Purpose

This gateway implements a minimal, deny-by-default decision surface for bounded demo operations.
It does **not** connect to any external system, cloud service, or network resource.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/propose` | Submit a proposal for gateway decision |
| POST | `/commit` | Commit an allowed proposal |
| POST | `/verify` | Verify integrity of a committed record |

## Allowlist

Only the following intents are permitted:

- `demo.transform_json`
- `demo.ping`

All other intents are denied by default.

## Authority Model

- `scope.intent` is the canonical authorization field.
- Top-level `intent` field does **not** authorize.
- Denied proposals cannot be committed.
- Unknown proposals are rejected.
- Invalid output digests are rejected.
- Decision mismatches are rejected.
- Double commits are rejected.

## CORS

Only `http://localhost:5173` is allowed (demo-ui dev server). No credentials.

## Non-Claims

- This gateway is not production-ready.
- This gateway is not a sandbox.
- This gateway does not provide OS/browser/network/process/filesystem isolation.
- This gateway does not grant global tool capability.
- This gateway does not integrate with any external third-party platform.

## Running

```bash
cd demo-gateway
node src/server.mjs
```

Gateway starts on `http://localhost:4400`.
