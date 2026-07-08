# Gateway Core Unit Tests - 2026-07-08

## Scope

This change adds direct unit coverage for the bounded local demo gateway core.

It does not change runtime gateway behavior, demo UI behavior, claim boundaries, package publication settings, release state, tags, deployments, or visibility settings.

## Changed Files

- `package.json`
- `test/gateway-core.test.mjs`
- `.github/workflows/audit.yml`
- `docs/release/gateway-core-unit-tests-pr-2026-07-08.md`

## Intent

The existing public probe validates the gateway through HTTP and smoke execution. These unit tests add direct coverage for the core decision, commit, and verify logic without introducing external test dependencies.

## Test Coverage

The tests cover:

- `scope.intent` as the authorization input
- top-level `intent` not being sufficient for authorization
- allowed proposal commit and verify path
- denied proposal cannot commit
- missing `decision_id` rejection
- wrong `decision_id` rejection
- invalid `output_digest` rejection
- double commit rejection
- unknown proposal rejection
- tampered signature rejection
- invalid verify input formats
- deterministic canonical JSON key ordering

## Tooling Choice

The test suite uses Node's built-in `node:test` and `node:assert/strict` modules.

No new runtime or development dependencies are introduced.

## CI Change

`.github/workflows/audit.yml` now runs both:

```bash
npm audit --omit=dev
npm test
```

This preserves the public-surface runtime dependency audit and adds direct gateway-core unit coverage before build and smoke validation.

## Acceptance Criteria

Before merge, the following checks should pass:

```bash
python tools/check_claims.py .
python tools/export_audit.py .
npm ci
npm audit --omit=dev
npm test
npm run build
npm run smoke
```

## Explicit Non-Changes

No changes were made to:

- `demo-gateway/src/core.mjs`
- `demo-gateway/src/server.mjs`
- `demo-ui/`
- `tools/public_demo_probe.mjs`
- `tools/gateway_smoke.mjs`
