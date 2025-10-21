/**
 * DataBaton - capture and log baton state between beats
 * Provides shallow snapshots, diffs, and concise console logging
 */
export class DataBaton {
    /** Optionally set by ConductorLogger to align with nested indent */
    static eventBus = null;
    /** Compute indent using ConductorLogger’s scope depth when available */
    static computeIndent(requestId) {
        try {
            const bus = DataBaton.eventBus;
            const logger = bus?.__conductorLogger;
            if (!logger)
                return "";
            const depth = logger.getDepth?.(requestId) ?? 0;
            return "  ".repeat(Math.max(0, depth));
        }
        catch {
            return "";
        }
    }
    static snapshot(baton) {
        if (!baton || typeof baton !== "object")
            return {};
        // Shallow snapshot to keep logs light-weight
        const snap = {};
        for (const k of Object.keys(baton)) {
            snap[k] = baton[k];
        }
        return snap;
    }
    static diff(prev, next) {
        const added = [];
        const removed = [];
        const updated = [];
        const prevKeys = new Set(Object.keys(prev || {}));
        const nextKeys = new Set(Object.keys(next || {}));
        for (const k of nextKeys) {
            if (!prevKeys.has(k)) {
                added.push(k);
            }
            else if (!DataBaton.shallowEqual(prev[k], next[k])) {
                updated.push(k);
            }
        }
        for (const k of prevKeys) {
            if (!nextKeys.has(k))
                removed.push(k);
        }
        return { added, removed, updated };
    }
    static log(context, prev, next) {
        const diff = DataBaton.diff(prev, next);
        const hasChanges = diff.added.length || diff.removed.length || diff.updated.length;
        const prefix = "🎽 DataBaton";
        if (!hasChanges) {
            const indent = DataBaton.computeIndent(context.requestId);
            console.log(`${indent}${prefix}: No changes | seq=${context.sequenceName || "?"} beat=${context.beatNumber ?? "?"} event=${context.beatEvent || "?"} handler=${context.handlerName || "?"}`);
            return;
        }
        const details = [];
        if (diff.added.length)
            details.push(`+${diff.added.join(",")}`);
        if (diff.updated.length)
            details.push(`~${diff.updated.join(",")}`);
        if (diff.removed.length)
            details.push(`-${diff.removed.join(",")}`);
        // Small preview of changed keys (truncate for safety)
        const previewKeys = [...diff.added, ...diff.updated].slice(0, 3);
        const previewObj = {};
        for (const k of previewKeys)
            previewObj[k] = next[k];
        let preview = "";
        try {
            preview = JSON.stringify(previewObj).slice(0, 200);
        }
        catch { }
        const indent = DataBaton.computeIndent(context.requestId);
        console.log(`${indent}${prefix}: ${details.join(" ")} | seq=${context.sequenceName || "?"} beat=${context.beatNumber ?? "?"} event=${context.beatEvent || "?"} handler=${context.handlerName || "?"} plugin=${context.pluginId || "?"} req=${context.requestId || "?"} preview=${preview}`);
    }
    static shallowEqual(a, b) {
        if (a === b)
            return true;
        if (!a || !b)
            return a === b;
        if (typeof a !== "object" || typeof b !== "object")
            return a === b;
        const aKeys = Object.keys(a);
        const bKeys = Object.keys(b);
        if (aKeys.length !== bKeys.length)
            return false;
        for (const k of aKeys) {
            if (a[k] !== b[k])
                return false;
        }
        return true;
    }
}
//# sourceMappingURL=DataBaton.js.map