# Demo Walkthrough

## Overview

This walkthrough demonstrates the bounded demo path through the local VAG demo gateway and UI.

## Prerequisites

- Node.js 18+
- Terminal access

## Steps

### 1. Start the Demo Gateway

```bash
cd demo-gateway
node src/server.mjs
```

Gateway runs on `http://localhost:4400`.

### 2. Start the Demo UI

```bash
cd demo-ui
npm install
npm run dev
```

UI runs on `http://localhost:5173`.

### 3. Open the Demo UI

Navigate to `http://localhost:5173` in your browser.

You will see:
- Mode indicator: "Local Demo / Gateway-Bound Demo"
- Gateway URL display
- Non-Claims panel (always visible)
- Demo control buttons

### 4. Run Allow Path

Click **"Allow Demo"** or **"Run Gateway-Bound Demo"**:

1. Gateway health check
2. Proposal submitted with `scope.intent: demo.transform_json`
3. Gateway allows the proposal (returns `decision_id`)
4. Bounded demo artifacts created (only after gateway allow)
5. Commit sent to gateway with `output_digest` and `decision_id`
6. Verify checks integrity of committed record (HMAC-based)
7. Deny path demonstrates negative evidence (bounded demo path only)

### 5. Run Deny Path

Click **"Deny Demo"**:

1. Gateway health check
2. Proposal submitted with forbidden intent
3. Gateway denies the proposal
4. No ToolGrant produced
5. No Commit produced
6. No Verify produced
7. Negative evidence recorded

### 6. Review Evidence

The Evidence JSON block shows the complete bounded demo evidence including:
- `health`, `allow_run`, `commit`, `verify`, `deny_run`
- `bounded_demo_artifacts`
- `negative_evidence`
- `demo_passed` (true only with full allow+commit+verify+deny chain and all invariants met)
- `truth_surface`, `truth_boundaries`, `non_claims`
- `source`, `truth_status`
- `negative_evidence_scope`: bounded_demo_path_only
- `negative_evidence_source`: ui_derived_from_gateway_deny
- `deny_non_claim`: does_not_prove_system_wide_non_execution

Use the **Copy** button to copy evidence to clipboard.

## Non-Claims

This demo does not claim any of the items listed in the Non-Claims panel.
See `docs/claims-and-nonclaims.md` for the full list.
