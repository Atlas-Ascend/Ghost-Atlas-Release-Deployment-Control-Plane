# Build Truth — GA Release Deployment Control Plane v0.1.0

## Required gates

```text
REPOSITORY_IDENTITY=PASS
RELEASE_CONTRACT=PASS
QUALIFIED_BUILD_GATE=PASS
PROMOTION_STATE_MACHINE=PASS
DEPLOYMENT_ADAPTER_BOUNDARY=PASS
ROLLBACK_POINT_CONTRACT=PASS
ESTATE_EVENT_ENVELOPE=PASS
DEPLOYMENT_RECEIPT=PASS
HTTP_CONTROL_API=PASS
TYPECHECK=PENDING_CI
TESTS=PENDING_CI
BUILD=PENDING_CI
```

## Proof criteria

The implementation must prove all of the following:

- a build with any failed Build Truth / DevOS / SECA gate is rejected
- a qualified build can become a release
- a release must be promoted before deployment
- deployment creates a sealed rollback point before completion
- successful deployment produces `HEALTH_GATE=PASS`
- successful deployment produces a sealed proof receipt
- release/deployment events carry a correlation ID
- rollback transitions deployment and release state to `rolled_back`
- provider credentials are externalized from source

## Production hardening queue

```text
1. Neon durable release/run ledger
2. signed artifact provenance / SBOM linkage
3. provider-native Render deployment adapter
4. provider-native Vercel deployment adapter
5. GitHub deployment/status adapter
6. EDEN resident runtime adapter
7. active health-probe policies
8. canary and progressive rollout strategy
9. automatic rollback policy
10. Estate Event Gateway publisher
11. Runtime Observatory live feed
12. Command Center release console
```

The v0.1.0 objective is to establish the executable control-plane contract and verify its state-machine invariants before provider-specific hardening.
