# VAG Demo Gateway

Local bounded demo gateway for the VAG public demo.

## Purpose

This gateway implements a minimal, deny-by-default decision surface for bounded demo operations.
The current implementation contains no outbound HTTP client, shell execution, or cloud-SDK path. This is an implementation statement, not a network-blocking or isolation claim.

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
- The gateway receives a caller-supplied `output_digest`, not the local UI artifact.
- Commit binds proposal, decision, and digest; the gateway does not observe external execution.
- Verify checks stored hash, signature, and proposal/decision reference relationships.
- Unknown proposals are rejected.
- Invalid output digests are rejected.
- Decision mismatches are rejected.
- Double commits are rejected.

## CORS

The gateway returns `Access-Control-Allow-Origin` for the configured demo-UI origin, which defaults to `http://localhost:5173`. No credentials are enabled.

CORS is a browser response rule. It is not authentication, request blocking, network isolation, or proof of loopback-only binding.

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

The default demo client addresses the gateway as `http://localhost:4400`. This client address is not a claim that the server enforces loopback-only binding.
