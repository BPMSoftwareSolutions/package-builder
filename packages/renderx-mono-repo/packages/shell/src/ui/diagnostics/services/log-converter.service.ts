/**
 * Log Converter Service
 * 
 * Converts console log format to structured JSON format for Sequence Player.
 * Part of Issue #305.
 */

import type { ParsedExecution } from '../types';

interface LogLine {
  lineNumber: number;
  content: string;
}

interface SequenceContext {
  executionId: string;
  sequenceId: string;
  sequenceName: string;
  pluginId: string;
  requestId: string;
  startTime?: string;
  movements: Map<string, MovementContext>;
  currentMovement?: string;
}

interface MovementContext {
  name: string;
  beats: BeatContext[];
  startTime?: string;
  endTime?: string;
  duration?: number;
  status: 'success' | 'error' | 'pending';
}

interface BeatContext {
  number: number;
  event: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  status: 'success' | 'error' | 'pending';
  dataBaton?: Record<string, unknown>;
}

/**
 * Convert console log file content to structured JSON format
 */
export function convertLogToJson(logContent: string): ParsedExecution[] {
  const lines = logContent.split('\n').map((content, index) => ({
    lineNumber: index + 1,
    content: content.trim()
  })).filter(line => line.content.length > 0);

  const executions: Map<string, SequenceContext> = new Map();
  let lastPluginId: string | null = null;

  for (const line of lines) {
    processLogLine(line, executions, lastPluginId);

    // Track plugin ID for next execution
    const pluginMatch = line.content.match(/PluginInterfaceFacade\.play\(\):\s*(\w+)\s*->/);
    if (pluginMatch) {
      lastPluginId = pluginMatch[1];
    }
  }

  // Convert to ParsedExecution array
  return Array.from(executions.values()).map(ctx => convertContextToExecution(ctx));
}

/**
 * Process a single log line and update execution contexts
 */
function processLogLine(line: LogLine, executions: Map<string, SequenceContext>, lastPluginId: string | null): void {
  const content = line.content;

  // Match: Recording sequence execution
  const recordingMatch = content.match(/SequenceOrchestrator.*Recording sequence execution:\s*(\S+)/);
  if (recordingMatch) {
    const executionId = recordingMatch[1];
    executions.set(executionId, {
      executionId,
      sequenceId: '',
      sequenceName: '',
      pluginId: lastPluginId || '',
      requestId: '',
      movements: new Map()
    });
    return;
  }

  // Match: Sequence name
  const sequenceNameMatch = content.match(/Sequence:\s*(.+?)(?:\s*$|🆔)/);
  if (sequenceNameMatch) {
    const sequenceName = sequenceNameMatch[1].trim();
    const lastExecution = getLastExecution(executions);
    if (lastExecution) {
      lastExecution.sequenceName = sequenceName;
      lastExecution.sequenceId = toKebabCase(sequenceName);
    }
    return;
  }

  // Match: Plugin ID from PluginInterfaceFacade
  const pluginMatch = content.match(/PluginInterfaceFacade\.play\(\):\s*(\w+)\s*->/);
  if (pluginMatch) {
    const pluginId = pluginMatch[1];
    const lastExecution = getLastExecution(executions);
    if (lastExecution) {
      lastExecution.pluginId = pluginId;
    }
    return;
  }

  // Match: Request ID
  const requestIdMatch = content.match(/Request ID:\s*(\S+)/);
  if (requestIdMatch) {
    const requestId = requestIdMatch[1];
    const lastExecution = getLastExecution(executions);
    if (lastExecution) {
      lastExecution.requestId = requestId;
    }
    return;
  }

  // Match: Movement Started
  const movementStartMatch = content.match(/Movement Started:\s*(.+?)\s*\((\d+)\s*beats?\)/);
  if (movementStartMatch) {
    const movementName = movementStartMatch[1].trim();
    const beatCount = parseInt(movementStartMatch[2], 10);
    const lastExecution = getLastExecution(executions);
    if (lastExecution) {
      lastExecution.currentMovement = movementName;
      lastExecution.movements.set(movementName, {
        name: movementName,
        beats: [],
        status: 'pending'
      });
    }
    return;
  }

  // Match: Beat Started
  const beatStartMatch = content.match(/Beat (\d+) Started:\s*(.+?)\s*\(([^)]+)\)/);
  if (beatStartMatch) {
    const beatNumber = parseInt(beatStartMatch[1], 10);
    const beatName = beatStartMatch[2].trim();
    const event = beatStartMatch[3].trim();
    const lastExecution = getLastExecution(executions);
    if (lastExecution && lastExecution.currentMovement) {
      const movement = lastExecution.movements.get(lastExecution.currentMovement);
      if (movement) {
        movement.beats.push({
          number: beatNumber,
          event: event,
          status: 'pending'
        });
      }
    }
    return;
  }

  // Match: Beat completed with timing
  const beatCompletedMatch = content.match(/Beat (\d+) completed in ([\d.]+)ms/);
  if (beatCompletedMatch) {
    const beatNumber = parseInt(beatCompletedMatch[1], 10);
    const duration = parseFloat(beatCompletedMatch[2]);
    const lastExecution = getLastExecution(executions);
    if (lastExecution && lastExecution.currentMovement) {
      const movement = lastExecution.movements.get(lastExecution.currentMovement);
      if (movement) {
        const beat = movement.beats.find(b => b.number === beatNumber);
        if (beat) {
          beat.duration = duration;
          beat.status = 'success';
        }
      }
    }
    return;
  }

  // Match: DataBaton with preview
  const dataBatonMatch = content.match(/🎽 DataBaton:.*preview=(\{.+\})$/);
  if (dataBatonMatch) {
    try {
      const previewJson = dataBatonMatch[1];
      const dataBaton = JSON.parse(previewJson);
      const lastExecution = getLastExecution(executions);
      if (lastExecution && lastExecution.currentMovement) {
        const movement = lastExecution.movements.get(lastExecution.currentMovement);
        if (movement && movement.beats.length > 0) {
          // Attach data baton to the most recent beat
          const lastBeat = movement.beats[movement.beats.length - 1];
          if (!lastBeat.dataBaton) {
            lastBeat.dataBaton = dataBaton;
          }
        }
      }
    } catch (error) {
      // Ignore JSON parse errors
    }
    return;
  }

  // Match: Movement completed
  const movementCompletedMatch = content.match(/Movement completed in ([\d.]+)ms/);
  if (movementCompletedMatch) {
    const duration = parseFloat(movementCompletedMatch[1]);
    const lastExecution = getLastExecution(executions);
    if (lastExecution && lastExecution.currentMovement) {
      const movement = lastExecution.movements.get(lastExecution.currentMovement);
      if (movement) {
        movement.duration = duration;
        movement.status = 'success';
      }
    }
    return;
  }

  // Match: Sequence completed
  const sequenceCompletedMatch = content.match(/Sequence "(.+?)" completed in (\d+)ms/);
  if (sequenceCompletedMatch) {
    const sequenceName = sequenceCompletedMatch[1];
    const duration = parseInt(sequenceCompletedMatch[2], 10);
    // Mark execution as complete
    for (const [id, ctx] of executions.entries()) {
      if (ctx.sequenceName === sequenceName && !ctx.startTime) {
        // This execution is complete
        break;
      }
    }
    return;
  }
}

/**
 * Get the most recently created execution context
 */
function getLastExecution(executions: Map<string, SequenceContext>): SequenceContext | undefined {
  const entries = Array.from(executions.values());
  return entries[entries.length - 1];
}

/**
 * Convert execution context to ParsedExecution format
 */
function convertContextToExecution(ctx: SequenceContext): ParsedExecution {
  const movements = Array.from(ctx.movements.values()).map(movement => ({
    name: movement.name,
    beats: movement.beats.map(beat => ({
      number: beat.number,
      event: beat.event,
      duration: beat.duration || 0,
      status: beat.status,
      timestamp: beat.startTime || new Date().toISOString(),
      dataBaton: beat.dataBaton
    })),
    duration: movement.duration || movement.beats.reduce((sum, b) => sum + (b.duration || 0), 0),
    status: movement.status
  }));

  const totalDuration = movements.reduce((sum, m) => sum + m.duration, 0);

  return {
    sequenceId: ctx.sequenceId || 'unknown',
    sequenceName: ctx.sequenceName || 'Unknown Sequence',
    pluginId: ctx.pluginId || 'UnknownPlugin',
    requestId: ctx.requestId || ctx.executionId,
    movements,
    totalDuration,
    status: movements.every(m => m.status === 'success') ? 'success' : 
            movements.some(m => m.status === 'error') ? 'error' : 'pending',
    startTime: ctx.startTime || new Date().toISOString(),
    endTime: ctx.endTime || new Date().toISOString()
  };
}

/**
 * Convert string to kebab-case
 */
function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Load log file from .logs directory
 */
export async function loadLogFile(filename: string): Promise<string> {
  try {
    const response = await fetch(`/.logs/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to load log file: ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    throw new Error(`Error loading log file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get list of available log files
 */
export async function getLogFiles(): Promise<string[]> {
  // This would need a backend endpoint to list files
  // For now, return empty array - user can paste content directly
  return [];
}

