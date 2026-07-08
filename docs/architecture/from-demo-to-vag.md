# From Public Demo to VAG Architecture

## Purpose

This repository is intentionally small. It is not the full VAG system, not the private Core, and not a production governance product.

It is a bounded public demonstration of one central idea:

```text
An agent action should not be treated as just a prompt and an output.
It should become a controlled, inspectable, bound, and verifiable run.
```

The demo shows that idea in the smallest public form that can be understood, run locally, inspected, and audited without exposing private Core implementation or private research material.

That limitation is not an apology. It is the point. A governance system that cannot state its own boundary is already failing at governance. Humanity somehow made this a market differentiator, so here we are.

---

## What this demo shows

The public demo implements a local bounded execution path:

```text
Proposal
  -> Gateway decision
  -> Allowed execution artifact
  -> Commit
  -> Evidence
  -> Verify
```

The important separation is:

| Step | Meaning in this repository |
|---|---|
| Proposal | A requested action is submitted with a scoped intent. |
| Gateway decision | A local deny-by-default gateway allows or denies the request. |
| Execution artifact | Demo artifacts are created only after an allowed bounded path. |
| Commit | The run is bound to the proposal, decision, and output digest. |
| Evidence | The bounded demo path can be reconstructed. |
| Verify | Hash, signature, and reference integrity are checked. |
| Deny | A denied path does not produce ToolGrant, Commit, or Verify artifacts inside the bounded demo path. |

The demo gateway is deliberately simple. Its allowlist is small. Its storage is local and in-memory. Its HMAC key is a public demo key. Its purpose is not to impress anyone with infrastructure weightlifting. Its purpose is to make the control structure visible.

---

## What this demo does not show

This repository does not include the private VAG Core and does not claim the following:

- live operational readiness
- regulatory readiness
- assurance readiness
- sandbox runtime behavior
- operating system, browser, network, process, filesystem, or cloud blocking
- complete telemetry
- external production platform integration
- named third-party operational integration
- global tool capability authorization
- a full semantic policy engine
- private ontology, private research, or private Core implementation

The public demo is therefore not a weaker version of a production claim. It is a public slice with a defined truth surface.

---

## Why the demo is intentionally bounded

Most agent systems are easy to demonstrate and hard to trust. They can generate outputs, call tools, and log traces, but the hard questions often appear too late:

```text
Who allowed this action?
What exactly was allowed?
What actually got committed?
Can the result be tied back to the decision?
Can the evidence be checked later?
Where does verification stop?
Where does policy authority live?
```

This demo starts with those questions instead of adding them as decorative audit confetti afterward.

The demo is bounded because public trust improves when claims are smaller than the system, not larger than the evidence.

---

## The deeper VAG architecture, at a safe level

The private VAG architecture is broader than this repository. This public demo maps to it as a small surface, not as a complete export.

At a high level, VAG separates several authority and evidence zones:

```text
1. Gateway / Policy
   Material decision authority.

2. Commit / Evidence
   Binding and reconstruction of bounded runs.

3. Verify
   Integrity and reference checking, not approval.

4. Observation / Deviation
   Comparison between declared, expected, and observed surfaces.

5. Context / Claim discipline
   Protection against narrative drift and unsupported system claims.

6. UI / Demo surface
   Human inspection and explanation layer, not authority.
```

The public repository mainly exposes zones 1, 2, 3, and 6 in a minimal local form. It also exposes the claim discipline around them through documentation and audit tools.

---

## Mapping table

| Public demo concept | Deeper VAG direction | Boundary |
|---|---|---|
| `scope.intent` | Scoped action proposal | Demo uses a small static allowlist. |
| Deny-by-default gateway | Gateway / Policy authority | Demo gateway is local and bounded. |
| Commit record | Runtime binding | Demo commit binds proposal, decision, and output digest. |
| Evidence examples | Reconstructable bounded path | Public examples are synthetic and not private runtime evidence. |
| Verify endpoint | Hash/signature/reference integrity | Verify is not approval, authorization, certification, or governance. |
| Deny path | Bounded path stop | Deny does not prove system-wide non-execution. |
| Claim audit | Public claim hygiene | Audit protects public wording, not runtime security. |
| Export audit | Public export hygiene | Audit reduces leak risk, not a complete security review. |

---

## Why Non-Claims are part of the architecture

The Non-Claims in this repository are not legal decoration. They are an architectural invariant.

A system about verifiable governance must not silently convert:

```text
integrity into approval,
evidence into compliance,
deny into global blocking,
observation into full telemetry,
demo behavior into production assurance.
```

Those conversions are authority collapses. They are also how many AI governance products become impressive-looking fog machines. This repository avoids that by making the boundary explicit.

---

## How to read the code

A useful reading path is:

1. `README.md` for the short framing and Non-Claims.
2. `demo-gateway/src/core.mjs` for the local decision, commit, and verify mechanics.
3. `tools/public_demo_probe.mjs` for the full bounded smoke path.
4. `docs/claims-and-nonclaims.md` for the public claim boundary.
5. `tools/check_claims.py` and `tools/export_audit.py` for the release hygiene checks.

The code is intentionally boring in places. Boring is a virtue when the goal is verifiability. Spectacle is cheap. Controlled state transitions are harder to fake without eventually embarrassing yourself in public.

---

## What a reviewer should look for

Good review questions:

- Is the difference between decision, commit, evidence, and verify clear?
- Does the demo avoid pretending to be a production system?
- Does deny stop the bounded demo artifact chain?
- Does verify stay within integrity and reference checking?
- Are the public claims narrower than the implementation?
- Is it obvious what is local demo behavior and what is not shown here?

Bad review questions, because they misunderstand the artifact:

- Why is this not a complete enterprise governance platform?
- Why does the demo not prove full containment?
- Why is the private Core not public?
- Why does a bounded demo not solve every agent safety problem invented before breakfast?

The answer to all of those is the same: because this repository is a scoped public artifact, not a magic wand with a README.

---

## Next public directions

Future public artifacts may extend this surface in controlled steps:

1. A richer decision example with more meaningful scoped policy logic.
2. A clearer declared-vs-observed demo surface.
3. More structured evidence examples.
4. A public architecture overview that explains VAG layers without exposing private implementation.
5. Additional review prompts for external technical critique.

Any such extension should preserve the same rule:

```text
Do not claim more than the public artifact can demonstrate.
```

That rule is not modesty. It is the product philosophy.

---

## Summary

This repository is the first public surface of a larger VAG architecture.

It demonstrates a bounded accountable execution path and the discipline around that path:

```text
propose -> decide -> execute only if allowed -> commit -> evidence -> verify
```

It does not expose the private Core, and it does not claim production governance, sandboxing, compliance, complete telemetry, or global enforcement.

Its value is that it shows a controlled run can be scoped, bound, checked, and honestly described.

That is the bridge from this small demo to the larger VAG architecture.
