/**
 * Sequence Execution Service
 * 
 * Handles live sequence triggering and execution monitoring.
 * Part of Issue #306 - Release 2: Live Sequence Triggering.
 */

import type { AvailableSequence, LiveExecution } from '../types';
import { introspectConductor } from './conductor.service';
import { loadPluginManifest, getPluginById } from './manifest.service';
import { loadPluginSequences } from './plugin-enrichment.service';

/**
 * Gets the conductor instance from the global window object
 *
 * @returns The conductor instance or null if not available
 * @throws Error if conductor is not initialized
 */
export function getConductor(): any {
  const conductor = (globalThis as any).RenderX?.conductor;
  if (!conductor) {
    throw new Error('Conductor not initialized');
  }
  return conductor;
}

/**
 * Checks if the conductor is available
 *
 * @returns true if conductor is available, false otherwise
 */
export function isConductorAvailable(): boolean {
  return !!(globalThis as any).RenderX?.conductor;
}

/**
 * Gets all available sequences from the conductor and manifest
 *
 * @returns Promise resolving to array of available sequences
 */
export async function getAvailableSequences(): Promise<AvailableSequence[]> {
  try {
    const conductor = getConductor();
    const manifest = await loadPluginManifest();

    if (!manifest) {
      console.warn('Failed to load manifest, returning empty sequence list');
      return [];
    }

    const introspection = introspectConductor(conductor);
    const sequences: AvailableSequence[] = [];

    // Iterate through all plugins in the manifest
    for (const plugin of manifest.plugins) {
      // Load sequences from JSON catalog files
      const runtimeSequences = await loadPluginSequences(plugin.id);

      for (const sequence of runtimeSequences) {
        const sequenceId = sequence.id;
        const isMounted = introspection.runtimeMountedSeqIds.includes(sequenceId);

        sequences.push({
          sequenceId,
          sequenceName: sequence.name || sequenceId,
          pluginId: plugin.id,
          description: sequence.description,
          parameters: sequence.parameters,
          isMounted
        });
      }
    }

    return sequences;
  } catch (error) {
    console.error('Failed to get available sequences:', error);
    return [];
  }
}

/**
 * Executes a sequence through the conductor
 * 
 * @param pluginId - The ID of the plugin that owns the sequence
 * @param sequenceId - The ID of the sequence to execute
 * @param parameters - Optional parameters to pass to the sequence
 * @returns Promise resolving to the request ID
 * @throws Error if execution fails
 */
export async function executeSequence(
  pluginId: string,
  sequenceId: string,
  parameters?: Record<string, any>
): Promise<string> {
  try {
    const conductor = getConductor();
    
    // Generate a unique request ID
    const requestId = generateRequestId(sequenceId);
    
    // Execute the sequence through the conductor
    await conductor.play(pluginId, sequenceId, parameters);
    
    return requestId;
  } catch (error) {
    console.error('Failed to execute sequence:', error);
    throw error;
  }
}

/**
 * Generates a unique request ID for a sequence execution
 * 
 * @param sequenceId - The ID of the sequence
 * @returns A unique request ID
 */
export function generateRequestId(sequenceId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${sequenceId}-symphony-${timestamp}-${random}`;
}

/**
 * Validates JSON parameters
 * 
 * @param jsonString - The JSON string to validate
 * @returns Object with validation result and parsed data
 */
export function validateParameters(jsonString: string): {
  valid: boolean;
  data?: Record<string, any>;
  error?: string;
} {
  if (!jsonString.trim()) {
    return { valid: true, data: {} };
  }

  try {
    const data = JSON.parse(jsonString);
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      return {
        valid: false,
        error: 'Parameters must be a JSON object'
      };
    }
    return { valid: true, data };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid JSON'
    };
  }
}

/**
 * Converts a LiveExecution to a format suitable for history storage
 * 
 * @param execution - The live execution to convert
 * @param sequenceName - The name of the sequence
 * @returns Execution history item data
 */
export function convertToHistoryItem(
  execution: LiveExecution,
  sequenceName: string
) {
  const successfulBeats = execution.beats.filter(b => b.status === 'success').length;
  const totalDuration = execution.totalDuration || 
    (execution.endTime && execution.startTime 
      ? new Date(execution.endTime).getTime() - new Date(execution.startTime).getTime()
      : 0);

  return {
    sequenceId: execution.sequenceId,
    sequenceName,
    pluginId: execution.pluginId,
    requestId: execution.requestId,
    status: execution.status === 'success' ? 'success' as const : 'error' as const,
    startTime: execution.startTime,
    endTime: execution.endTime || new Date().toISOString(),
    totalDuration,
    beatCount: execution.beats.length,
    parameters: execution.parameters,
    error: execution.error,
    execution
  };
}

/**
 * Gets sequence metadata from the manifest
 *
 * @param pluginId - The ID of the plugin
 * @param sequenceId - The ID of the sequence
 * @returns Promise resolving to sequence metadata or null
 */
export async function getSequenceMetadata(
  pluginId: string,
  sequenceId: string
): Promise<{ name: string; description?: string } | null> {
  try {
    const manifest = await loadPluginManifest();
    if (!manifest) return null;

    const plugin = getPluginById(manifest, pluginId);
    if (!plugin) return null;

    // Load sequences from JSON catalog files
    const sequences = await loadPluginSequences(pluginId);
    const sequence = sequences.find(s => s.id === sequenceId);
    if (!sequence) return null;

    return {
      name: sequence.name || sequenceId,
      description: sequence.description
    };
  } catch (error) {
    console.error('Failed to get sequence metadata:', error);
    return null;
  }
}

