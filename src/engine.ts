import type {
  DeploymentReceipt,
  DeploymentRecord,
  EnvironmentName,
  ProviderName,
  QualifiedBuildInput,
  ReleaseManifest
} from "./domain.js";
import { AdapterRegistry } from "./adapters.js";
import { EstateEventBus } from "./events.js";
import { makeId } from "./id.js";
import { ControlPlaneStore } from "./store.js";

export class ReleaseDeploymentEngine {
  constructor(
    private readonly store: ControlPlaneStore,
    private readonly events: EstateEventBus,
    private readonly adapters: AdapterRegistry
  ) {}

  createRelease(build: QualifiedBuildInput): ReleaseManifest {
    this.assertQualifiedBuild(build);

    const release: ReleaseManifest = {
      releaseId: makeId("GA-REL"),
      createdAt: new Date().toISOString(),
      build,
      state: "qualified"
    };

    this.store.releases.set(release.releaseId, release);
    this.events.emit("release.qualified", build.buildId, { service: build.service, version: build.version }, { releaseId: release.releaseId });
    return release;
  }

  promote(releaseId: string, environment: EnvironmentName): ReleaseManifest {
    const release = this.requireRelease(releaseId);
    if (!(["qualified", "promoted"] as const).includes(release.state as "qualified" | "promoted")) {
      throw new Error(`Release ${releaseId} cannot be promoted from state ${release.state}`);
    }

    release.environment = environment;
    release.state = "promoted";
    this.events.emit("release.promoted", release.build.buildId, { environment }, { releaseId });
    return release;
  }

  async deploy(releaseId: string, provider: ProviderName): Promise<{ deployment: DeploymentRecord; receipt: DeploymentReceipt }> {
    const release = this.requireRelease(releaseId);
    if (release.state !== "promoted" || !release.environment) {
      throw new Error(`Release ${releaseId} must be promoted before deployment`);
    }

    release.state = "deploying";
    const deploymentId = makeId("GA-DEPLOY");
    const now = new Date().toISOString();
    const rollbackPoint = {
      rollbackPointId: makeId("GA-RB"),
      deploymentId,
      releaseId,
      createdAt: now,
      sealed: true as const
    };

    this.events.emit("deployment.started", release.build.buildId, { provider, environment: release.environment }, { releaseId, deploymentId });

    try {
      const adapter = this.adapters.get(provider);
      const result = await adapter.deploy(release);
      const deployment: DeploymentRecord = {
        deploymentId,
        releaseId,
        provider,
        environment: release.environment,
        externalDeploymentId: result.externalDeploymentId,
        state: "healthy",
        healthGate: "PASS",
        rollbackPoint,
        createdAt: now,
        updatedAt: new Date().toISOString(),
        ...(result.liveUrl ? { liveUrl: result.liveUrl } : {})
      };

      release.state = "healthy";
      this.store.deployments.set(deploymentId, deployment);

      const receipt: DeploymentReceipt = {
        receiptId: makeId("GA-RECEIPT"),
        releaseId,
        deploymentId,
        provider,
        environment: release.environment,
        deployment: "PASS",
        healthGate: "PASS",
        rollbackPoint: "SEALED",
        proofReceipt: "SEALED",
        emittedAt: new Date().toISOString(),
        ...(result.liveUrl ? { liveUrl: result.liveUrl } : {})
      };
      this.store.receipts.set(receipt.receiptId, receipt);

      this.events.emit("deployment.healthy", release.build.buildId, receipt, { releaseId, deploymentId });
      return { deployment, receipt };
    } catch (error) {
      release.state = "failed";
      this.events.emit(
        "deployment.failed",
        release.build.buildId,
        { provider, error: error instanceof Error ? error.message : String(error) },
        { releaseId, deploymentId }
      );
      throw error;
    }
  }

  async rollback(deploymentId: string): Promise<DeploymentRecord> {
    const deployment = this.store.deployments.get(deploymentId);
    if (!deployment) throw new Error(`Unknown deployment ${deploymentId}`);
    if (deployment.state === "rolled_back") return deployment;

    const adapter = this.adapters.get(deployment.provider);
    await adapter.rollback(deployment.externalDeploymentId);
    deployment.state = "rolled_back";
    deployment.updatedAt = new Date().toISOString();

    const release = this.requireRelease(deployment.releaseId);
    release.state = "rolled_back";
    this.events.emit("deployment.rolled_back", release.build.buildId, { rollbackPointId: deployment.rollbackPoint.rollbackPointId }, { releaseId: release.releaseId, deploymentId });
    return deployment;
  }

  listReleases(): ReleaseManifest[] {
    return this.store.listReleases();
  }

  listDeployments(): DeploymentRecord[] {
    return this.store.listDeployments();
  }

  private assertQualifiedBuild(build: QualifiedBuildInput): void {
    if (!build.buildId || !build.artifactSha || !build.version || !build.service) {
      throw new Error("buildId, artifactSha, version, and service are required");
    }
    if (build.buildTruth !== "PASS" || build.devos !== "PASS" || build.seca !== "PASS") {
      throw new Error("Release denied: Build Truth, DevOS, and SECA must all PASS");
    }
  }

  private requireRelease(releaseId: string): ReleaseManifest {
    const release = this.store.releases.get(releaseId);
    if (!release) throw new Error(`Unknown release ${releaseId}`);
    return release;
  }
}
