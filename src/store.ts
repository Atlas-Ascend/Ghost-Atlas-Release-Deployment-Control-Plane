import type { DeploymentReceipt, DeploymentRecord, ReleaseManifest } from "./domain.js";

export class ControlPlaneStore {
  readonly releases = new Map<string, ReleaseManifest>();
  readonly deployments = new Map<string, DeploymentRecord>();
  readonly receipts = new Map<string, DeploymentReceipt>();

  listReleases(): ReleaseManifest[] {
    return [...this.releases.values()];
  }

  listDeployments(): DeploymentRecord[] {
    return [...this.deployments.values()];
  }
}
