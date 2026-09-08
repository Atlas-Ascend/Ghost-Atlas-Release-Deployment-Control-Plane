import { AdapterRegistry, DeployHookAdapter } from "./adapters.js";
import { ReleaseDeploymentEngine } from "./engine.js";
import { EstateEventBus } from "./events.js";
import { createControlPlaneServer } from "./http.js";
import { startPresenceAgent } from "./presence.js";
import { ControlPlaneStore } from "./store.js";

const port = Number(process.env.PORT ?? 8787);

const adapters = new AdapterRegistry();
adapters.register(new DeployHookAdapter({
  provider: "render",
  ...(process.env.GA_RENDER_DEPLOY_HOOK_URL ? { hookUrl: process.env.GA_RENDER_DEPLOY_HOOK_URL } : {}),
  ...(process.env.GA_RENDER_LIVE_URL ? { liveUrl: process.env.GA_RENDER_LIVE_URL } : {})
}));
adapters.register(new DeployHookAdapter({
  provider: "vercel",
  ...(process.env.GA_VERCEL_DEPLOY_HOOK_URL ? { hookUrl: process.env.GA_VERCEL_DEPLOY_HOOK_URL } : {}),
  ...(process.env.GA_VERCEL_LIVE_URL ? { liveUrl: process.env.GA_VERCEL_LIVE_URL } : {})
}));
adapters.register(new DeployHookAdapter({
  provider: "github",
  ...(process.env.GA_GITHUB_DEPLOY_HOOK_URL ? { hookUrl: process.env.GA_GITHUB_DEPLOY_HOOK_URL } : {})
}));
adapters.register(new DeployHookAdapter({
  provider: "eden",
  ...(process.env.GA_EDEN_DEPLOY_HOOK_URL ? { hookUrl: process.env.GA_EDEN_DEPLOY_HOOK_URL } : {}),
  ...(process.env.GA_EDEN_LIVE_URL ? { liveUrl: process.env.GA_EDEN_LIVE_URL } : {})
}));

const store = new ControlPlaneStore();
const events = new EstateEventBus(process.env.GA_EVENT_GATEWAY_URL);
const engine = new ReleaseDeploymentEngine(store, events, adapters);
const server = createControlPlaneServer(engine, events);

server.listen(port, "0.0.0.0", () => {
  console.log(`Ghost Atlas Release Deployment Control Plane listening on :${port}`);
  startPresenceAgent();
});
