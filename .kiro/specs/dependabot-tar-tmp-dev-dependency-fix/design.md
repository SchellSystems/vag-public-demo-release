# Dependabot tar/tmp Dev-Dependency Fix — Bugfix Design

## Document Production Constraint (read first)

This design was produced under a **documentation-only recovery constraint**:

- No command that installs, resolves, builds, packages, or tests was executed — no `npm ci`/`install`/`update`/`audit`, no Node run, no Python gate, no test, no build, no packaging.
- Nothing was installed; `node_modules/` was not populated; no lockfile or manifest was written, staged, or altered.
- No merge, tag, release, deployment, or publication was created.
- File inspection was read-only.
- **All dependency evidence is inherited verbatim from the accepted Phase-1 `bugfix.md`, not re-derived here.** Truth classes (OBSERVED / TESTED / DERIVED / HISTORICAL / UNKNOWN) are reproduced exactly as recorded at SHA `ed3b8d9444d49f5ff2e28cd1c4c52092782e701c`. No truth class is upgraded by this document. A Phase-1 `TESTED` result belongs only to that tested SHA and that observation window (E2.4).

### Canonicalization pass (2026-07-26)

This file is the canonical design document. It was canonicalized on 2026-07-26 together with `bugfix.md` and `tasks.md`. The canonicalization pass:

- was **documentation-only**: the only repository writes are the three files in this spec directory;
- performed **read-only** inspection of `package.json`, `forge.config.mjs` references, `.github/workflows/audit.yml`, `.github/workflows/windows-build.yml`, `.github/scripts/check_changed_whitespace.sh`, `tools/check_claims.py`, `tools/export_audit.py`, `AGENTS.md`, and all four steering files;
- performed **read-only** remote revalidation (public GitHub REST API): default branch `main`, `main` SHA `ed3b8d9444d49f5ff2e28cd1c4c52092782e701c`, no open pull requests (OBSERVED, 2026-07-26);
- incorporated the owner clarifications recorded in `bugfix.md` → [Owner Clarification Addendum (2026-07-26)](./bugfix.md), which resolve **BU2**, **BU3** and **BU5** for this bugfix and narrow **BU4**;
- corrected the packaging-command vocabulary (`desktop:package` vs `desktop:make` vs the existing manual Windows workflow);
- moved Windows candidate verification **before merge**;
- replaced every mutable `main`-based base-to-head comparison with the **immutable BASE_SHA**;
- restated the proposed regression test as an **evidence-dated snapshot dependency contract**, never a security gate.

**Immutable base for this spec:** `BASE_SHA = ed3b8d9444d49f5ff2e28cd1c4c52092782e701c`.

## Overview

The committed dependency state at `ed3b8d9` resolves two **development-only** transitive packages into advisory-covered versions: `tar@6.2.1` (aggregate vulnerable range `<=7.5.20`, includes one critical advisory — E5.3) and `tmp@0.0.33` (aggregate vulnerable range `<=0.2.5`, high — E5.4). Both enter the graph **exclusively** through the Electron Forge desktop-packaging devDependency set (E4.6, DERIVED). Neither appears in the 9-entry production closure (E3.5, OBSERVED).

The repository's only CI dependency gate is `npm audit --omit=dev`, which returns 0 findings / exit 0 at this SHA (E5.1, TESTED). The defect is therefore invisible to every automated gate that currently runs and is surfaced only by Dependabot and by `npm audit --include=dev` (E5.2, TESTED).

`fixAvailable` is `false` for both packages (E5.3, E5.4) and **no in-range resolution exists**: the `tar` 6.x line ends at 6.2.1 with no patched 6.x (E6.2), the `tmp` 0.0.x line ends at 0.0.33 (E6.3), and every requirer range excludes all non-vulnerable published versions (E6.4, DERIVED). `@electron-forge/cli` is already at `dist-tags.latest` 7.11.2 (E6.5) and pins `core|core-utils|shared-types` to exactly 7.11.2 and `@inquirer/prompts` to `^6.0.1` (E6.6), which blocks the clean upstream ancestor paths (E6.7, E6.10).

**Consequence for this design:** the fix strategy cannot be selected by the spec. This document formalizes the bug condition, enumerates every viable remediation mechanism **without choosing one**, defines the offline regression contract, the permitted file-set contract, the branch boundary, rollback and hard-stop conditions, and then terminates at a **hard owner decision gate on BU1**. Reaching that gate without applying any change is the *correct* terminal outcome, exactly as required by expected behavior 2.4.

### Exposure framing (binding)

Presence of `tar`/`tmp` in the resolved graph is **build-chain exposure**: the advisory-covered code is present in the build/packaging environment's dependency closure for maintainers and CI runners (E7.1, DERIVED). This design does **not** claim that the vulnerable code paths are executed. Whether the specific vulnerable functions (archive decompression/parse in `tar`; temp-path `prefix`/`postfix` handling and symlinked `dir` in `tmp`) are actually invoked during `npm ci` or a packaging run is **UNKNOWN** — E5.x establishes advisory coverage of resolved versions, never call-path reachability. No reachability analysis was performed, and none may be inferred from the audit output.

## Glossary

| Term | Definition |
|---|---|
| **X** | A repository dependency state: the `package.json` set + `package-lock.json` at a commit, together with the resolved graph and audit result. |
| **F** | Original (unfixed) dependency state at `ed3b8d9`. |
| **F'** | Fixed dependency state after an owner-authorized remediation. |
| **BASE_SHA** | The immutable base commit `ed3b8d9444d49f5ff2e28cd1c4c52092782e701c`. Every base-to-head comparison uses this SHA, never the mutable local `main` ref. A later implementation branch records its own immutable base SHA at creation time. |
| **Bug_Condition (C)** | `isBugCondition(X)` — some resolved graph node named `tar` or `tmp` has a version inside an applicable advisory range. |
| **Property (P)** | Desired post-fix behavior for buggy inputs: no resolved `tar`/`tmp` node inside any applicable advisory range, and no `vulnerabilities.tar` / `vulnerabilities.tmp` entry under `npm audit --include=dev`. |
| **Preservation** | All behavior of the non-buggy input class that must be byte- or result-identical after the fix: production closure, `--omit=dev` audit result, tests, build, smoke, claim surface, workflows, authority separation (3.1–3.8). |
| **Build-chain exposure** | Advisory-covered package present in the build/packaging dependency closure. Not a claim that vulnerable code executes. |
| **Advisory floor** | The lowest published version outside every applicable advisory range, as evidenced and dated: `tar >= 7.5.21` (E6.1), `tmp >= 0.2.6` (E6.3). Evidence-dated, not self-updating. |
| **Snapshot dependency contract** | The proposed offline regression test. It asserts the evidence-dated floors only. It is **not** an advisory scanner, **not** a dev-audit gate, and **not** a substitute for Dependabot. |
| **Owner decision gate** | A point where only the repository owner may choose; the agent stops, reports, and changes nothing (AGENTS.md; steering 01/03). |
| **`npm run desktop:package`** | `npm run build && electron-forge package` (OBSERVED in root `package.json`). Produces the packaged application directory and its ASAR **only** — no installer, no ZIP distributable, no `.nupkg`. |
| **`npm run desktop:make`** | `npm run build && electron-forge make` (OBSERVED in root `package.json`). Produces the distributable surfaces (Squirrel installer, ZIP) **for the host platform**. Required for any installer-surface evidence. |
| **Existing Windows workflow** | `.github/workflows/windows-build.yml`, "Windows Desktop Build (manual)": owner-dispatched, `workflow_dispatch` with a `ref` input, runs the full gate sequence, then Electron Forge's make step for `win32/x64` inside the workflow, collects installer + ZIP + hashes + provenance into a private artifact bundle. It signs, releases, tags, and deploys nothing. **This file is not modified by this bugfix.** No unbound local `npx` command is used anywhere in this plan. |

## Bug Details

### Bug Condition

The bug manifests when the committed dependency state resolves a `tar` or `tmp` node into a version covered by a published advisory range. At `ed3b8d9` this holds for both packages simultaneously, with `fixAvailable: false` and no in-range alternative, while the sole CI dependency gate (`--omit=dev`) passes — so the state persists silently.

**Formal Specification:**

```
FUNCTION isBugCondition(X)
  INPUT: X of type RepositoryDependencyState
  OUTPUT: boolean

  RETURN EXISTS node IN resolvedGraph(X) SUCH THAT
           node.name IN { "tar", "tmp" }
           AND versionInAnyAdvisoryRange(node.name, node.version)
END FUNCTION
```

`isBugCondition(F) = TRUE` — `tar 6.2.1 IN <=7.5.20` (E5.3), `tmp 0.0.33 IN <=0.2.5` (E5.4).

### Counterexample (TESTED at `ed3b8d9`)

`npm audit --include=dev --json` exits 1 with `vulnerabilities.tar.severity = critical`, range `<=7.5.20`, `fixAvailable: false`, and `vulnerabilities.tmp.severity = high`, range `<=0.2.5`, `fixAvailable: false` — while `npm audit --omit=dev` exits 0 with 0 vulnerabilities (E5.1, E5.2, E5.3, E5.4).

### Examples

| # | Situation | Expected | Actual at `ed3b8d9` | Evidence |
|---|---|---|---|---|
| 1 | Lockfile inspection for `tar` | resolved version outside all advisory ranges, or absent | exactly one node `node_modules/tar` → `6.2.1`, `"dev": true` | E3.2 OBSERVED |
| 2 | Lockfile inspection for `tmp` | resolved version outside its advisory range, or absent | exactly one node `node_modules/tmp` → `0.0.33`, `"dev": true` | E3.3 OBSERVED |
| 3 | `npm audit --include=dev --json` | no `vulnerabilities.tar` / `vulnerabilities.tmp` | 36 entries; low 3, high 32, critical 1; both packages present | E5.2–E5.4 TESTED |
| 4 | CI dependency gate | surfaces the defect | `npm audit --omit=dev` → 0 findings, exit 0 (defect invisible) | E5.1 TESTED, N1 OBSERVED |
| 5 | In-range remediation attempt | a patched version inside declared ranges | none exists: `tar` 6.x ends at 6.2.1; `tmp` 0.0.x ends at 0.0.33 | E6.2, E6.3 TESTED; E6.4 DERIVED |
| 6 | Edge case — production exposure | `tar`/`tmp` absent from production closure | absent; production closure is 9 entries | E3.5 OBSERVED, E7.1 DERIVED |

### Ancestry (why no in-range fix exists)

| Package | Direct requirers (ranges) | Terminal root | Clean upstream exists? | Evidence |
|---|---|---|---|---|
| `tar` | `@electron/node-gyp ^6.2.1`, `@electron/rebuild ^6.0.5`, `cacache ^6.1.11` | root devDependencies via `@electron-forge/cli` 7.11.2 and the three makers/plugin through `@electron-forge/shared-types` | Yes but unreachable: `@electron/rebuild` 4.2.0 drops `tar`; `cacache` 21.0.1 drops `tar` — both require crossing majors pinned by Forge 7.11.2 | E4.1, E4.3, E6.7, E6.8, E6.6 |
| `tmp` | `external-editor ^0.0.33` | `external-editor@3.1.0` ← `@inquirer/editor@3.0.1` ← `@inquirer/prompts@6.0.1` ← `@electron-forge/cli@7.11.2` ← root(dev) | Yes but unreachable: `@inquirer/editor@latest` replaced `external-editor` with `@inquirer/external-editor`; needs `@inquirer/prompts` 6 → 8 inside a Forge-pinned range | E4.2, E4.4, E6.9, E6.10, E6.6 |

`@electron/node-gyp` resolves from a git source (`git+ssh://git@github.com/electron/node-gyp.git#06b29aaf…`, version `10.2.0-electron.1`) rather than a registry tarball (E4.5, OBSERVED; also recorded as non-scope observation N3).

`npm explain tar` / `npm explain tmp` failed because `node_modules/` is empty and installing was prohibited; chain evidence comes from the lockfile walk, not from an installed tree (E5.6 — TESTED failure recorded / UNKNOWN installed-tree confirmation).

## Expected Behavior

### Preservation Requirements

**Unchanged behaviors** (from bugfix.md 3.1–3.8; each maps to a preservation check PC1–PC8):

| ID | Must stay unchanged | Check |
|---|---|---|
| 3.1 | Gateway behavior per `npm test`, `npm run smoke`, `desktop/main.mjs --smoke-test` (seven checks) | PC3, PC4 |
| 3.2 | Production closure identical — 9 entries, same versions (E3.5) | PC1 |
| 3.3 | `npm audit --omit=dev` still 0 findings / exit 0 (E5.1) | PC2 |
| 3.4 | `test/desktop-contract.test.mjs` fully satisfied (N7: it asserts packaging/security config statically, nothing about the dependency graph) | PC3 |
| 3.5 | Same artifact kinds and manifest structure; `tar`/`tmp` still excluded from packaged runtime content. **Binary hash equality explicitly NOT claimed.** Packaged-content baseline partially narrowed but not closed (see below) | PC7 |
| 3.6 | `tools/check_claims.py .` and `tools/export_audit.py .` pass; public claim surface byte-identical | PC5, PC6 |
| 3.7 | Workflows and `.github/scripts/check_changed_whitespace.sh` unchanged | PC6 |
| 3.8 | Authority separation preserved — proposal / decision / artifact / digest / Commit / Verify / evidence / owner approval must not collapse (E2.5) | PC6 |

**Scope of preservation:** every input where `NOT isBugCondition(X)` must be unaffected. This includes: the entire production dependency closure; the `--omit=dev` audit result; all gateway/UI/evidence behavior; all public documentation and claim text; all CI workflow definitions; all packaging configuration semantics in `forge.config.mjs`.

### Owner-Supplied Partial Baseline (refines E7.5 / E7.6, BU4, PC7)

**Classification: HISTORICAL / owner-reported partial baseline — not revalidated in this environment. Does not upgrade E7.5.** Full detail, including the reported artifact hashes, is recorded in the `bugfix.md` addendum section A5.

| Artifact surface | Owner-reported finding | Class | Effect |
|---|---|---|---|
| Windows ZIP → `resources/app.asar` present; ASAR header-tree parsing lists 48 paths and contains neither `tar` nor `tmp` | consistent with E7.1–E7.4 and with the `packagerConfig.ignore` rule `/^\/node_modules\/(?!(?:electron\|@electron))/` (E7.2, OBSERVED) | HISTORICAL / owner-reported | **Narrows** BU4/PC7 for the ASAR surface only |
| Squirrel installer (`.exe`) and `.nupkg` contents | not inspected | **UNKNOWN** | BU4/PC7 **remain open** |
| Manual Windows installation / UI acceptance | not performed | **UNKNOWN** | stays UNKNOWN unless the owner performs it |

This narrows but **does not close** BU4 or PC7. The pre-fix packaged-artifact baseline is therefore *partial*: ASAR = owner-reported clean (unrevalidated), installer = UNKNOWN.

### Artifact absence is a post-fix acceptance criterion only

`tar`/`tmp` absence in newly built artifacts is a **post-fix acceptance criterion**, verified only after remediation under an owner-authorized packaging run — `npm run desktop:package` for the ASAR surface, and `npm run desktop:make` (or an owner-dispatched run of the existing Windows workflow against the candidate ref) for the installer surfaces. It is:

- **never** pre-fix proof that the defect is absent, and
- **never** a substitute for FC1 (lockfile floor inspection) or FC2 (`npm audit --include=dev` has no `tar`/`tmp` entry).

Artifact cleanliness is orthogonal to the bug condition: the bug is a *dependency-state* defect in the build environment closure, not an artifact-content defect.

## Hypothesized Root Cause

Ordered by evidential support. This is a dependency-state defect, so "root cause" means *why the advisory-covered versions are pinned and why they cannot be cleared in range*.

1. **Upstream pinning by Electron Forge 7.11.2 (strongest support).** `@electron-forge/cli@7.11.2` pins `core|core-utils|shared-types` to exactly 7.11.2 and `@inquirer/prompts` to `^6.0.1` (E6.6, TESTED). This freezes `@electron/rebuild@3.7.2` (which still depends on `tar`, E6.7) and `@inquirer/editor@3.0.1 → external-editor@3.1.0 → tmp ^0.0.33` (E6.9, E6.10). Forge's own latest is already installed (E6.5), so no in-range upstream release clears either package.
2. **Dead patch lines in the required ranges.** No patched `tar` 6.x exists and no patched `tmp` 0.0.x exists (E6.2, E6.3), so every requirer range (`tar ^6.2.1 / ^6.0.5 / ^6.1.11`, `tmp ^0.0.33`) is entirely inside the advisory ranges (E6.4, DERIVED). `fixAvailable: false` in the audit output is a direct consequence (E5.3, E5.4).
3. **Absent dev-audit visibility.** Both workflows gate only `npm audit --omit=dev` (N1, OBSERVED), and there is no `.github/dependabot.yml` (N4, OBSERVED). The state can persist indefinitely without any local or CI signal — this explains *durability*, not *origin*.
4. **Build tooling co-located in the product root.** All packaging tooling sits in the root workspace `devDependencies` (N2, OBSERVED; E3.6), so the build chain's advisory surface is attributed to the product repository root rather than an isolated tooling boundary. Contributing factor only.
5. **Git-pinned ancestor.** `@electron/node-gyp@10.2.0-electron.1` resolves from a git commit (E4.5, N3), which removes registry-driven remediation for one of the three `tar` requirer paths.

**Not established (UNKNOWN):** that the vulnerable code paths execute during `npm ci` or packaging; that the alerts originated with the Electron desktop packaging integration (UNVERIFIABLE — shallow clone, no alert access, E1.3, E8); the Dependabot alert IDs/severities/state (E1.6).

## Correctness Properties

Property 1: Bug Condition — No Advisory-Covered `tar`/`tmp` in the Resolved Graph

_For any_ repository dependency state `X` where the bug condition holds (`isBugCondition(X)` returns true), the fixed state `X' = applyFix(X)` SHALL contain no resolved `tar` or `tmp` node inside any applicable advisory range — either resolving `tar >= 7.5.21` (latest 7.5.22, E6.1) and `tmp >= 0.2.6` (latest 0.2.7, E6.3), or removing the nodes from the resolved graph entirely — and `npm audit --include=dev --json` SHALL contain no `vulnerabilities.tar` and no `vulnerabilities.tmp` entry.

**Validates: Requirements 2.1, 2.2, 2.3, 2.5**

```
FOR ALL X WHERE isBugCondition(X) DO
  X' := applyFix(X)
  ASSERT NOT isBugCondition(X')
  ASSERT auditDevEntriesFor(X', "tar") = EMPTY
  ASSERT auditDevEntriesFor(X', "tmp") = EMPTY
  ASSERT resolvedVersion(X', "tar") outsideAllAdvisoryRanges OR absent(X', "tar")
  ASSERT resolvedVersion(X', "tmp") outsideAllAdvisoryRanges OR absent(X', "tmp")
END FOR
```

Property 2: Preservation — Non-Buggy Dependency State and All Product Behavior

_For any_ input where the bug condition does NOT hold (`isBugCondition` returns false), the fixed state SHALL produce the same result as the original state, preserving the 9-entry production closure, the `npm audit --omit=dev` result (0 / exit 0), all test/build/smoke outcomes, the claim and documentation surface, the workflow definitions, and authority separation.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**

```
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT F(X) = F'(X)
END FOR
```

Property 3: Terminal Gate — Unchanged Repository When the Owner Decision Is Absent

_For any_ situation where Property 1 cannot be satisfied without an owner decision (BU1 unresolved), the repository SHALL remain byte-identical outside this spec directory, and the blocker SHALL be reported. Reaching this state without applying a change is a **pass**, not a failure.

**Validates: Requirements 2.4**

```
FUNCTION ownerGateSatisfied(state)
  RETURN BU1.resolved = TRUE AND ownerAuthorization(mechanism) = GRANTED
END FUNCTION

IF NOT ownerGateSatisfied(current) THEN
  ASSERT changedFileSet ⊆ { ".kiro/specs/dependabot-tar-tmp-dev-dependency-fix/**" }
  ASSERT lockfileBytes(F') = lockfileBytes(F)
  ASSERT manifestBytes(F') = manifestBytes(F)
  REPORT blocker(BU1)
  STOP
END IF
```

### Property-Based Testing Note — offline boundary

**CAN be checked offline** (no network, no child process, lockfile bytes only):

- **Version-floor invariant** over lockfile nodes: `passes(node) ⟺ compare(node.version, floor) >= 0` for exact numeric `x.y.z` versions.
- **Comparator determinism** on the boundary triples that matter: equal to floor, one below, one above, and the major/minor/patch boundary cases.
- **Fail-closed behavior on malformed input**: for every malformed version string (prerelease, build metadata, range specifier, leading `v`, non-numeric, empty) and every malformed lockfile shape, the check FAILS — it never skips and never passes by default.
- **Absence-vs-missing-structure discrimination**: explicit node-key absence in `packages` passes; a missing/renamed `packages` object or an unsupported `lockfileVersion` fails.

**Complexity reservation (review record 2026-07-26).** A broad generative comparator-algebra surface (totality, antisymmetry, reflexivity, transitivity over generated triples) adds test complexity without increasing assurance about npm resolution or Electron Forge compatibility, which is where the real risk sits (E6.12/PC8). Deterministic boundary cases plus fail-closed cases are therefore **sufficient** for this bugfix. Generated cases may be added **only** if they introduce no new test dependency and keep the file small; they are optional, not required.

**CANNOT be checked offline (UNKNOWN):**

- Advisory-database truth, severities, or range membership beyond the evidence-dated floors (E5.3, E5.4).
- Dependabot alert existence, IDs, severity, or closure state (E1.6, BU2, FC5).
- Packaged-artifact content of ASAR / Squirrel `.exe` / `.nupkg` (E7.5, partially narrowed by the owner-reported ASAR baseline, installer still UNKNOWN — BU4, PC7).
- Build-tool functional compatibility under any overridden majors (E6.11, E6.12, PC8).
- CI run history for `main` (E1.7).

## Remediation Mechanism Comparison — NO SELECTION MADE

All six mechanisms are documented for the owner's BU1 decision. **This design selects none of them.** Every row's compatibility column is bounded by E6.11 (major-contract crossings) and E6.12 (functional behavior under those crossings is not established).

| ID | Mechanism | Files it would touch | Evidence basis | Satisfies | Residual risk | Remains UNKNOWN |
|---|---|---|---|---|---|---|
| **M1** | **Targeted nested `npm` overrides** scoped to the specific requirer paths (`@electron/rebuild > tar`, `@electron/node-gyp > tar`, `cacache > tar`, `external-editor > tmp`) | `package.json` (`overrides`), `package-lock.json` | E3.4 (no existing `overrides`), E4.1–E4.4 (exact requirer paths), E6.1/E6.3 (targets exist), E6.4 (nothing in range) | FC1, FC2, FC3 | Crosses `tar ^6 → 7.5.x` (major; `engines.node >= 18`, restructured API) and `tmp ^0.0.33 → 0.2.x` (breaking under 0.x rules; `engines.node >= 14.14`) for the named paths only (E6.11); one requirer path is git-pinned (E4.5) and override behavior there is less predictable | Whether `@electron/rebuild@3.7.2`, `@electron/node-gyp@10.2.0-electron.1`, `cacache@16.1.3`, `external-editor@3.1.0` function under the overridden majors (E6.12, PC8) |
| **M2** | **Broad root-level overrides** — `{"tar": "^7.5.22", "tmp": "^0.2.7"}` applied graph-wide | `package.json`, `package-lock.json` | same as M1, plus E3.2/E3.3 (exactly one node each today) | FC1, FC2, FC3 | Same major crossings as M1 but with **unbounded blast radius**: applies to any future requirer as well; a broad override is a standing policy, not a scoped fix | Same as M1, plus effect on future graph shape (E6.12) |
| **M3** | **Ancestor major upgrade path** — `@electron/rebuild` → 4.x (drops `tar`, uses `node-gyp ^12.2.0`) and `@inquirer/prompts` → 8.x (`@inquirer/editor` replaced `external-editor` with `@inquirer/external-editor`) | `package.json` (would require overrides or a Forge change), `package-lock.json` | E6.7, E6.8, E6.10 (clean upstreams exist) | FC1, FC2, FC3 *in principle* | **Blocked**: `@electron-forge/cli@7.11.2` pins `core\|core-utils\|shared-types` to exactly 7.11.2 and `@inquirer/prompts` to `^6.0.1` (E6.6). Forcing these crosses Forge's own pinned contracts | Whether Forge 7.11.2 tolerates the forced ancestor majors at all (E6.12) |
| **M4** | **Wait for upstream Electron Forge 8** | none (no change now) | E6.5 — only `8.0.0-alpha.10` is newer than the installed 7.11.2, and it is a prerelease | none now (FC1–FC3 stay unmet) | Indefinite exposure window; adopting an alpha would itself violate stability expectations | Forge 8 GA date; whether Forge 8 actually clears both `tar` and `tmp` (UNKNOWN) |
| **M5** | **Documented risk acceptance**, no dependency change | this spec directory only (a dated acceptance record) | E7.1 (dev-only, build/packaging-time), E3.5 (absent from production closure), owner-reported ASAR baseline | none of FC1–FC3; PC1–PC6 trivially preserved | Dependabot alerts stay open; build-chain exposure persists for maintainers and CI runners; one critical advisory remains in the closure | Whether the vulnerable paths are ever invoked during `npm ci`/packaging (explicitly UNKNOWN — see Overview) |
| **M6** | **Remove or replace the desktop-packaging devDependency set** (drop/relocate `@electron-forge/*` + `electron`) | `package.json`, `package-lock.json`, and — unavoidably — packaging config, scripts, workflows, and likely public docs/claims | E4.6 (both packages enter *only* via this set), E3.6 | FC1, FC2, FC3 by removal (`absent` branch of Property 1) | **Most invasive.** Would breach 3.7 (workflows unchanged) and the file-set contract, and would remove a documented capability — i.e. it is a product/scope change, not a bugfix | Whether the desktop-packaging capability is still required by the public demo scope (owner-only, UNKNOWN) |

### Preferred experimental candidate (NOT a decision)

**M1 (targeted nested overrides) is identified as the preferred *experimental candidate only*** — the mechanism most likely to be attempted **first, IF and WHEN the owner authorizes experimentation**, because it is the minimum-blast-radius option that could satisfy FC1–FC3 (E6.4 rules out anything smaller; M2 is strictly broader; M3 is blocked by E6.6; M4 changes nothing; M5 satisfies no fix check; M6 exceeds bugfix scope).

Explicitly:

- This is **not a decision**, **not an approval**, and **not a recommendation to implement**.
- No `overrides` block, lockfile edit, or install has been prepared, drafted into a repository file, or applied.
- Compatibility of the overridden majors with `@electron/rebuild@3.7.2`, `@electron/node-gyp@10.2.0-electron.1`, `cacache@16.1.3`, and `external-editor@3.1.0` remains **UNKNOWN** until an owner-authorized `npm ci` plus packaging run produces evidence (E6.11, E6.12, PC8).
- The BU1 decision belongs to the owner and to no one else.

## Hard Owner Decision Gate (BU1)

> **GATE — BINDING.** No manifest change, no lockfile change, no dependency-resolution change, and no remediation implementation may be **designed further, prepared, staged, or applied** until the owner resolves **BU1** by selecting a mechanism from M1–M6 (or specifying another).

The gate exists because Phase 1 established that no advisory-clean resolution exists inside the declared ranges (E6.2–E6.4) and that the direct Forge dependency is already at latest (E6.5). The choice is therefore a risk decision, not a technical derivation.

Per expected behavior **2.4**: if 2.1/2.2 cannot be satisfied without an owner decision, **the repository SHALL remain unchanged and the blocker SHALL be reported**. Consequently:

**Stopping at this gate with zero repository changes outside this spec directory is a correct, successful terminal outcome of this bugfix — not an incomplete result.**

### Blocking UNKNOWNs — state as of 2026-07-26

Resolutions come from the owner clarification recorded in `bugfix.md` (addendum A2–A7). They are dated decisions, not upgraded evidence.

| ID | State | Detail | Evidence |
|---|---|---|---|
| **BU1** | **OPEN — blocking** | Select among M1–M6 (or specify another); the spec cannot select it. Nothing may be prepared, staged, or applied first | E6.2–E6.5, E6.11, E6.12 |
| **BU2** | **RESOLVED for this bugfix** | Owner bounded scope to the visible dev-only `tar`/`tmp` alert family. Alert IDs, severities, and state stay UNKNOWN; FC5 remains owner-confirmed after merge and is never locally claimable. Hard stop S7 still applies if the observed alert set differs | E1.6, addendum A3 |
| **BU3** | **RESOLVED for this bugfix** | Remote default branch `main`, remote `main` = `BASE_SHA`, no open pull requests (OBSERVED, 2026-07-26). Must be re-executed before creating the implementation branch and again before any owner-authorized merge; CI run history (E1.7) stays UNKNOWN | E1.3–E1.5, addendum A2 |
| **BU4** | **OPEN — narrowed** | ASAR surface owner-reported clean (HISTORICAL, unrevalidated); installer `.exe` / `.nupkg` UNKNOWN. Owner decides whether an authorized Windows candidate build establishes the baseline before merge, or 3.5/PC7 stays UNKNOWN | E7.5, E7.6, addendum A5 |
| **BU5** | **RESOLVED for this bugfix** | Owner kept the CI visibility gap (N1) and all of N2–N8 out of scope. The gap therefore **remains open after the fix, by decision**, and must be stated in the handoff | N1, E2.3, addendum A4 |

## Fix Implementation

### Status: NOT DESIGNED — blocked at the BU1 gate

No concrete change is specified here, and none may be prepared. What follows is the **envelope** any owner-authorized remediation must fit inside. It is a constraint set, not an implementation plan.

**Conditional shape (only after BU1 resolves):**

1. **Re-revalidate remote state** (default branch, base SHA, open PRs, working tree), record the resulting **immutable base SHA**, and **create a task branch from it before any implementation write**. Never write on `main`; never mix implementation into the documentation/spec-only branch and pull request that carries this spec.
2. **Apply exactly one authorized mechanism** from M1–M6, using the minimum mechanism that achieves FC1–FC3 (per the in-scope boundary of bugfix.md).
3. **Record**, per FC4, the mechanism used, the exact resolved versions, and **every deliberately crossed requirer range** (e.g. `tar ^6.2.1`/`^6.0.5`/`^6.1.11` → 7.5.x; `tmp ^0.0.33` → 0.2.x).
4. **Regenerate the lockfile only as a consequence** of the authorized manifest change; verify no drift afterwards (FC3: `git status --porcelain` clean after `npm ci`).
5. **Add the offline snapshot dependency contract** `test/dependency-advisory-contract.test.mjs` (below), which requires **no workflow change** and weakens no existing gate.
6. **Run the full local gate sequence** (E2.4) against the fixed SHA. Use `npm run desktop:package` / `npm run desktop:make` if and only if packaging validation is owner-authorized — never an unbound `npx` invocation.
7. **Compare base to head using the recorded immutable base SHA**, never the mutable local `main` ref: `git diff <BASE_SHA>...HEAD`.
8. **Verify the Windows candidate before merge** (see below), then leave residual UNKNOWNs recorded rather than resolved by assumption: PC7 (installer content where still unverified), PC8 (build-tool compatibility), FC5 (Dependabot alert closure).

### Windows candidate verification — before merge, not after

Because every candidate mechanism crosses major contracts **inside the packaging toolchain** (E6.11, E6.12), Windows compatibility is central rather than incidental. Therefore, under explicit owner authorization:

1. the candidate commit exists on the implementation branch and is pushed;
2. a draft pull request carries the candidate for review;
3. the Windows candidate build runs **against that candidate ref** — either `npm run desktop:make` on a Windows host, or an owner-dispatched run of the existing `.github/workflows/windows-build.yml` with its `ref` input set explicitly to the candidate branch (its default input is the unrelated feature branch `desktop-electron-finish`, N8, so the ref must be entered deliberately);
4. the resulting installer/ZIP surfaces are inspected for `tar`/`tmp` presence and compared with the partial pre-fix baseline (ASAR owner-reported clean; installer UNKNOWN);
5. only then may the owner consider merge. Merge itself remains an owner-only gate (S8).

Dependabot alert closure (FC5) is the only check that is legitimately **post-merge**.

## File-Set Contract

The **maximum permitted changed-file set** for the eventual owner-authorized remediation:

| Path | Permitted change | Rationale |
|---|---|---|
| `package.json` | root manifest only, and only the fields the authorized mechanism requires (e.g. an `overrides` block) | E3.4 — no `overrides` exists today |
| `package-lock.json` | regenerated as a consequence of the manifest change | FC1, FC3 |
| `test/dependency-advisory-contract.test.mjs` | new file, picked up by the existing `"test": "node --test test/*.test.mjs"` glob | regression protection tied to this defect, no workflow change |
| `.kiro/specs/dependabot-tar-tmp-dev-dependency-fix/**` | spec documents and evidence records | this spec |

**Nothing else may change.** Explicitly forbidden in the changed-file set: any product source (`demo-gateway/**`, `demo-ui/**`, `desktop/**`, `tools/**`), `forge.config.mjs`, any file under `.github/**` (workflows and `check_changed_whitespace.sh`), any public documentation or claim text (`README.md`, `docs/**`, `NOTICE*`, `SECURITY.md`, `CONTRIBUTING.md`, `AGENTS.md`), `.kiro/steering/**`, any workspace `package.json` (`demo-gateway`, `demo-ui`), and `examples/**`. This is enforced by PC6 and by requirements 3.6 and 3.7.

**Spec-phase sub-contract (this documentation-only phase).** The changed-file set is exactly three files:

- `.kiro/specs/dependabot-tar-tmp-dev-dependency-fix/bugfix.md`
- `.kiro/specs/dependabot-tar-tmp-dev-dependency-fix/design.md`
- `.kiro/specs/dependabot-tar-tmp-dev-dependency-fix/tasks.md`

No tool-metadata file (for example a generated spec-configuration file) is created or committed. No manifest, lockfile, test, product, or workflow file is touched in this phase.

## Non-Scope Observations (N1–N8) — owner awareness only

These were recorded in Phase 1 as **findings, not work items**. They are reproduced here so the owner sees them, and are explicitly **outside this bugfix** (confirmed by the 2026-07-26 owner decision, addendum A4).

| ID | Observation (OBSERVED) |
|---|---|
| N1 | Both CI workflows gate only `npm audit --omit=dev`; no gate observes dev/build-chain advisories |
| N2 | All packaging tooling sits in the root workspace devDependencies; build tooling is not isolated from the product root |
| N3 | One ancestor of `tar` (`@electron/node-gyp@10.2.0-electron.1`) resolves from a git commit rather than a registry tarball |
| N4 | No `.github/dependabot.yml` exists |
| N5 | `tools/windows_artifact_manifest.mjs` records hashes/versions/provenance but performs NO content inspection of ASAR/installer/ZIP |
| N6 | `packagerConfig.ignore`'s negative lookahead keeps every `/node_modules/@electron*` path, relying on implicit dev pruning |
| N7 | `test/desktop-contract.test.mjs` asserts packaging/security configuration statically but nothing about the dependency graph or advisory state |
| N8 | The Windows build workflow's `ref` input defaults to feature branch `desktop-electron-finish` rather than `main`; packaged-runtime smoke is `continue-on-error` with UNKNOWN tolerated |

> **NON-AUTHORIZATION STATEMENT:** None of N1–N8 authorizes any change in this spec. No workflow redesign, no dev-audit gate (N1/BU5), no Dependabot config (N4), no artifact content-inspection tooling (N5), no packaging-ignore change (N6), no dependency-graph assertion inside `desktop-contract.test.mjs` (N7), and no workflow-ref change (N8) is in scope. Each would be a separate concern requiring its own owner-authorized branch and pull request (E2.3: one concern per branch/PR, no opportunistic fixes).

## Testing Strategy

### Validation Approach

Two phases: first surface a counterexample that demonstrates the defect on the **unfixed** state; then — only after BU1 is resolved and remediation is authorized — verify the fix (FC1–FC5) and preservation (PC1–PC8). The exploratory phase is **strictly offline** and mutates nothing; it is the only test work this design permits to be *specified* now. Even the exploratory test file is **not created in this phase** (file-set contract: the test file lands on the implementation branch with the authorized remediation).

### Exploratory Bug Condition Checking

**Goal:** produce a reproducible counterexample witness for the unfixed state and confirm or refute the root-cause hypothesis. If refuted, re-hypothesize before any fix.

**Test plan (offline):** the proposed regression test, run against the **unfixed** lockfile, is itself the exploratory witness — it must **FAIL** at `BASE_SHA` (`tar 6.2.1 < 7.5.21`; `tmp 0.0.33 < 0.2.6`). No network call, no `npm audit` invocation, no child process.

**Test cases:**

1. **`tar` floor check** — lockfile node `node_modules/tar` = `6.2.1` vs floor `7.5.21` → **FAILS on unfixed code** (E3.2, E6.1).
2. **`tmp` floor check** — lockfile node `node_modules/tmp` = `0.0.33` vs floor `0.2.6` → **FAILS on unfixed code** (E3.3, E6.3).
3. **Structure guard** — `lockfileVersion` is 3 and `packages` is an object → passes at `BASE_SHA` (E3.1), fails closed otherwise.
4. **Malformed-version edge cases** — prerelease / build metadata / range specifier / leading `v` / non-numeric inputs all fail closed (never skip, never default-pass).

**Expected counterexamples:** both floor checks fail; the `--omit=dev` audit gate simultaneously passes (E5.1), reproducing the invisibility described in current behavior 1.4. **Refutation signal:** if either floor check passed at `BASE_SHA`, the lockfile evidence (E3.2/E3.3) would be contradicted and the hypothesis would require re-derivation.

### Proposed Regression Test — `test/dependency-advisory-contract.test.mjs`

Strictly offline contract, run by the **existing** `npm test` script (`"node --test test/*.test.mjs"`). **No workflow change.** This test is *specified* here and created only with the authorized remediation.

> **Bounded meaning — snapshot dependency contract, not a security gate.** The floors below are **evidence-dated** (2026-07-25 registry/audit observations) and are **not self-updating**. The test can prevent regression *below* the accepted floor. It cannot detect a future advisory affecting a version *above* that floor, it does not read any advisory database, and it is **not** a substitute for Dependabot or for a dev-dependency audit gate (which stays out of scope per BU5/N1). Describing it as a security gate would be a stronger claim than the evidence supports.

**Inputs and prohibitions**

| Aspect | Rule |
|---|---|
| Input | `package-lock.json` read from disk only |
| Network | **none** — no registry access, no advisory database |
| `npm audit` | **never invoked** |
| Child processes | **none** |
| Assertions about severities / advisories / Dependabot | **none** (all UNKNOWN offline) |

**Configured minimum-safe floors** (evidence-dated, **not** self-updating; comment in the file must cite E5.3, E5.4, E6.1, E6.3 and state the snapshot nature):

| Package | Floor | Basis |
|---|---|---|
| `tar` | `>= 7.5.21` | aggregate vulnerable range `<=7.5.20` (E5.3); 7.5.21/7.5.22 are above it, latest 7.5.22 (E6.1) |
| `tmp` | `>= 0.2.6` | aggregate vulnerable range `<=0.2.5` (E5.4); 0.2.6/0.2.7 are above it, latest 0.2.7 (E6.3) |

**Comparison algorithm — strict offline numeric `x.y.z`:** parse exactly three integer components and compare **major, then minor, then patch as integers**. No semver library, no range semantics, no coercion.

```
FUNCTION compareExactVersion(actual, floor)
  INPUT: actual, floor as exact "x.y.z" strings
  OUTPUT: -1 | 0 | 1   (throws/fails on any non-conforming input)

  a := parseExactTriple(actual)     // fails closed on anything non-conforming
  f := parseExactTriple(floor)
  IF a.major <> f.major THEN RETURN sign(a.major - f.major)
  IF a.minor <> f.minor THEN RETURN sign(a.minor - f.minor)
  RETURN sign(a.patch - f.patch)
END FUNCTION

FUNCTION assertLockfileFloors(lockfileText)
  lock := parseJson(lockfileText)                       // fail on parse error
  FAIL_IF lock.lockfileVersion <> 3                     // unsupported structure
  FAIL_IF NOT isObject(lock.packages)                   // unsupported structure

  FOR EACH (name, floor) IN { "tar": "7.5.21", "tmp": "0.2.6" } DO
    key  := "node_modules/" + name
    IF NOT hasOwnProperty(lock.packages, key) THEN
      PASS(name, reason = "explicit absence: node key not present in packages")
      CONTINUE
    END IF
    node := lock.packages[key]
    FAIL_IF NOT isObject(node)                          // unexpected node shape
    FAIL_IF NOT isString(node.version)                  // unexpected node shape
    ASSERT compareExactVersion(node.version, floor) >= 0
  END FOR
END FUNCTION
```

**FAIL-CLOSED conditions** — the test **fails**; it must never skip and never pass by default:

| Condition | Example | Result |
|---|---|---|
| Prerelease identifier present | `7.6.0-alpha.1`, `0.3.0-rc.2` | FAIL |
| Build metadata present | `7.5.22+build.5` | FAIL |
| Range/specifier instead of exact version | `^7.5.22`, `~0.2.7`, `>7.5.20`, `<8`, `=7.5.22`, `*`, `1 \|\| 2`, `7.x`, any whitespace | FAIL |
| Leading `v` | `v7.5.22` | FAIL |
| Malformed or non-numeric version | `7.5`, `7.5.a`, `""`, `null`, non-string | FAIL |
| Missing lockfile node when the entry is expected (not an explicit, unambiguous absence) | node key present but `version` missing/renamed | FAIL |
| Unsupported lockfile structure | `lockfileVersion` other than 3, missing `packages` object, unexpected node shape | FAIL |

**Absence-as-pass vs missing-structure-as-fail (must be documented in the file):** genuine absence of a package is a **pass only** when absence is asserted explicitly and unambiguously — the node key `node_modules/tar` (resp. `node_modules/tmp`) is **not present** in a well-formed `packages` object of a `lockfileVersion: 3` lockfile. Any *inability to determine* presence — unparsable JSON, wrong `lockfileVersion`, absent/renamed `packages`, unexpected node shape — is **not** absence and MUST fail. Removal of the package (Property 1's `absent` branch, e.g. via M6) is a legitimate pass; a broken or restructured lockfile is not.

**Expected behavior on the UNFIXED state:** **FAILS** — `tar 6.2.1 < 7.5.21` and `tmp 0.0.33 < 0.2.6`. This intentional failure is the counterexample witness and is the reason the file may only be committed together with an authorized remediation that makes it pass.

### Fix Checking (FC1–FC5) — post-authorization

```
FOR ALL X WHERE isBugCondition(X) DO
  X' := applyFix(X)
  ASSERT NOT isBugCondition(X')
  ASSERT auditDevEntriesFor(X', "tar") = EMPTY
  ASSERT auditDevEntriesFor(X', "tmp") = EMPTY
  ASSERT resolvedVersion outsideAdvisoryRanges OR absent
END FOR
```

| ID | Check | Command / method | Class if unrun |
|---|---|---|---|
| FC1 | Every resolved `tar`/`tmp` node outside all applicable advisory ranges, or absent | offline lockfile inspection + `test/dependency-advisory-contract.test.mjs` | UNKNOWN |
| FC2 | `npm audit --include=dev --json` contains no `vulnerabilities.tar` and no `vulnerabilities.tmp` | `npm audit --include=dev --json` (owner-authorized run only) | UNKNOWN |
| FC3 | `npm ci` completes from the committed lockfile with no drift | `npm ci` then `git status --porcelain` clean | UNKNOWN |
| FC4 | Mechanism, resolved versions, and every deliberately crossed requirer range recorded | evidence record in this spec directory | — |
| FC5 | Dependabot alert closure | **owner-confirmed after merge; NOT claimable from local evidence** (E1.6, BU2) | permanently UNKNOWN locally |

### Preservation Checking (PC1–PC8) — post-authorization

```
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT F(X) = F'(X)
END FOR
```

**Approach:** preservation is a universal claim over the non-buggy input class, so the offline lockfile-shaped invariants listed in the [Property-Based Testing Note](#property-based-testing-note--offline-boundary) are asserted with deterministic boundary and fail-closed cases, optionally extended by small generated cases under the complexity reservation recorded there. Everything requiring install, network, or packaging is owner-gated and compared against the recorded pre-fix baseline.

**Plan:** the pre-fix behavior for the non-buggy input class is already recorded at `BASE_SHA` (E3.5, E5.1, E5.2) and is the baseline; re-observe the same checks on the fixed SHA and compare.

| ID | Preservation check | Requirement | Status now |
|---|---|---|---|
| PC1 | Production closure equality — 9 entries, same versions | 3.2 | baseline OBSERVED (E3.5); post-fix UNKNOWN |
| PC2 | `npm audit --omit=dev` still exit 0 / 0 vulnerabilities | 3.3 | baseline TESTED (E5.1); post-fix UNKNOWN |
| PC3 | `npm test` passes incl. `desktop-contract`, `gateway-core`, `gateway-http`, `evidence`, `local-browser-contract` | 3.1, 3.4 | post-fix UNKNOWN |
| PC4 | `npm run build`, `npm run smoke` pass; `desktop/main.mjs --smoke-test` completes all seven checks | 3.1 | post-fix UNKNOWN |
| PC5 | `python -m unittest discover -s test/audit`, `-s test/ci`, `tools/check_claims.py .`, `tools/export_audit.py .` all pass | 3.6 | post-fix UNKNOWN |
| PC6 | Changed-file set contains no product source, public docs, claim text, workflow file, or UI file | 3.6, 3.7, 3.8 | enforced by the File-Set Contract; verified against `BASE_SHA` |
| PC7 | Artifact-content check for `tar`/`tmp` absence | 3.5 | **partially narrowed**: ASAR owner-reported clean (HISTORICAL, unrevalidated); installer `.exe`/`.nupkg` **UNKNOWN** → BU4 open. Verified on the candidate **before merge**, under owner-gated `npm run desktop:make` or an owner-dispatched Windows workflow run against the candidate ref |
| PC8 | Build-toolchain functional preservation under any overridden majors | 3.1, 3.5 | **UNKNOWN** (E6.11, E6.12); host-platform packaging gives partial evidence, Windows is owner-gated |

### Unit Tests

- Offline lockfile floor assertions for `tar` and `tmp` (the snapshot dependency contract).
- Comparator unit cases: equal, one-below-floor, one-above-floor, major/minor/patch boundary triples.
- Fail-closed unit cases: prerelease, build metadata, each range specifier form, leading `v`, non-numeric, empty, non-string.
- Structure unit cases: `lockfileVersion` ≠ 3, missing `packages`, node present without `version`, node not an object.
- Explicit-absence unit case: `packages` well-formed and node key absent → pass, with the reason recorded.

### Optional generated cases (complexity-reserved)

Permitted only if they add no test dependency and keep the file small:

- Generate valid `x.y.z` triples and assert `passes ⟺ compare(version, floor) >= 0` for both floors.
- Generate malformed version strings and malformed lockfile shapes and assert the check **always fails** — never skips, never default-passes.

Comparator-algebra properties (totality, antisymmetry, reflexivity, transitivity) are **not required** for this bugfix.

### Integration Tests

- **Owner-gated, post-authorization only:** `npm ci` → `npm test` → `npm run build` → `npm run smoke` → `npm run desktop:package` on the fixed SHA (never an unbound `npx` command), plus `npm audit --omit=dev` (PC2) and `npm audit --include=dev --json` (FC2).
- **Owner-gated Windows candidate verification before merge** (BU4): `npm run desktop:make` on a Windows host, or an owner-dispatched run of the existing `.github/workflows/windows-build.yml` with `ref` set explicitly to the candidate branch, followed by installer/ZIP content inspection. Until that happens, PC7 stays UNKNOWN for `.exe`/`.nupkg`.
- Full local gate sequence per E2.4 recorded against the fixed SHA, with the explicit note that a green result belongs only to that tested SHA. Pull-request CI is not final-main CI.

## Rollback Conditions

If **any** of the following occurs after an owner-authorized remediation begins, **revert the working tree to the pre-change state and keep no partial dependency change**:

| # | Trigger |
|---|---|
| R1 | Any gate in the E2.4 sequence regresses relative to `BASE_SHA` (test, build, smoke, python audit/ci suites, `check_claims.py`, `export_audit.py`, `git diff --check`) |
| R2 | Any change to the production closure — count ≠ 9 or any version differs (PC1) |
| R3 | `npm audit --omit=dev` no longer exits 0 with 0 vulnerabilities (PC2) |
| R4 | Packaging fails under the applied overrides, or `npm run desktop:package` / `npm run desktop:make` errors where it previously succeeded (PC8) |
| R5 | Lockfile drift — `git status --porcelain` not clean after `npm ci` (FC3) |
| R6 | Any change outside the permitted file set (PC6, File-Set Contract) |
| R7 | `test/desktop-contract.test.mjs` or any existing test no longer fully satisfied (3.4) |
| R8 | Any public claim, documentation, or claim-vocabulary byte changes (3.6, E2.5) |

Rollback is all-or-nothing: a partially applied override or a regenerated lockfile without a passing gate sequence must not be left in the tree, staged, committed, or pushed.

## Hard Stop Conditions

On **any** of the following, **stop, report, and change nothing** (no branch, no commit, no push, no pull request):

| # | Trigger | Evidence |
|---|---|---|
| S1 | **BU1 unresolved** — no owner-selected mechanism | BU1, E6.2–E6.5 |
| S2 | Owner authorization for the selected mechanism is absent or ambiguous | AGENTS.md, E2.3 |
| S3 | Remote state unconfirmed at the time of acting — remote `main` differs from the recorded immutable base SHA, or a conflicting open pull request touches `package.json` / `package-lock.json` | BU3, E1.4, E1.5, E1.7 |
| S4 | The required change would touch workflows, product source, `forge.config.mjs`, or public claims | 3.6, 3.7, File-Set Contract, M6 |
| S5 | The audit result would regress (`--omit=dev` no longer clean) or any existing gate would be weakened | PC2, in-scope boundary |
| S6 | The environment cannot execute the required gates (no install permitted, no network, no packaging capability) — a green result may not be claimed or implied | E2.2 (unchecked facts are UNKNOWN; absence of evidence is never a pass) |
| S7 | BU2 changes scope (the observed alert set is not exactly the `tar`/`tmp` findings) | BU2, E1.6 |
| S8 | An owner-gated action would be required (merge, release, tag, deploy, publish, signing, visibility/settings) | E2.1, E2.5 |

**Current state (2026-07-26): S1, S2 and S6 hold.** S3 does not hold for this documentation-only phase (remote state was revalidated: default branch `main`, `main` = `BASE_SHA`, no open pull requests) but must be re-evaluated at implementation time. S7 does not hold under the owner's bounded `tar`/`tmp` scope, while the alert records themselves stay UNKNOWN. S8 holds for merge, release, tag, deploy, publication and signing — none of which is performed.

Therefore the implementation design terminates at the BU1 gate, and the repository remains unchanged outside this spec directory — satisfying Property 3 and expected behavior 2.4.

## Scope Boundaries (carried from Phase 1)

**In scope:** changing dependency resolution so no resolved `tar`/`tmp` node is inside an applicable advisory range, using the **minimum** mechanism achieving FC1–FC3; only the manifest/lockfile changes strictly required; regression protection tied to this defect (the offline snapshot dependency contract) **only** because it needs no workflow change and weakens no gate; evidence recording including residual UNKNOWNs.

**Out of scope:** unrelated cleanup or refactoring; dependency modernization beyond `tar` and `tmp`; workflow redesign including any dev-audit gate (N1/BU5); product behavior changes; new or strengthened public claims; architecture expansion (N2, N3, N4, N5, N6, N8); and every owner-gated action (merge, release, tag, deploy, publish, signing, visibility/settings).
