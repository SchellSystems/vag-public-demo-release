# Demo Script — 10 Minutes

## Purpose

Explain the bounded VAG demo concept in approximately 10 minutes with more detail on each component.

## Script

### Introduction (1 minute)

VAG (Verified Action Gateway) demonstrates a bounded public-demo record path. This demo explains how proposals, decisions, a locally created artifact digest, commits, evidence, and verification work together within a defined scope.

This is a concept demonstration. It is not a production system.

### The Problem (2 minutes)

When AI agents execute actions on behalf of users, accountability becomes critical. Key questions:

- Who proposed the action?
- Who decided to allow it?
- What digest was supplied for the local demo artifact?
- Can we reconstruct what happened?
- Can we verify the integrity of the record?

VAG demonstrates one bounded approach to answering these questions within a demo context.

### The Bounded Demo Flow (3 minutes)

#### Step 1: Proposal

An agent creates a proposal describing an intended action within the bounded demo context.

#### Step 2: Gateway Decision

The Gateway evaluates the proposal against a bounded public-demo contract. The Gateway decides: allow or deny.

#### Step 3a: Allow Path

If allowed:
- The UI creates a local demo artifact and computes its digest.
- The gateway receives the caller-supplied `output_digest`, not the artifact itself.
- A Commit binds proposal, decision, and digest.
- Evidence records the bounded public-demo record path.
- Verify checks stored hash, signature, and reference relationships.

#### Step 3b: Deny Path

If denied:
- The commit endpoint rejects the denied proposal.
- The bounded UI flow creates no local demo artifact and produces no Commit or Verify.
- The UI records this as derived negative evidence for the bounded public-demo path.
- This repository contains no ToolGrant subsystem.
- This does NOT mean system-wide non-execution.

### Evidence and Verification (2 minutes)

#### Evidence

Evidence records and reconstructs the bounded demo path. It captures:
- The proposal
- The decision
- The caller-supplied artifact digest
- The commit and reference context

Evidence does NOT:
- Prove compliance
- Prove security
- Represent full telemetry
- Certify anything

#### Verify

Verify checks and reports stored hash, signature, and reference-relationship results within the bounded demo scope.

Verify does NOT:
- Approve actions
- Authorize actions
- Certify safety
- Decide governance

### Authority Boundaries (1 minute)

Each component has a defined role:
- Gateway decides.
- The UI creates the local demo artifact after allow.
- Commit binds proposal, decision, and caller-supplied digest.
- Evidence records.
- Verify checks stored integrity relationships.
- No component assumes the authority of another.

### Closing (1 minute)

VAG demonstrates that proposal, decision, local artifact creation, digest binding, commit, evidence, and verify can be kept distinct and made inspectable within a bounded demo context.

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
