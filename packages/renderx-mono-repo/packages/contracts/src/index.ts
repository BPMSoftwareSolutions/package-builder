/**
 * @renderx/contracts
 * Shared interface definitions for RenderX plugin system
 */

// Export all types
export * from './types.js';

// Export plugin interfaces and base classes
export { BasePlugin, type PluginFactory, type IPluginLoader } from './plugin.js';

// Export shell interfaces and base classes
export { BaseShell } from './shell.js';

