# Claims and Non-Claims

## Allowed Claims

The following claims are allowed, only with scope:

- VAG demonstrates a bounded accountable demo path.
- VAG keeps decision, execution, commit, evidence, and verify concepts distinct.
- Commit binds bounded demo artifacts to proposal/decision context.
- Verify checks hash/signature/reference integrity.
- Evidence can reconstruct a bounded demo path.
- Deny prevents bounded Pilot-path ToolGrant/Commit/Verify artifacts.

## Cautious Claims

The following terms may be used only with explicit limitation and non-claims:

- controlled agent execution
- bounded agent intent review
- public demo candidate
- review-ready demo material
- runtime-verified demo path

These terms must always be accompanied by scope qualifiers and non-claims.

## Forbidden Claims

The following claims are explicitly forbidden:

- production-ready
- public-ready
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

Means hash/signature/reference integrity check passed within scope.
It does not mean governance approval.

### runtime_verified

Means the demo path was verified against the defined bounded runtime/demo flow.
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
