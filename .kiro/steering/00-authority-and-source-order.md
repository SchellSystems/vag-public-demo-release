---
inclusion: always
---

# Authority and Source Order

Use this protocol before analysis, implementation, review, or status reporting.

## Establish current state

Start read-only and capture the current branch, clean/dirty status, `HEAD`, base SHA, remote/default-branch state, open pull requests, review threads, and relevant CI runs. State the observation time when freshness matters. Do not reuse a previous status as if it were live.

Classify unchecked, inaccessible, ambiguous, or stale facts as `UNKNOWN`. Never convert absence of evidence into a pass.

## Resolve sources in order

1. **Live state:** current Git/GitHub branch, SHA, diff, review, and CI facts.
2. **Executable behavior:** code and tests at that SHA are evidence of current behavior.
3. **Normative public documentation:** the current README, claim boundaries, authority boundaries, runbooks, and walkthroughs bound permitted claims and intended scope.
4. **Examples:** useful only within their declared synthetic and bounded scope.
5. **Historical material:** dated release notes, snapshots, incident reviews, and prior PR descriptions describe their recorded point in time only.
6. **External statements:** require current verification and cannot override repository evidence without an explicit owner decision.

Treat contradictions between current behavior and normative public documentation as defects. Report the exact conflict and its consequence; neither side silently overrides or repairs the other.

## Authority boundaries

Keep the actors separate:

- **Gateway Decision:** the gateway decides only within its local allowlist contract.
- **Commit:** Commit binds the proposal, gateway decision, and caller-supplied digest.
- **Verify:** Verify checks stored hash, signature, and reference relationships.
- The UI sends proposals, creates the local demo artifact after allow, supplies its digest, and assembles bounded review material.
- Evidence reconstructs a bounded record path; it grants no further authority.
- Human owners retain decisions for merge, release, tag, deploy, publication, visibility, and other governance actions.

Do not infer authority from a tool's technical ability, a green check, an AI recommendation, or an unopposed PR.

## Public provenance

Use only material already public in this repository or independently public sources suitable for attribution. Do not import private bootstrap notes, internal repository details, credentials, private paths, private logs, customer data, or unpublished operational context.

Normative references:

- `README.md`
- `docs/claims-and-nonclaims.md`
- `docs/architecture/authority-boundaries.md`
- `.github/workflows/audit.yml`
