# Demo Script — 3 Minutes

## Purpose

Explain the bounded VAG demo concept in approximately 3 minutes.

## Script

### Introduction (30 seconds)

VAG demonstrates verifiable agent execution control within a bounded demo path. An agent proposes an action, a Gateway decides, and the result is committed with evidence that can be verified.

### Core Flow (90 seconds)

1. **Proposal**: An agent proposes an action within a bounded demo context.
2. **Gateway Decision**: The Gateway evaluates the proposal within a bounded demo/Core contract and decides to allow or deny.
3. **Allow Path**: If allowed, execution proceeds. A Commit binds the result to the proposal and decision. Evidence records the bounded demo path. Verify checks integrity.
4. **Deny Path**: If denied, no ToolGrant is issued. No Commit is created. No Verify artifacts are produced. The bounded Pilot path stops.

### Key Points (60 seconds)

- Every step is recorded and verifiable within scope.
- Verify checks hash, signature, and reference integrity — it does not approve or authorize.
- Evidence reconstructs the bounded demo path — it does not prove compliance or security.
- Deny stops the bounded Pilot path — it does not prove system-wide non-execution.

## Non-Claims

- This is not a production system demonstration.
- No real transaction or production workflow is shown.
- No real external platform flow is shown.
- No real evidence is used.
- No secrets are exposed.
- No Core internals are revealed.
