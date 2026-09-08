import type { EstateEventEnvelope } from "./domain.js";
import { makeId } from "./id.js";

export class EstateEventBus {
  private readonly events: EstateEventEnvelope[] = [];

  constructor(private readonly gatewayUrl?: string) {}

  emit<T>(eventType: string, correlationId: string, payload: T, refs: { releaseId?: string; deploymentId?: string } = {}): EstateEventEnvelope<T> {
    const event: EstateEventEnvelope<T> = {
      eventId: makeId("GA-EVT"),
      eventType,
      source: "ghost-atlas-release-deployment-control-plane",
      occurredAt: new Date().toISOString(),
      correlationId,
      payload,
      ...(refs.releaseId ? { releaseId: refs.releaseId } : {}),
      ...(refs.deploymentId ? { deploymentId: refs.deploymentId } : {})
    };

    this.events.push(event);

    if (this.gatewayUrl) {
      void fetch(this.gatewayUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(event)
      }).catch(() => undefined);
    }

    return event;
  }

  list(): EstateEventEnvelope[] {
    return [...this.events];
  }
}
