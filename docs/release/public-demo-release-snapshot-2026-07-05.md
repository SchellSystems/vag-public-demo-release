# Public Demo Release Snapshot ? 2026-07-05

## Scope

Source Repo: `SchellSystems/vag-public-demo`

Source PR #13: merged

This export is a history-clean snapshot prepared from the private source repository. It does not include the source `.git` directory, old Git history, or old branches.

## Repository State

- Source repository remains private.
- Target repository is intended to be created as private first.
- No publication was performed by this snapshot document.
- No release was performed by this snapshot document.
- No deploy was performed by this snapshot document.
- No tag was created by this snapshot document.

## License

The full AGPL license text is present in `LICENSE`.

## Validation Summary

The source snapshot was validated before export with:

- `python tools/export_audit.py .`: PASS, 0 FAIL, 4 WARN
- `python tools/check_claims.py .`: PASS, 0 FAIL, 2 WARN
- `npm audit --omit=dev`: PASS, 0 runtime vulnerabilities
- `npm run build`: PASS
- `npm run smoke`: PASS, 42 passed, 0 failed

The export must be revalidated from the export directory before creating the target repository.

## Non-Claims

This snapshot does not claim:

- production readiness
- sandbox behavior or isolation
- compliance proof
- security proof
- full telemetry
- external platform integration
- that Verify approves
- that Evidence proves compliance or security
- that Deny proves system-wide non-execution

## Authority Boundary

This document records a private, history-clean public-demo snapshot preparation state only. It does not authorize public visibility, release, deployment, tagging, production use, compliance claims, security claims, or external platform integration claims.
