# Demo Script — 10 Minutes

## Purpose

Explain the bounded VAG demo concept in approximately 10 minutes with more detail on each component.

## Script

### Introduction (1 minute)

VAG (Verifiable Agent Governance) demonstrates a bounded, accountable demo path for agent execution control. This demo explains how proposals, decisions, execution, commits, evidence, and verification work together within a defined scope.

This is a concept demonstration. It is not a production system.

### The Problem (2 minutes)

When AI agents execute actions on behalf of users, accountability becomes critical. Key questions:

- Who proposed the action?
- Who decided to allow it?
- What exactly was executed?
- Can we reconstruct what happened?
- Can we verify the integrity of the record?

VAG demonstrates one bounded approach to answering these questions within a demo context.

### The Bounded Demo Flow (3 minutes)

#### Step 1: Proposal

An agent creates a proposal describing an intended action within the bounded demo context.

#### Step 2: Gateway Decision

The Gateway evaluates the proposal against a bounded demo/Core contract. The Gateway decides: allow or deny.

#### Step 3a: Allow Path

If allowed:
- Execution proceeds within the bounded demo path.
- A Commit is created, binding the execution to its proposal and decision context.
- Evidence is recorded, capturing the bounded demo path.
- Verify can check the integrity of the resulting artifacts.

#### Step 3b: Deny Path

If denied:
- No ToolGrant is issued.
- No Commit is created.
- No Verify artifacts are produced.
- The bounded Pilot path stops.
- This does NOT mean system-wide non-execution.

### Evidence and Verification (2 minutes)

#### Evidence

Evidence records and reconstructs the bounded demo path. It captures:
- The proposal
- The decision
- The execution context
- The commit reference

Evidence does NOT:
- Prove compliance
- Prove security
- Represent full telemetry
- Certify anything

#### Verify

Verify checks and reports hash, signature, and reference-integrity results within the bounded demo scope.

Verify does NOT:
- Approve actions
- Authorize actions
- Certify safety
- Decide governance

### Authority Boundaries (1 minute)

Each component has a defined role:
- Gateway decides.
- Commit binds.
- Evidence records.
- Verify checks integrity.
- No component assumes the authority of another.

### Closing (1 minute)

VAG demonstrates that agent execution control concepts — proposal, decision, execution, commit, evidence, and verify — can be kept distinct and made inspectable within a bounded demo context.

This demonstration does not claim production readiness, compliance certification, or security guarantees.

## Non-Claims

- This is not a production system demonstration.
- No real transaction or production workflow is shown.
- No real external platform flow is shown.
- No real evidence is used.
- No secrets are exposed.
- No Core internals are revealed.
- No runtime claims are made.
- No screenshots from private systems are shown.
