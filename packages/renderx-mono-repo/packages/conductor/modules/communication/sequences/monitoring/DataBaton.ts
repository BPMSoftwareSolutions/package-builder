/**
 * DataBaton - capture and log baton state between beats
 * Provides shallow snapshots, diffs, and concise console logging
 */

import type { EventBus } from "../../EventBus.js";

export type BatonSnapshot = Record<string, any>;

export interface BatonDiff {
  added: string[];
  removed: string[];
  updated: string[];
}

export interface BatonLogContext {
  sequenceName?: string;
  movementName?: string;
  beatEvent?: string;
  beatNumber?: number;
  pluginId?: string;
  handlerName?: string;
  requestId?: string;
}

export class DataBaton {
  /** Optionally set by ConductorLogger to align with nested indent */
  static eventBus: EventBus | null = null;
  /** Compute indent using ConductorLogger’s scope depth when available */
  private static computeIndent(requestId?: string): string {
    try {
      const bus = DataBaton.eventBus as any;
      const logger = bus?.__conductorLogger as any;
      if (!logger) return "";
      const depth = logger.getDepth?.(requestId) ?? 0;
      return "  ".repeat(Math.max(0, depth));
    } catch {
      return "";
    }
  }

  static snapshot(
    baton: Record<string, any> | null | undefined
  ): BatonSnapshot {
    if (!baton || typeof baton !== "object") return {};
    // Shallow snapshot to keep logs light-weight
    const snap: BatonSnapshot = {};
    for (const k of Object.keys(baton)) {
      snap[k] = baton[k];
    }
    return snap;
  }

  static diff(prev: BatonSnapshot, next: BatonSnapshot): BatonDiff {
    const added: string[] = [];
    const removed: string[] = [];
    const updated: string[] = [];

    const prevKeys = new Set(Object.keys(prev || {}));
    const nextKeys = new Set(Object.keys(next || {}));

    for (const k of nextKeys) {
      if (!prevKeys.has(k)) {
        added.push(k);
      } else if (!DataBaton.shallowEqual(prev[k], next[k])) {
        updated.push(k);
      }
    }
    for (const k of prevKeys) {
      if (!nextKeys.has(k)) removed.push(k);
    }

    return { added, removed, updated };
  }

  static log(
    context: BatonLogContext,
    prev: BatonSnapshot,
    next: BatonSnapshot
  ) {
    const diff = DataBaton.diff(prev, next);
    const hasChanges =
      diff.added.length || diff.removed.length || diff.updated.length;
    const prefix = "🎽 DataBaton";

    if (!hasChanges) {
      const indent = DataBaton.computeIndent(context.requestId);
      console.log(
        `${indent}${prefix}: No changes | seq=${
          context.sequenceName || "?"
        } beat=${context.beatNumber ?? "?"} event=${
          context.beatEvent || "?"
        } handler=${context.handlerName || "?"}`
      );
      return;
    }

    const details = [] as string[];
    if (diff.added.length) details.push(`+${diff.added.join(",")}`);
    if (diff.updated.length) details.push(`~${diff.updated.join(",")}`);
    if (diff.removed.length) details.push(`-${diff.removed.join(",")}`);

    // Small preview of changed keys (truncate for safety)
    const previewKeys = [...diff.added, ...diff.updated].slice(0, 3);
    const previewObj: Record<string, any> = {};
    for (const k of previewKeys) previewObj[k] = (next as any)[k];
    let preview = "";
    try {
      preview = JSON.stringify(previewObj).slice(0, 200);
    } catch {}

    const indent = DataBaton.computeIndent(context.requestId);

    console.log(
      `${indent}${prefix}: ${details.join(" ")} | seq=${
        context.sequenceName || "?"
      } beat=${context.beatNumber ?? "?"} event=${
        context.beatEvent || "?"
      } handler=${context.handlerName || "?"} plugin=${
        context.pluginId || "?"
      } req=${context.requestId || "?"} preview=${preview}`
    );
  }

  private static shallowEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (!a || !b) return a === b;
    if (typeof a !== "object" || typeof b !== "object") return a === b;
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    for (const k of aKeys) {
      if (a[k] !== b[k]) return false;
    }
    return true;
  }
}
