# Authority Boundaries

## Authority Matrix

### Gateway / Policy
Decides whether a proposed action is allowed within the bounded demo/Core contract.

### Commit
Binds execution artifacts to proposal and decision context.

### Evidence
Records and reconstructs bounded paths.

### Verify
Checks integrity and explains reference status.

### DRE (Declared Runtime Envelope)
Declares intended work surface.

### Observed Surface
Observes bounded/pilot surface.

### Deviation
Compares declared and observed surfaces and recommends.

### Pilot
Demonstrates bounded behavior.

### Lite
Supports addon/browser/cartography context.

### vag-public-demo
Curated private quarantine documentation/demo surface.

## Forbidden Authority Collapses

The following authority collapses are explicitly forbidden:

- Evidence becomes Policy
- Verify becomes Governance
- DRE becomes Authorization
- Deviation blocks independently
- Pilot becomes Core
- Lite becomes Core
- Demo Repo becomes Release Surface
- Deny becomes Sandbox
- Observed Surface becomes Full Telemetry

## Explanation

Each component has a defined and bounded role. No component may assume the authority of another. These boundaries are architectural invariants that must be preserved in all documentation, demo scripts, and public-facing material.
