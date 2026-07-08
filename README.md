# VAG Public Demo

[![Public Demo Audit](https://github.com/SchellSystems/vag-public-demo-release/actions/workflows/audit.yml/badge.svg)](https://github.com/SchellSystems/vag-public-demo-release/actions/workflows/audit.yml)

VAG Public Demo is a bounded local demonstration of inspectable agent execution control: proposal, gateway decision, commit, evidence, and verify.

The repository is intentionally small. It shows one reviewable path clearly instead of presenting a larger system than the public demo contains.

## Review the Demo in Three Minutes

Start here if you are evaluating the repository for the first time:

- [Three-Minute Demo Review](docs/demo/three-minute-review.md)
- [Demo Walkthrough](docs/demo/walkthrough.md)
- [Claims and Non-Claims](docs/claims-and-nonclaims.md)

## What to Look For

- A scoped proposal enters the local demo gateway.
- The gateway returns an explicit allow or deny decision.
- Allowed bounded demo paths can produce commit and evidence artifacts.
- Denied bounded demo paths do not produce ToolGrant, Commit, or Verify artifacts.
- Verify checks hash, signature, and reference integrity for the bounded demo record.

## Demo Flow

```text
Agent Proposal
  -> Gateway Decision
      -> allow -> bounded demo artifact -> Commit -> Evidence -> Verify
      -> deny  -> no ToolGrant / no Commit / no Verify in the bounded path
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

The demo gateway listens on `:4400`. The demo UI runs on `:5173`.

## Bounded Demo Logic

```text
Agent proposes.
Gateway decides within a bounded demo/Core contract.
Execution artifacts are created only after an allowed bounded path.
Commit binds a demo run to proposal and decision context.
Evidence reconstructs a bounded demo path.
Verify checks hash, signature, and reference integrity.
Deny stops the bounded Pilot path from producing ToolGrant, Commit, and Verify artifacts.
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

This repository is a public bounded local demo. It illustrates a reviewable agent execution control path and remains limited to the repository scope described in the documentation. No real external workflow integration, global execution control, or certification is implied.

## License

This project is licensed under the GNU Affero General Public License version 3 or later. See [LICENSE](LICENSE) for details.

## Commercial / Pilot Use

The demo is distributed under AGPL-3.0-or-later. Commercial pilot, integration, hosted, or proprietary use may require a separate written agreement or commercial license from the repository owner.

## Contributing

Contributions are welcome subject to our Contributor License Agreement (CLA). See [CONTRIBUTING.md](CONTRIBUTING.md) for more information.
