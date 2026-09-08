import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { EnvironmentName, ProviderName, QualifiedBuildInput } from "./domain.js";
import type { ReleaseDeploymentEngine } from "./engine.js";
import type { EstateEventBus } from "./events.js";

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

export function createControlPlaneServer(engine: ReleaseDeploymentEngine, events: EstateEventBus) {
  return createServer(async (req, res) => {
    try {
      const method = req.method ?? "GET";
      const url = new URL(req.url ?? "/", "http://localhost");
      const path = url.pathname;

      if (method === "GET" && path === "/health") {
        return json(res, 200, { status: "ok", service: "ghost-atlas-release-deployment-control-plane" });
      }
      if (method === "GET" && path === "/v1/releases") {
        return json(res, 200, { releases: engine.listReleases() });
      }
      if (method === "GET" && path === "/v1/deployments") {
        return json(res, 200, { deployments: engine.listDeployments() });
      }
      if (method === "GET" && path === "/v1/events") {
        return json(res, 200, { events: events.list() });
      }
      if (method === "POST" && path === "/v1/releases") {
        const body = (await readJson(req)) as QualifiedBuildInput;
        return json(res, 201, engine.createRelease(body));
      }

      const promoteMatch = path.match(/^\/v1\/releases\/([^/]+)\/promote$/);
      if (method === "POST" && promoteMatch?.[1]) {
        const body = (await readJson(req)) as { environment?: EnvironmentName };
        if (!body.environment) throw new Error("environment is required");
        return json(res, 200, engine.promote(promoteMatch[1], body.environment));
      }

      const deployMatch = path.match(/^\/v1\/releases\/([^/]+)\/deploy$/);
      if (method === "POST" && deployMatch?.[1]) {
        const body = (await readJson(req)) as { provider?: ProviderName };
        if (!body.provider) throw new Error("provider is required");
        return json(res, 202, await engine.deploy(deployMatch[1], body.provider));
      }

      const rollbackMatch = path.match(/^\/v1\/deployments\/([^/]+)\/rollback$/);
      if (method === "POST" && rollbackMatch?.[1]) {
        return json(res, 200, await engine.rollback(rollbackMatch[1]));
      }

      return json(res, 404, { error: "not_found" });
    } catch (error) {
      return json(res, 400, { error: error instanceof Error ? error.message : String(error) });
    }
  });
}
