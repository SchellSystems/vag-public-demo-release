# Claims and Non-Claims

## Allowed Claims

The following claims are allowed, only with scope:

- VAG demonstrates a bounded accountable demo path.
- VAG keeps proposal, decision, local artifact creation, digest binding, commit, evidence, and verify concepts distinct.
- After allow, the UI creates a local demo artifact and supplies its digest.
- Commit binds proposal, decision, and caller-supplied digest.
- Verify checks stored hash/signature/reference relationships.
- Evidence can reconstruct a bounded demo path.
- The gateway rejects commit for a denied proposal.
- The UI can report that no local artifact, Commit, or Verify followed in its bounded public-demo path.
- This repository contains no ToolGrant subsystem.

## Cautious Claims

The following terms may be used only with explicit limitation and non-claims:

- bounded agent intent review
- bounded public-demo record path
- public demo candidate
- review-ready demo material
- integrity-checked demo record

These terms must always be accompanied by scope qualifiers and non-claims.

## Forbidden Claims

The following claims are explicitly forbidden:

- production-ready
- public product-ready
- compliance-ready
- security-ready
- sandboxed
- isolated
- certified
- enterprise-security-certified
- externally integrated with any named third-party platform
- system-wide enforcement
- system-wide non-execution proof
- full telemetry
- Verify approves
- Verify authorizes
- Evidence proves compliance
- Evidence proves security
- Deny blocks OS/network/process/browser/filesystem/cloud execution

## Status Word Guidance

### PASS

Means a bounded demo step passed its defined check.
It does not mean production readiness or compliance.

### VALID

Means a verify/integrity check passed within scope.
It does not mean approval, authorization, safety, or compliance.

### VERIFY_OK

Means an actual runtime hash/signature/reference check passed within scope.
It does not mean governance approval.
Synthetic, conceptual, or non-replayable examples must not present `VERIFY_OK` as an executed result.

### runtime_demo_integrity_verified

Means the gateway checked the stored demo record relationships defined by the bounded runtime/demo flow.
It does not mean production runtime, full telemetry, or external certification.

## Human Review Checklist

Before any publication or visibility change, AI-assisted semantic review can support the owner decision, but does not authorize publication, release, deploy, visibility change, or public export. The owner must confirm:

- [ ] No forbidden claims are present in any file.
- [ ] All cautious claims have proper scope and non-claims.
- [ ] No private source material is directly copied.
- [ ] No secrets, tokens, or private paths are present.
- [ ] All evidence examples are synthetic.
- [ ] No authority collapses are present.
- [ ] License decision has been made.
- [ ] SECURITY.md makes no guarantees.
- [ ] README non-claims block is present and complete.
