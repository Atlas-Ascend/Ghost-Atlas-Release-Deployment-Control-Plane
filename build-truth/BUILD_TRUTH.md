# Build Truth — GA Release Deployment Control Plane v0.1.0

## Verified baseline

```text
VERIFIED_SHA=d208da492f6d93cf09694709ab57a32bd6226a24
GITHUB_ACTIONS_RUN=34176018234
CI_VERIFY=PASS
```

## Required gates

```text
REPOSITORY_IDENTITY=PASS
RELEASE_CONTRACT=PASS
QUALIFIED_BUILD_GATE=PASS
PROMOTION_STATE_MACHINE=PASS
DEPLOYMENT_ADAPTER_BOUNDARY=PASS
ROLLBACK_POINT_CONTRACT=PASS
ESTATE_EVENT_ENVELOPE=PASS
ESTATE_EVENT_GATEWAY_PUBLISHER=PASS
DEPLOYMENT_RECEIPT=PASS
HTTP_CONTROL_API=PASS
TYPECHECK=PASS
TESTS=PASS
BUILD=PASS
```

## Proof criteria

The verified implementation proves all of the following:

- a build with any failed Build Truth / DevOS / SECA gate is rejected
- a qualified build can become a release
- a release must be promoted before deployment
- deployment creates a sealed rollback point before completion
- successful deployment produces `HEALTH_GATE=PASS`
- successful deployment produces a sealed proof receipt
- release/deployment events carry a correlation ID
- configured estate events publish to `GA_EVENT_GATEWAY_URL`
- rollback transitions deployment and release state to `rolled_back`
- provider credentials and deploy hooks are externalized from source
- strict TypeScript compilation passes
- automated state-machine tests pass
- production JavaScript build passes

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
10. Runtime Observatory live feed consumer contract
11. Command Center release console
```

v0.1.0 establishes and verifies the executable release/deployment state machine, provider boundary, proof receipt contract, Render deployment blueprint, and Estate Event Gateway publication seam.
