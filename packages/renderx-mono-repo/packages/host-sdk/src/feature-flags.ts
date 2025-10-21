// Standalone feature flags for @renderx/host-sdk
// Simplified version that delegates to host or provides defaults

import "./types.js"; // Load global declarations

export type FlagStatus = "on" | "off" | "experiment";

export interface FlagMeta {
  status: FlagStatus;
  created: string;
  verified?: string;
  description?: string;
  owner?: string;
}

export type FlagsProvider = {
  isFlagEnabled(key: string): boolean;
  getFlagMeta(key: string): any | undefined;
  getAllFlags(): Record<string, any>;
};

// Built-in flags for common features (fallback when host/provider not available)
const DEFAULT_FLAGS: Record<string, FlagMeta> = {
  "lint.topics.runtime-validate": {
    status: "off",
    created: "2024-01-01",
    description: "Runtime validation of topic payloads",
  },
};

// Optional provider (works in SSR/Node as well)
let flagsProvider: FlagsProvider | null = null;

export function setFeatureFlagsProvider(p: FlagsProvider): void {
  flagsProvider = p;
  try {
    if (typeof window !== "undefined") {
      (window as any).RenderX = (window as any).RenderX || {};
      (window as any).RenderX.featureFlags = p;
    }
  } catch {}
}

// Test overrides
let enableOverrides = new Map<string, boolean>();

// Usage log for diagnostics
const usageLog: Array<{ id: string; when: number }> = [];

export function isFlagEnabled(id: string): boolean {
  usageLog.push({ id, when: Date.now() });

  // Check test overrides first
  if (enableOverrides.has(id)) {
    return enableOverrides.get(id)!;
  }

  // Delegate to provider if set (SSR-safe)
  if (flagsProvider) {
    try { return !!flagsProvider.isFlagEnabled(id); } catch {}
  }

  // Delegate to host if available
  if (typeof window !== "undefined") {
    const hostFlags = (window as any).RenderX?.featureFlags;
    if (hostFlags) {
      try {
        return !!hostFlags.isFlagEnabled(id);
      } catch {
        // Fall through to defaults
      }
    }
  }

  // Use built-in defaults
  const meta = DEFAULT_FLAGS[id];
  if (!meta) return false;
  return meta.status === "on" || meta.status === "experiment";
}

export function getFlagMeta(id: string): FlagMeta | undefined {
  // Provider first
  if (flagsProvider) {
    try { return flagsProvider.getFlagMeta(id) as any; } catch {}
  }
  // Delegate to host if available
  if (typeof window !== "undefined") {
    const hostFlags = (window as any).RenderX?.featureFlags;
    if (hostFlags) {
      try {
        return hostFlags.getFlagMeta(id);
      } catch {
        // Fall through to defaults
      }
    }
  }
  return DEFAULT_FLAGS[id];
}

export function getAllFlags(): Record<string, FlagMeta> {
  // Provider first
  if (flagsProvider) {
    try { return flagsProvider.getAllFlags() as any; } catch {}
  }
  // Delegate to host if available
  if (typeof window !== "undefined") {
    const hostFlags = (window as any).RenderX?.featureFlags;
    if (hostFlags) {
      try {
        return hostFlags.getAllFlags();
      } catch {
        // Fall through to defaults
      }
    }
  }
  return { ...DEFAULT_FLAGS };
}

export function getUsageLog(): Array<{ id: string; when: number }> {
  return [...usageLog];
}

// Test-only functions
export function setFlagOverride(id: string, enabled: boolean): void {
  enableOverrides.set(id, enabled);
}

export function clearFlagOverrides(): void {
  enableOverrides.clear();
}
