import type { AdapterDeploymentResult, ProviderName, ReleaseManifest } from "./domain.js";
import { makeId } from "./id.js";

export interface DeploymentAdapter {
  readonly provider: ProviderName;
  deploy(release: ReleaseManifest): Promise<AdapterDeploymentResult>;
  rollback(externalDeploymentId: string): Promise<void>;
}

export interface DeployHookConfig {
  provider: ProviderName;
  hookUrl?: string;
  liveUrl?: string;
}

export class DeployHookAdapter implements DeploymentAdapter {
  readonly provider: ProviderName;
  private readonly hookUrl?: string;
  private readonly liveUrl?: string;

  constructor(config: DeployHookConfig) {
    this.provider = config.provider;
    this.hookUrl = config.hookUrl;
    this.liveUrl = config.liveUrl;
  }

  async deploy(release: ReleaseManifest): Promise<AdapterDeploymentResult> {
    const externalDeploymentId = makeId(`GA-${this.provider.toUpperCase()}-DEPLOY`);

    if (this.hookUrl) {
      const response = await fetch(this.hookUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          releaseId: release.releaseId,
          buildId: release.build.buildId,
          artifactSha: release.build.artifactSha,
          service: release.build.service,
          version: release.build.version,
          environment: release.environment
        })
      });

      if (!response.ok) {
        throw new Error(`${this.provider} deployment hook failed with HTTP ${response.status}`);
      }
    }

    return {
      externalDeploymentId,
      status: "healthy",
      ...(this.liveUrl ? { liveUrl: this.liveUrl } : {}),
      providerMetadata: {
        mode: this.hookUrl ? "hook" : "simulation"
      }
    };
  }

  async rollback(_externalDeploymentId: string): Promise<void> {
    // v1 rollback establishes the orchestration contract and sealed rollback point.
    // Provider-native rollback APIs are intentionally adapter-specific follow-ons.
  }
}

export class AdapterRegistry {
  private readonly adapters = new Map<ProviderName, DeploymentAdapter>();

  register(adapter: DeploymentAdapter): void {
    this.adapters.set(adapter.provider, adapter);
  }

  get(provider: ProviderName): DeploymentAdapter {
    const adapter = this.adapters.get(provider);
    if (!adapter) throw new Error(`No deployment adapter registered for ${provider}`);
    return adapter;
  }
}
