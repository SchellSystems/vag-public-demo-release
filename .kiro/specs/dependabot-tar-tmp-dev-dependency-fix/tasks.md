# Implementation Plan

## Canonicalization note (2026-07-26)

This is the canonical, corrected task plan. It supersedes the earlier generated draft and applies the defects found in the 2026-07-26 review record:

- a **task-branch creation step now precedes every implementation write** (new task 2);
- every base-to-head comparison uses the **immutable BASE_SHA**, never the mutable local `main` ref;
- **BU2, BU3 and BU5 are recorded as owner-resolved** for this bugfix instead of being reopened as blocking questions (see `bugfix.md` addendum A2–A7);
- **Windows candidate verification happens before merge** (task 9), with only Dependabot closure left post-merge (task 11);
- local `npm run desktop:package` (packaged app + ASAR only) is distinguished from local `npm run desktop:make` (installer/ZIP surfaces) and from the existing manual workflow `.github/workflows/windows-build.yml`;
- the offline regression test is described as an **evidence-dated snapshot dependency contract**, never a security gate;
- no stray Markdown fence remains, and **no tool-metadata file is created** in this spec directory.

**Immutable base for this spec:** `BASE_SHA = ed3b8d9444d49f5ff2e28cd1c4c52092782e701c` (remote `main` at 2026-07-26, OBSERVED).

## Current status

**Only task 1 is actionable, and it is owner-only.** No repository file outside `.kiro/specs/dependabot-tar-tmp-dev-dependency-fix/` has been changed: `package.json` and `package-lock.json` are byte-identical to `BASE_SHA`, no `overrides` block exists (E3.4), no install has been run, and no dependency change, implementation branch, or implementation commit exists. Every task numbered 3 and above is **CONDITIONAL on BU1 being resolved by the owner** and must not be started before that; task 2 (branch creation) runs only after BU1 resolves and immediately before the first implementation write.

Stopping at task 1 with zero repository change outside this spec directory is a **correct terminal outcome** (expected behavior 2.4, design Property 3), not an incomplete result.

### BU1 Resolution (2026-07-26)

**Task 1 status: RESOLVED.** Owner selected **M2** (root overrides `tar=7.5.22`, `tmp=0.2.7`) as the authorized remediation mechanism on 2026-07-26.

- **M1 REJECTED:** independently tested in scratch; `npm ls tar tmp --all` produces exit 1 / ELSPROBLEMS with targeted nested overrides. M1 does not produce a clean tree.
- **M2 AUTHORIZED:** Phase B scratch validation on base SHA `ed3b8d9` confirms all gates pass (npm ci exit 0, npm ls exit 0, npm audit clean, npm test 109/0, build pass, smoke 45/0, production closure identical).
- **Implementation authorized** on separate branch `fix/dependabot-tar-tmp-remediation`.
- **Remaining tasks (2-11)** proceed as documented with M2 as the authorized mechanism. Task 2 creates the implementation branch; tasks 3-6 implement and verify M2; tasks 7-11 handle staging, commit, push, Windows verification, and closure.

## Prohibited throughout this plan (no task may perform these)

- Merge, release, tag, deployment, publication, signing, repository visibility/settings changes.
- Branch deletion; force-push; rewriting history.
- Writing or committing directly on `main`.
- Workflow changes of any kind under `.github/**`, including `check_changed_whitespace.sh`.
- CI hardening of any kind, including adding a dev-audit gate (BU5 / N1) or a `.github/dependabot.yml` (N4).
- Product source changes (`demo-gateway/**`, `demo-ui/**`, `desktop/**`, `tools/**`), `forge.config.mjs`, workspace manifests, `examples/**`, public docs/claim text, `.kiro/steering/**`.
- Any unbound `npx` packaging command. Packaging is only ever `npm run desktop:package` or `npm run desktop:make`, or the existing owner-dispatched Windows workflow.
- Creating a tool-metadata/spec-configuration file in this spec directory.
- Before BU1 resolves: `npm install`, `npm ci`, `npm update`, `npm audit fix`, any lockfile edit, any `package.json` edit, any dependency-resolution change, implementation branch creation, implementation commit, push, pull request.

## Plan-level testing constraint (binding)

Between task 4 (adding the intentionally failing regression test) and task 6 (applying authorized remediation), **the only required test run is the single-file run** `node --test test/dependency-advisory-contract.test.mjs`. A red full `npm test` suite in that window is **expected and correct** — it is the counterexample witness. The full suite MUST NOT be required to pass in that window, and the failing test MUST NOT be weakened, skipped, floor-lowered, or deleted to make the suite green. Only remediation may turn it green.

---

- [ ] 1. **BLOCKING OWNER GATE (BU1) — remediation mechanism authorization** — *status: BLOCKED / OWNER-ONLY / not startable by the agent*
  - Present the six documented mechanisms from design.md ("Remediation Mechanism Comparison — NO SELECTION MADE") for owner selection: **M1** targeted nested `npm` overrides scoped to `@electron/rebuild > tar`, `@electron/node-gyp > tar`, `cacache > tar`, `external-editor > tmp`; **M2** broad root-level overrides; **M3** ancestor major upgrade path (`@electron/rebuild` 4.x, `@inquirer/prompts` 8.x); **M4** wait for Electron Forge 8 GA; **M5** documented risk acceptance with no dependency change; **M6** remove/relocate the desktop-packaging devDependency set
  - State to the owner that **M1 is the preferred EXPERIMENTAL CANDIDATE ONLY** — not a decision, not an approval, not a recommendation to implement; nothing has been prepared, drafted into a repository file, or applied
  - State the reason the gate exists: no advisory-clean resolution exists inside the declared ranges (`tar` 6.x ends at 6.2.1, E6.2; `tmp` 0.0.x ends at 0.0.33, E6.3; all requirer ranges exclude safe versions, E6.4) and the direct Forge devDependency is already at latest 7.11.2 (E6.5) which pins `core|core-utils|shared-types` exactly and `@inquirer/prompts ^6.0.1` (E6.6). The choice is a risk decision, not a technical derivation
  - State that all six mechanisms cross major contracts (E6.11) with **UNKNOWN** build-tool compatibility (E6.12, PC8), and that advisory floors are evidence-dated: `tar >= 7.5.21` (latest 7.5.22, E6.1), `tmp >= 0.2.6` (latest 0.2.7, E6.3)
  - **EXPLICIT PROHIBITION until the owner selects a mechanism:** no manifest change, no lockfile change, no `overrides` block, no install, no dependency-resolution change, no implementation branch, no commit, no push, no pull request — not even prepared or staged
  - Record the owner's selection (or explicit non-selection) as a dated decision record inside this spec directory only
  - **Correct terminal outcome if unresolved:** report the blocker and stop with the repository unchanged outside this spec directory
  - _Requirements: 2.4_
  - _Evidence: E6.2, E6.3, E6.4, E6.5, E6.6, E6.11, E6.12_
  - _Checks: Property 3, S1, S2_

  - [x] 1.1 **BU2 — alert scope: RESOLVED for this bugfix (owner decision, 2026-07-26)**
    - Owner bounded this bugfix to the visible dev-only `tar` / `tmp` alert family: `tar` (critical, aggregate range `<=7.5.20`, `fixAvailable: false`, E5.3) and `tmp` (high, aggregate range `<=0.2.5`, `fixAvailable: false`, E5.4). Nothing else is in scope
    - Recorded in `bugfix.md` addendum A3 as an owner decision (HISTORICAL, dated), **not** as ground truth about the alert records
    - Exact Dependabot alert IDs, severities, and open/closed state remain **UNKNOWN** from this environment; FC5 stays owner-confirmed after merge only
    - Do not reopen this as a blocking question. Hard stop **S7 still applies** if the owner later observes an alert set that differs from the `tar`/`tmp` family — in that case scope must be re-derived before any later task runs
    - _Requirements: 2.4_
    - _Evidence: E1.6, addendum A3_
    - _Checks: BU2, FC5, S7_

  - [x] 1.2 **BU3 — remote state: RESOLVED for this bugfix (revalidated 2026-07-26)**
    - Revalidated read-only against the public GitHub API: default branch `main`; remote `main` = `ed3b8d9444d49f5ff2e28cd1c4c52092782e701c` = `BASE_SHA`; **no open pull requests**; local working tree clean at branch creation (OBSERVED, 2026-07-26; `bugfix.md` addendum A2)
    - CI run history for `main` (E1.7) was not retrieved and stays **UNKNOWN**; the clone is shallow (E1.3)
    - **Must be re-executed** in task 2 immediately before the implementation branch is created, and again immediately before any owner-authorized merge — a revalidation result belongs only to its observation time
    - _Requirements: 2.4_
    - _Evidence: E1.2, E1.3, E1.4, E1.5, E1.7, addendum A2_
    - _Checks: BU3, S3_

  - [x] 1.3 **BU5 — CI visibility gap: RESOLVED for this bugfix (owner decision, 2026-07-26)**
    - Owner kept N1 (both workflows gate only `npm audit --omit=dev`) and all of N2–N8 **outside** this bugfix as future hardening
    - Consequence: the dev-advisory CI gap **remains open after the fix, by explicit decision**, and must be stated in the pull-request handoff rather than silently closed or silently ignored
    - Any closing of that gap is a separate concern with its own branch and pull request
    - _Requirements: 3.7_
    - _Evidence: N1, E5.1, E5.2, addendum A4_
    - _Checks: BU5, S4_

- [ ] 2. **Create the implementation task branch — BEFORE any implementation write** — *CONDITIONAL on task 1; must complete before task 3 and before any file is created or modified outside this spec directory*
  - Re-revalidate live remote state at this moment: remote default branch, remote `main` SHA, open pull requests and review threads touching `package.json` / `package-lock.json`, and local working-tree cleanliness. Do not reuse the 2026-07-26 result as if it were live
  - Record the **immutable base SHA** for the implementation work as `BASE_SHA_IMPL` (it equals `ed3b8d9444d49f5ff2e28cd1c4c52092782e701c` only if remote `main` has not moved; if this spec branch was merged first, `BASE_SHA_IMPL` is the new remote `main` SHA). Every later comparison in this plan uses `BASE_SHA_IMPL`, never the local `main` ref
  - Create and switch to a descriptive implementation branch **exactly from `BASE_SHA_IMPL`** (for example `fix/dependabot-tar-tmp-dev-deps-impl`). Never write on `main`
  - Keep the implementation on its own branch: do **not** add manifest, lockfile, or test changes to the documentation/spec-only branch and pull request that carries this spec
  - If remote `main` differs from expectation, or a conflicting open pull request touches `package.json` / `package-lock.json`, hard stop **S3** holds: report the exact difference and stop without writing
  - Confirm and record: current branch, `git rev-parse HEAD` = `BASE_SHA_IMPL`, `git status --short` empty
  - _Requirements: 2.4, 2.5_
  - _Evidence: E2.1, E2.3, addendum A2_
  - _Checks: S3, PC6_

- [ ] 3. Capture the COMPLETE existing test baseline at `BASE_SHA_IMPL` — *CONDITIONAL on tasks 1 and 2; requires an owner-authorized environment where `npm ci` is permitted*
  - **Purpose:** every preservation check compares against this baseline. Until this environment exists, **every entry below is UNKNOWN** and no green result may be claimed or implied (E2.2 — absence of evidence is never a pass; hard-stop S6)
  - Confirm `HEAD` = `BASE_SHA_IMPL` and the working tree is clean before running anything
  - Run `npm ci` from the committed lockfile (only permitted in the authorized environment) and record exit code plus `git status --porcelain` output
  - Record pass/fail **and captured output** for each gate below, each tagged with its truth class and the SHA it belongs to:
    - `npm test` — must cover all five existing files: `test/desktop-contract.test.mjs`, `test/evidence.test.mjs`, `test/gateway-core.test.mjs`, `test/gateway-http.test.mjs`, `test/local-browser-contract.test.mjs`
    - `npm run build`
    - `npm run smoke`
    - `desktop/main.mjs --smoke-test` (seven checks; record each check individually)
    - `python -m unittest discover -s test/audit -p 'test_*.py'`
    - `python -m unittest discover -s test/ci -p 'test_*.py'`
    - `python tools/check_claims.py .`
    - `python tools/export_audit.py .`
    - `npm audit --omit=dev` — expected baseline: 0 vulnerabilities, exit 0 (E5.1)
    - `npm audit --include=dev --json` — expected baseline: exit 1, 36 entries, `vulnerabilities.tar` critical `<=7.5.20` `fixAvailable false` (E5.3), `vulnerabilities.tmp` high `<=0.2.5` `fixAvailable false` (E5.4)
    - `git diff --check`
  - Record the 9-entry production closure (names + versions, no `tar`/`tmp`) as the PC1 baseline (E3.5)
  - Record the lockfile baseline: `lockfileVersion` 3, exactly one `node_modules/tar` → `6.2.1` `"dev": true`, exactly one `node_modules/tmp` → `0.0.33` `"dev": true`, no `overrides` block (E3.1, E3.2, E3.3, E3.4)
  - Write the baseline record into this spec directory only; mark any gate that could not be executed as **UNKNOWN**, never as passing
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6, 3.7_
  - _Evidence: E1.2, E3.1, E3.2, E3.3, E3.4, E3.5, E5.1, E5.3, E5.4, E2.2, E2.4_
  - _Checks: PC1, PC2, PC3, PC4, PC5, FC3_

- [ ] 4. Write bug condition exploration test — *CONDITIONAL on tasks 1, 2 and 3; written on the implementation branch only*
  - **Property 1: Bug Condition** - No Advisory-Covered `tar`/`tmp` in the Resolved Graph
  - **CRITICAL**: This test MUST FAIL on the unfixed state — the failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior — it will validate the fix when it passes after remediation
  - **GOAL**: Surface reproducible counterexamples demonstrating the defect
  - **Bounded meaning (must be stated in the file):** this is an **evidence-dated snapshot dependency contract**, not a security gate. It prevents regression below the accepted floor; it cannot detect a future advisory above that floor, reads no advisory database, and does not replace Dependabot or a dev-audit gate (which stays out of scope per BU5/N1)
  - Create `test/dependency-advisory-contract.test.mjs` exactly per the design's "Proposed Regression Test" section: strictly offline — lockfile bytes only, **no network, no advisory database, no `npm audit` invocation, no child process, no assertions about severities or Dependabot state**
  - Implement `compareExactVersion` as strict numeric `x.y.z` comparison (major, then minor, then patch as integers; no semver library, no range semantics, no coercion) and `assertLockfileFloors` against evidence-dated floors `tar >= 7.5.21` and `tmp >= 0.2.6`, with an in-file comment citing E5.3, E5.4, E6.1, E6.3 and stating the floors are a dated snapshot and not self-updating
  - Implement fail-closed handling: prerelease, build metadata, range specifiers (`^`, `~`, `>`, `<`, `=`, `*`, `||`, `x` ranges, whitespace), leading `v`, non-numeric/empty/non-string versions, node present without `version`, node not an object, `lockfileVersion` ≠ 3, missing/renamed `packages` — all FAIL, never skip, never default-pass
  - Implement and document the absence discrimination: explicit node-key absence in a well-formed `packages` object of a `lockfileVersion: 3` lockfile **passes** (with the reason recorded); any inability to determine presence **fails**
  - Add the deterministic comparator unit cases (equal / one-below / one-above / major-minor-patch boundary triples) and the fail-closed unit cases. Generated cases are **optional** under the design's complexity reservation: permitted only with no new test dependency and a small file; comparator-algebra properties (totality, antisymmetry, reflexivity, transitivity) are **not required**
  - Run the test **ALONE**: `node --test test/dependency-advisory-contract.test.mjs`
  - **EXPECTED OUTCOME**: Test **FAILS** — `tar 6.2.1 < 7.5.21` and `tmp 0.0.33 < 0.2.6`. This is correct and proves the defect exists
  - Do **not** run or require the full `npm test` suite in this window (see the plan-level testing constraint); a red full suite here is expected
  - Document the counterexamples: `node_modules/tar` = `6.2.1` below floor `7.5.21`; `node_modules/tmp` = `0.0.33` below floor `0.2.6`; simultaneously `npm audit --omit=dev` passes clean (E5.1) — reproducing the gate invisibility in current behavior 1.4
  - **Refutation signal:** if either floor check passed at `BASE_SHA_IMPL`, lockfile evidence E3.2/E3.3 would be contradicted and the root-cause hypothesis must be re-derived before any fix
  - Mark complete when the test is written, run alone, and the failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2_
  - _Evidence: E3.1, E3.2, E3.3, E5.1, E5.3, E5.4, E6.1, E6.3_
  - _Checks: FC1, Property 1_

- [ ] 5. Write preservation property tests (BEFORE implementing the fix) — *CONDITIONAL on tasks 1, 2 and 3*
  - **Property 2: Preservation** - Non-Buggy Dependency State and All Product Behavior
  - **IMPORTANT**: Follow observation-first methodology — assert only behavior actually observed on the UNFIXED state in task 3, never assumed behavior
  - Observe on unfixed code: production closure is exactly 9 entries with recorded versions and contains no `tar`/`tmp` (E3.5) → assert closure equality as a property over the lockfile production closure (PC1)
  - Observe on unfixed code: `npm audit --omit=dev` → 0 vulnerabilities, exit 0 (E5.1) → record as the PC2 comparison baseline (executed check, owner-authorized environment only)
  - Observe on unfixed code: all five `.test.mjs` suites pass, `npm run build` and `npm run smoke` pass, `desktop/main.mjs --smoke-test` completes all seven checks → record as the PC3/PC4 baselines
  - Observe on unfixed code: `python -m unittest discover -s test/audit -p 'test_*.py'`, `-s test/ci -p 'test_*.py'`, `tools/check_claims.py .`, `tools/export_audit.py .` all pass → record as the PC5 baseline
  - Add the offline preservation assertions into `test/dependency-advisory-contract.test.mjs` (no new workflow, no new script): for lockfile-shaped inputs where the bug condition does **not** hold (no `tar`/`tmp` node below the floor), the check result is unchanged — i.e. the contract never fails a state that is already at or above the floor, and never depends on dev/prod partitioning of unrelated nodes
  - Keep this surface deterministic and small; optional generated cases only under the design's complexity reservation
  - Run the preservation assertions on the UNFIXED state
  - **EXPECTED OUTCOME**: preservation assertions **PASS** on unfixed code (they confirm the baseline to preserve), while the task-4 floor assertions still fail — these are distinct assertions in the same file and must be reported separately
  - Record PC6 as file-set enforcement (not an executable test), PC7 as **partially narrowed / installer UNKNOWN**, and PC8 as **UNKNOWN**
  - Mark complete when the preservation assertions are written, run, and passing on the unfixed state, and every baseline above is recorded or explicitly marked UNKNOWN
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_
  - _Evidence: E3.5, E5.1, E5.2, E7.1, E7.2, E6.11, E6.12_
  - _Checks: PC1, PC2, PC3, PC4, PC5, PC6, PC8_

- [ ] 6. Fix for advisory-covered dev-only `tar`/`tmp` resolution — *CONDITIONAL on task 1 resolving BU1 with explicit owner authorization, and on the implementation branch from task 2 being active*

  - [ ] 6.1 Apply exactly the owner-authorized mechanism
    - Apply **only** the mechanism the owner selected in task 1 — the minimum mechanism that achieves FC1–FC3 — and nothing broader
    - If the authorized mechanism is M1: add an `overrides` block to the root `package.json` scoped to the specific requirer paths only (`@electron/rebuild > tar`, `@electron/node-gyp > tar`, `cacache > tar`, `external-editor > tmp`) — no graph-wide override
    - If the authorized mechanism is M5 (risk acceptance) or M4 (wait): make **no** manifest/lockfile change; record the dated acceptance/deferral in this spec directory and skip tasks 6.2–9
    - Regenerate `package-lock.json` **only as a consequence** of the authorized manifest change; never hand-edit lockfile bytes
    - Keep the changed-file set within the File-Set Contract: `package.json`, `package-lock.json`, `test/dependency-advisory-contract.test.mjs`, `.kiro/specs/dependabot-tar-tmp-dev-dependency-fix/**` — nothing else
    - Record per FC4: the mechanism used, the exact resolved `tar`/`tmp` versions, and **every deliberately crossed requirer range** (`tar ^6.2.1`, `^6.0.5`, `^6.1.11` → 7.5.x; `tmp ^0.0.33` → 0.2.x), each labeled as a major-contract crossing with UNKNOWN compatibility
    - Apply rollback (R1–R8) all-or-nothing on any trigger: never leave a partial override or an unvalidated regenerated lockfile in the tree, staged, or committed
    - _Bug_Condition: isBugCondition(X) = EXISTS node IN resolvedGraph(X) WHERE node.name IN {tar, tmp} AND versionInAnyAdvisoryRange(node.name, node.version) — TRUE at BASE_SHA via tar 6.2.1 and tmp 0.0.33_
    - _Expected_Behavior: no resolved tar/tmp node inside any applicable advisory range (tar >= 7.5.21 or absent; tmp >= 0.2.6 or absent) AND no vulnerabilities.tar / vulnerabilities.tmp under `npm audit --include=dev`_
    - _Preservation: Preservation Requirements 3.1–3.8 from design (PC1–PC8)_
    - _Requirements: 2.1, 2.2, 2.3, 2.5_
    - _Evidence: E3.2, E3.3, E3.4, E4.1, E4.2, E4.3, E4.4, E4.5, E6.1, E6.3, E6.4, E6.11, E6.12_
    - _Checks: FC1, FC4, R1-R8_

  - [ ] 6.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - No Advisory-Covered `tar`/`tmp` in the Resolved Graph
    - **IMPORTANT**: Re-run the SAME test from task 4 — do NOT write a new test and do NOT alter its floors or fail-closed rules
    - Run `node --test test/dependency-advisory-contract.test.mjs`
    - **EXPECTED OUTCOME**: Test **PASSES** (confirms the bug is fixed at the lockfile-floor level, FC1)
    - Run `npm audit --include=dev --json` and assert no `vulnerabilities.tar` and no `vulnerabilities.tmp` entry (FC2); record remaining unrelated entries without claiming anything about them
    - Run `npm ci` then `git status --porcelain` and assert no drift (FC3)
    - Record FC5 as **permanently UNKNOWN locally** — Dependabot closure is owner-confirmed after merge only
    - _Requirements: 2.1, 2.2, 2.3, 2.5_
    - _Evidence: E5.3, E5.4, E6.1, E6.3, E1.6_
    - _Checks: FC1, FC2, FC3, FC5, Property 1_

  - [ ] 6.3 Verify preservation tests still pass and run the COMPLETE gate sequence
    - **Property 2: Preservation** - Non-Buggy Dependency State and All Product Behavior
    - **IMPORTANT**: Re-run the SAME tests from tasks 3 and 5 — do NOT write new tests and do NOT relax any assertion
    - Run the **complete** `npm test` suite: all five existing `.test.mjs` files **plus** `test/dependency-advisory-contract.test.mjs` must now pass together (PC3). A red suite is no longer acceptable at this point
    - Run the full E2.4 gate sequence on the fixed state and compare each result to the task-3 baseline: `npm ci`, `npm test`, `npm run build`, `npm run smoke`, `desktop/main.mjs --smoke-test` (all seven checks), `python -m unittest discover -s test/audit -p 'test_*.py'`, `python -m unittest discover -s test/ci -p 'test_*.py'`, `python tools/check_claims.py .`, `python tools/export_audit.py .`, `npm audit --omit=dev` (must still be 0 / exit 0, PC2), `git diff --check`
    - Assert the production closure is still exactly 9 entries with identical versions (PC1)
    - Assert `test/desktop-contract.test.mjs` remains fully satisfied (3.4, N7)
    - Assert no public claim, documentation, or claim-vocabulary byte changed (PC6, 3.6, 3.8)
    - Record PC8 (build-toolchain functional preservation under crossed majors) as **UNKNOWN** unless the authorized packaging runs in task 9 produce evidence; binary hash equality is explicitly NOT claimed (3.5)
    - **EXPECTED OUTCOME**: all gates pass at or above the recorded baseline, with no regressions; any regression triggers rollback R1–R8 and a hard stop
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_
    - _Evidence: E2.4, E3.5, E5.1, E7.1_
    - _Checks: PC1, PC2, PC3, PC4, PC5, PC6, PC8, R1-R8_

- [ ] 7. Changed-file review, staging, and whitespace verification — *CONDITIONAL on task 6 completing green*

  - [ ] 7.1 Review the changed-file set against the File-Set Contract
    - Run `git status --porcelain` and `git diff` and enumerate every changed path
    - Assert the set is a subset of: `package.json`, `package-lock.json`, `test/dependency-advisory-contract.test.mjs`, `.kiro/specs/dependabot-tar-tmp-dev-dependency-fix/**`
    - Assert explicitly that **no** product source (`demo-gateway/**`, `demo-ui/**`, `desktop/**`, `tools/**`), `forge.config.mjs`, `.github/**`, public docs/claim text (`README.md`, `docs/**`, `NOTICE*`, `SECURITY.md`, `CONTRIBUTING.md`, `AGENTS.md`), `.kiro/steering/**`, workspace manifest, or `examples/**` file appears
    - Assert the `package.json` diff contains only the fields the authorized mechanism requires; any extra field is a violation → hard stop S4 / rollback R6
    - _Requirements: 3.6, 3.7, 3.8_
    - _Evidence: E3.4_
    - _Checks: PC6, R6, S4_

  - [ ] 7.2 Stage exactly the permitted files
    - `git add` **only** the enumerated permitted paths by name — never `git add -A` and never `git add .`
    - Re-run `git status --porcelain` and confirm nothing unintended is staged and nothing permitted is left unstaged
    - _Requirements: 3.6, 3.7_
    - _Checks: PC6_

  - [ ] 7.3 Verify whitespace and line endings on staged content
    - Run `git diff --cached --check` and require empty output (no trailing whitespace, no space-before-tab, no missing final newline)
    - Do **not** modify `.github/scripts/check_changed_whitespace.sh` or any workflow to satisfy this check
    - _Requirements: 3.7_
    - _Evidence: E2.4_
    - _Checks: PC6_

- [ ] 8. Commit and base-to-head validation — *CONDITIONAL on task 7*

  - [ ] 8.1 Create a single one-concern commit
    - Create exactly **one** commit covering only this concern (E2.3 — one concern per branch/PR, no opportunistic fixes)
    - Write an evidence-bearing message: the authorized mechanism (M-id), the resolved `tar`/`tmp` versions against floors `7.5.21` / `0.2.6`, every crossed requirer range, the immutable base SHA `BASE_SHA_IMPL`, the gate results from task 6.3, and the residual UNKNOWNs (PC7 installer surface, PC8 toolchain compatibility, FC5 alert closure)
    - Do not amend, squash, rebase, or rewrite history; do not skip hooks
    - _Requirements: 2.5_
    - _Evidence: E2.3, E2.5_
    - _Checks: FC4_

  - [ ] 8.2 Validate base-to-head diff against the immutable base SHA
    - Run `git diff <BASE_SHA_IMPL>...HEAD --stat` and review the full `git diff <BASE_SHA_IMPL>...HEAD`. **Never** compare against the mutable local `main` ref
    - Run `git diff --check <BASE_SHA_IMPL>...HEAD`
    - Assert the changed-path set equals the permitted set from task 7.1 and that no additional commit or file slipped in
    - Assert the lockfile diff is consistent with the manifest change only (no unrelated resolution churn beyond what the authorized mechanism forces; record any forced collateral resolution explicitly)
    - Any discrepancy → stop and roll back; do not proceed
    - _Requirements: 3.6, 3.7_
    - _Checks: PC6, R6_

  - [ ] 8.3 Push the implementation branch and open a DRAFT pull request
    - Push the implementation branch (never `main`, never force)
    - Open a **draft** pull request against `main` carrying the steering-01 handoff: concern statement, authorized mechanism and owner authorization reference, `BASE_SHA_IMPL` and head SHA, exact changed-file set, evidence IDs with truth classes, FC1–FC5 status, PC1–PC8 status, crossed requirer ranges, rollback triggers, explicit non-actions, and the residual UNKNOWNs
    - State in the body that FC5 (Dependabot alert closure) is owner-confirmed after merge and is never locally claimable, that PC7's installer surface is verified in task 9 **before** merge, and that the dev-advisory CI gap stays open by decision (BU5)
    - **Do NOT** enable auto-merge, merge, tag, release, deploy, sign, or publish. Merge remains an owner-only gate (S8)
    - _Requirements: 2.5, 3.8_
    - _Evidence: E2.1, E2.5_
    - _Checks: FC4, S8_

- [ ] 9. **Windows candidate verification — BEFORE merge** — *status: OWNER-GATED; runs on the pushed candidate/draft pull request, not after merge*
  - Only with explicit owner authorization. Purpose: the candidate mechanisms cross major contracts **inside the packaging toolchain** (E6.11, E6.12), so packaging compatibility must be evidenced before the owner considers merge
  - Distinguish the three packaging paths and use them deliberately:
    - `npm run desktop:package` (= `npm run build && electron-forge package`) — packaged application directory and its ASAR **only**; gives ASAR-surface evidence, **no** installer, no ZIP, no `.nupkg`
    - `npm run desktop:make` (= `npm run build && electron-forge make`) — distributable surfaces (Squirrel installer, ZIP) **for the host platform**; required for installer-surface evidence
    - the existing manual workflow `.github/workflows/windows-build.yml` ("Windows Desktop Build (manual)") — owner-dispatched Windows path; its `ref` input **must be set explicitly to the candidate branch**, because it defaults to the unrelated feature branch `desktop-electron-finish` (N8). The workflow file itself is **not modified**
  - Never use an unbound `npx` packaging command locally
  - Inspect the produced surfaces for `tar`/`tmp` presence: ZIP → `resources/app.asar`, Squirrel `.exe`, and `.nupkg`
  - Compare against the owner-supplied partial baseline (HISTORICAL / owner-reported, unrevalidated): ASAR reported clean (48 ASAR paths, no `tar`/`tmp`); installer contents **UNKNOWN**
  - Record artifact absence as a **post-fix acceptance criterion only** — never pre-fix proof and never a substitute for FC1/FC2. Same artifact kinds and manifest structure asserted; **binary hash equality explicitly NOT claimed** (3.5)
  - If this authorized run does not happen, **PC7's installer surface stays UNKNOWN and BU4 stays open** — record it that way rather than resolving it by assumption, and state it in the pull request
  - Any packaging failure or regression under the applied mechanism triggers rollback R4 and gives PC8 evidence
  - Manual Windows installation and human UI acceptance remain **UNKNOWN** unless the owner performs and records them
  - _Requirements: 3.5_
  - _Evidence: E7.1, E7.2, E7.5, E7.6, addendum A5, A6_
  - _Checks: PC7, PC8, BU4, R4_

- [ ] 10. Checkpoint — ensure all tests pass before the owner merge decision
  - Confirm the complete `npm test` suite (five existing files plus `test/dependency-advisory-contract.test.mjs`) passes, the full E2.4 gate sequence matches or exceeds the task-3 baseline, FC1–FC4 are satisfied, PC1–PC6 are preserved, and PC7/PC8/FC5 are recorded as UNKNOWN or owner-gated rather than assumed
  - Confirm no prohibited action was performed and no file outside the permitted set changed
  - Re-revalidate remote `main` and every unresolved review thread immediately before the owner's merge decision; pull-request CI is not final-main CI
  - Merge itself remains an owner-only gate (S8); auto-merge is never enabled
  - Ensure all tests pass, ask the user if questions arise
  - _Requirements: 2.1, 2.2, 2.3, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_
  - _Checks: FC1-FC5, PC1-PC8, S3, S8_

- [ ] 11. Dependabot alert closure confirmation (FC5) — *status: OWNER-GATED / POST-MERGE (the only legitimately post-merge check)*
  - After the owner merges, the owner confirms the `tar` and `tmp` alerts are closed and that no new alert was introduced by the mechanism
  - Record the confirmation as owner-reported; **never** claim closure from local evidence (E1.6, BU2)
  - Recheck the merged `main` SHA and its completed main-push checks before any final-main statement
  - If alerts remain open, reopen BU1 for mechanism reconsideration — do not escalate scope unilaterally
  - _Requirements: 2.3_
  - _Evidence: E1.6_
  - _Checks: FC5, BU2_

---

## Task Dependency Ordering

```
1  (BU1 owner gate, BLOCKING)  ──┬── 1.1 (BU2: RESOLVED 2026-07-26)
                                 ├── 1.2 (BU3: RESOLVED 2026-07-26)
                                 └── 1.3 (BU5: RESOLVED 2026-07-26)
        │  BU1 must resolve before anything below
        ▼
2  (re-revalidate remote; record BASE_SHA_IMPL; create implementation branch)
        │  no implementation write before this completes
        ▼
3  (complete existing baseline at BASE_SHA_IMPL; needs npm-ci-authorized env)
        ▼
4  (add snapshot contract test; run ALONE; MUST FAIL)  ──►  5  (preservation assertions; MUST PASS on unfixed)
        │                                                      │
        └──────────────────┬───────────────────────────────────┘
                           ▼
6.1 (apply authorized mechanism)  ──►  6.2 (Property 1 now passes: FC1, FC2, FC3)
                                  ──►  6.3 (Property 2 preserved + COMPLETE npm test + full E2.4 gates)
                           ▼
7.1 (changed-file review)  ──►  7.2 (stage permitted files)  ──►  7.3 (git diff --cached --check)
                           ▼
8.1 (single one-concern commit)  ──►  8.2 (git diff BASE_SHA_IMPL...HEAD)  ──►  8.3 (push + DRAFT PR, no auto-merge)
                           ▼
9  (Windows candidate verification on the candidate — BEFORE merge; PC7/PC8/BU4)
                           ▼
10 (checkpoint; re-revalidate main; owner merge decision — owner-only)
                           ╎
                           ╎ after an owner-authorized merge
                           ▼
11 (Dependabot closure → FC5, post-merge, owner-reported)
```

**Blocking relationships:**

- 1 blocks everything. 1.1, 1.2 and 1.3 are recorded owner resolutions, not open gates; S7 still applies if the observed alert set differs from the `tar`/`tmp` family.
- 2 blocks every implementation write. No file outside this spec directory may be created or modified before the implementation branch exists.
- 3 blocks 4, 5, and all preservation comparison in 6.3 (no baseline → PC1–PC5 stay UNKNOWN).
- 4 must FAIL before 6.1; 5 must PASS before 6.1.
- Between 4 and 6.1, only the single-file run is required; a red full suite is expected and must not be "fixed".
- 6.1 blocks 6.2 and 6.3; 6.3 must be green before 7.
- 7.3 blocks 8.1; 8.2 blocks 8.3. Every base-to-head comparison uses `BASE_SHA_IMPL`.
- 9 runs on the pushed candidate **before** merge; if it is not authorized, PC7's installer surface and BU4 stay explicitly UNKNOWN.
- 10 precedes the owner merge decision. Merge, auto-merge, tag, release, deploy, signing and publication are owner-only gates (S8) and are not agent tasks.
- 11 is the only post-merge item; its absence leaves FC5 explicitly UNKNOWN.
