# Authority Boundaries — Demo Context

## Overview

The bounded demo implements a strict authority boundary model with deny-by-default semantics.

## Boundary Definitions

### Gateway Authority

The demo gateway has authority to:
- Accept or reject proposals based on `scope.intent` allowlist
- Bind commits to allowed proposals with output digests
- Verify integrity of committed records

The demo gateway does NOT have authority to:
- Execute external tools
- Make network calls
- Access filesystems beyond its own source
- Grant global tool capability
- Authorize production operations
- Provide compliance certification

### UI Authority

The demo UI has authority to:
- Display demo state and evidence
- Send proposals to the local gateway
- Display non-claims

The demo UI does NOT have authority to:
- Execute operations without gateway decision
- Bypass deny decisions
- Produce ToolGrant, Commit, or Verify on denied paths
- Make external network calls

### Evidence Authority

Evidence produced by the demo:
- Reconstructs a bounded demo path
- Contains non-claims explicitly
- Contains truth boundaries

Evidence does NOT:
- Certify compliance
- Prove system-wide enforcement
- Constitute telemetry
- Authorize further operations

## Authorization Model

```
scope.intent → Gateway Allowlist Check → Decision (allow/deny)
                                              │
                                  ┌───────────┴───────────┐
                                  │                       │
                               ALLOW                    DENY
                                  │                       │
                         Create Artifacts          No ToolGrant
                         Commit (bind)             No Commit
                         Verify (integrity)        No Verify
                                  │                       │
                         Evidence (positive)       Evidence (negative)
```

## Key Invariants

1. `scope.intent` is the sole authorization field
2. Top-level `intent` never authorizes
3. Denied proposals cannot produce commits
4. Artifacts are created only after gateway allow
5. Commit requires matching `decision_id` from the proposal
6. Verify checks integrity via HMAC, does not approve or authorize
7. Deny produces negative evidence only (bounded demo path only)
8. `output_digest`, `record_hash`, and `signature` must be 64 lowercase hex

## Non-Claims

These authority boundaries describe only the local bounded demo.
They do not constitute production-level, system-wide, or compliance-level enforcement.
