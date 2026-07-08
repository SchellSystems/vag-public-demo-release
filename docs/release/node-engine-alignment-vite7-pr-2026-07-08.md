# Node Engine Alignment for Vite 7 Path - 2026-07-08

## Scope

This change aligns the public demo repository runtime contract with the Node.js requirement implied by the Vite 7 dependency update path.

It does not merge or modify the Dependabot dependency update itself.

## Reason

PR #6 proposes updating the demo UI build dependency path from Vite 5 to Vite 7.

Vite 7 requires a newer Node.js runtime than the repository previously declared. The repository root previously allowed Node.js `>=18.0.0`, which is too broad for the Vite 7 path.

## Changed Files

- `package.json`
- `.github/workflows/audit.yml`
- `README.md`
- `docs/release/node-engine-alignment-vite7-pr-2026-07-08.md`

## Changes

- Root `package.json` now declares Node.js `>=20.19.0`.
- Public Demo Audit now uses Node.js 22.
- README Quick Start now states the Node.js minimum and notes that Node.js 22 is used by CI.

## Explicit Non-Changes

No changes were made to:

- gateway runtime behavior
- demo UI behavior
- proposal, decision, commit, evidence, or verify logic
- claim or non-claim boundaries
- dependency versions
- package publication settings
- release state
- tag state
- deployment state
- repository visibility

## Required Validation

Before merging this alignment PR, run:

```bash
python tools/check_claims.py .
python tools/export_audit.py .
npm ci
npm audit --omit=dev
npm test
npm run build
npm run smoke
```

After this alignment PR is merged, PR #6 can be re-evaluated as a dependency update against an explicit Node.js contract.

## Merge Order

1. Merge this Node engine alignment PR only after CI succeeds.
2. Re-check PR #6 after this PR lands.
3. Merge PR #6 only if the full public demo audit succeeds with the updated dependency path.
