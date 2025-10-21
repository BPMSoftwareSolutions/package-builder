import { 
  createCssClass, 
  updateCssClass, 
  deleteCssClass, 
  getCssClass, 
  listCssClasses,
  applyCssClassToElement,
  removeCssClassFromElement
} from "./css-management.stage-crew";

// NOTE: Runtime sequences are mounted from JSON (see json-sequences/*). This file only exports handlers.

export const handlers = {
  createCssClass,
  updateCssClass,
  deleteCssClass,
  getCssClass,
  listCssClasses,
  applyCssClassToElement,
  removeCssClassFromElement,
  
  notifyUi(data: any, ctx: any) {
    const { success, className, content, error } = ctx.payload || {};

    try {
      // Use EventRouter instead of observer pattern for cross-module communication
      const EventRouter = (globalThis as any).RenderX?.EventRouter;
      if (EventRouter) {
        EventRouter.publish('control.panel.css.registry.updated', { 
          success, 
          className, 
          content, 
          error,
          timestamp: Date.now()
        });
        ctx.logger?.info?.('[SYMPHONY] Published control.panel.css.registry.updated event');
      } else {
        ctx.logger?.warn?.('[SYMPHONY] EventRouter not available on globalThis.RenderX');
      }
    } catch (e) {
      ctx.logger?.warn?.("Control Panel EventRouter publish error:", e);
    }
  },
};
