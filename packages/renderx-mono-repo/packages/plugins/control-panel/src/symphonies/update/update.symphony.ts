import { updateFromElement } from "./update.stage-crew";
import { isFlagEnabled } from "@renderx-plugins/host-sdk";

// NOTE: Runtime sequences are mounted from JSON (see json-sequences/*). This file only exports handlers.

const lastLayoutById: Record<
  string,
  { x: number; y: number; width: number; height: number }
> = {};
let lastNotifyAt = 0;
const DEFAULT_DEDUPE_WINDOW_MS = 150;

const LAYOUT_EPS = 1.0; // flag-based tuning moved to runtime check below

export const handlers = {
  updateFromElement,
  notifyUi(data: any, ctx: any) {
    const selectionModel = ctx.payload?.selectionModel;
    const source = ctx.payload?._source;

    if (!selectionModel) return;

    // Drop redundant layout-only updates during drag/resize
    const id = selectionModel?.header?.id;
    const layout = selectionModel?.layout;
    if (id && layout && (source === "drag" || source === "resize")) {
      const last = lastLayoutById[id];
      // Allow raising EPS via flag for jitter suppression
      let eps = LAYOUT_EPS;
      try {
        // Prefer centralized feature flags; fall back to global for legacy overrides
        const flagOn = isFlagEnabled("perf.cp.layout-eps");
        if (flagOn) {
          // Optional: support numeric override via global for quick A/B until JSON carries values
          const flags = (globalThis as any).__cpPerf || {};
          if (flags.layoutEps && Number.isFinite(Number(flags.layoutEps))) {
            eps = Number(flags.layoutEps);
          }
        }
      } catch {}

      const changed =
        !last ||
        Math.abs(layout.x - last.x) > eps ||
        Math.abs(layout.y - last.y) > eps ||
        Math.abs(layout.width - last.width) > eps ||
        Math.abs(layout.height - last.height) > eps;
      if (!changed) return;

      lastLayoutById[id] = { ...layout };
    }

    // Window-based deduplication for high-freq update events
    let windowMs = DEFAULT_DEDUPE_WINDOW_MS;
    try {
      const flags = (globalThis as any).__cpPerf || {};
      if (flags.dedupeWindow && Number.isFinite(Number(flags.dedupeWindow))) {
        windowMs = Number(flags.dedupeWindow);
      }
    } catch {}

    const now = Date.now();
    if (now - lastNotifyAt < windowMs) return;
    lastNotifyAt = now;

    try {
      // Use EventRouter instead of observer pattern for cross-module communication
      const EventRouter = (globalThis as any).RenderX?.EventRouter;
      if (EventRouter) {
        EventRouter.publish('control.panel.selection.updated', selectionModel);
        ctx.logger?.info?.('[SYMPHONY] Published control.panel.selection.updated event');
      } else {
        ctx.logger?.warn?.('[SYMPHONY] EventRouter not available on globalThis.RenderX');
      }
    } catch (e) {
      ctx.logger?.warn?.("Control Panel EventRouter publish error:", e);
    }
  },
};
