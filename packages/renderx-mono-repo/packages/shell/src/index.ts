/**
 * @renderx/shell
 * Thin wrapper shell for managing RenderX plugins
 */

// Export shell implementation
export { Shell, createShell } from './shell.js';

// Re-export contracts for convenience
export type {
  IPlugin,
  IShell,
  PluginId,
  SequenceId,
  PluginMetadata,
  Sequence,
  ShellEvent,
  ShellEventListener,
  ShellConfig,
  ShellMetrics,
} from '@renderx/contracts';

