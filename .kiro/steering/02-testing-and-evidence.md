---
inclusion: always
---

# Testing and Evidence

## Truth classes

Label consequential statements with the strongest class actually supported:

- **OBSERVED:** directly read from the identified file, command output, API response, or review thread at a stated SHA/time.
- **TESTED:** produced by an executed check, with command, environment when material, tested SHA, and outcome recorded.
- **DERIVED:** reasoned from cited observations; include the reasoning and do not present it as direct observation.
- **HISTORICAL:** valid only for the dated snapshot, report, PR, or run cited.
- **UNKNOWN:** not checked, inaccessible, ambiguous, stale, or outside the evidence boundary.

`PASS`, `VALID`, and `VERIFY_OK` retain the narrow meanings in `docs/claims-and-nonclaims.md`. Never upgrade one bounded result into a broader conclusion.

## Required local validation

Run from the repository root, in this order:

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

Then verify scope with `git status --short`, the exact changed-file list, and the full diff against the intended base. Treat warnings as review evidence even when the command exits zero. Because plain `git diff --check` does not cover untracked or staged files, also run `git diff --cached --check` after staging and `git diff --check <base>...HEAD` after committing.

If a gate cannot run, report the exact command, failure or environmental limitation, impact, and resulting `UNKNOWN`; do not claim the sequence passed.

## Evidence recording

For each result, preserve enough context to replay and review it:

- repository, branch, and exact SHA
- command or CI workflow/run/job identity
- relevant runtime versions and material environment differences
- exit/result status and concise output
- warnings and tolerated findings
- skipped checks and why
- whether the working tree or dependencies changed during validation

A green result belongs only to the tested SHA and configuration. Recheck after material changes.

## Bounded interpretations

- Claim audit checks its implemented text patterns; it is not complete semantic review.
- Export audit checks its implemented public-export rules; it is not a complete history or secret review.
- Unit tests cover their asserted contracts only.
- Build success establishes that the UI build completed in that environment.
- Gateway smoke starts the gateway and runs the automated probe. It is not human browser acceptance and does not exercise every browser-origin or documentation path.
- For UI, CORS/origin, browser-instruction, or browser-flow changes, perform human browser acceptance against the documented flow when the environment permits and record the browser, relevant origin, tested SHA, and result. If it is not performed, report browser acceptance as `UNKNOWN`; do not claim a browser-acceptance pass.
- Pull-request CI is not final-main CI. A final-main result requires the merged main SHA and its completed main-push checks.

Review changed public prose, examples, and PR text semantically even when automated checks pass.
