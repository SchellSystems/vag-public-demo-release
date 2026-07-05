# Threat Model — Bounded Public Demo

## Scope

This threat model covers only the bounded local demo (demo-gateway + demo-ui).
It does not cover production systems, cloud deployments, or infrastructure.

## Assets

| Asset | Description |
|-------|-------------|
| Demo Gateway | Local HTTP server, deny-by-default decision surface |
| Demo UI | Local React application, browser-only |
| Evidence JSON | Synthetic demo output, reconstructable |

## Trust Boundaries

1. **Gateway ↔ UI**: CORS-restricted to localhost:5173, no credentials
2. **Gateway ↔ External**: No external calls allowed (no HTTP client, no shell, no cloud)
3. **UI ↔ External**: No external calls (all requests go to local gateway only)

## Threats and Mitigations

### T1: Unauthorized Intent Execution

- **Threat**: An unauthorized intent bypasses the allowlist
- **Mitigation**: deny-by-default; only `demo.transform_json` and `demo.ping` allowed
- **Residual risk**: Low in the bounded demo context because the allowlist is hardcoded; not assessed outside this local demo surface

### T2: Top-Level Intent Authorization Bypass

- **Threat**: Using top-level `intent` field to bypass scope authorization
- **Mitigation**: Only `scope.intent` is used for authorization decisions; top-level `intent` is recorded but never authorizes

### T3: Denied Proposal Commitment

- **Threat**: Committing artifacts from a denied proposal
- **Mitigation**: Gateway rejects commit for denied proposals

### T4: Double Commit

- **Threat**: Committing the same proposal twice
- **Mitigation**: Gateway tracks committed proposals and rejects duplicates

### T5: Signature Tampering

- **Threat**: Modifying the signature to forge verification
- **Mitigation**: Verify uses HMAC-SHA256 with timing-safe comparison and rejects mismatches

### T6: Unknown Record Verification

- **Threat**: Verifying a non-existent record
- **Mitigation**: Gateway rejects unknown record hashes

### T7: CORS Bypass

- **Threat**: External origin accessing gateway
- **Mitigation**: CORS restricted to demo-ui origin only, no credentials

### T8: External Call Injection

- **Threat**: Gateway making external network calls
- **Mitigation**: No HTTP client libraries imported; no shell exec; no cloud SDK

### T9: Decision ID Mismatch

- **Threat**: Committing with a forged or mismatched decision_id
- **Mitigation**: Gateway stores decision_id per proposal and rejects mismatches at commit time

### T10: Payload Size Abuse

- **Threat**: Large payloads causing resource exhaustion
- **Mitigation**: Request body limited to 64 KB; oversized payloads rejected

## What This Threat Model Does NOT Cover

- Production deployment threats
- Network-level attacks
- OS-level exploits
- Browser vulnerabilities
- Cloud infrastructure
- Real production systems
- Compliance requirements
- Named external platform integration

## Non-Claims

This threat model does not claim to be a comprehensive assessment.
It covers only the bounded local demo surface.
