# Architecture

## Bounded Demo Architecture

This document describes the public, bounded demo architecture of VAG.

## Flow

```
Proposal → Gateway Decision → UI-Created Demo Artifact → Caller-Supplied Digest → Commit → Evidence → Verify
```

## Components

### Proposal

An agent proposes an action within a bounded demo context.

### Gateway Decision

The Gateway decides within a bounded public-demo contract whether to allow or deny the proposed action.

### Bounded Demo Artifact

After allow, the UI creates a local demo artifact and computes its digest. The gateway receives the caller-supplied `output_digest`; it does not receive the artifact or observe external execution.

### Commit

Commit binds the proposal, decision, and caller-supplied digest in the bounded public-demo record.

### Evidence

Evidence reconstructs the bounded public-demo record path. UI-assembled evidence may reference the local artifact and the committed digest, but it is not gateway observation of external execution.

### Verify

Verify reports whether the stored hash, signature, and proposal/decision reference relationships pass their defined checks within the bounded demo scope.

### Deny

For a denied proposal, the gateway rejects commit. In the bounded UI flow, no local demo artifact, Commit, or Verify follows, and the UI records that absence as derived negative evidence. The repository contains no ToolGrant subsystem, and deny does not prove system-wide non-execution.

## Boundaries

- Gateway decides within a bounded public-demo contract.
- The UI creates the local demo artifact after allow.
- Commit binds proposal, decision, and caller-supplied digest.
- Evidence reconstructs bounded public-demo record paths.
- Verify checks stored integrity and reference relationships within scope.
- Public-demo artifacts are not Core or Pilot artifacts.
- This repository contains no canonical VAG Core implementation.
- This repository contains a minimal local demo gateway that simulates the bounded public demo contract.

## What This Architecture Is Not

- Gateway is not a global enforcement layer.
- Deny is not a system-wide blockade.
- Evidence is not a compliance or security proof.
- Verify is not an approval mechanism.
- This architecture does not claim sandbox or isolation properties.
