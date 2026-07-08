# Three-Minute Demo Review

This page is the fastest safe way to review what the public demo shows.

The demo is intentionally bounded. It should be read as a local, inspectable execution-control path, not as a claim about a larger deployed system.

## 1. Confirm the Frame

Read the repository as a narrow public demo:

```text
Proposal -> Gateway Decision -> Commit -> Evidence -> Verify
```

The important distinction is not that an action exists. The important distinction is whether the bounded demo path can produce the expected follow-on artifacts after a gateway decision.

## 2. Run the Automated Check

From the repository root:

```bash
npm ci
npm run smoke
```

The smoke test starts the local gateway and runs the public probe. A useful review should confirm that both allow and deny behavior are exercised.

## 3. Run the Interactive Demo

Use two terminals:

```bash
npm run gateway
```

```bash
npm run dev
```

Open the demo UI and run the full demo path.

## 4. Inspect the Allow Path

In the allow path, look for these artifacts:

- proposal context
- gateway decision
- commit record
- evidence record
- verify result

The commit should bind the bounded demo run to the proposal and decision context. Verify should check hash, signature, and reference integrity.

## 5. Inspect the Deny Path

In the deny path, look for absence of follow-on bounded-path artifacts:

- no ToolGrant
- no Commit
- no Verify

This means the bounded Pilot path was stopped from producing those artifacts. It does not make a broader claim about everything outside this local demo path.

## 6. Read the Result Correctly

A correct review result is:

```text
The repository demonstrates a bounded local proposal-decision-commit-evidence-verify path.
```

Do not restate the result as a claim about live external workflows, global execution control, certification, or a larger deployed environment.

## 7. Next Documents

After this page, read:

- [Demo Walkthrough](walkthrough.md)
- [Runbook](runbook.md)
- [Threat Model](threat-model.md)
- [Claims and Non-Claims](../claims-and-nonclaims.md)
