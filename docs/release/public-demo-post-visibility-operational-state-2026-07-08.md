# VAG Public Demo - Post-Public Operational State

**Date:** 2026-07-08  
**Repository:** `SchellSystems/vag-public-demo-release`  
**Repository visibility:** public  
**Default branch:** `main`  
**Document type:** post-public operational baseline / release-state source document  
**Status:** `PUBLIC_DEMO_BASELINE_VERIFIED_WITH_NOTE`

---

## 1. Purpose

This document records the post-public operational state of `SchellSystems/vag-public-demo-release` after the repository became publicly visible and after the post-PR10 verification pass.

It exists to prevent future drift between:

- the public repository state,
- the private quarantine/source repository,
- the private VAG Core,
- review-chat state,
- and later release or partner-facing interpretations.

This document is not a release, tag, deploy, package publication, product launch, security certification, compliance approval, or production readiness statement.

---

## 2. Repository Authority

Current repository order:

```text
SchellSystems/VAG-v1-main
  = private canonical Core
  = not part of the public demo export

SchellSystems/vag-public-demo
  = private quarantine/source/work repository
  = not the public release surface

SchellSystems/vag-public-demo-release
  = public history-clean bounded demo repository
  = current public review surface
```

The public repository remains a bounded local demo surface. It is not the private Core and must not be treated as the normative runtime authority for VAG.

---

## 3. Current Public Baseline

Current reviewed public baseline:

```text
Repository: SchellSystems/vag-public-demo-release
Visibility: public
Default branch: main
Current main SHA: c3205a59c3c63387289f5dab165b965fc0042c0e
Latest merged PR: #10
Latest commit message: chore(deps-dev): bump vite from 5.4.21 to 6.4.3 (#10)
```

PR #10 changed only:

```text
demo-ui/package.json
package-lock.json
```

No gateway runtime behavior, demo UI behavior, claim boundary, workflow behavior, release state, tag state, deployment state, package publication state, or repository visibility setting was intentionally changed by PR #10.

---

## 4. Branch Equivalence Note

A local validation agent initially ran the post-PR10 validation on:

```text
codex/main
```

instead of a local branch named:

```text
main
```

This was investigated through the GitHub connector.

Connector comparison showed:

```text
base: main
head: codex/main
status: identical
ahead_by: 0
behind_by: 0
total_commits: 0
merge_base_commit: c3205a59c3c63387289f5dab165b965fc0042c0e
```

Therefore, the validation run on `codex/main` is accepted as tree-equivalent to `main` for this reviewed state.

This does not make `codex/main` an authority branch. It only records that, at the time of validation, `codex/main` and `main` pointed to the same reviewed repository state.

---

## 5. Post-PR10 Validation Results

The agent-reported validation results on the tree-equivalent branch were:

```text
check_claims:
  PASS
  0 FAIL
  18 WARN

export_audit:
  PASS
  0 FAIL
  4 WARN

npm audit --omit=dev:
  PASS
  found 0 vulnerabilities

npm test:
  PASS
  19 passed
  0 failed

npm run build:
  PASS
  Vite build successful

npm run smoke:
  PASS
  45 passed
  0 failed
```

These results support:

```text
PUBLIC_DEMO_BASELINE_VERIFIED_WITH_NOTE
```

They do not support any production, compliance, security, sandbox, isolation, enterprise, external integration, full telemetry, or certification claim.

---

## 6. GitHub Actions Visibility Note

Connector checks for the latest main commit:

```text
c3205a59c3c63387289f5dab165b965fc0042c0e
```

returned no observable workflow runs and no combined status checks through the connector at the time of review.

This is not recorded as a runtime failure. It is recorded as an observability limitation.

The baseline is accepted because a validation agent reported successful local/tree-equivalent checks and because the remote `main` and `codex/main` refs were confirmed identical at the reviewed state.

---

## 7. Functional Boundary

The public demo shows only a bounded local path:

```text
Proposal
  -> Gateway Decision
      -> allow -> bounded demo artifact -> Commit -> Evidence -> Verify
      -> deny  -> no ToolGrant / no Commit / no Verify in the bounded path
```

Correct interpretation:

```text
The repository demonstrates a bounded local proposal-decision-commit-evidence-verify path.
```

Incorrect interpretations include:

```text
production-ready system
compliance-ready system
security-ready system
sandbox
isolation layer
system-wide enforcement
system-wide non-execution proof
full telemetry system
external platform integration
enterprise-security-certified product
```

---

## 8. Authority Boundaries

The current authority boundaries remain:

```text
Gateway decides within the bounded demo scope.
Commit binds bounded demo records.
Evidence reconstructs the bounded demo path.
Verify checks hash/signature/reference integrity.
Deny prevents bounded Pilot-path ToolGrant/Commit/Verify artifacts.
UI displays the bounded path and evidence.
```

Explicit non-authorities:

```text
Verify does not approve.
Verify does not authorize.
Verify does not certify safety.
Verify does not decide governance.
Evidence does not certify compliance.
Evidence does not prove security.
Evidence is not full telemetry.
Deny does not prove system-wide non-execution.
Gateway does not grant global tool capability.
The public demo is not the private Core.
```

---

## 9. Claim and Namedrop Surface

Connector search and local claim-audit validation found no current blocking evidence of forbidden public-surface claims.

Specifically reviewed categories included:

```text
Palantir
AIP
SWIFT
SEPA
Google Pay
AP Vendor
Bank Change
payment processor
real payment
bank integration
wallet integration
settlement system
production-ready
public-ready
compliance-ready
security-ready
sandboxed
isolated
enterprise-security-certified
system-wide enforcement
full telemetry
Verify approves
Verify authorizes
Evidence proves compliance
Evidence proves security
```

Current conclusion:

```text
No current public-surface blocker was identified from these searches and audits.
```

This conclusion is scoped to the reviewed repository state and does not replace future claim audits after any further change.

---

## 10. Dependency State

The current public baseline includes the PR #10 dependency update:

```text
vite: ^6.4.3
```

Root package state remains:

```text
package name: vag-public-demo-release
private: true
license: AGPL-3.0-or-later
node engine: >=20.19.0
```

The repository must continue to treat dependency PRs as controlled changes requiring:

```bash
python tools/check_claims.py .
python tools/export_audit.py .
npm ci
npm audit --omit=dev
npm test
npm run build
npm run smoke
```

No dependency PR should be auto-merged.

---

## 11. Operational State

Current operational state:

```text
PUBLIC_DEMO_BASELINE_VERIFIED_WITH_NOTE
```

Allowed next actions:

```text
docs-only issue/PR for operational notes
reviewer feedback collection
dependency policy documentation
claim-surface rechecks after changes
```

Not allowed without explicit owner decision:

```text
release
tag
deploy
package publication
new visibility change
private Core export
private evidence export
public claim expansion
new external integration claim
```

---

## 12. Known Open Notes

The following remain intentionally open or limited:

```text
GitHub Actions status for latest main was not observable through connector.
Local validation was reported from codex/main, accepted only because codex/main and main were connector-confirmed identical.
The public demo remains bounded and local.
No production, compliance, security, sandbox, isolation, full telemetry, or enterprise claim is introduced.
```

---

## 13. Final Baseline Verdict

Final scoped verdict:

```text
GO: public bounded demo baseline is verified with note.
NO-GO: release, tag, deploy, package publication, production claim, compliance claim, security claim, sandbox claim, isolation claim, external integration claim.
```

The correct next project posture is controlled stabilization, not feature expansion.
