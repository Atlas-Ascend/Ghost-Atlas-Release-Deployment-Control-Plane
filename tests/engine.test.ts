import assert from "node:assert/strict";
import test from "node:test";
import { AdapterRegistry, DeployHookAdapter } from "../src/adapters.js";
import { ReleaseDeploymentEngine } from "../src/engine.js";
import { EstateEventBus } from "../src/events.js";
import { ControlPlaneStore } from "../src/store.js";

function fixture() {
  const store = new ControlPlaneStore();
  const events = new EstateEventBus();
  const adapters = new AdapterRegistry();
  adapters.register(new DeployHookAdapter({ provider: "render", liveUrl: "https://example.invalid" }));
  return { store, events, engine: new ReleaseDeploymentEngine(store, events, adapters) };
}

test("rejects an unqualified build", () => {
  const { engine } = fixture();
  assert.throws(() => engine.createRelease({
    buildId: "GA-BUILD-FAIL",
    artifactSha: "sha256:deadbeef",
    buildTruth: "PASS",
    devos: "FAIL",
    seca: "PASS",
    version: "0.1.0",
    service: "runtime-gateway"
  }), /Release denied/);
});

test("qualified artifact promotes, deploys, emits proof, and rolls back", async () => {
  const { engine, events } = fixture();
  const release = engine.createRelease({
    buildId: "GA-BUILD-0042",
    artifactSha: "sha256:cafebabe",
    buildTruth: "PASS",
    devos: "PASS",
    seca: "PASS",
    version: "0.1.0",
    service: "runtime-gateway"
  });

  engine.promote(release.releaseId, "production");
  const { deployment, receipt } = await engine.deploy(release.releaseId, "render");

  assert.equal(deployment.state, "healthy");
  assert.equal(deployment.healthGate, "PASS");
  assert.equal(receipt.proofReceipt, "SEALED");
  assert.equal(receipt.rollbackPoint, "SEALED");
  assert.ok(events.list().some((event) => event.eventType === "deployment.healthy"));

  const rolledBack = await engine.rollback(deployment.deploymentId);
  assert.equal(rolledBack.state, "rolled_back");
  assert.ok(events.list().some((event) => event.eventType === "deployment.rolled_back"));
});
