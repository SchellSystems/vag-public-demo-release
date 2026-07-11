# Demo Script — 3 Minutes

## Purpose

Explain the bounded VAG demo concept in approximately 3 minutes.

## Script

### Introduction (30 seconds)

VAG demonstrates a bounded public-demo record path. An agent proposes an action, the local demo gateway decides, the UI may create a local artifact after allow, and a caller-supplied digest can be committed and checked.

### Core Flow (90 seconds)

1. **Proposal**: An agent proposes an action within a bounded demo context.
2. **Gateway Decision**: The Gateway evaluates the proposal within a bounded public-demo contract and decides to allow or deny.
3. **Allow Path**: After allow, the UI creates a local demo artifact and supplies its digest. Commit binds proposal, decision, and digest. Evidence records the bounded public-demo path. Verify checks stored hash, signature, and reference relationships.
4. **Deny Path**: If denied, the commit endpoint rejects the proposal and the UI derives that no local artifact, Commit, or Verify follows in its bounded path. This repository has no ToolGrant subsystem.

### Key Points (60 seconds)

- The bounded record path is inspectable within scope.
- Verify checks hash, signature, and reference integrity — it does not approve or authorize.
- Evidence reconstructs the bounded demo path — it does not prove compliance or security.
- The UI-derived deny result is limited to the bounded public-demo path — it does not prove system-wide non-execution.

## Non-Claims

- This is not a production system demonstration.
- No real transaction or production workflow is shown.
- No real external platform flow is shown.
- No real evidence is used.
- No secrets are exposed.
- No Core internals are revealed.
