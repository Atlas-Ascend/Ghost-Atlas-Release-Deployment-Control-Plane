import assert from "node:assert/strict";
import test from "node:test";
import { presenceConfigFromEnv } from "../src/presence.js";

test("presence is disabled until registry, token, and public base URL exist", () => {
  assert.equal(presenceConfigFromEnv({}), null);
  assert.equal(presenceConfigFromEnv({ GA_ESTATE_REGISTRY_URL: "https://registry.test" }), null);
});

test("release control advertises canonical release capabilities", () => {
  const config = presenceConfigFromEnv({
    GA_ESTATE_REGISTRY_URL: "https://registry.test/",
    GA_REGISTRY_WRITE_TOKEN: "secret",
    GA_SERVICE_BASE_URL: "https://release.test/",
    GA_RUNTIME_ENVIRONMENT: "production",
    GA_SERVICE_VERSION: "1.2.3",
    GA_PRESENCE_HEARTBEAT_SECONDS: "30",
    GA_PRESENCE_PRIORITY: "7"
  });

  assert.ok(config);
  assert.equal(config.registryUrl, "https://registry.test");
  assert.equal(config.baseUrl, "https://release.test");
  assert.equal(config.serviceId, "estate.release-control");
  assert.equal(config.version, "1.2.3");
  assert.equal(config.heartbeatIntervalMs, 30_000);
  assert.equal(config.priority, 7);
  assert.deepEqual(config.capabilities, {
    "estate.release.qualify": "/v1/releases",
    "estate.release.deploy": "/v1/releases/{releaseId}/deploy"
  });
});

test("heartbeat interval is clamped to prevent lease-spam", () => {
  const config = presenceConfigFromEnv({
    GA_ESTATE_REGISTRY_URL: "https://registry.test",
    GA_REGISTRY_WRITE_TOKEN: "secret",
    GA_SERVICE_BASE_URL: "https://release.test",
    GA_PRESENCE_HEARTBEAT_SECONDS: "1"
  });
  assert.ok(config);
  assert.equal(config.heartbeatIntervalMs, 15_000);
});
