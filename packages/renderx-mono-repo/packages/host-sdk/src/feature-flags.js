// Standalone feature flags for @renderx/host-sdk
// Simplified version that delegates to host or provides defaults
import "./types.js"; // Load global declarations
// Built-in flags for common features (fallback when host/provider not available)
const DEFAULT_FLAGS = {
    "lint.topics.runtime-validate": {
        status: "off",
        created: "2024-01-01",
        description: "Runtime validation of topic payloads",
    },
};
// Optional provider (works in SSR/Node as well)
let flagsProvider = null;
export function setFeatureFlagsProvider(p) {
    flagsProvider = p;
    try {
        if (typeof window !== "undefined") {
            window.RenderX = window.RenderX || {};
            window.RenderX.featureFlags = p;
        }
    }
    catch { }
}
// Test overrides
let enableOverrides = new Map();
// Usage log for diagnostics
const usageLog = [];
export function isFlagEnabled(id) {
    usageLog.push({ id, when: Date.now() });
    // Check test overrides first
    if (enableOverrides.has(id)) {
        return enableOverrides.get(id);
    }
    // Delegate to provider if set (SSR-safe)
    if (flagsProvider) {
        try {
            return !!flagsProvider.isFlagEnabled(id);
        }
        catch { }
    }
    // Delegate to host if available
    if (typeof window !== "undefined") {
        const hostFlags = window.RenderX?.featureFlags;
        if (hostFlags) {
            try {
                return !!hostFlags.isFlagEnabled(id);
            }
            catch {
                // Fall through to defaults
            }
        }
    }
    // Use built-in defaults
    const meta = DEFAULT_FLAGS[id];
    if (!meta)
        return false;
    return meta.status === "on" || meta.status === "experiment";
}
export function getFlagMeta(id) {
    // Provider first
    if (flagsProvider) {
        try {
            return flagsProvider.getFlagMeta(id);
        }
        catch { }
    }
    // Delegate to host if available
    if (typeof window !== "undefined") {
        const hostFlags = window.RenderX?.featureFlags;
        if (hostFlags) {
            try {
                return hostFlags.getFlagMeta(id);
            }
            catch {
                // Fall through to defaults
            }
        }
    }
    return DEFAULT_FLAGS[id];
}
export function getAllFlags() {
    // Provider first
    if (flagsProvider) {
        try {
            return flagsProvider.getAllFlags();
        }
        catch { }
    }
    // Delegate to host if available
    if (typeof window !== "undefined") {
        const hostFlags = window.RenderX?.featureFlags;
        if (hostFlags) {
            try {
                return hostFlags.getAllFlags();
            }
            catch {
                // Fall through to defaults
            }
        }
    }
    return { ...DEFAULT_FLAGS };
}
export function getUsageLog() {
    return [...usageLog];
}
// Test-only functions
export function setFlagOverride(id, enabled) {
    enableOverrides.set(id, enabled);
}
export function clearFlagOverrides() {
    enableOverrides.clear();
}
//# sourceMappingURL=feature-flags.js.map