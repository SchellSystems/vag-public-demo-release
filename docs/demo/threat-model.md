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

1. **Gateway ↔ UI**: The gateway returns a CORS response header for the configured demo-UI origin; no credentials are used. CORS is not authentication or a network boundary.
2. **Gateway ↔ External**: The current gateway implementation contains no outbound HTTP client, shell, or cloud-SDK path. This is an implementation statement, not isolation.
3. **UI ↔ Gateway**: The current UI client is configured to request the local demo gateway. This does not enforce loopback-only network binding.

## Threats and Mitigations

### T1: Unauthorized Proposal Acceptance or Commit

- **Threat**: An unauthorized intent is accepted or a denied proposal is committed
- **Mitigation**: deny-by-default; only `demo.transform_json` and `demo.ping` allowed
- **Residual boundary**: The static allowlist and commit rejection are tested only within this bounded demo implementation; no broader risk level is assigned

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

### T7: CORS Misinterpretation

- **Threat**: A reviewer treats the configured CORS response header as authentication, request blocking, or network isolation
- **Mitigation**: Documentation states that CORS only controls browser response access for the configured origin; it does not block non-browser requests or enforce loopback binding

### T8: Unintended Outbound Call Path

- **Threat**: A future change introduces an outbound HTTP, shell, or cloud call path
- **Mitigation**: The current implementation imports no outbound HTTP client, shell execution API, or cloud SDK; this does not constitute a sandbox or network block

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
