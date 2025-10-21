import { EventRouter } from "@renderx-plugins/host-sdk";

export type UiEventDef = {
  id: string;
  target: { window?: boolean; selector?: string };
  event: keyof WindowEventMap | string;
  options?: AddEventListenerOptions | boolean;
  guard?: {
    key?: string;
    ctrlKey?: boolean;
    metaKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    notClosestMatch?: string;
  };
  publish: { topic: string; payload?: any };
};

/**
 * Wires UI events based on provided definitions. Returns a cleanup function.
 */
export function wireUiEvents(defs: UiEventDef[]): () => void {
  const disposers: Array<() => void> = [];
  const pending: UiEventDef[] = [];

  const getConductor = () => (window as any).RenderX?.conductor;

  const tryAttach = (def: UiEventDef): boolean => {
    const conductor = getConductor();
    if (!conductor) return false;

    const targetEl: EventTarget | null = def.target.window
      ? window
      : def.target.selector
      ? (document.querySelector(def.target.selector) as EventTarget | null)
      : null;

    if (!targetEl) return false;

    const handler = async (e: Event) => {
      try {
        // Guard checks
        if (def.guard?.key) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const key = (e as any).key as string | undefined;
          if (key !== def.guard.key) return;
        }
        // Check modifier keys
        if (def.guard?.ctrlKey !== undefined) {
          const ke = e as KeyboardEvent;
          if (ke.ctrlKey !== def.guard.ctrlKey) return;
        }
        if (def.guard?.metaKey !== undefined) {
          const ke = e as KeyboardEvent;
          if (ke.metaKey !== def.guard.metaKey) return;
        }
        if (def.guard?.shiftKey !== undefined) {
          const ke = e as KeyboardEvent;
          if (ke.shiftKey !== def.guard.shiftKey) return;
        }
        if (def.guard?.altKey !== undefined) {
          const ke = e as KeyboardEvent;
          if (ke.altKey !== def.guard.altKey) return;
        }
        if (def.guard?.notClosestMatch) {
          const target = e.target as HTMLElement | null;
          const isComp = target?.closest?.(def.guard.notClosestMatch);
          if (isComp) return; // abort if inside a matching element
        }
        const conductor = getConductor();
        if (!conductor) return;
        await EventRouter.publish(def.publish.topic, def.publish.payload ?? {}, conductor);
      } catch {}
    };

    targetEl.addEventListener(def.event as any, handler as EventListener, def.options as any);

    // Track disposer
    const off = () => {
      try { targetEl.removeEventListener(def.event as any, handler as EventListener, def.options as any); } catch {}
    };
    disposers.push(off);
    return true;
  };

  // Initial attach attempts
  for (const d of defs) {
    if (!tryAttach(d)) pending.push(d);
  }

  // If anything pending, observe DOM for readiness
  let observer: MutationObserver | null = null;
  if (pending.length) {
    observer = new MutationObserver(() => {
      for (let i = pending.length - 1; i >= 0; i--) {
        const ok = tryAttach(pending[i]);
        if (ok) pending.splice(i, 1);
      }
      if (!pending.length && observer) {
        observer.disconnect();
        observer = null;
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  return () => {
    try { if (observer) observer.disconnect(); } catch {}
    while (disposers.length) {
      const off = disposers.pop();
      try { off && off(); } catch {}
    }
  };
}

