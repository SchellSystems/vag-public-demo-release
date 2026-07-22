# Repository Operating Contract

This contract applies to every AI-assisted change in this repository. It preserves the repository's bounded public-demo scope; it does not grant authority to merge, release, publish, deploy, or change repository visibility.

## Source and truth order

1. Revalidate live repository state before acting: current branch, working tree, base SHA, open pull requests, review threads, and relevant CI.
2. Use code and tests at the current commit as evidence of current behavior.
3. Use current normative public documentation to bound permitted claims and intended scope: `README.md`, `docs/claims-and-nonclaims.md`, `docs/architecture/authority-boundaries.md`, and `docs/demo/`.
4. Treat dated release reports and snapshots as historical evidence, not current state.
5. Treat contradictions between current behavior and normative public documentation as defects and report them explicitly. Neither side silently overrides the other. Mark anything not directly checked as `UNKNOWN`.

See `.kiro/steering/00-authority-and-source-order.md` for the full source protocol.

## Change protocol

- Begin read-only. Establish the requested outcome, exact scope, base branch/SHA, current reviews, and required checks before writing.
- Work on a task-specific branch from a revalidated `main`; never write or push directly to `main`.
- Keep diffs small and task-related. Do not mix setup, product, dependency, lockfile, workflow, release, or unrelated cleanup changes.
- Preserve public-only provenance. Never copy private source material, credentials, tokens, private paths, private logs, customer data, or unpublished operational details.
- Do not merge, release, tag, deploy, publish, change visibility, delete branches, or force-push without a separate explicit owner decision for that action.
- Review all open threads and recheck final `main` immediately before any owner-authorized merge. A prior green result is not a final-main result.

See `.kiro/steering/01-change-and-branch-protocol.md`.

## Validation and evidence

Run the repository-standard gates from the repository root unless the task explicitly narrows them and the limitation is reported:

```bash
python -m unittest discover -s test/audit -p 'test_*.py'
python -m unittest discover -s test/ci -p 'test_*.py'
python tools/check_claims.py .
python tools/export_audit.py .
npm ci
npm audit --omit=dev
npm test
npm run build
npm run smoke
git diff --check
```

Record the tested commit, environment when material, exact commands, outcomes, warnings, omissions, and remaining `UNKNOWN`s. Passing CI or smoke establishes only those bounded checks; smoke is not human browser acceptance. For a browser-impacting change, record a separate browser acceptance result or leave it explicitly `UNKNOWN`. After staging, run `git diff --cached --check`; after committing, check the complete base-to-head diff.

See `.kiro/steering/02-testing-and-evidence.md`.

## Claims and authority

- Describe this repository only as the bounded local Public Demo documented here. Do not infer a Core, Pilot, Lite, production, cloud, external-integration, or broader enforcement capability.
- Preserve proposal, gateway decision, UI-created local artifact, caller-supplied digest, Commit, Verify, and evidence-assembly as distinct concepts and authorities.
- Verify checks stored hash, signature, and reference relationships. It does not approve, authorize, certify, or decide governance.
- Deny-path absence is UI-derived and bounded to that flow; it is not system-wide observation.
- The gateway receives a digest and does not observe external execution. This repository contains no ToolGrant subsystem.
- Use `docs/claims-and-nonclaims.md` as the normative wording boundary. Scope every status word and claim.

See `.kiro/steering/03-claims-export-and-public-demo.md`.

## Pull-request handoff

A review handoff must state: role and scope, base/head branch and SHA, exact changed files, what and why, claim/authority impact, explicit non-actions, validations with results, limitations and `UNKNOWN`s, review focus, unresolved threads, and owner decisions still required. AI review and green checks support an owner decision; they do not make it.
