import { deriveSelectionModel } from "./selection.stage-crew";

// NOTE: Runtime sequences are mounted from JSON (see json-sequences/*). This file only exports handlers.

export const handlers = {
  deriveSelectionModel,
  notifyUi(_data: any, ctx: any) {
    ctx.logger?.info?.('[SYMPHONY] selection.symphony notifyUi called with data:', _data, 'ctx.payload:', ctx.payload);
    const selectionModel = ctx.payload?.selectionModel;
    ctx.logger?.info?.('[SYMPHONY] selectionModel extracted:', selectionModel);
    ctx.logger?.info?.('[SYMPHONY] Publishing selection update via EventRouter, selectionModel:', selectionModel);

    if (selectionModel) {
      try {
        // Use EventRouter instead of observer pattern for cross-module communication
        const EventRouter = (globalThis as any).RenderX?.EventRouter;
        ctx.logger?.info?.('[SYMPHONY] EventRouter found:', !!EventRouter);
        if (EventRouter) {
          ctx.logger?.info?.('[SYMPHONY] Publishing control.panel.selection.updated with:', selectionModel);
          EventRouter.publish('control.panel.selection.updated', selectionModel);
          ctx.logger?.info?.('[SYMPHONY] Published control.panel.selection.updated event successfully');
          ctx.logger?.info?.('[SYMPHONY] Published control.panel.selection.updated event');
        } else {
          ctx.logger?.warn?.('[SYMPHONY] EventRouter not available on globalThis.RenderX');
          ctx.logger?.warn?.('[SYMPHONY] EventRouter not available on globalThis.RenderX');
        }
      } catch (e) {
        ctx.logger?.warn?.("Control Panel EventRouter publish error:", e);
      }
    } else {
      ctx.logger?.warn?.('[SYMPHONY] Missing selectionModel, cannot publish update');
    }
    // IMPORTANT: Do not republish the 'canvas.component.selection.changed' topic here.
    // This symphony is triggered BY that topic; republishing would cause a loop.
  },
};
