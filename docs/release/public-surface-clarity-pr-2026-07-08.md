# Public Surface Clarity Implementation - 2026-07-08

## Scope

This change documents and improves the public review surface of the bounded local demo repository.

It does not change runtime gateway behavior, demo UI behavior, package settings, release state, tags, deployment state, or visibility settings.

## Changed Files

- `README.md`
- `docs/demo/three-minute-review.md`
- `.github/workflows/audit.yml`

## Intent

The implementation makes the first-review path clearer for public readers while preserving the existing claim boundaries.

## README Changes

The README now emphasizes:

- the public demo as a bounded local demonstration
- a first-review path for new readers
- a concise demo flow
- what to look for in allow and deny paths
- current public bounded local demo status

## Demo Review Document

`docs/demo/three-minute-review.md` was added to guide a reviewer through:

- the proposal-decision-commit-evidence-verify frame
- automated smoke execution
- interactive local execution
- allow-path artifact review
- deny-path interpretation
- safe result wording

## CI Change

`.github/workflows/audit.yml` now includes:

```bash
npm audit --omit=dev
```

This is placed after dependency installation and before build/smoke execution.

## Explicit Non-Changes

No changes were made to:

- `demo-gateway/`
- `demo-ui/`
- `tools/public_demo_probe.mjs`
- `tools/gateway_smoke.mjs`
- `package.json`
- license files
- release or tag state
- package publication state

## Acceptance Criteria

Before merge, the following checks should pass:

```bash
python tools/check_claims.py .
python tools/export_audit.py .
npm ci
npm audit --omit=dev
npm run build
npm run smoke
```

## Owner Review Focus

Reviewers should confirm that:

- no new broad claims were introduced
- the README is clearer for first-time readers
- the three-minute review document remains bounded
- the CI dependency audit is acceptable as a merge gate
