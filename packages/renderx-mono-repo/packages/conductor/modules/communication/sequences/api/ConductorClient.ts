/**
 * ConductorClient - Narrow, client-facing surface of MusicalConductor
 *
 * This interface exposes only the methods intended for application clients,
 * preserving CIA/SPA architectural boundaries while allowing common tasks
 * like orchestration via play() and UI event subscriptions.
 */

import type { EventCallback, UnsubscribeFunction } from "../../EventBus.js";
import type {
  ConductorStatistics,
  SequencePriority,
} from "../SequenceTypes.js";

export interface ConductorClient {
  // Orchestration (CIA entrypoint)
  play(
    pluginId: string,
    sequenceId: string,
    context?: any,
    priority?: SequencePriority
  ): any;

  // Event subscriptions (SPA-compliant, mediated by the conductor)
  subscribe(
    eventName: string,
    callback: EventCallback,
    context?: any
  ): UnsubscribeFunction;
  unsubscribe(eventName: string, callback: EventCallback): void;

  // Friendly aliases commonly used by client apps
  on(
    eventName: string,
    callback: EventCallback,
    context?: any
  ): UnsubscribeFunction;
  off(eventName: string, callback: EventCallback): void;

  // Bootstrap helpers
  registerCIAPlugins(): Promise<void>;

  // Status and read-only inspection
  getStatistics(): ConductorStatistics & { mountedPlugins: number };
  getStatus(): {
    statistics: ConductorStatistics & { mountedPlugins: number };
    eventBus: boolean;
    sequences: number;
    plugins: number;
  };
  getSequenceNames(): string[];
  getMountedPlugins(): string[];
  getMountedPluginIds(): string[];
}
