# Authority Boundaries — Public Demo Summary

## Status

This file is a non-authoritative navigation summary for the public demo repository. The detailed public-demo authority definition is [docs/architecture/authority-boundaries.md](architecture/authority-boundaries.md).

This summary does not define private Core, Pilot, Lite, DRE, Observed Surface, Deviation, Agent-Control, or Contextmarker authority.

## Public-Demo Roles

### Demo Gateway

Decides allow or deny within the bounded public-demo contract. For an allowed proposal, it can bind the proposal, decision, and caller-supplied digest. It does not receive the local artifact or observe external execution.

### Demo UI

Submits proposals, creates a local demo artifact after allow, supplies its digest, displays gateway responses, and assembles bounded review material. Its negative-evidence statements are UI-derived.

### Commit

Binds proposal, decision, and caller-supplied `output_digest` in the demo record.

### Evidence

Reconstructs the bounded public-demo record path and distinguishes gateway records from UI-derived statements.

### Verify

Checks stored hash, signature, and proposal/decision reference relationships. It does not approve, authorize, certify, or govern.

## Repository Separation

- The public demo is not the private Core.
- The public demo is not the Controlled Agent Pilot.
- The public demo is not VAG-lite.
- This repository contains no ToolGrant subsystem.
- Deny does not prove system-wide non-execution.

No component in this repository may assume authority outside the bounded public-demo contract.
