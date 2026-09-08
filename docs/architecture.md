# Architecture — Release & Deployment Control Plane

## Boundary

This component starts **after** the Ghost Atlas Software Factory has produced a qualified artifact and ends **after** deployment health and proof are emitted.

It does not compile application source, replace MetaForge, or replace DevOS/SECA. It consumes their truth.

## Inputs

- build ID
- immutable artifact digest
- semantic/application version
- service identity
- Build Truth result
- DevOS result
- SECA result
- optional artifact URI and source provenance

## State machine

```text
qualified
   │ promote(environment)
   ▼
promoted
   │ deploy(provider)
   ▼
deploying ───── failure ───→ failed
   │ provider accepted + health gate
   ▼
healthy
   │ rollback
   ▼
rolled_back
```

No deployment is legal from an unpromoted release. No release is legal unless Build Truth, DevOS, and SECA are all `PASS`.

## Data plane vs control plane

The repository is a **control plane**. It decides and records *what should run where*, coordinates the provider action, evaluates the deployment result, and emits proof. Application request traffic remains in the deployed service's data plane.

## Provider boundary

`DeploymentAdapter` is the provider contract. v1 includes deploy-hook adapters for Render, Vercel, GitHub-mediated delivery, and EDEN. A configured hook performs an actual outbound deployment trigger. Without a hook, the adapter runs in deterministic simulation mode for contract testing.

Provider credentials and secret deploy-hook URLs belong in runtime environment configuration, never source control.

## Estate integration

### Upstream

`Ghost-Atlas-Software-Factory-End-to-End-SDLC-Control-Plane`

Expected upstream event/command:

```text
artifact.qualified
buildId
artifactSha
buildTruth=PASS
devos=PASS
seca=PASS
```

### Downstream

`Ghost-Atlas-Estate-Event-Gateway`

Canonical event classes:

- `release.qualified`
- `release.promoted`
- `deployment.started`
- `deployment.healthy`
- `deployment.failed`
- `deployment.rolled_back`

`Ghost-Atlas-Runtime-Observatory` consumes these events to render release/runtime truth.

`Ghost-Atlas-Command-Center` issues operator-authorized release, promotion, deployment, and rollback requests through this API.

## Persistence evolution

v1 ships with an in-memory ledger to make the state machine executable with zero infrastructure. Production hardening replaces `ControlPlaneStore` with the Neon Run Ledger implementation while preserving the domain/API contracts.

Recommended production tables:

```text
releases
deployments
rollback_points
deployment_receipts
estate_events
promotion_audit
```

## Deployment proof

A successful deployment must have:

1. qualified immutable artifact
2. explicit target environment
3. explicit provider
4. sealed rollback point
5. provider acceptance
6. passing health gate
7. deployment receipt
8. Estate Event Envelope output
9. observable correlation chain

This is the bridge from **build truth** to **runtime truth**.
