# Final Public Visibility Preflight - 2026-07-08

## Scope

Repository reviewed: `SchellSystems/vag-public-demo-release`

This document records a final owner preflight for the bounded public demo release candidate. It does not perform a visibility change, release, deploy, tag, package publication, or runtime change.

## Reviewed State

- Repository id: `1289852841`
- Visibility at connector check: `private`
- Default branch: `main`
- Reviewed HEAD: `38c15452ccf70afcb471f2f3e9b21064fcf45b0b`
- Latest commit message: `Rename package from 'vag-public-demo' to 'vag-public-demo-release'`
- Latest commit scope: root `package.json` package-name alignment only

## Owner UI Corroboration

Owner mobile/browser UI check reported:

- Releases: empty / no releases published
- Packages: empty / no packages published
- Tags: `0`
- Repository visibility before owner action: private
- Default branch: main
- Branches visible: `3`; recorded only, not deleted
- Deployments/Environments: not reliably verifiable from the mobile UI path

## Connector Corroboration

Connector checks confirmed:

- Repository full name: `SchellSystems/vag-public-demo-release`
- Repository id: `1289852841`
- Visibility: private
- Default branch: main
- Current latest commit observed: `38c15452ccf70afcb471f2f3e9b21064fcf45b0b`
- Commit message: `Rename package from 'vag-public-demo' to 'vag-public-demo-release'`

The earlier Codex branch `codex/final-public-demo-preflight-check` had no commits ahead of `main`, so GitHub could not create a pull request from it.

## Validation Basis

Required validation suite for current-owner confirmation:

```bash
python tools/check_claims.py .
python tools/export_audit.py .
npm ci
npm audit --omit=dev
npm run build
npm run smoke
git diff --check
git status
```

Expected pass criteria:

- claim audit: PASS, `0 FAIL`
- export audit: PASS, `0 FAIL`
- runtime dependency audit: `0` runtime vulnerabilities
- build: PASS
- smoke: PASS
- whitespace check: PASS
- final working tree: clean

Known prior controlled validation from the release-preflight path reported claim audit PASS, export audit PASS, build PASS, smoke PASS, and `npm audit --omit=dev` with `0` runtime vulnerabilities. The current latest code change after that path is limited to the root package-name alignment.

## Semantic Boundary Review

Allowed public frame:

```text
VAG Public Demo is a bounded local demonstration of verifiable agent execution control: proposal, gateway decision, commit, evidence, and verify.
```

Boundaries preserved:

- Verify checks hash, signature, and reference integrity within the bounded demo scope.
- Evidence reconstructs the bounded demo path.
- Deny prevents bounded Pilot-path ToolGrant, Commit, and Verify artifacts.
- Public evidence examples are synthetic and not private runtime evidence.
- The demo gateway is a local bounded demo gateway, not the private canonical VAG Core.

## Private Repositories Out of Scope

The following repositories must remain private and are not part of this public visibility decision:

- `SchellSystems/VAG-v1-main`
- `SchellSystems/vag-public-demo`
- `SchellSystems/VAG-Controlled-Agent-Pilot`
- `SchellSystems/VAG-lite`

## Explicit Non-Claims

This repository does not claim:

- production readiness
- public product readiness
- compliance readiness
- security readiness
- sandboxing
- isolation
- certification
- enterprise security certification
- system-wide enforcement
- system-wide non-execution proof
- full telemetry
- external production platform integration
- named third-party platform integration
- Verify approval or authorization
- Evidence proof of compliance or security
- Deny blocking OS, browser, network, process, filesystem, or cloud execution

## Verdict

Verdict: `GO_WITH_OWNER_UI_CHECK`

Reason:

- Repository identity and current private visibility were confirmed.
- Owner UI check confirmed Releases, Packages, and Tags are empty.
- Previous controlled audit/build/smoke results were green.
- The latest code-relevant change is a package-name alignment only.
- Deployments/Environments were not reliably verifiable from the mobile UI path.

Required owner action before manual visibility change:

- Confirm the selected repository is exactly `SchellSystems/vag-public-demo-release`.
- Confirm no other SchellSystems repository is selected.
- Confirm no unexpected open PR, release, tag, package, or deployment appeared after this document.
- Confirm Deployments/Environments are absent or harmless if an owner-capable UI path exposes them.

Only after those confirmations may the owner manually change visibility for `SchellSystems/vag-public-demo-release`.
