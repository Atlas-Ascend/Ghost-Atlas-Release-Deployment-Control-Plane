# Ghost Atlas Release Deployment Control Plane

**Technical role:** Continuous Delivery / Release Engineering / Deployment Orchestration Control Plane

This repository owns the transition from a **qualified Ghost Atlas software artifact** to a **running, versioned, observable, rollback-safe deployment**.

## Canonical placement

```text
ARCHITECT
  ↓
ATLAS MIND
  ↓
JANUS / ODIN
  ↓
PACKET OS
  ↓
WORKFORCE SPINE
  ↓
GHOST ATLAS SOFTWARE FACTORY
  ↓ qualified artifact
┌──────────────────────────────────────────────┐
│ RELEASE + DEPLOYMENT CONTROL PLANE          │
│ release manifest → gates → promotion        │
│ deploy → health → receipt → rollback point  │
└──────────────────────┬───────────────────────┘
                       ↓
          RUNTIME FABRIC / PROVIDERS
        Render · Vercel · EDEN · GitHub
                       ↓
             ESTATE EVENT GATEWAY
                       ↓
             RUNTIME OBSERVATORY
                       ↓
      COMMAND CENTER / LIVE OPERATIONS THEATER
```

## Control-plane law

A build is not a release. A release is not a deployment. A deployment is not proven until its health gate passes and a durable receipt is emitted.

```text
COMMAND → BUILD → VERIFY → PACKAGE → RELEASE → DEPLOY → HEALTH → OBSERVE → PROVE
```

## v1 responsibilities

- validate qualified build inputs from the Software Factory
- create immutable release manifests
- promote releases through named environments
- dispatch deployments through provider adapters
- enforce pre-deploy and post-deploy gates
- coordinate database migration intent
- create rollback points before mutation
- emit Estate Event Envelope-compatible events
- issue machine-readable deployment receipts
- expose release/deployment status to Runtime Observatory

## Provider adapters

- `render`
- `vercel`
- `github`
- `eden`
- `neon` migration coordination

Adapters are explicit boundaries. Provider credentials are never committed to this repository.

## API

```text
GET  /health
GET  /v1/releases
POST /v1/releases
POST /v1/releases/:id/promote
POST /v1/releases/:id/deploy
POST /v1/deployments/:id/rollback
GET  /v1/events
```

## Release contract

A deployable release begins with a qualified artifact:

```json
{
  "buildId": "GA-BUILD-0042",
  "artifactSha": "sha256:...",
  "buildTruth": "PASS",
  "devos": "PASS",
  "seca": "PASS",
  "version": "0.1.0",
  "service": "runtime-gateway"
}
```

Successful production deployment yields:

```text
RELEASE_ID=GA-REL-...
DEPLOYMENT=PASS
HEALTH_GATE=PASS
ROLLBACK_POINT=SEALED
PROOF_RECEIPT=SEALED
```

## Local development

```bash
npm install
npm run typecheck
npm test
npm run build
npm start
```

Default port: `8787`.

## Environment

```text
PORT=8787
GA_DEFAULT_PROVIDER=render
GA_EVENT_GATEWAY_URL=
GA_RUNTIME_OBSERVATORY_URL=
RENDER_API_KEY=
VERCEL_TOKEN=
GITHUB_TOKEN=
NEON_DATABASE_URL=
```

No credential is required for local simulation mode.

## Build truth

The repository is considered implementation-ready when:

```text
TYPECHECK=PASS
TESTS=PASS
BUILD=PASS
RELEASE_CONTRACT=PASS
PROMOTION_GATE=PASS
ROLLBACK_CONTRACT=PASS
EVENT_ENVELOPE=PASS
```

See [`docs/architecture.md`](docs/architecture.md) and [`build-truth/BUILD_TRUTH.md`](build-truth/BUILD_TRUTH.md).
