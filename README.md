# VAG Public Demo

VAG Public Demo is a curated, bounded demonstration surface for explaining verifiable agent execution control concepts.

## Components

| Component | Path | Description |
|-----------|------|-------------|
| Demo Gateway | `demo-gateway/` | Local deny-by-default bounded gateway |
| Demo UI | `demo-ui/` | React UI for bounded business-record review demo |
| Public Probe | `tools/public_demo_probe.mjs` | Automated gateway validation |
| Gateway Smoke | `tools/gateway_smoke.mjs` | Local gateway+probe smoke test |
| Audit Tools | `tools/check_claims.py`, `tools/export_audit.py` | Claim and export audit |

## Quick Start

```bash
npm ci
npm run gateway &       # starts demo-gateway on :4400
npm run dev             # starts demo-ui on :5173
npm run probe:public    # validates gateway behavior
```

## Bounded Demo Logic

```
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

- [Demo Walkthrough](docs/demo/walkthrough.md)
- [Runbook](docs/demo/runbook.md)
- [Threat Model](docs/demo/threat-model.md)
- [Authority Boundaries](docs/architecture/authority-boundaries.md)
- [Claims and Non-Claims](docs/claims-and-nonclaims.md)
- [Architecture](docs/architecture.md)

## Repository Status

This repository is in the final phase of preparation for public demonstration. It remains a bounded demo and does not claim production readiness. The bounded demo illustrates agent execution control concepts; no real external workflow integration or security certification is implied.

## License

This project is licensed under the GNU Affero General Public License version 3 or later. See [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome subject to our Contributor License Agreement (CLA). See [CONTRIBUTING.md](CONTRIBUTING.md) for more information.
