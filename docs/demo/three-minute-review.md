# Three-Minute Demo Review

This page is the fastest safe way to review what the public demo shows.

The demo is intentionally bounded. It should be read as a local, inspectable record-and-integrity path, not as a claim about a larger deployed system.

## 1. Confirm the Frame

Read the repository as a narrow public demo:

```text
Proposal -> Gateway Decision -> UI-created Artifact -> Digest -> Commit -> Evidence -> Verify
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
- UI-created local demo artifact
- caller-supplied `output_digest`
- commit record
- evidence record
- verify result

The commit should bind the proposal, decision, and caller-supplied digest. Verify should check the stored hash, signature, and reference relationships. The gateway does not observe external execution or receive the artifact itself.

## 5. Inspect the Deny Path

In the deny path, confirm that the gateway returns deny and rejects a commit attempt for the denied proposal. The UI then derives the absence of its bounded follow-on chain:

- no UI-created demo artifact
- no Commit
- no Verify

This is a UI-derived statement about the bounded public-demo path. The repository contains no ToolGrant subsystem, and the result is not evidence about execution outside this local demo path.

## 6. Read the Result Correctly

A correct review result is:

```text
The repository demonstrates a bounded local proposal-decision-artifact-digest-commit-evidence-verify path.
```

Do not restate the result as a claim about live external workflows, global execution control, certification, or a larger deployed environment.

## 7. Next Documents

After this page, read:

- [Demo Walkthrough](walkthrough.md)
- [Runbook](runbook.md)
- [Threat Model](threat-model.md)
- [Claims and Non-Claims](../claims-and-nonclaims.md)
