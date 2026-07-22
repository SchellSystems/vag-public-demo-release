# VAG Public Demo

[![Public Demo Audit](https://github.com/SchellSystems/vag-public-demo-release/actions/workflows/audit.yml/badge.svg)](https://github.com/SchellSystems/vag-public-demo-release/actions/workflows/audit.yml)

VAG Public Demo is a bounded local demonstration of an inspectable proposal, decision, artifact-digest, commit, verify, and evidence-assembly path.

The repository is intentionally small. It shows one reviewable path clearly instead of presenting a larger system than the public demo contains.

## Review the Demo in Three Minutes

Start here if you are evaluating the repository for the first time:

- [Three-Minute Demo Review](docs/demo/three-minute-review.md)
- [Demo Walkthrough](docs/demo/walkthrough.md)
- [Claims and Non-Claims](docs/claims-and-nonclaims.md)

## What to Look For

- A scoped proposal enters the local demo gateway.
- The gateway returns an explicit allow or deny decision.
- After an allow decision, the UI creates a local demo artifact and supplies its digest to the gateway.
- Commit binds the proposal, decision, and caller-supplied `output_digest`.
- A denied proposal cannot be committed; the UI records the absence of its bounded follow-on artifact chain.
- Verify checks stored hash, signature, and reference relationships for the bounded demo record.
- Evidence is assembled after Commit and Verify for review of the bounded path.

## Demo Flow

```text
Agent Proposal
  -> Gateway Decision
      -> allow -> UI-created demo artifact -> caller-supplied digest -> Commit -> Verify -> Evidence Assembly
      -> deny  -> Commit rejected / UI records no bounded follow-on chain
```

## Components

| Component | Path | Description |
|-----------|------|-------------|
| Demo Gateway | `demo-gateway/` | Local deny-by-default bounded gateway |
| Demo UI | `demo-ui/` | React UI for bounded business-record review demo |
| Public Probe | `tools/public_demo_probe.mjs` | Automated gateway validation |
| Gateway Smoke | `tools/gateway_smoke.mjs` | Local gateway+probe smoke test |
| Audit Tools | `tools/check_claims.py`, `tools/export_audit.py` | Claim and export audit |

## Quick Start

Prerequisite:

- Node.js `>=20.19.0`; the public demo audit workflow validates Node.js 20.19 and 22.

Install dependencies and run the automated local smoke test:

```bash
npm ci
npm run smoke
```

Run the interactive demo locally with two terminals:

```bash
npm run gateway
```

```bash
npm run dev
```

The demo gateway listens on `http://127.0.0.1:4400`. The demo UI runs on `http://127.0.0.1:5173`.

## Bounded Demo Logic

```text
Agent proposes.
Gateway decides within a bounded public-demo contract.
After allow, the UI creates a local demo artifact and computes its digest.
The gateway receives the caller-supplied `output_digest`; it does not observe external execution.
Commit binds proposal, decision, and digest.
Verify checks stored hash, signature, and reference relationships.
Evidence Assembly reconstructs the bounded public-demo record path after Commit and Verify.
For deny, the commit endpoint rejects the proposal and the UI derives the absence of its bounded follow-on chain.
This repository contains no ToolGrant subsystem.
```

## Non-Claims

This repository does not claim that VAG is:

- production-ready
- a sandbox
- OS/browser/network/process/filesystem isolation
- system-wide enforcement
- a compliance certification system or compliance proof
- a security guarantee or security proof
- full telemetry
- an external transaction or production platform
- externally integrated with any named third-party platform
- enterprise-security-certified

Also:

- Verify does not approve.
- Verify does not authorize.
- Verify does not certify safety.
- Verify does not decide governance.
- Evidence does not certify compliance.
- Evidence does not prove security.
- Evidence is not full telemetry.
- Deny does not prove system-wide non-execution.
- Gateway does not grant global tool capability.

## Documentation

- [Three-Minute Demo Review](docs/demo/three-minute-review.md)
- [From Public Demo to VAG Architecture](docs/architecture/from-demo-to-vag.md)
- [Demo Walkthrough](docs/demo/walkthrough.md)
- [Runbook](docs/demo/runbook.md)
- [Threat Model](docs/demo/threat-model.md)
- [Authority Boundaries](docs/architecture/authority-boundaries.md)
- [Claims and Non-Claims](docs/claims-and-nonclaims.md)
- [Architecture](docs/architecture.md)

## Repository Status

This repository is a public bounded local demo. It illustrates a reviewable proposal-decision-artifact-digest-commit-verify-evidence-assembly path and remains limited to the repository scope described in the documentation. No real external workflow integration, global execution control, or certification is implied.

## License

This project is licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for details.
