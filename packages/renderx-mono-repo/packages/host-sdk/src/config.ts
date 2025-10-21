// Standalone config API for @renderx/host-sdk
// Provides getConfigValue and hasConfigValue functions without host dependencies

import "./types.js"; // Load global declarations

/**
 * Get a configuration value from the host.
 * Returns undefined if the key doesn't exist or if the host config is not available.
 * 
 * @param key - The configuration key to retrieve
 * @returns The configuration value or undefined
 * 
 * @example
 * ```typescript
 * const apiKey = getConfigValue('API_KEY');
 * const apiUrl = getConfigValue('API_URL') || 'https://default.api.com';
 * ```
 */
export function getConfigValue(key: string): string | undefined {
  if (typeof window === "undefined") {
    // Node/SSR fallback - return undefined
    return undefined;
  }

  const config = window.RenderX?.config;
  if (!config) {
    console.warn("Host config not available. Ensure the host has called initConfig().");
    return undefined;
  }

  return config.getValue(key);
}

/**
 * Check if a configuration key exists in the host config.
 * Returns false if the host config is not available.
 * 
 * @param key - The configuration key to check
 * @returns true if the key exists, false otherwise
 * 
 * @example
 * ```typescript
 * if (hasConfigValue('API_KEY')) {
 *   const apiKey = getConfigValue('API_KEY');
 *   // Use the API key
 * }
 * ```
 */
export function hasConfigValue(key: string): boolean {
  if (typeof window === "undefined") {
    // Node/SSR fallback
    return false;
  }

  const config = window.RenderX?.config;
  if (!config) {
    console.warn("Host config not available. Ensure the host has called initConfig().");
    return false;
  }

  return config.hasValue(key);
}

