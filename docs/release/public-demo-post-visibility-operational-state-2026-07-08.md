# VAG Public Demo - Post-Public Operational State

**Date:** 2026-07-08  
**Repository:** `SchellSystems/vag-public-demo-release`  
**Repository visibility:** public  
**Default branch:** `main`  
**Document type:** post-public operational baseline / release-state source document  
**Status:** `PUBLIC_DEMO_BASELINE_VERIFIED_WITH_NOTE`

**Temporal scope:** dated review of the PR #10 base state; not a live pointer to the current `main` SHA

---

## 1. Purpose

This document records the reviewed post-public baseline of `SchellSystems/vag-public-demo-release` after the repository became publicly visible and after the post-PR10 verification pass.

It exists to prevent future drift between:

- the public repository state,
- the private quarantine/source repository,
- the private VAG Core,
- review-chat state,
- and later release or partner-facing interpretations.

This document is not a release, tag, deploy, package publication, product launch, certification, compliance approval, or production-readiness statement.

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

## 3. Reviewed Public Baseline

Reviewed base state before this document was merged:

```text
Repository: SchellSystems/vag-public-demo-release
Visibility: public
Default branch: main
Reviewed base SHA: c3205a59c3c63387289f5dab165b965fc0042c0e
Latest merged PR at review time: #10
Latest commit message at review time: chore(deps-dev): bump vite from 5.4.21 to 6.4.3 (#10)
```

The SHA above is a dated review anchor, not a perpetual pointer to the current `main` head. This document was later merged through PR #11, which necessarily advanced `main`. Current repository facts must be checked live rather than inferred from this dated file.

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

They do not support any broader production, compliance, assurance, sandbox, isolation, enterprise, external integration, telemetry, or certification statement.

---

## 6. GitHub Actions Visibility Note

Connector checks for the reviewed base commit:

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
      -> allow -> UI-created demo artifact -> caller-supplied digest -> Commit -> Evidence -> Verify
      -> deny  -> Commit rejected / UI records no bounded follow-on chain
```

Correct interpretation:

```text
The repository demonstrates a bounded local proposal-decision-artifact-digest-commit-evidence-verify path.
```

Incorrect interpretations include:

```text
a production system
a compliance system
a broad assurance system
a sandbox claim
an isolation claim
global enforcement
a global proof that execution cannot happen
a complete telemetry system
an external platform integration
an enterprise assurance product
```

---

## 8. Authority Boundaries

The current authority boundaries remain:

```text
Gateway decides within the bounded demo scope.
UI creates a local demo artifact after allow and supplies its digest.
Commit binds proposal, decision, and caller-supplied digest.
Evidence reconstructs the bounded public-demo record path and distinguishes UI-derived statements.
Verify checks stored hash/signature/reference relationships.
For deny, the gateway rejects commit and the UI derives the absence of its bounded follow-on chain.
This repository contains no ToolGrant subsystem.
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

Specifically reviewed forbidden or blocked categories included:

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
production-readiness wording
public product-readiness wording
compliance-readiness wording
security-readiness wording
sandbox claim wording
isolation claim wording
enterprise assurance wording
global enforcement wording
complete telemetry wording
Verify-as-approval wording
Verify-as-authorization wording
Evidence-as-compliance wording
Evidence-as-security wording
```

Conclusion at review time:

```text
No current public-surface blocker was identified from these searches and audits.
```

This conclusion is scoped to the reviewed repository state and does not replace future claim audits after any further change.

---

## 10. Dependency State

License note (2026-07-13): the repository owner migrated the project license to Apache-2.0. The root LICENSE and current package metadata are authoritative; the earlier reviewed license field in this dated baseline is superseded.


The reviewed public baseline includes the PR #10 dependency update:

```text
vite: ^6.4.3
```

Root package state remains:

```text
package name: vag-public-demo-release
private: true
license: Apache-2.0
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
git diff --check
```

No dependency PR should be auto-merged.

---

## 11. Operational State

Recorded operational classification for the reviewed baseline:

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
GitHub Actions status for the reviewed base commit was not observable through the connector at review time.
Local validation was reported from `codex/main`, accepted for that dated baseline only because `codex/main` and `main` were connector-confirmed identical at the reviewed state.
The public demo remains bounded and local.
No production, compliance, assurance, sandbox, isolation, telemetry, or enterprise claim is introduced.
```

---

## 13. Final Baseline Verdict

Final scoped verdict for the reviewed baseline:

```text
GO: public bounded demo baseline is verified with note.
NO-GO: release, tag, deploy, package publication, production claim, compliance claim, security claim, sandbox claim, isolation claim, external integration claim.
```

The correct next project posture is controlled stabilization, not feature expansion.
