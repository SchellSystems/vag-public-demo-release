---
inclusion: always
---

# Claims, Export, and Public-Demo Boundaries

## Repository identity

This repository documents and implements only the bounded local Public Demo described by its current public sources. Do not imply that it contains or validates a separate Core, Pilot, Lite, production, cloud, quarantine, external integration, or larger VAG system. A passing demo check is not evidence about those scopes.

Use `docs/claims-and-nonclaims.md` as the normative claim vocabulary. Keep cautious terms explicitly scoped and preserve the README/UI non-claims. Do not introduce a stronger claim through headings, badges, screenshots, examples, comments, commit messages, PR text, or status summaries.

## Preserve authority separation

Keep these statements precise:

- A proposal carries `scope.intent`; top-level `intent` does not authorize.
- The local gateway returns an allow or deny decision under its bounded allowlist.
- After allow, the UI creates a local demo artifact and supplies its digest.
- Commit binds proposal, decision, and caller-supplied digest; it does not establish observed external execution.
- Verify checks stored hash, signature, and reference relationships. It does not approve, authorize, certify, or decide governance.
- Deny prevents Commit in the gateway contract. UI-derived absence applies only to that bounded UI path and is not system-wide observation.
- Evidence assembles bounded review material and grants no authority.
- The repository contains no ToolGrant subsystem, and the gateway does not grant global tool capability.

Do not collapse proposal, decision, artifact creation, digest, Commit, Verify, evidence, or owner approval into one event.

## Origin and runtime statements

Treat local origin details as a cross-file contract. Compare gateway bind/CORS configuration, UI gateway constants, Vite dev/preview configuration, probes, smoke tools, tests, README files, runbooks, and walkthroughs. Report any `localhost` versus `127.0.0.1`, port, protocol, host, or browser-instruction drift explicitly. Do not infer browser acceptance from gateway smoke or substitute documentation for a runtime check.

## Public export hygiene

Before any public-facing change or export:

1. Review the exact diff and all generated or copied material.
2. Use only sources already public in this repository or independently public sources suitable for attribution. Never copy, paraphrase, summarize, transform, or infer content from private context.
3. Remove credentials, tokens, personal/customer data, private paths, private repository names, private URLs, internal logs, and unpublished operational details.
4. Keep evidence examples synthetic and clearly scoped.
5. Run claim and export audits, then perform semantic human review of claims and provenance.
6. Record limitations and unresolved `UNKNOWN`s.
7. Obtain an explicit owner decision for publication, release, deployment, or visibility change.

Automated audits are bounded detectors. Their success does not replace provenance review, claim review, review-thread resolution, or owner authorization.

Normative references:

- `README.md`
- `docs/claims-and-nonclaims.md`
- `docs/architecture/authority-boundaries.md`
- `docs/demo/runbook.md`
- `docs/demo/walkthrough.md`
- `demo-gateway/src/server.mjs`
- `demo-ui/src/constants.ts`
