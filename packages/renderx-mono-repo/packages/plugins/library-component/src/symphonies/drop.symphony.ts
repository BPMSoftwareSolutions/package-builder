// NOTE: Runtime sequences are mounted from JSON (see json-sequences/*). This file only exports handlers.
import { EventRouter } from "@renderx-plugins/host-sdk";

// Browser-compatible UUID generator
const generateUUID = (): string => {
  // Use browser's native crypto.randomUUID() if available
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for older browsers
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const handlers = {
  async publishCreateRequested(data: any, ctx: any) {
    const correlationId =
      data?.correlationId || generateUUID() || String(Date.now());
    await EventRouter.publish(
      "canvas.component.create.requested",
      {
        component: data.component,
        position: data.position,
        containerId: data.containerId,
        correlationId,
      },
      ctx.conductor
    );
  },
};

