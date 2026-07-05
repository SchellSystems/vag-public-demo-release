# Public Visibility Owner Decision - 2026-07-05

DECISION = APPROVED

## Decision Scope

Candidate repository:

- `SchellSystems/vag-public-demo-release`

No other repository is in scope for a public-visibility decision.

This document is an owner decision placeholder. It does not perform or authorize any publication, release, deploy, tag, merge, or visibility change.

## Repositories That Must Remain Private

- `SchellSystems/VAG-v1-main` - private canonical Core
- `SchellSystems/vag-public-demo` - private quarantine/source repository
- `SchellSystems/VAG-Controlled-Agent-Pilot` - private
- `SchellSystems/VAG-lite` - private

## Required Current State Before Any Owner Approval

- Repository full name must be `SchellSystems/vag-public-demo-release`.
- Repository id should match the reviewed GitHub connector value: `1289852841`.
- Visibility must be intentionally reviewed by the owner before any change.
- Default branch must be `main`.
- Reviewed `origin/main` SHA: `fa8b9fee75feb8b4d23bc9e76e8b87ab68960d3a`.
- Open PR count must be `0`, or every open PR must be explicitly accounted for.
- Tags must be absent, or every tag must be explicitly accounted for.
- Releases must be explicitly checked by an owner-capable GitHub UI/API path before any visibility change, because release objects were not directly listable from the available connector tools.

## Preflight Summary

- Repository metadata check: PASS for name, full name, default branch, and private visibility.
- Open PR search: PASS, `0` open PRs.
- Recent merged PRs observed: PR #1, PR #2, PR #3.
- Branch search: `main`.
- Local and remote tags: no tags.
- `git checkout main`: PASS.
- `git pull --ff-only`: PASS.
- `git status`: clean before these decision documents were added.
- `python tools/check_claims.py .`: PASS, `0 FAIL`, `10 WARN`.
- `python tools/export_audit.py .`: PASS, `0 FAIL`, `4 WARN`.
- `npm ci`: PASS.
- `npm audit --omit=dev`: PASS, `found 0 vulnerabilities`.
- `npm run build`: PASS.
- `npm run smoke`: PASS, `45 passed`, `0 failed`.
- Forbidden named-domain search: no matches.
- Generic financial-domain search: one AGPL license-text match at `LICENSE:514`.
- License status: `AGPL-3.0-or-later` in `package.json`; full GNU AGPL v3 license text present in `LICENSE`.

## Owner Checklist

- [ ] Confirm the target repository in GitHub UI is exactly `SchellSystems/vag-public-demo-release`.
- [ ] Confirm no other listed private repository is selected.
- [ ] Confirm current `main` SHA is still `fa8b9fee75feb8b4d23bc9e76e8b87ab68960d3a` or re-run preflight.
- [ ] Confirm no open PRs have appeared.
- [ ] Confirm tags and release objects are absent or intentionally handled.
- [ ] Review the incident document at `docs/release/release-incident-review-2026-07-05.md`.
- [ ] Review README, FAQ, docs, and UI for forbidden claim classes.
- [ ] Confirm no Core code, private evidence, private runtime logs, or private source material is present.
- [ ] Decide whether to keep `DECISION = PENDING`, change to `APPROVED`, or change to `REJECTED`.

## No-Go Conditions

Any of the following keeps `DECISION = PENDING` or requires `DECISION = REJECTED`:

- Target repository ambiguity.
- Any selected repository other than `SchellSystems/vag-public-demo-release`.
- Any unexpected public visibility on a private-only repository.
- Any open PR not explicitly handled.
- Any unexpected tag or release object.
- Any audit, build, or smoke failure.
- Any forbidden named-domain search hit outside license or explicit meta-context.
- Forbidden: any production, proof-of-compliance, proof-of-assurance, contained-runtime, repository-wide enforcement, or third-party integration claim.
- Any wording where Verify means approval.
- Any wording where Evidence means proof for compliance or assurance.
- Any wording where Deny means global non-execution.
- Any imported private Core, private evidence, private runtime log, or private implementation material.

## Current Recommendation

Go/No-Go: NO-GO for immediate public visibility change while `DECISION = PENDING`.

Reason: Owner approval has not been recorded, and GitHub release objects still require direct owner-capable UI/API verification before any later visibility decision.
