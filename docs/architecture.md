# Architecture

## Bounded Demo Architecture

This document describes the public, bounded demo architecture of VAG.

## Flow

```
Proposal → Gateway Decision → Bounded Demo Execution → Commit → Evidence → Verify
```

## Components

### Proposal

An agent proposes an action within a bounded demo context.

### Gateway Decision

The Gateway decides within a bounded demo/Core contract whether to allow or deny the proposed action.

### Bounded Demo Execution

If allowed, execution proceeds within the bounded demo path. Execution artifacts are produced only after an allowed bounded path.

### Commit

Commit binds a demo run to its proposal and decision context. It creates a verifiable link between what was proposed, what was decided, and what was executed.

### Evidence

Evidence reconstructs a bounded demo path. It records the sequence of proposal, decision, execution, and commit for later inspection.

### Verify

Verify reports whether the available integrity checks (hash, signature, and reference integrity) pass within the bounded demo scope.

### Deny

Deny stops the bounded Pilot path from producing ToolGrant, Commit, and Verify artifacts. When the Gateway denies a proposal, no execution artifacts are created in the bounded demo path.

## Boundaries

- Gateway decides within a bounded demo/Core contract.
- Commit binds execution to proposal/decision context.
- Evidence reconstructs bounded demo paths.
- Verify checks integrity within scope.
- Pilot/Demo artifacts are not Core.
- This repository contains no canonical VAG Core implementation.
- This repository contains a minimal local demo gateway that simulates the bounded public demo contract.

## What This Architecture Is Not

- Gateway is not a global enforcement layer.
- Deny is not a system-wide blockade.
- Evidence is not a compliance or security proof.
- Verify is not an approval mechanism.
- This architecture does not claim sandbox or isolation properties.
