// Host configuration service
// Provides a simple key-value configuration API for plugins via window.RenderX.config

import type { ConfigAPI } from "../../types.js";

// In-memory configuration store
const configStore = new Map<string, string>();

/**
 * Initialize the configuration service and attach it to window.RenderX.config
 * 
 * This function should be called by the host application during startup.
 * It supports loading configuration from environment variables (via Vite's import.meta.env)
 * and allows for runtime configuration updates.
 * 
 * @param initialConfig - Optional initial configuration object
 * 
 * @example
 * ```typescript
 * // In host application startup
 * import { initConfig } from '@renderx-plugins/host-sdk/core/environment/config';
 * 
 * // Load from environment variables (Vite automatically injects these)
 * initConfig({
 *   API_KEY: import.meta.env.VITE_API_KEY,
 *   API_URL: import.meta.env.VITE_API_URL,
 * });
 * ```
 */
export function initConfig(initialConfig?: Record<string, string | undefined>): ConfigAPI {
  // Clear existing config
  configStore.clear();

  // Load initial config, filtering out undefined values
  if (initialConfig) {
    for (const [key, value] of Object.entries(initialConfig)) {
      if (value !== undefined) {
        configStore.set(key, value);
      }
    }
  }

  // Create the config API
  const configAPI: ConfigAPI = {
    getValue(key: string): string | undefined {
      return configStore.get(key);
    },

    hasValue(key: string): boolean {
      return configStore.has(key);
    },
  };

  // Attach to window.RenderX.config
  if (typeof window !== "undefined") {
    (window as any).RenderX = (window as any).RenderX || {};
    (window as any).RenderX.config = configAPI;
  }

  return configAPI;
}

/**
 * Set a configuration value at runtime
 * 
 * @param key - The configuration key
 * @param value - The configuration value
 * 
 * @example
 * ```typescript
 * setConfigValue('API_KEY', 'new-api-key');
 * ```
 */
export function setConfigValue(key: string, value: string): void {
  configStore.set(key, value);
}

/**
 * Remove a configuration value
 * 
 * @param key - The configuration key to remove
 * 
 * @example
 * ```typescript
 * removeConfigValue('API_KEY');
 * ```
 */
export function removeConfigValue(key: string): void {
  configStore.delete(key);
}

/**
 * Get all configuration keys
 * 
 * @returns Array of all configuration keys
 * 
 * @example
 * ```typescript
 * const keys = getAllConfigKeys();
 * console.log('Available config keys:', keys);
 * ```
 */
export function getAllConfigKeys(): string[] {
  return Array.from(configStore.keys());
}

/**
 * Clear all configuration values
 * 
 * @example
 * ```typescript
 * clearConfig();
 * ```
 */
export function clearConfig(): void {
  configStore.clear();
}

