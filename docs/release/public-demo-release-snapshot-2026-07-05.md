# Public Demo Release Snapshot - 2026-07-05

## Scope

Source repo: `SchellSystems/vag-public-demo`

Target repo: `SchellSystems/vag-public-demo-release`

Source PR #13: merged

This export is a history-clean snapshot prepared from the private source repository. It does not include the source `.git` directory, old Git history, or old branches.

## Repository State

- Source repository remains private.
- Target repository is a bounded public demo repository.
- Target repository was created history-clean.
- Initial target commit SHA: `9222b010c534b195d10135f4fb9ada0300f5fbbf`
- Original target commit SHA: `9222b010c534b195d10135f4fb9ada0300f5fbbf`.
- Current `main` after target PR #1 points to `08a5c33d52bdbf0b4b48231d726462d1c6d3f5ae`.
- Workflow `Öffentliche Demo-Prüfung Nr. 1` succeeded on commit `9222b01`.
- No production publication was performed.
- No production release was performed.
- No deploy was performed.
- No tag was created.
- No visibility change was performed.
- Production release, deployment, tagging, and production visibility claims remain owner decisions outside this snapshot.

## License

The full AGPL license text is present in `LICENSE`.

## Validation Summary

The source snapshot and target export state were validated with:

- `python tools/export_audit.py .`: PASS, 0 FAIL, 4 WARN
- `python tools/check_claims.py .`: PASS, 0 FAIL, 8 WARN
- `npm audit --omit=dev`: PASS, 0 runtime vulnerabilities
- `npm run build`: PASS
- `npm run smoke`: PASS, 42 passed, 0 failed

Source PR #13 fixed the export audit LICENSE false positive before the history-clean target repository push.

## Non-Claims

This snapshot does not claim:

- production readiness
- sandbox behavior
- isolation
- compliance proof
- security proof
- full telemetry
- external platform integration
- that Verify approves
- that Evidence proves compliance or security
- that Deny proves system-wide non-execution

## Authority Boundary

This document records a history-clean bounded public-demo snapshot state only. It does not authorize production release, deployment, tagging, production use, compliance claims, security claims, sandbox claims, isolation claims, or external platform integration claims.
