# Authority Boundaries — Demo Context

## Overview

The bounded demo implements a strict authority boundary model with deny-by-default semantics.

## Boundary Definitions

### Gateway Authority

The demo gateway has authority to:
- Accept or reject proposals based on `scope.intent` allowlist
- Bind an allowed proposal, its decision, and a caller-supplied output digest
- Check stored hash, signature, and proposal/decision reference relationships

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
- Create a local demo artifact after allow and supply its digest
- Assemble bounded review material, including UI-derived negative evidence
- Display non-claims

The demo UI does NOT have authority to:
- Bypass deny decisions
- Create Gateway Commit or Verify results itself
- Turn UI-derived absence into system-wide observation
- Make external network calls

### Evidence Authority

Evidence produced by the demo:
- Reconstructs a bounded demo path
- Distinguishes gateway records from UI-derived statements
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
                         UI creates artifact       Commit rejected
                         Supply digest             UI creates no artifact
                         Commit (bind)             No Commit / Verify
                         Verify (checks)           in bounded UI path
                                  │                       │
                         Review material           UI-derived negative
                                                   review material
```

## Key Invariants

1. `scope.intent` is the sole authorization field
2. Top-level `intent` never authorizes
3. Denied proposals cannot produce commits
4. The UI creates its local demo artifact only after gateway allow
5. The gateway receives a caller-supplied digest, not the artifact itself
6. Commit requires the matching `decision_id` and binds proposal, decision, and digest
7. Verify checks stored relationships via HMAC/hash/reference checks; it does not approve or authorize
8. Deny-path negative evidence is UI-derived and bounded to that UI flow
9. This repository contains no ToolGrant subsystem
10. `output_digest`, `record_hash`, and `signature` must be 64 lowercase hex

## Non-Claims

These authority boundaries describe only the local bounded demo.
They do not constitute production-level, system-wide, or compliance-level enforcement.
