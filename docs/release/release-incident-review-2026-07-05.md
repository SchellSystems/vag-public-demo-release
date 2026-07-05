# Release Incident Review - 2026-07-05

## Scope

This document records recovery facts after an incorrect prior public-visibility attempt. It is a review and preflight record only.

No publication, release, deploy, tag, merge, or visibility change is authorized by this document.

## Repository Checked

- Target repository: `SchellSystems/vag-public-demo-release`
- Local remote checked: `origin https://github.com/SchellSystems/vag-public-demo-release.git`
- GitHub connector repository id: `1289852841`
- Repository name: `vag-public-demo-release`
- Full name: `SchellSystems/vag-public-demo-release`
- Current visibility reported by GitHub connector: `private`
- Default branch reported by GitHub connector: `main`
- Current `origin/main` SHA after `git pull --ff-only`: `fa8b9fee75feb8b4d23bc9e76e8b87ab68960d3a`
- Local `HEAD` after preflight pull: `fa8b9fee75feb8b4d23bc9e76e8b87ab68960d3a`

## Repository Order

Only the following repository is a possible future public-demo visibility candidate:

- `SchellSystems/vag-public-demo-release`

The following repositories must remain private and must not be made public as part of this public-demo decision path:

- `SchellSystems/VAG-v1-main` - private canonical Core
- `SchellSystems/vag-public-demo` - private quarantine/source repository
- `SchellSystems/VAG-Controlled-Agent-Pilot` - private
- `SchellSystems/VAG-lite` - private

## What Was Checked

- Local `origin` URL.
- GitHub connector repository metadata.
- Default branch and visibility.
- Local branch state after checkout and fast-forward pull.
- Open PR search.
- Recent merged PR metadata.
- Branch search.
- Local and remote tag refs.
- Claim audit.
- Export audit.
- Runtime npm audit with `--omit=dev`.
- UI build.
- Gateway smoke test.
- Forbidden named-domain search.
- Generic financial-domain search.
- README, FAQ, docs, and UI text semantics for forbidden claim classes.
- License file presence and package license declaration.

## Current GitHub State Observed

- Visibility: `private`
- Default branch: `main`
- Branches returned by GitHub branch search: `main`
- Open PRs: `0`
- Recent merged PRs observed:
  - PR #3, `[codex] Update release snapshot after PR 2`, merged at `2026-07-05T13:23:48Z`, merge commit `fa8b9fee75feb8b4d23bc9e76e8b87ab68960d3a`
  - PR #2, `[codex] Align public demo release surface`, merged at `2026-07-05T12:33:58Z`, merge commit `3eb1b3f0d6feab9bc055068ff5325cda4c8992f7`
  - PR #1, `docs(release): update snapshot after history-clean repo push`, merged at `2026-07-05T11:17:21Z`, merge commit `08a5c33d52bdbf0b4b48231d726462d1c6d3f5ae`
- Tags:
  - Local `git tag --list`: no tags
  - Remote `git ls-remote --tags origin`: no tags
- Releases:
  - Not directly listable with the available GitHub connector tools in this environment.
  - No tag refs were present. This does not by itself prove that no GitHub release object exists.

## Preflight Results

- `git checkout main`: PASS after escalation for local `.git` write access.
- `git pull --ff-only`: PASS, fast-forwarded to `fa8b9fee75feb8b4d23bc9e76e8b87ab68960d3a`.
- `git status`: clean before creating this review document.
- `python tools/check_claims.py .`: PASS, `0 FAIL`, `10 WARN`.
- `python tools/export_audit.py .`: PASS, `0 FAIL`, `4 WARN`.
- `npm ci`: PASS; installed `70` packages and audited `73` packages. npm reported `2 vulnerabilities` in the full tree before omit filtering.
- `npm audit --omit=dev`: PASS, `found 0 vulnerabilities`.
- `npm run build`: PASS.
- `npm run smoke`: PASS after escalation for local process spawn, `45 passed`, `0 failed`.

## Search Results

Forbidden named-domain search result: no matches.

Generic financial-domain search result: one AGPL license-text match at `LICENSE:514`; no product, workflow, or integration claim was observed.

## Semantic Review

Observed README, FAQ, docs, and UI text preserve these boundaries:

- No production-readiness claim.
- No claim that compliance is proven.
- No claim that safety or assurance is proven.
- No contained-runtime claim.
- No claim of repository-wide enforcement.
- No third-party integration claim.
- Verify is described as hash/signature/reference integrity checking, not approval.
- Evidence is described as bounded demo reconstruction, not proof for compliance or assurance.
- Deny is described as bounded Pilot-path behavior, not global non-execution.

## Known Risks

- GitHub release objects could not be directly listed with the available connector tools. Tags were verified as absent.
- Local deleted-tracking branches remained visible as local branches after fetch; remote branch search returned only `main`.
- The repository name in root `package.json` is `vag-public-demo`, while the GitHub repository name is `vag-public-demo-release`. This is not by itself a visibility error, but it should be treated as a naming ambiguity during owner review.
- `npm ci` full-tree output reported `2 vulnerabilities`; runtime audit with `npm audit --omit=dev` reported `0 vulnerabilities`.
- This review is not evidence that any other SchellSystems repository is safe for public visibility.

## No-Go Rules

Do not proceed with any public-visibility decision if any of the following are true:

- The target repository is not exactly `SchellSystems/vag-public-demo-release`.
- The repository id does not match `1289852841` unless the owner explicitly re-verifies the replacement target.
- The default branch is not `main`.
- Local `HEAD` and `origin/main` do not match the reviewed SHA.
- Any open PR must be merged, closed, or explicitly accounted for by the owner.
- Any tag or release object is present without explicit owner review.
- Any forbidden named-domain search returns a non-license/non-meta hit.
- Any audit, build, or smoke step fails.
- Forbidden: any text claims production readiness, proof of compliance, proof of safety or assurance, contained-runtime behavior, repository-wide enforcement, third-party integration, Verify approval, Evidence proof, or Deny global non-execution.
- Any private Core, quarantine/source, Pilot, Lite, private evidence, private runtime log, or private implementation material is present.

## Non-Claims

This document does not authorize publication, release, deployment, tagging, merging, production use, visibility change, compliance claims, assurance claims, contained-runtime claims, third-party integration claims, or public export.
