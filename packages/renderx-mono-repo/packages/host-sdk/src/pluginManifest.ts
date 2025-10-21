// Standalone plugin manifest accessor for @renderx/host-sdk
// Provides a simple interface for plugins to discover other plugins without host coupling

export interface HostPluginRuntimeEntry {
  module: string;
  export: string;
}

export interface HostPluginManifestEntry {
  id: string;
  title?: string;
  description?: string;
  runtime?: HostPluginRuntimeEntry;
}

export interface HostPluginManifest {
  plugins: HostPluginManifestEntry[];
}

// Simple in-memory cache
let cached: HostPluginManifest | null = null;

// Host applications can provide the manifest via this function
export function setPluginManifest(manifest: HostPluginManifest): void {
  cached = manifest;
}

// Plugins can use this to discover other available plugins
export async function getPluginManifest(): Promise<HostPluginManifest> {
  if (cached) {
    return cached;
  }

  // Try to fetch from standard location if in browser
  if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    try {
      const response = await fetch('/plugins/plugin-manifest.json');
      if (response.ok) {
        const manifest = await response.json();
        cached = manifest;
        return manifest;
      }
    } catch {
      // Fetch failed, continue to fallback
    }
  }

  // Return empty manifest as fallback
  return { plugins: [] };
}

// Synchronous accessor for cached manifest
export function getCachedPluginManifest(): HostPluginManifest | null {
  return cached;
}