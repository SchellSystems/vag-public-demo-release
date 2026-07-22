# Demo Walkthrough

## Overview

This walkthrough demonstrates the bounded demo path through the local VAG demo gateway and UI.

## Prerequisites

- Node.js `>=20.19.0`; the public demo audit workflow uses Node.js 22
- npm
- Terminal access

Run all commands from the repository root unless a section says otherwise.

## Steps

### 1. Install Dependencies

```bash
npm ci
```

This installs the root workspaces for both `demo-gateway` and `demo-ui`.

### 2. Start the Demo Gateway

In the first terminal:

```bash
npm run gateway
```

Gateway runs on `http://127.0.0.1:4400`.

### 3. Start the Demo UI

In the second terminal:

```bash
npm run dev
```

UI runs on `http://127.0.0.1:5173`.

### 4. Open the Demo UI

Navigate to `http://127.0.0.1:5173` in your browser.

You will see:

- Mode indicator: "Local Demo / Gateway-Bound Demo"
- Gateway URL display
- Non-Claims panel (always visible)
- Demo control buttons

### 5. Run Allow Path

Click **"Allow Demo"** or **"Run Gateway-Bound Demo"**:

1. Gateway health check
2. Proposal submitted with `scope.intent: demo.transform_json`
3. Gateway allows the proposal (returns `decision_id`)
4. UI creates a local demo artifact after gateway allow
5. UI computes and supplies `output_digest` with `decision_id`
6. Commit binds proposal, decision, and the caller-supplied digest
7. Verify checks stored hash, signature, and reference relationships
8. Deny path demonstrates UI-derived negative evidence (bounded to the observed UI path only)

### 6. Run Deny Path

Click **"Deny Demo"**:

1. Gateway health check
2. Proposal submitted with forbidden intent
3. Gateway denies the proposal
4. The bounded UI flow creates no local demo artifact
5. No Commit or Verify follows in that UI flow
6. The gateway would reject a commit attempt for the denied proposal
7. UI-derived negative evidence is recorded for this observed UI path

### 7. Review Evidence

The Evidence JSON block shows UI-assembled bounded demo review material including:

- `health`, `allow_run`, `commit`, `verify`, `deny_run`
- `bounded_demo_artifacts`
- `negative_evidence`
- `demo_passed` (true only with full allow+commit+verify+deny chain and all invariants met)
- `truth_surface`, `truth_boundaries`, `non_claims`
- `source`, `truth_status`
- `negative_evidence_scope`: bounded_ui_path_only
- `negative_evidence_source`: ui_derived_from_gateway_deny
- `deny_non_claim`: does_not_prove_system_wide_non_execution

The gateway receives the digest, not the local artifact, and does not observe external execution. The repository contains no ToolGrant subsystem.

Use the **Copy** button to copy evidence to clipboard.

## Validation Checklist

Before submitting any change, run the repository-standard validation from the repository root:

```bash
python tools/check_claims.py .
python tools/export_audit.py .
npm ci
npm audit --omit=dev
npm test
npm run build
npm run smoke
git diff --check
```

## Non-Claims

This demo does not claim any of the items listed in the Non-Claims panel.
See `docs/claims-and-nonclaims.md` for the full list.
