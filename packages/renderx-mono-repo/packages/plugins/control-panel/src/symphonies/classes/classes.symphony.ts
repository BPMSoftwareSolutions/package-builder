import { addClass, removeClass } from "./classes.stage-crew";

// NOTE: Runtime sequences are mounted from JSON (see json-sequences/*). This file only exports handlers.

export const handlers = {
  addClass,
  removeClass,
  notifyUi(data: any, ctx: any) {
    const { id, updatedClasses } = ctx.payload || {};

    if (id && updatedClasses) {
      try {
        // Use EventRouter instead of observer pattern for cross-module communication
        const EventRouter = (globalThis as any).RenderX?.EventRouter;
        if (EventRouter) {
          EventRouter.publish('control.panel.classes.updated', { id, classes: updatedClasses });
          ctx.logger?.info?.('[SYMPHONY] Published control.panel.classes.updated event');
        } else {
          ctx.logger?.warn?.('[SYMPHONY] EventRouter not available on globalThis.RenderX');
        }
      } catch (e) {
        ctx.logger?.warn?.("Control Panel EventRouter publish error:", e);
      }
    }
  },
};
