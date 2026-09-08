export type PresenceConfig = {
  registryUrl: string;
  writeToken: string;
  serviceId: string;
  environment: string;
  version: string;
  baseUrl: string;
  heartbeatIntervalMs: number;
  priority: number;
  capabilities: Record<string, string>;
};

export function presenceConfigFromEnv(env: NodeJS.ProcessEnv = process.env): PresenceConfig | null {
  const registryUrl = env.GA_ESTATE_REGISTRY_URL?.replace(/\/$/, "");
  const writeToken = env.GA_REGISTRY_WRITE_TOKEN;
  const baseUrl = (env.GA_SERVICE_BASE_URL ?? env.RENDER_EXTERNAL_URL)?.replace(/\/$/, "");
  if (!registryUrl || !writeToken || !baseUrl) return null;

  const heartbeatSeconds = Math.max(15, Number(env.GA_PRESENCE_HEARTBEAT_SECONDS ?? 45));
  return {
    registryUrl,
    writeToken,
    serviceId: "estate.release-control",
    environment: env.GA_RUNTIME_ENVIRONMENT ?? "production",
    version: env.GA_SERVICE_VERSION ?? env.RENDER_GIT_COMMIT ?? "0.1.0",
    baseUrl,
    heartbeatIntervalMs: heartbeatSeconds * 1000,
    priority: Math.max(0, Number(env.GA_PRESENCE_PRIORITY ?? 20)),
    capabilities: {
      "estate.release.qualify": "/v1/releases",
      "estate.release.deploy": "/v1/releases/{releaseId}/deploy"
    }
  };
}

async function registryPost(config: PresenceConfig, path: string, body: unknown): Promise<void> {
  const response = await fetch(`${config.registryUrl}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.writeToken}`
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8_000)
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`presence registry ${response.status}: ${detail}`);
  }
}

export async function registerPresence(config: PresenceConfig): Promise<void> {
  await registryPost(config, `/v1/runtime/${encodeURIComponent(config.serviceId)}/register`, {
    environment: config.environment,
    version: config.version,
    base_url: config.baseUrl,
    health: "healthy",
    status: "active",
    priority: config.priority,
    capabilities: config.capabilities,
    metadata: {
      runtime: "node",
      role: "release-deployment-control-plane",
      presence_protocol: "ghost-atlas-runtime-presence-v1"
    }
  });
}

export async function heartbeatPresence(config: PresenceConfig): Promise<void> {
  await registryPost(config, `/v1/runtime/${encodeURIComponent(config.serviceId)}/heartbeat`, {
    environment: config.environment,
    health: "healthy",
    status: "active",
    version: config.version,
    metadata: { heartbeat_source: "resident-process" }
  });
}

export function startPresenceAgent(config: PresenceConfig | null = presenceConfigFromEnv()): () => void {
  if (!config) {
    console.log("Runtime presence disabled: GA_ESTATE_REGISTRY_URL, GA_REGISTRY_WRITE_TOKEN, and GA_SERVICE_BASE_URL/RENDER_EXTERNAL_URL are required.");
    return () => undefined;
  }

  let stopped = false;
  const send = async (register: boolean) => {
    try {
      if (register) await registerPresence(config);
      else await heartbeatPresence(config);
      console.log(`Runtime presence ${register ? "registered" : "heartbeat"}: ${config.serviceId}@${config.environment}`);
    } catch (error) {
      console.error("Runtime presence error", error);
    }
  };

  void send(true);
  const timer = setInterval(() => {
    if (!stopped) void send(false);
  }, config.heartbeatIntervalMs);
  timer.unref?.();

  return () => {
    stopped = true;
    clearInterval(timer);
  };
}
