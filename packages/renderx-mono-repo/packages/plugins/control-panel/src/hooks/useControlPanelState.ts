import React from "react";
import { EventRouter as SdkEventRouter } from "@renderx-plugins/host-sdk";
import {
  controlPanelReducer,
  initialControlPanelState,
} from "../state/control-panel.reducer";
// Import for future use - currently unused but reserved for development
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { ControlPanelAction } from "../types/control-panel.types";

export function useControlPanelState() {
  const [state, dispatch] = React.useReducer(
    controlPanelReducer,
    initialControlPanelState
  );

  React.useEffect(() => {
    // Resolve EventRouter references. For UI subscriptions we PREFER the host global router,
    // because selection updates are published via window.RenderX.EventRouter by the symphonies.
    const globalRouter = (globalThis as any)?.RenderX?.EventRouter;
    const hasGlobal = !!(globalRouter && typeof globalRouter.subscribe === 'function');
    const hasSdk = !!(SdkEventRouter && typeof (SdkEventRouter as any).subscribe === 'function');

    try {
      console.log('[cp] useControlPanelState: mounting subscriptions', {
        hasSdkRouter: !!SdkEventRouter,
        sdkHasSubscribe: hasSdk,
        hasGlobalRouter: !!(globalThis as any)?.RenderX?.EventRouter,
        globalHasSubscribe: hasGlobal,
      });
    } catch {}

    if (!hasGlobal && !hasSdk) {
      try { console.warn('[cp] useControlPanelState: No EventRouter available; UI will not react to selection updates'); } catch {}
      return () => {};
    }

    const unsubs: Array<() => void> = [];

    const subscribeWith = (router: any, label: string) => {
      try {
        const u1 = router.subscribe('control.panel.selection.updated', (selectionModel: any) => {
          try { console.log(`[cp] useControlPanelState:${label} selection.updated`, { id: selectionModel?.header?.id, type: selectionModel?.header?.type }); } catch {}
          dispatch({ type: "SET_SELECTED_ELEMENT", payload: selectionModel });
          dispatch({ type: "SET_CLASSES", payload: selectionModel?.classes || [] });
        });
        const u2 = router.subscribe('control.panel.classes.updated', (classData: any) => {
          try { console.log(`[cp] useControlPanelState:${label} classes.updated`, { count: Array.isArray(classData?.classes) ? classData.classes.length : 0 }); } catch {}
          if (classData?.classes) {
            dispatch({ type: "SET_CLASSES", payload: classData.classes });
          }
        });
        // Fallback: if selection.changed fired before the selection symphony ran (or plugin runtime mounted),
        // hydrate a minimal selection model directly so the UI can render instead of staying in "No Element Selected".
        // This relies on EventRouter replay (we added canvas.component.selection.changed to REPLAY_TOPICS) so late subscribers see the last id.
        const u3 = router.subscribe('canvas.component.selection.changed', (data: any) => {
          try {
            const id = String(data?.id || '').trim();
            if (!id) return;
            const el = typeof document !== 'undefined' ? document.getElementById(id) as HTMLElement | null : null;
            if (!el) return;
            const classes = Array.from(el.classList || []);
            const rxTypeClass = classes.find((c) => c.startsWith('rx-') && c !== 'rx-comp');
            const type = rxTypeClass ? rxTypeClass.replace(/^rx-/, '') : 'unknown';
            const rect = el.getBoundingClientRect?.() || { x: 0, y: 0, width: 0, height: 0 } as any;
            const computed = typeof window !== 'undefined' && window.getComputedStyle ? window.getComputedStyle(el) : ({} as any);
            const selectionModel = {
              header: { type, id },
              content: { content: el.textContent || '' },
              layout: { x: rect.x || 0, y: rect.y || 0, width: rect.width || 0, height: rect.height || 0 },
              styling: {
                "bg-color": (computed as any).backgroundColor || '',
                "text-color": (computed as any).color || '',
                "border-radius": (computed as any).borderRadius || '',
                "font-size": (computed as any).fontSize || '',
              },
              classes,
            };
            try { console.log(`[cp] useControlPanelState:${label} fallback from selection.changed`, { id, type }); } catch {}
            dispatch({ type: 'SET_SELECTED_ELEMENT', payload: selectionModel });
            dispatch({ type: 'SET_CLASSES', payload: classes });
          } catch (err) {
            try { console.warn(`[cp] useControlPanelState:${label} fallback selection.changed handler error`, err); } catch {}
          }
        });
        if (typeof u1 === 'function') unsubs.push(u1);
        if (typeof u2 === 'function') unsubs.push(u2);
        if (typeof u3 === 'function') unsubs.push(u3);
      } catch (e) {
        try { console.warn(`[cp] useControlPanelState: failed to subscribe via ${label}:`, e); } catch {}
      }
    };

    // Prefer global router, but also subscribe to SDK router if it's a different instance
    if (hasGlobal) subscribeWith(globalRouter, 'global');
    if (hasSdk && SdkEventRouter !== globalRouter) subscribeWith(SdkEventRouter as any, 'sdk');

    return () => {
      for (const u of unsubs) {
        try { u(); } catch {}
      }
    };
  }, []);

  return { state, dispatch };
}
