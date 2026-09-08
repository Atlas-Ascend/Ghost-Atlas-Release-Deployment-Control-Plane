export type GateStatus = "PASS" | "FAIL";
export type ProviderName = "render" | "vercel" | "github" | "eden";
export type EnvironmentName = "development" | "staging" | "production";
export type ReleaseState =
  | "qualified"
  | "promoted"
  | "deploying"
  | "healthy"
  | "failed"
  | "rolled_back";

export interface QualifiedBuildInput {
  buildId: string;
  artifactSha: string;
  buildTruth: GateStatus;
  devos: GateStatus;
  seca: GateStatus;
  version: string;
  service: string;
  artifactUri?: string;
  sourceRepository?: string;
  sourceCommit?: string;
}

export interface MigrationIntent {
  required: boolean;
  migrationId?: string;
  reversible?: boolean;
}

export interface ReleaseManifest {
  releaseId: string;
  createdAt: string;
  build: QualifiedBuildInput;
  state: ReleaseState;
  environment?: EnvironmentName;
  migration?: MigrationIntent;
}

export interface DeploymentRequest {
  releaseId: string;
  provider: ProviderName;
  environment: EnvironmentName;
}

export interface AdapterDeploymentResult {
  externalDeploymentId: string;
  status: "accepted" | "healthy";
  liveUrl?: string;
  providerMetadata?: Record<string, string>;
}

export interface RollbackPoint {
  rollbackPointId: string;
  deploymentId: string;
  releaseId: string;
  createdAt: string;
  sealed: true;
}

export interface DeploymentRecord {
  deploymentId: string;
  releaseId: string;
  provider: ProviderName;
  environment: EnvironmentName;
  externalDeploymentId: string;
  state: "deploying" | "healthy" | "failed" | "rolled_back";
  healthGate: GateStatus;
  rollbackPoint: RollbackPoint;
  liveUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EstateEventEnvelope<T = unknown> {
  eventId: string;
  eventType: string;
  source: "ghost-atlas-release-deployment-control-plane";
  occurredAt: string;
  correlationId: string;
  releaseId?: string;
  deploymentId?: string;
  payload: T;
}

export interface DeploymentReceipt {
  receiptId: string;
  releaseId: string;
  deploymentId: string;
  provider: ProviderName;
  environment: EnvironmentName;
  deployment: GateStatus;
  healthGate: GateStatus;
  rollbackPoint: "SEALED";
  proofReceipt: "SEALED";
  liveUrl?: string;
  emittedAt: string;
}
