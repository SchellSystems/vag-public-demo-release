# PR #29 Post-Merge Closure Record

**Record ID:** `VAG-PD-PR29-POSTMERGE-20260727T044543Z`

**Observed through:** `2026-07-27T04:45:43Z`

**Repository:** `SchellSystems/vag-public-demo-release`

**Pull request:** [#29](https://github.com/SchellSystems/vag-public-demo-release/pull/29)

**Status class:** `PASS_WITH_RESIDUAL_MANUAL_ACCEPTANCE`

## Scope and status meaning

This immutable, SHA-bound record covers the technical post-merge closure of dependency PR #29 in the bounded Public Demo repository. The named merge, main-push workflow, and local gates passed at the SHAs recorded below. The status does not authorize or record a release, deployment, publication, production approval, or broader capability claim.

`PASS_WITH_RESIDUAL_MANUAL_ACCEPTANCE` expressly means:

- manual Windows acceptance remains open;
- manual browser/GUI acceptance remains open because it was not performed in this run;
- no release was created;
- no deployment was performed;
- no production approval was granted.

## NACHGEWIESEN

Live GitHub state and the exact local checkout established:

- PR #29 is closed and merged.
- Pre-merge base: `455e0ae1aec167672dd78afc519b11c26e9315db`.
- PR head: `69bec9bb88190c8b0cb570e36dd110f09d77b004`.
- Merge SHA: `6913adb0907e927692c2b277c9808627a8e9c2e8`.
- New full `main` SHA: `6913adb0907e927692c2b277c9808627a8e9c2e8`.
- Merged at: `2026-07-27T04:40:58Z`; the resulting commit has author and committer time `2026-07-27T04:40:57Z`.
- The resulting commit has exactly one parent, the pre-merge base, and differs from the one-commit PR head.
- Actual PR and merge delta: exactly `package-lock.json`, 7 additions and 7 deletions.
- The delta updates PostCSS `8.5.16` to `8.5.23`, Nano ID `3.3.15` to `3.3.16`, and the PostCSS Nano ID range `^3.3.12` to `^3.3.16`.
- No runtime source, workflow, or public-claim file changed in PR #29.

## BERICHTET

The historical pre-merge record reported successful candidate gates and a then-current `BLOCKED` state. It is retained byte-for-byte as historical evidence and is not used as proof of the later merge or post-merge results:

- [Historical PR #29 pre-merge closure record](pr-29-closure-record-2026-07-27-035418z.md)
- Record ID: `VAG-PD-PR29-20260727T035418Z`
- Classification: `HISTORICAL_VALID_PRE_MERGE_RECORD`
- Preserved SHA-256: `e708fdf710a99111f469dee034c1a4a12778a3232195e05b5194d08db43f54c2`

Earlier agent material is provenance only. Every consequential merge, main, CI, diff, and test fact in this record was independently revalidated live or rerun.

## UNKNOWN and open residual work

- Manual Windows installer/ZIP execution and interactive Windows acceptance were not performed: `UNKNOWN`, open.
- Human browser/GUI acceptance was not performed: `UNKNOWN`, open. Automated gateway smoke is not human browser acceptance.
- External Drive deposit and a real Drive destination were not performed or established: `UNKNOWN`, open. The available resource mapping exposed PR #30 but no Drive resource.
- Any later release, deployment, production approval, or repository state after the observation time is outside this record: `UNKNOWN`.

## PR #29 merge

The live pull-request API reports `merged=true`, owner `SchellSystems` as merger, merge SHA `6913adb0907e927692c2b277c9808627a8e9c2e8`, and merge time `2026-07-27T04:40:58Z`. The live `refs/heads/main` endpoint points to the same SHA.

**Merge method:** `squash merge` (derived from the observed topology: the GitHub-created result is a new one-parent commit on the pre-merge base, its SHA differs from the PR head, and its subject includes `(#29)`).

## Main-push CI

| Field | NACHGEWIESEN value |
|---|---|
| Workflow | `Public Demo Audit` |
| Event / branch | `push` / `main` |
| Run ID | `30237758979` |
| Run number | `142` |
| Job | `audit` |
| Job ID | `89888701902` |
| Bound SHA | `6913adb0907e927692c2b277c9808627a8e9c2e8` |
| Run status / conclusion | `completed` / `success` |
| Job status / conclusion | `completed` / `success` |
| Run interval | `2026-07-27T04:41:00Z` to `2026-07-27T04:41:29Z` |
| Job interval | `2026-07-27T04:41:03Z` to `2026-07-27T04:41:28Z` |

All listed workflow steps concluded successfully, including changed-line whitespace, CI helper tests, audit fixtures, claim audit, export audit, dependency installation, production-closure dependency audit, Node tests, UI build, and gateway smoke.

## Local post-merge gates

Tested commit: `6913adb0907e927692c2b277c9808627a8e9c2e8`, checked out detached from the freshly fetched live `main` ref.

Environment: Linux sandbox; Node.js `v22.23.1`; npm `11.4.2`; Python `3.11.15`.

The environment set `NODE_OPTIONS=--require /opt/amazon/kiro-agent/proxy-bootstrap.js`, but that preload target does not exist. The minimum adjustment removed only `NODE_OPTIONS` for Node/npm commands. Python was selected explicitly with `PYENV_VERSION=3.11.15` because the sandbox requires an installed pyenv version selection. No repository file was changed by either adjustment.

| Command | Exit | NACHGEWIESEN result |
|---|---:|---|
| `PYENV_VERSION=3.11.15 python -m unittest discover -s test/audit -p 'test_*.py'` | 0 | 34 tests, OK |
| `PYENV_VERSION=3.11.15 python -m unittest discover -s test/ci -p 'test_*.py'` | 0 | 17 tests, OK |
| `PYENV_VERSION=3.11.15 python tools/check_claims.py .` | 0 | PASS; 0 FAIL, 50 WARN |
| `PYENV_VERSION=3.11.15 python tools/export_audit.py .` | 0 | PASS; 0 FAIL, 74 WARN |
| `env -u NODE_OPTIONS npm ci` | 0 | 603 packages added; 606 audited; deprecation warnings; 30 high-severity full-development-tree findings reported |
| `env -u NODE_OPTIONS npm audit --omit=dev` | 0 | 0 vulnerabilities in the production closure |
| `env -u NODE_OPTIONS npm test` | 0 | 142 tests, 33 suites, 0 failed |
| `env -u NODE_OPTIONS npm run build` | 0 | Vite 6.4.3 build completed; 37 modules transformed |
| `env -u NODE_OPTIONS npm run smoke` | 0 | 45 passed, 0 failed |
| `git diff --check` | 0 | no whitespace errors |
| `git status --short` | 0 | no tracked or untracked changes after validation |

Warnings remain review evidence and are not silently upgraded to approval.

## Claim boundary

The dependency findings have two distinct scopes:

- `npm audit --omit=dev`: **0 vulnerabilities in the production closure**.
- Full development-dependency tree observed during `npm ci`: **30 high-severity findings**.

This record does not state or imply “0 vulnerabilities overall.” The local tests, build, smoke, claim audit, and export audit establish only their bounded checks at the named SHA. Smoke does not establish human browser acceptance.

## PR #30 continuation boundary

The existing branch `docs/pr29-closure-20260727` and existing PR #30 are the sole documentation continuation for this closure track. The new `main` commit was integrated with a two-parent merge commit, without rebase, history rewrite, or force push. The historical record remains unchanged; this record supersedes only its former role as the current navigation target.

No new branch, pull request, pointer file, runtime change, dependency change, lockfile-only PR change, workflow change, release, tag, deployment, auto-merge, direct-main push, visibility change, secret change, or PR #30 merge is authorized or recorded here.
