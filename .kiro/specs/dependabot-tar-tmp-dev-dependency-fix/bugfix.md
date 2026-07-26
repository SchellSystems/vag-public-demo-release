# Bugfix Requirements Document

> **Canonicalization note (2026-07-26).** This file is the canonical Phase-1 requirements document for this spec. The evidence body below (sections "Evidence Log" through "Blocking UNKNOWNs") is **preserved as originally accepted** for its 2026-07-25 observation window and is deliberately **not rewritten**. Later owner clarifications and revalidations are recorded separately and additively in the clearly labelled [Owner Clarification Addendum (2026-07-26)](#owner-clarification-addendum-2026-07-26) at the end of this document. Where the addendum and the historical body differ, the addendum states the later state and the historical record stays intact.

## Introduction

The repository's committed dependency state resolves two transitive **development-only** packages to versions that are covered by published security advisories: `tar@6.2.1` and `tmp@0.0.33`. Both enter the graph exclusively through the Electron Forge desktop-packaging devDependencies. The repository's only dependency gate in CI is `npm audit --omit=dev`, which reports zero findings, so the defect is invisible to every automated gate that currently runs — it is only surfaced by Dependabot and by `npm audit --include=dev`.

Impact is bounded to the build/packaging toolchain (a maintainer or CI runner extracting a hostile archive or using a hostile temp path during `npm ci` / packaging). No evidence was found that either package is part of the demo runtime dependency closure. This bugfix therefore targets the **dependency state defect**, not the demo product behavior.

This document is Phase 1 (requirements) only. No repository file outside this spec directory was modified, no branch, commit, push, or pull request was created, and no command that mutates the working tree or lockfile was executed.

---

## Evidence Log

Truth classes follow `.kiro/steering/02-testing-and-evidence.md`: **OBSERVED** (nachgewiesen, read directly), **TESTED** (executed check), **DERIVED** (abgeleitet, reasoned from cited evidence), **HISTORICAL** (berichtet, dated snapshot only), **UNKNOWN** (unbekannt).

Environment for all executed checks: local sandbox clone of this repository, Node v22.23.1, npm 11.4.2, Python 3.9.25, network mode `COMMON_DEPENDENCIES` (npm registry reachable, GitHub remote NOT authenticated), observation time 2026-07-25T21:22Z–21:27Z UTC.

### E1. Repository state

| ID | Finding | Class | Source |
|----|---------|-------|--------|
| E1.1 | Local checked-out branch is `main`; `HEAD` = `ed3b8d9444d49f5ff2e28cd1c4c52092782e701c`; tip subject "Merge PR #26: fix Windows hash verification and ESM path", dated Fri Jul 24 17:46:26 2026 +0200 | OBSERVED | `git rev-parse --abbrev-ref HEAD`, `git rev-parse HEAD`, `git log -1` |
| E1.2 | Working tree clean; `git status -sb` reports `## main...origin/main` with no modified, staged, or untracked files | OBSERVED | `git status --porcelain`, `git status -sb` |
| E1.3 | Clone is **shallow** (`git rev-parse --is-shallow-repository` = `true`, single commit of history available) | OBSERVED | `git rev-parse --is-shallow-repository`, `git log --oneline -5` |
| E1.4 | Remote default branch and remote branch list could not be revalidated: `git ls-remote --heads origin` and `git ls-remote --symref origin HEAD` both fail with `Missing header field, please provide AuthToken` / HTTP 400 through the connection gateway | UNKNOWN | executed command output |
| E1.5 | Pull-request listing for this session returned no pull requests; open-issue listing returned an empty set (`{"issues":[]}`). Whether unrelated third-party PRs / review threads are open on the remote is not established by these two calls alone | UNKNOWN (open PRs / review threads), OBSERVED (both calls returned empty) | provider PR/issue listing tools |
| E1.6 | Dependabot alert list, alert IDs, severities, and alert state are **not accessible** in this sandbox (no security-alerts API available; unauthenticated git remote) | UNKNOWN | tool inventory + E1.4 |
| E1.7 | CI/workflow run history and run conclusions for `main` could not be retrieved (no workflow-run listing available without a known run ID) | UNKNOWN | tool inventory |

### E2. Governing repository instructions (read in full)

| ID | Finding | Class |
|----|---------|-------|
| E2.1 | `AGENTS.md` read in full: revalidate live state; task branch from revalidated `main`, never write to `main`; keep diffs small and one-concern; **do not change dependencies, lockfiles, workflows, release metadata, product behavior, or public claims unless explicitly in scope**; owner-only gates for merge/release/tag/deploy/visibility | OBSERVED |
| E2.2 | `.kiro/steering/00-authority-and-source-order.md` read in full: source order (live state → executable behavior → normative public docs → examples → historical → external); unchecked/inaccessible facts are `UNKNOWN`; absence of evidence is never a pass | OBSERVED |
| E2.3 | `.kiro/steering/01-change-and-branch-protocol.md` read in full: read-only start, exact expected file set, prohibited side effects, one concern per branch/PR, no opportunistic fixes, owner-only gates, draft-PR handoff contents | OBSERVED |
| E2.4 | `.kiro/steering/02-testing-and-evidence.md` read in full: truth classes; required local gate sequence (`test/audit`, `test/ci`, `check_claims.py`, `export_audit.py`, `npm ci`, `npm audit --omit=dev`, `npm test`, `npm run build`, `npm run smoke`, `git diff --check`); a green result belongs only to the tested SHA | OBSERVED |
| E2.5 | `.kiro/steering/03-claims-export-and-public-demo.md` read in full: bounded local Public Demo identity only; authority separation (proposal / decision / artifact / digest / Commit / Verify / evidence / owner approval must not collapse); claim vocabulary bounded by `docs/claims-and-nonclaims.md` | OBSERVED |
| E2.6 | Exactly four steering files exist: `00-authority-and-source-order.md`, `01-change-and-branch-protocol.md`, `02-testing-and-evidence.md`, `03-claims-export-and-public-demo.md` | OBSERVED |

### E3. Affected versions present in the lockfile

| ID | Finding | Class |
|----|---------|-------|
| E3.1 | `package-lock.json` is `lockfileVersion: 3`, name `vag-public-demo-release`, 284841 bytes | OBSERVED |
| E3.2 | Exactly one `tar` entry exists: `node_modules/tar` → version `6.2.1`, `"dev": true`, resolved from `registry.npmjs.org`, carrying npm's `deprecated` notice for old `tar` versions (lockfile lines 7441–7453) | OBSERVED |
| E3.3 | Exactly one `tmp` entry exists: `node_modules/tmp` → version `0.0.33`, `"dev": true`, resolved from `registry.npmjs.org` (lockfile lines 7564–7576) | OBSERVED |
| E3.4 | No `overrides` block exists in root `package.json` or in the lockfile root package entry | OBSERVED |
| E3.5 | Non-dev (production) closure in the lockfile is 9 entries only: the two workspaces (`demo-gateway`, `demo-ui`) plus `react`, `react-dom`, `scheduler`, `loose-envify`, `js-tokens` and the two workspace links. Neither `tar` nor `tmp` appears | OBSERVED |
| E3.6 | Root `package.json` declares **no** `dependencies`; devDependencies are `@electron-forge/cli ^7.11.2`, `@electron-forge/maker-squirrel ^7.11.2`, `@electron-forge/maker-zip ^7.11.2`, `@electron-forge/plugin-auto-unpack-natives ^7.11.2`, `electron ^43.2.0`; workspaces are `demo-gateway`, `demo-ui`; `engines.node >= 20.19.0` | OBSERVED |
| E3.7 | `demo-gateway/package.json` declares no dependencies at all; `demo-ui/package.json` declares runtime `react`/`react-dom ^18.2.0` and dev `vite ^6.4.3`, `typescript ^5.3.0`, `@vitejs/plugin-react ^4.2.0`, `@types/*` | OBSERVED |

### E4. Ancestor dependency chains (derived from the lockfile graph)

| ID | Finding | Class |
|----|---------|-------|
| E4.1 | Direct requirers of `tar`: `@electron/node-gyp` (`^6.2.1`), `@electron/rebuild` (`^6.0.5`), `cacache` (`^6.1.11`). All three are dev-only | OBSERVED |
| E4.2 | Direct requirer of `tmp`: `external-editor` (`^0.0.33`), dev-only | OBSERVED |
| E4.3 | Representative `tar` chains (all terminate at root devDependencies): `tar ← @electron/rebuild@3.7.2 ← @electron-forge/core|core-utils|shared-types@7.11.2 ← @electron-forge/cli@7.11.2 ← root(dev)`; `tar ← @electron/node-gyp@10.2.0-electron.1 ← @electron/rebuild@3.7.2 ← … ← root(dev)`; `tar ← cacache@16.1.3 ← make-fetch-happen@10.2.1 ← @electron/node-gyp ← @electron/rebuild ← … ← root(dev)`. Chains also reach the three directly declared makers/plugin (`maker-squirrel`, `maker-zip`, `plugin-auto-unpack-natives`) via `@electron-forge/shared-types` | DERIVED (graph walk over OBSERVED lockfile entries) |
| E4.4 | `tmp` chains: `tmp ← external-editor@3.1.0 ← @inquirer/editor@3.0.1 ← @inquirer/prompts@6.0.1 ← @electron-forge/cli@7.11.2 ← root(dev)`, plus the same path reached through `@listr2/prompt-adapter-inquirer` (peer) | DERIVED (graph walk over OBSERVED lockfile entries) |
| E4.5 | `@electron/node-gyp` is pinned in the lockfile to a **git** source (`git+ssh://git@github.com/electron/node-gyp.git#06b29aaf…`, version `10.2.0-electron.1`), i.e. one ancestor of `tar` is not a registry tarball | OBSERVED |
| E4.6 | Both packages enter the graph **only** through the Electron-Forge desktop-packaging devDependency set; no chain reaches them from `demo-gateway`, `demo-ui`, or any production dependency | DERIVED (from E3.5, E4.1–E4.4) |

### E5. Executed audit results

| ID | Finding | Class |
|----|---------|-------|
| E5.1 | `npm audit --omit=dev` → `found 0 vulnerabilities`, exit code 0. The CI gate in `.github/workflows/audit.yml` and `.github/workflows/windows-build.yml` therefore passes at this SHA | TESTED (SHA ed3b8d9) |
| E5.2 | `npm audit --include=dev --json` → exit code 1; 36 advisory entries; severity metadata `low 3, high 32, critical 1`; dependency metadata `prod 10, dev 593, optional 85, total 602` | TESTED (SHA ed3b8d9) |
| E5.3 | `tar` entry: severity `critical` overall, `isDirect: false`, aggregate vulnerable range `<=7.5.20`, node `node_modules/tar`, effects `@electron/node-gyp`, `@electron/rebuild`, `cacache`, **`fixAvailable: false`**. Advisories listed include GHSA-23hp-3jrh-7fpw (critical, decompression/parse DoS, `<=7.5.18`), GHSA-34x7-hfp2-rc4v (`<7.5.7`), GHSA-8qq5-rm4j-mr97 (`<=7.5.2`), GHSA-83g3-92jg-28cx (`<7.5.8`), GHSA-qffp-2rhf-9h96 (`<=7.5.9`), GHSA-9ppj-qmqm-q256 (`<=7.5.10`), GHSA-r6q2-hw4h-h46w (`<=7.5.3`), GHSA-vmf3-w455-68vh (`<=7.5.15`), GHSA-w8wr-v893-vjvp (`<=7.5.17`), GHSA-8x88-c5mf-7j5w (`<=7.5.17`), GHSA-gvwx-54wh-qm9j (`<=7.5.16`), GHSA-r292-9mhp-454m (`<=7.5.20`) | TESTED |
| E5.4 | `tmp` entry: severity `high` overall, `isDirect: false`, aggregate vulnerable range `<=0.2.5`, effects `external-editor`, **`fixAvailable: false`**. Advisories: GHSA-ph9p-34f9-6g65 (high, path traversal via unsanitized prefix/postfix, `<0.2.6`) and GHSA-52f5-9888-hmc6 (low, symlink `dir` parameter, `<=0.2.3`) | TESTED |
| E5.5 | Direct devDependencies flagged by the dev audit: `@electron-forge/cli` (high, `fixAvailable` = downgrade to 7.6.1, `isSemVerMajor: true`), `@electron-forge/maker-squirrel` (high, `fixAvailable: false`), `@electron-forge/maker-zip` (high, `fixAvailable: false`), `@electron-forge/plugin-auto-unpack-natives` (high, `fixAvailable: false`) | TESTED |
| E5.6 | `npm explain tar` and `npm explain tmp` both fail with `No dependencies found matching …` (exit 1) because `node_modules/` is empty in this sandbox and installing was prohibited. Chain evidence therefore comes from the lockfile walk (E4), not from an installed tree | TESTED (failure recorded) / UNKNOWN (installed-tree confirmation) |

### E6. Patched versions and upgrade feasibility

| ID | Finding | Class |
|----|---------|-------|
| E6.1 | `tar` registry state: `dist-tags.latest = 7.5.22`; published versions include 7.5.21 and 7.5.22, i.e. above the aggregate vulnerable range `<=7.5.20` | TESTED (`npm view tar dist-tags/versions`) |
| E6.2 | The `tar` 6.x line ends at **6.2.1**. There is no patched 6.x release, so no in-range (`^6.x`) resolution can clear the advisories | TESTED (`npm view tar versions`, filtered) |
| E6.3 | `tmp` registry state: `dist-tags.latest = 0.2.7`; 0.2.6 and 0.2.7 are above the vulnerable range `<=0.2.5`. The `0.0.x` line ends at **0.0.33**, so no patched `0.0.x` release exists | TESTED (`npm view tmp dist-tags/versions`) |
| E6.4 | **Lockfile-only resolution is not possible** for either package: every requirer range (`tar ^6.2.1 / ^6.0.5 / ^6.1.11`, `tmp ^0.0.33`) excludes all non-vulnerable published versions | DERIVED (from E4.1, E4.2, E6.2, E6.3) |
| E6.5 | `@electron-forge/cli` `dist-tags.latest` is **7.11.2** — already the installed version; only `8.0.0-alpha.10` is newer and is a prerelease. There is no newer stable parent to upgrade to | TESTED (`npm view @electron-forge/cli dist-tags`) |
| E6.6 | `@electron-forge/cli@7.11.2` pins `@electron-forge/core|core-utils|shared-types` to exactly `7.11.2` and `@inquirer/prompts` to `^6.0.1`, so intermediate ancestors cannot be lifted without breaking declared ranges | TESTED (`npm view @electron-forge/cli@latest dependencies`) |
| E6.7 | `@electron/rebuild` `latest` is **4.2.0** and no longer depends on `tar` (uses `node-gyp ^12.2.0`); the installed 3.7.2 does. The upstream fix exists but is only reachable through a major bump of an ancestor pinned by Forge 7.11.2 | TESTED (`npm view @electron/rebuild dist-tags/dependencies`) |
| E6.8 | `cacache` `latest` is 21.0.1 and has no `tar` dependency; installed is `cacache@16.1.3` reached via `make-fetch-happen@10.2.1` under the git-pinned `@electron/node-gyp` | TESTED (`npm view cacache@latest`) |
| E6.9 | `external-editor` `latest` is **3.1.0** — the installed version — and still declares `tmp ^0.0.33`. There is no upstream `external-editor` release that drops the vulnerable range | TESTED (`npm view external-editor version/dependencies`) |
| E6.10 | `@inquirer/editor@latest` replaced `external-editor` with `@inquirer/external-editor`, and `@inquirer/prompts` `latest` is 8.5.2. Clearing `tmp` through the parent path requires crossing `@inquirer/prompts` 6 → 8 inside a Forge-pinned range | TESTED (`npm view @inquirer/editor@latest dependencies`, `npm view @inquirer/prompts version`) |
| E6.11 | An npm `overrides` remediation would cross **major-version contracts** in both cases: `tar` `^6` → `7.5.x` (major, `engines.node >= 18`, restructured API) against three requirers, and `tmp` `^0.0.33` → `0.2.x` (breaking under 0.x semver rules, `engines.node >= 14.14`) against `external-editor` | DERIVED (from E4.1–E4.2, E6.1–E6.3, TESTED engines output) |
| E6.12 | Whether Electron Forge 7.11.2, `@electron/rebuild@3.7.2`, `cacache@16`, and `external-editor@3.1.0` actually function correctly under those overridden majors is **not established**; verifying it requires an install plus a packaging run, which Phase 1 prohibits | UNKNOWN |

### E7. Build-time vs. packaged-runtime exposure

| ID | Finding | Class |
|----|---------|-------|
| E7.1 | Both packages are marked `"dev": true` in the lockfile and are absent from the 9-entry production closure, so exposure is **build/packaging-time** for maintainers and CI runners | DERIVED (from E3.2, E3.3, E3.5) |
| E7.2 | `forge.config.mjs` `packagerConfig.ignore` includes `/^\/node_modules\/(?!(?:electron|@electron))/`, which matches `/node_modules/tar` and `/node_modules/tmp` and therefore excludes them from the package. The same negative lookahead does **not** exclude `/node_modules/@electron/...` paths | OBSERVED |
| E7.3 | `forge.config.mjs` sets `asar: true`, no publisher, no auto-update, no telemetry, `UNSIGNED_TEST_DISTRIBUTABLE`; no explicit `prune` setting is present, so packager's default dev-dependency pruning applies | OBSERVED (config), DERIVED (default pruning behavior) |
| E7.4 | Root `package.json` declares no runtime `dependencies`, so a pruned package's dependency set is limited to the workspace runtime closure (`react`, `react-dom`, `scheduler`, `loose-envify`, `js-tokens`) plus Electron itself | DERIVED (from E3.5, E3.6) |
| E7.5 | Whether the generated ASAR, Squirrel installer, or ZIP contains `tar`/`tmp` was **not directly verified**: packaging requires `npm install`/`npm ci` and a Forge run (prohibited in Phase 1), and the Windows build workflow is manual-dispatch and owner-gated | UNKNOWN |
| E7.6 | The prior report that the Windows runtime artifact contains neither `tar` nor `tmp` remains a dated third-party statement, consistent with E7.1–E7.4 but not revalidated here | HISTORICAL |

### E8. Revalidation of the four prior observations

| Prior observation | Result | Basis |
|-------------------|--------|-------|
| main SHA `ed3b8d9444d49f5ff2e28cd1c4c52092782e701c` | **CONFIRMED** for the local checkout; remote-side confirmation of `main`/default branch is UNKNOWN (E1.4) | E1.1, E1.4 |
| lockfile entries `tar 6.2.1` (dev), `tmp 0.0.33` (dev) | **CONFIRMED**, exactly one entry each, both `"dev": true` | E3.2, E3.3 |
| alerts appeared after the Electron desktop packaging integration | **UNVERIFIABLE** — shallow clone (one commit of history) and no Dependabot/alert access. Consistent-but-not-proven: both packages enter only through the Forge devDependency set | E1.3, E1.6, E4.6 |
| generated Windows runtime artifact contains neither `tar` nor `tmp` | **UNVERIFIABLE** in this environment; treated as HISTORICAL. Supporting derived evidence: dev-only classification, packaging ignore rule, no root runtime dependencies | E7.1–E7.6 |

### E9. Structural review — non-scope observations (findings only, not work items)

| ID | Observation | Class |
|----|-------------|-------|
| N1 | Both CI workflows gate only `npm audit --omit=dev`; no gate observes development/build-chain advisories, so this defect class cannot fail CI (E5.1 vs. E5.2) | OBSERVED |
| N2 | All packaging tooling sits in the **root** workspace's devDependencies while the two product workspaces (`demo-gateway`, `demo-ui`) carry their own; build tooling is not isolated from the product root | OBSERVED |
| N3 | One ancestor of `tar` (`@electron/node-gyp@10.2.0-electron.1`) resolves from a git commit rather than a registry tarball, which weakens registry-based reproducibility and advisory tracking for that subtree | OBSERVED |
| N4 | No `.github/dependabot.yml` exists in the repository; Dependabot configuration and alert routing are therefore not visible in-repo | OBSERVED |
| N5 | Artifact verification (`tools/windows_artifact_manifest.mjs`) records hashes, versions, and provenance but performs **no content inspection** of the ASAR/installer/ZIP, so "no vulnerable dev package inside the artifact" is not machine-checked anywhere | OBSERVED |
| N6 | `packagerConfig.ignore`'s negative lookahead keeps every `/node_modules/@electron*` path, relying on packager's implicit dev pruning rather than an explicit allowlist | OBSERVED |
| N7 | `test/desktop-contract.test.mjs` asserts packaging and security configuration statically (asar, makers, no publisher/telemetry, loopback, sandbox flags) but asserts nothing about the dependency graph or advisory state | OBSERVED |
| N8 | The Windows build workflow's `ref` input defaults to a feature branch (`desktop-electron-finish`) rather than `main`, and packaged-runtime smoke is `continue-on-error` with `UNKNOWN` as a tolerated outcome | OBSERVED |

These observations are recorded for owner awareness only. None of them authorizes a change in this spec.

---

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the committed dependency state at `main` (`ed3b8d9`) is resolved THEN the system pins the development-only package `tar` to `6.2.1`, a version inside the aggregate advisory range `<=7.5.20` (including one `critical` advisory), and pins the development-only package `tmp` to `0.0.33`, a version inside the advisory range `<=0.2.5`.

1.2 WHEN `npm audit --include=dev` is executed against the committed lockfile THEN the system reports both `tar` (critical, `fixAvailable: false`) and `tmp` (high, `fixAvailable: false`) as vulnerable nodes, so the committed dependency state is not advisory-clean for the build toolchain.

1.3 WHEN the requirer ranges are inspected THEN the system offers no in-range remediation: every requirer constrains `tar` to `^6.x` and `tmp` to `^0.0.33`, while the `tar` 6.x line ends at 6.2.1 and the `tmp` 0.0.x line ends at 0.0.33 — a lockfile-only refresh cannot clear either advisory.

1.4 WHEN the repository's CI dependency gate runs THEN the system evaluates only `npm audit --omit=dev`, which reports `found 0 vulnerabilities`, so the vulnerable build-chain state passes every automated gate and is reported only by Dependabot outside CI.

1.5 WHEN a maintainer or CI runner performs `npm ci` and Electron Forge packaging THEN the vulnerable `tar`/`tmp` code is present in the build environment's dependency closure and is exercised by build-time archive extraction and temporary-path handling.

### Expected Behavior (Correct)

2.1 WHEN the fixed dependency state is resolved THEN the system SHALL resolve `tar` to a version outside every advisory range applicable at fix time (as evidenced then: `>= 7.5.21`, `latest` 7.5.22) and `tmp` to a version outside its advisory range (as evidenced then: `>= 0.2.6`, `latest` 0.2.7), or SHALL remove those packages from the resolved graph entirely.

2.2 WHEN `npm audit --include=dev` is executed against the fixed lockfile THEN the system SHALL report zero advisory entries whose vulnerable package is `tar` or `tmp`.

2.3 WHEN the remediation mechanism is applied THEN the system SHALL record, in the fix's evidence, the exact resolved versions, the mechanism used, and every requirer whose declared range is deliberately crossed, so that the major-boundary decision (E6.11) is explicit and reviewable rather than implicit.

2.4 WHEN the remediation cannot satisfy 2.1 and 2.2 without an owner decision that Phase 1 does not hold (see Blocking UNKNOWNs) THEN the system SHALL remain unchanged and the blocker SHALL be reported, rather than a partial or speculative dependency change being committed.

2.5 WHEN the required local gate sequence is executed against the fixed state THEN the system SHALL still pass every gate listed in `.kiro/steering/02-testing-and-evidence.md`, with results recorded against the fixed SHA.

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the demo gateway is exercised (propose allow, propose deny, commit, verify, deny-commit rejection, loopback binding, dynamic port) THEN the system SHALL CONTINUE TO produce the behavior asserted by `npm test`, `npm run smoke`, and `desktop/main.mjs --smoke-test` at the pre-fix SHA.

3.2 WHEN the production dependency closure is resolved THEN the system SHALL CONTINUE TO contain exactly the pre-fix production set (`demo-gateway`, `demo-ui`, `react`, `react-dom`, `scheduler`, `loose-envify`, `js-tokens` and the two workspace links) with no additions, removals, or version changes.

3.3 WHEN `npm audit --omit=dev` is executed THEN the system SHALL CONTINUE TO report `found 0 vulnerabilities` with exit code 0.

3.4 WHEN the desktop packaging configuration is inspected THEN the system SHALL CONTINUE TO satisfy `test/desktop-contract.test.mjs` in full: `asar: true`, both makers configured, no publisher, no auto-update, no telemetry, `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, packaged `devTools` disabled, loopback-only bind, dynamic port, single-instance lock, Squirrel event handling.

3.5 WHEN the Windows packaging path is executed under owner authorization THEN the system SHALL CONTINUE TO produce the same artifact **kinds** and manifest structure (Squirrel installer, ZIP, `SHA256SUMS.txt`, `BUILD_PROVENANCE.json`, `WINDOWS_BUILD_REPORT.md`) and SHALL CONTINUE TO exclude `tar` and `tmp` from the packaged runtime content. Binary hash equality is explicitly NOT claimed as preserved (packaging is not bit-reproducible across runs), and the packaged-content baseline is currently UNKNOWN (E7.5).

3.6 WHEN the claim and export audits run THEN the system SHALL CONTINUE TO pass `python tools/check_claims.py .` and `python tools/export_audit.py .`, and the public claim surface (`README.md`, `docs/claims-and-nonclaims.md`, `docs/architecture/authority-boundaries.md`, `docs/demo/*`, UI text) SHALL CONTINUE TO be byte-identical — no new, stronger, or security-related public claim is introduced by this fix.

3.7 WHEN the CI workflows are compared before and after THEN `.github/workflows/audit.yml`, `.github/workflows/windows-build.yml`, and `.github/scripts/check_changed_whitespace.sh` SHALL CONTINUE TO define the same gates in the same order, unless a gate change is explicitly authorized as in-scope by the owner.

3.8 WHEN the authority separation is inspected THEN proposal, gateway decision, UI-created local artifact, caller-supplied digest, Commit, Verify, evidence assembly, and owner approval SHALL CONTINUE TO be distinct, and the deny-path non-claim SHALL CONTINUE TO be scoped to the bounded UI flow.

---

## Bug Condition and Properties

**Definitions.** `X` is a repository dependency state: the pair (`package.json` set, `package-lock.json`) at a commit, together with the resolved graph and audit result derived from it. `F` is the dependency state at the pre-fix SHA `ed3b8d9`; `F'` is the dependency state after the fix.

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type RepositoryDependencyState
  OUTPUT: boolean

  // A resolved node exists whose package is tar or tmp
  // and whose version falls inside a published advisory range
  // applicable to that package at evaluation time.
  RETURN EXISTS node IN resolvedGraph(X) SUCH THAT
           node.name IN { "tar", "tmp" }
           AND versionInAnyAdvisoryRange(node.name, node.version)
END FUNCTION
```

Instantiated at the pre-fix SHA (TESTED, E3.2/E3.3/E5.3/E5.4):

```pascal
isBugCondition(F) = TRUE
  // node_modules/tar   = 6.2.1   IN (<= 7.5.20)   [critical: GHSA-23hp-3jrh-7fpw, and 11 further advisories]
  // node_modules/tmp   = 0.0.33  IN (<= 0.2.5)    [high: GHSA-ph9p-34f9-6g65; low: GHSA-52f5-9888-hmc6]
```

**Counterexample (concrete, reproducible):** at SHA `ed3b8d9`, `npm audit --include=dev --json` exits 1 and returns `vulnerabilities.tar.severity = "critical"`, `vulnerabilities.tar.range = "<=7.5.20"`, `vulnerabilities.tmp.severity = "high"`, `vulnerabilities.tmp.range = "<=0.2.5"`, both with `fixAvailable: false`, while `npm audit --omit=dev` exits 0 with `found 0 vulnerabilities`.

### Fix checking (testable)

```pascal
// Property: Fix Checking — no vulnerable tar/tmp node remains
FOR ALL X WHERE isBugCondition(X) DO
  X' ← applyFix(X)
  ASSERT NOT isBugCondition(X')
  ASSERT auditDevEntriesFor(X', "tar") = EMPTY
  ASSERT auditDevEntriesFor(X', "tmp") = EMPTY
  ASSERT resolvedVersion(X', "tar") NOT IN advisoryRanges("tar") OR absent(X', "tar")
  ASSERT resolvedVersion(X', "tmp") NOT IN advisoryRanges("tmp") OR absent(X', "tmp")
END FOR
```

Concrete, checkable fix criteria (each maps to a command whose output is recorded against the fixed SHA):

- **FC1** — lockfile inspection: every resolved `tar` node is outside all applicable advisory ranges (or absent); every resolved `tmp` node likewise.
- **FC2** — `npm audit --include=dev --json` contains no `vulnerabilities.tar` and no `vulnerabilities.tmp` entry.
- **FC3** — `npm ci` completes from the committed lockfile with no lockfile drift (`git status --porcelain` clean afterwards).
- **FC4** — the mechanism used, the resolved versions, and every deliberately crossed requirer range are recorded in the change's evidence (satisfies 2.3).
- **FC5** — Dependabot alert closure for these two packages is confirmed by the owner after merge; it is **not** claimable from local evidence (E1.6).

### Preservation checking (testable)

```pascal
// Property: Preservation Checking — everything outside the defect is identical
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT F(X) = F'(X)
END FOR
```

Concrete, checkable preservation criteria:

- **PC1** — production closure equality: the non-dev lockfile entry set and versions after the fix equal the pre-fix 9-entry set exactly (3.2).
- **PC2** — `npm audit --omit=dev` still exits 0 with `found 0 vulnerabilities` (3.3).
- **PC3** — `npm test` passes, including `test/desktop-contract.test.mjs`, `test/gateway-core.test.mjs`, `test/gateway-http.test.mjs`, `test/evidence.test.mjs`, `test/local-browser-contract.test.mjs` (3.1, 3.4).
- **PC4** — `npm run build` and `npm run smoke` pass; `desktop/main.mjs --smoke-test` still completes all seven checks (health, allow, commit, verify, deny, deny-commit rejection, loopback) (3.1).
- **PC5** — `python -m unittest discover -s test/audit`, `python -m unittest discover -s test/ci`, `python tools/check_claims.py .`, `python tools/export_audit.py .` all pass (3.6).
- **PC6** — changed-file set contains no product source, no public documentation, no claim text, no workflow file, and no UI file; the base-to-head diff is limited to the dependency manifest/lockfile and any new regression test (3.6, 3.7).
- **PC7** — a packaging/artifact-content check confirming `tar`/`tmp` absence in the ASAR/installer/ZIP is required for 3.5; because no pre-fix baseline exists (E7.5) this criterion is **UNKNOWN until an owner-authorized packaging run is performed** and must be reported as such rather than assumed.
- **PC8** — build-toolchain functional preservation: Electron Forge `package`/`make` still succeeds under any overridden major versions (E6.12). Local packaging on the development host can partially evidence this; Windows packaging is owner-gated.

---

## Scope Boundaries

### In scope

- Changing the repository's dependency resolution so that no resolved `tar`/`tmp` node is inside an applicable advisory range, using the minimum mechanism that achieves FC1–FC3.
- The manifest/lockfile changes strictly required by that mechanism.
- Regression protection directly tied to this defect (for example a test asserting that the resolved `tar`/`tmp` versions stay outside the advisory ranges), added only if it does not require workflow changes and does not weaken existing gates.
- Evidence recording per `.kiro/steering/02-testing-and-evidence.md`, including all residual `UNKNOWN`s.

### Out of scope (explicitly excluded)

- Unrelated cleanup, formatting, refactoring, or opportunistic fixes.
- Dependency modernization beyond the two affected packages — including Electron, Vite, React, TypeScript, or Electron Forge major upgrades not strictly required by FC1.
- Workflow redesign, including adding, reordering, or reweighting CI gates (notably any dev-dependency audit gate — see N1) unless the owner explicitly authorizes it as a separate concern.
- Product behavior changes: gateway logic, decision/allowlist semantics, evidence assembly, UI behavior or text.
- New or strengthened public claims, README/docs claim changes, security assurances, or status-word changes.
- Architecture expansion: workspace restructuring, build-tool isolation (N2), packaging allowlist redesign (N6), artifact-content verification tooling (N5), Dependabot configuration (N4), or build-reproducibility work (N3, N8).
- Any owner-gated action: branch/PR merge, release, tag, deploy, publish, signing, visibility or settings changes.

Structural weaknesses found during the review are recorded in **E9 (N1–N8)** as non-scope observations. They are deliberately not work items in this spec.

---

## Blocking UNKNOWNs — owner input required

> **Status pointer (2026-07-26):** BU2, BU3 and BU5 are **resolved for this bugfix** by the owner clarification recorded in the addendum below. BU1 remains open and blocking. BU4 remains open but narrowed. The original Phase-1 wording is preserved unchanged.

- **BU1 — remediation mechanism authorization.** No advisory-clean resolution exists inside the declared requirer ranges (E6.2, E6.3, E6.4) and `@electron-forge/cli` is already at `latest` (E6.5). Every available path is consequential: (a) `overrides` that cross major boundaries (`tar` 6→7, `tmp` 0.0→0.2, E6.11) with unverified build-tool compatibility (E6.12); (b) waiting for upstream Forge 8 (currently alpha only); (c) documented risk acceptance for a dev-only build-chain exposure with no code change. This is a dependency-contract decision the owner must make before implementation; the spec cannot select it.
- **BU2 — Dependabot alert ground truth.** Alert IDs, severities, and open/closed state are inaccessible here (E1.6). The defect set in this document is derived from the lockfile plus a local dev audit. The owner must confirm that the open alerts are exactly the `tar`/`tmp` findings and that no additional alert is in scope.
- **BU3 — remote state revalidation.** Remote default branch, remote branch list, open PRs/review threads, and CI run history could not be revalidated (E1.4, E1.5, E1.7); the clone is shallow (E1.3). The owner must confirm `main` = `ed3b8d9` on the remote and that no conflicting open PR touches `package.json`/`package-lock.json`.
- **BU4 — packaged-artifact baseline.** Preservation criterion 3.5/PC7 has no pre-fix baseline: artifact content was never verified locally (E7.5) and the prior "no `tar`/`tmp` in the artifact" statement is HISTORICAL (E7.6). The owner must decide whether an owner-gated Windows packaging run is authorized to establish the baseline, or whether 3.5 stays `UNKNOWN`.
- **BU5 — CI visibility gap.** The defect class is invisible to CI by construction (N1, E5.1 vs. E5.2). Closing that gap requires a workflow change, which is out of scope by default. The owner must state whether it stays out of scope (leaving the gap open after the fix) or becomes a separately authorized concern.

---

## Owner Clarification Addendum (2026-07-26)

**This addendum is additive.** It does not edit, replace, or reinterpret any evidence entry above. Every statement above keeps its original truth class and its 2026-07-25 observation window. The items here are dated 2026-07-26 and carry their own truth classes.

### A1. Basis of this addendum

| Source | Nature | Class |
|--------|--------|-------|
| Owner review record "VAG Public Demo — Dependency-Spec Current State", dated 2026-07-26 | owner-supplied review/decision record; not an implementation record and not a release record | HISTORICAL (dated owner statement) |
| Independent revalidation of remote repository state performed while creating this spec branch on 2026-07-26 | read-only queries against the public GitHub REST API for this repository | OBSERVED (2026-07-26) |

### A2. Remote state revalidation — closes BU3 for this bugfix

Observed on 2026-07-26 via the public GitHub REST API for `SchellSystems/vag-public-demo-release` (read-only):

| Fact | Value | Class |
|------|-------|-------|
| remote default branch | `main` | OBSERVED (2026-07-26) |
| remote `main` commit SHA | `ed3b8d9444d49f5ff2e28cd1c4c52092782e701c` — identical to the Phase-1 base (E1.1) | OBSERVED (2026-07-26) |
| open pull requests | none (`[]`) | OBSERVED (2026-07-26) |
| `main` branch protection flag reported by the branch listing | `protected: true` | OBSERVED (2026-07-26) |
| existing remote branch `fix/dependabot-tar-tmp-dev-deps` | did not exist before this spec branch was pushed | OBSERVED (2026-07-26) |
| local working tree at branch creation | clean; branch created exactly from `ed3b8d9444d49f5ff2e28cd1c4c52092782e701c` | OBSERVED (2026-07-26) |

**Consequence:** the authenticated-remote limitation recorded in E1.4/E1.5 no longer blocks this bugfix. **BU3 is resolved for this bugfix.** It must nevertheless be re-executed immediately before any later implementation branch is created and again before any owner-authorized merge, because a revalidation result belongs only to its observation time.

CI run history for `main` (E1.7) was **not** retrieved and stays **UNKNOWN**.

### A3. Alert scope clarification — closes BU2 for this bugfix

The owner has bounded the scope of this bugfix to the visible `tar` / `tmp` dev-only alert family, as recorded in the 2026-07-26 review record.

| Item | State | Class |
|------|-------|-------|
| bug scope for this spec | transitive dev-only `tar` / `tmp` findings only | owner-decided (HISTORICAL, 2026-07-26) |
| exact Dependabot alert IDs, severities, and open/closed state | still not accessible from this environment | UNKNOWN |
| FC5 (alert closure) | remains owner-confirmed after merge only; never claimable from local evidence | UNKNOWN locally |

**Consequence: BU2 is resolved for this bugfix** as a scope decision. It is **not** resolved as ground truth about the alert records themselves — the alert IDs stay UNKNOWN, so hard-stop S7 still applies if the owner later observes an alert set that differs from the `tar`/`tmp` family.

### A4. CI visibility gap — closes BU5 for this bugfix

| Item | State | Class |
|------|-------|-------|
| N1 (only `npm audit --omit=dev` is gated) and N2–N8 | acknowledged, kept **outside** this bugfix as future hardening | owner-decided (HISTORICAL, 2026-07-26) |
| workflow / product / claim expansion | not authorized in this bugfix | owner-decided (HISTORICAL, 2026-07-26) |

**Consequence: BU5 is resolved for this bugfix** with the outcome "stays out of scope". The gap therefore **remains open after the fix**, by explicit decision, and must be stated as such in any handoff. Closing it would be a separate concern with its own branch and pull request.

### A5. Artifact baseline — BU4 narrowed, still open

The owner reports a locally performed inspection of the existing Windows artifact built from `ed3b8d9444d49f5ff2e28cd1c4c52092782e701c`:

| Surface | Owner-reported finding | Class |
|---------|------------------------|-------|
| outer artifact bundle SHA-256 | `8ec08d5dd1d56b7d6cc022f66ce9e0f51bb8baa8163fd345e8e3de248c7c205e` | HISTORICAL / owner-reported, not revalidated here |
| installer SHA-256 | `617df7e32d5d2c1b77d33fdf1e15d486388f0e23f3a63df2c2b8936c670a44b9` | HISTORICAL / owner-reported, not revalidated here |
| packaged ZIP SHA-256 | `d616893e195fab6e19efcef24968a2aa061d3f24f698930e598108f975af5c8f` | HISTORICAL / owner-reported, not revalidated here |
| packaged ZIP contains `resources/app.asar`; direct ASAR header-tree parsing lists 48 paths; no `tar` and no `tmp` path present | consistent with E7.1–E7.4 and with the `packagerConfig.ignore` rule in E7.2 | HISTORICAL / owner-reported, not revalidated here |
| Squirrel `.exe` and `.nupkg` internal contents | not inspected | UNKNOWN |
| compatibility of a future override-based build on Windows | not established | UNKNOWN |
| manual Windows installation / UI acceptance | not performed | UNKNOWN |

**Consequence:** E7.5 and E7.6 keep their original classes. PC7 is **narrowed to the ASAR surface only** and **BU4 stays open** for the installer surfaces. Nothing here upgrades a HISTORICAL statement into an OBSERVED or TESTED one.

### A6. Correction to the packaging-command vocabulary

Phase-1 and the first design draft referred to a single packaging entry point. The repository's committed root `package.json` defines three distinct desktop scripts (OBSERVED, 2026-07-26):

| Script | Definition | What it can evidence |
|--------|-----------|----------------------|
| `npm run desktop:package` | `npm run build && electron-forge package` | the packaged application directory and its ASAR only — **no** installer, no ZIP distributable, no `.nupkg` |
| `npm run desktop:make` | `npm run build && electron-forge make` | the distributable surfaces (Squirrel installer, ZIP) on the host platform |
| `npm run desktop:smoke:packaged` | `electron desktop/main.mjs --smoke-test` | the packaged-runtime smoke path |

The existing manual workflow `.github/workflows/windows-build.yml` ("Windows Desktop Build (manual)") is a **separate** owner-dispatched path: it runs the full gate sequence and then invokes Electron Forge's make step for `win32/x64` inside the workflow, collects the installer and ZIP, and uploads a private artifact bundle. It signs nothing, releases nothing, tags nothing, and deploys nothing (OBSERVED, 2026-07-26).

**Consequence:** PC7 for installer surfaces cannot be evidenced by `npm run desktop:package` alone. It requires `npm run desktop:make` on a Windows host or an owner-dispatched run of that existing workflow against the candidate ref. No unbound local `npx` invocation is used; the workflow's own internal command is part of the unchanged workflow file and is not a local command.

### A7. Resulting blocker state for this bugfix

| ID | State as of 2026-07-26 | Note |
|----|------------------------|------|
| BU1 | **OPEN — blocking** | remediation mechanism selection is owner-only; nothing may be prepared, staged, or applied before it |
| BU2 | **RESOLVED for this bugfix** (scope bounded to `tar`/`tmp`) | alert IDs stay UNKNOWN; S7 still applies if the observed alert set differs |
| BU3 | **RESOLVED for this bugfix** (remote `main` = base SHA, no open PR) | must be re-executed before the implementation branch and before any merge |
| BU4 | **OPEN — narrowed** | ASAR surface owner-reported clean; installer surfaces UNKNOWN |
| BU5 | **RESOLVED for this bugfix** (stays out of scope) | the CI visibility gap remains open by decision and must be stated in the handoff |

### A8. Residual UNKNOWNs after this addendum

- Dependabot alert IDs, severities, and state (E1.6) — UNKNOWN; FC5 stays owner-confirmed post-merge.
- CI run history for `main` (E1.7) — UNKNOWN.
- Installed-tree confirmation via `npm explain` / `npm ls` (E5.6) — UNKNOWN until an install is authorized.
- Build-tool compatibility under any crossed major (E6.11, E6.12 / PC8) — UNKNOWN.
- Installer-surface content (`.exe`, `.nupkg`) and Windows compatibility of an override-based build (PC7 / BU4) — UNKNOWN.
- Manual Windows installation and human browser/UI acceptance — UNKNOWN.

---

## Owner Decision Addendum - BU1 Resolution (2026-07-26)

**This addendum is additive.** It records the owner's resolution of BU1 and the Phase B scratch validation that informed it. It does not edit, replace, or reinterpret any evidence entry above.

### BU1 RESOLVED: Owner authorized M2 (exact root overrides)

The owner authorized **M2** as the remediation mechanism on 2026-07-26: exact root-level overrides `{"tar": "7.5.22", "tmp": "0.2.7"}` applied to the root `package.json`.

| Item | Decision | Class |
|------|----------|-------|
| Selected mechanism | **M2** - exact root overrides `{"tar": "7.5.22", "tmp": "0.2.7"}` | owner-decided (2026-07-26) |
| Authorization | Owner authorized implementation of M2 on a separate branch | owner-decided (2026-07-26) |

### M1 REJECTED: independently tested, produces ELSPROBLEMS

M1 (targeted nested overrides scoped to specific requirer paths) was independently tested in a Phase B scratch validation. Result: `npm ls tar tmp --all` produces **exit 1 / ELSPROBLEMS** with targeted nested overrides (invalid peer dependency resolution). M1 does not produce a clean tree.

| Check | M1 result | Class |
|-------|-----------|-------|
| `npm ls tar tmp --all` | exit 1, ELSPROBLEMS (invalid peer dependency resolution) | TESTED (scratch, 2026-07-26) |
| Clean dependency tree | **FAIL** - M1 does not produce a clean tree | TESTED (scratch, 2026-07-26) |

### tmp floor corrected

The `tmp` override target is **0.2.7** (latest), not 0.2.6 (the minimum above the advisory range `<=0.2.5`). The advisory floor for the contract test remains `>= 0.2.6`; the override resolves to the latest available version above it.

### Phase B scratch validation results (M2 on base SHA ed3b8d9)

Scratch validation performed with overrides `{"tar": "7.5.22", "tmp": "0.2.7"}` applied to the root `package.json` at `BASE_SHA = ed3b8d9444d49f5ff2e28cd1c4c52092782e701c`:

| Gate | Result | Class |
|------|--------|-------|
| `npm ci` | exit 0 | TESTED (scratch, 2026-07-26) |
| `npm ls tar tmp --all` | exit 0 (`tar@7.5.22`, `tmp@0.2.7`) | TESTED (scratch, 2026-07-26) |
| `npm audit --omit=dev` | 0 vulnerabilities | TESTED (scratch, 2026-07-26) |
| `npm audit --include=dev` | no `vulnerabilities.tar` / `vulnerabilities.tmp` entries | TESTED (scratch, 2026-07-26) |
| `npm test` | 109 pass, 0 fail | TESTED (scratch, 2026-07-26) |
| `npm run build` | pass (vite, 37 modules) | TESTED (scratch, 2026-07-26) |
| `npm run smoke` | 45 passed, 0 failed | TESTED (scratch, 2026-07-26) |
| Production closure | identical (9 entries, unchanged) | TESTED (scratch, 2026-07-26) |

All Phase B gates pass. M2 satisfies FC1, FC2, FC3, PC1, PC2, PC3, PC4, PC5.

### Updated blocker state

| ID | State | Note |
|----|-------|------|
| BU1 | **RESOLVED** | Owner selected M2; implementation authorized on branch `fix/dependabot-tar-tmp-remediation` |
| BU2 | **RESOLVED for this bugfix** | unchanged from A3 |
| BU3 | **RESOLVED for this bugfix** | unchanged from A2; must be re-executed before implementation branch creation |
| BU4 | **OPEN - narrowed** | unchanged from A5; PC7/PC8 remain UNKNOWN pending packaging run |
| BU5 | **RESOLVED for this bugfix** | unchanged from A4 |
