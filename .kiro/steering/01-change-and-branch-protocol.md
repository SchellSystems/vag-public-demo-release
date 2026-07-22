---
inclusion: always
---

# Change and Branch Protocol

## Before writing

1. Restate the requested outcome and concrete success criteria.
2. Revalidate `main`, the working tree, base SHA, open PRs, review threads, and relevant CI.
3. Identify the exact expected file set and prohibited side effects.
4. Read every existing file before modifying it and inspect adjacent contracts that could drift.
5. Separate verified facts, inferences, proposals, warnings, and `UNKNOWN`s.

If the task is unclear, externally consequential, or requires an owner gate, stop and request the missing decision.

## Branch and diff discipline

- Create a descriptive task branch from the revalidated `main` SHA.
- Never commit or push directly to `main`.
- Keep one concern per branch and pull request.
- Do not add unrelated cleanup or opportunistic fixes.
- Do not change dependencies, lockfiles, workflows, release metadata, product behavior, or public claims unless they are explicitly in scope.
- Stage specific paths and inspect both the staged diff and the full `main...HEAD` diff.
- Use a new commit after a hook failure; do not bypass hooks or rewrite shared history without explicit authorization.

If another open PR exposes an issue outside scope, report and link it; do not absorb it into the current diff.

## Owner-only gates

Technical capability is not authorization. Require a separate, explicit owner decision before each of these actions:

- merge or auto-merge
- release, package publication, or tag creation
- deployment or external rollout
- repository visibility change or public export
- default-branch or protection changes
- branch deletion
- force-push or history rewrite
- scope expansion that changes claims or authority

A request to implement or open a draft PR does not imply any of these decisions.

## Review handoff

Prefer a draft PR while review or owner gates remain. The handoff must include:

- role, bounded scope, base/head branch, and base/head SHA
- exact changed-file set
- what changed and why
- claim and authority impact
- explicit non-actions
- exact validation results and warnings
- limitations, unresolved threads, and `UNKNOWN`s
- focused review questions
- owner decisions still required

Before any authorized merge, refresh `main`, review every unresolved thread, compare the final diff again, rerun the required gates against the final candidate, and wait for main-push CI before making a final-main statement.
