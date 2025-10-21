/**
 * Log Parser Service
 * 
 * Handles parsing of sequence execution logs (JSON and text formats).
 * Extracts sequence metadata, movements, beats, and timing data.
 * 
 * Part of the Diagnostic Sequence Player MVP (Issue #305).
 */

import type { 
  ParsedExecution, 
  Movement, 
  Beat, 
  LogInput, 
  ParseResult,
  ExecutionStats 
} from '../types';

/**
 * Parses a log input and extracts sequence execution data
 * 
 * @param input - Log input containing content and format
 * @returns Parse result with execution data or error
 */
export function parseLog(input: LogInput): ParseResult {
  try {
    if (input.format === 'json') {
      return parseJsonLog(input.content);
    } else {
      return parseTextLog(input.content);
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown parsing error'
    };
  }
}

/**
 * Parses JSON-formatted log content
 *
 * @param content - JSON string containing execution data
 * @returns Parse result with execution data or error
 */
function parseJsonLog(content: string): ParseResult {
  try {
    let data = JSON.parse(content);

    // If data is an array, use the first execution
    if (Array.isArray(data)) {
      if (data.length === 0) {
        return {
          success: false,
          error: 'Empty execution array'
        };
      }
      data = data[0]; // Use first execution
    }

    // Validate required fields
    if (!data.sequenceId || !data.pluginId || !data.requestId) {
      return {
        success: false,
        error: 'Missing required fields: sequenceId, pluginId, or requestId'
      };
    }

    // Parse movements
    const movements: Movement[] = [];
    let totalDuration = 0;
    let hasError = false;

    if (Array.isArray(data.movements)) {
      for (const movementData of data.movements) {
        const movement = parseMovement(movementData);
        movements.push(movement);
        totalDuration += movement.duration;
        if (movement.status === 'error') {
          hasError = true;
        }
      }
    }

    const execution: ParsedExecution = {
      sequenceId: data.sequenceId,
      sequenceName: data.sequenceName || data.sequenceId,
      pluginId: data.pluginId,
      requestId: data.requestId,
      movements,
      totalDuration: data.totalDuration || totalDuration,
      status: hasError ? 'error' : 'success',
      startTime: data.startTime,
      endTime: data.endTime,
      error: data.error
    };

    return {
      success: true,
      execution
    };
  } catch (error) {
    return {
      success: false,
      error: `JSON parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Parses text-formatted log content
 * 
 * @param content - Text string containing execution data
 * @returns Parse result with execution data or error
 */
function parseTextLog(content: string): ParseResult {
  try {
    const lines = content.split('\n').filter(line => line.trim());
    
    // Extract metadata from first few lines
    let sequenceId = '';
    let sequenceName = '';
    let pluginId = '';
    let requestId = '';
    const movements: Movement[] = [];
    let currentMovement: Partial<Movement> | null = null;
    let totalDuration = 0;
    let hasError = false;

    for (const line of lines) {
      // Extract sequence ID
      const seqIdMatch = line.match(/sequenceId[:\s]+([^\s,]+)/i);
      if (seqIdMatch) sequenceId = seqIdMatch[1];

      // Extract sequence name
      const seqNameMatch = line.match(/sequenceName[:\s]+([^\s,]+)/i);
      if (seqNameMatch) sequenceName = seqNameMatch[1];

      // Extract plugin ID
      const pluginMatch = line.match(/pluginId[:\s]+([^\s,]+)/i);
      if (pluginMatch) pluginId = pluginMatch[1];

      // Extract request ID
      const reqMatch = line.match(/requestId[:\s]+([^\s,]+)/i);
      if (reqMatch) requestId = reqMatch[1];

      // Extract movement
      const movementMatch = line.match(/movement[:\s]+([^\s,]+)/i);
      if (movementMatch) {
        if (currentMovement && currentMovement.name) {
          movements.push(currentMovement as Movement);
        }
        currentMovement = {
          name: movementMatch[1],
          beats: [],
          duration: 0,
          status: 'success'
        };
      }

      // Extract beat
      const beatMatch = line.match(/beat[:\s]+(\d+)[,\s]+event[:\s]+([^\s,]+)[,\s]+duration[:\s]+(\d+)/i);
      if (beatMatch && currentMovement) {
        const beat: Beat = {
          number: parseInt(beatMatch[1], 10),
          event: beatMatch[2],
          duration: parseInt(beatMatch[3], 10),
          status: 'success'
        };
        currentMovement.beats = currentMovement.beats || [];
        currentMovement.beats.push(beat);
        currentMovement.duration = (currentMovement.duration || 0) + beat.duration;
      }

      // Check for errors
      if (line.toLowerCase().includes('error')) {
        hasError = true;
        if (currentMovement) {
          currentMovement.status = 'error';
        }
      }
    }

    // Add last movement
    if (currentMovement && currentMovement.name) {
      movements.push(currentMovement as Movement);
    }

    // Calculate total duration
    totalDuration = movements.reduce((sum, m) => sum + m.duration, 0);

    // Validate required fields
    if (!sequenceId || !pluginId || !requestId) {
      return {
        success: false,
        error: 'Could not extract required fields from text log'
      };
    }

    const execution: ParsedExecution = {
      sequenceId,
      sequenceName: sequenceName || sequenceId,
      pluginId,
      requestId,
      movements,
      totalDuration,
      status: hasError ? 'error' : 'success'
    };

    return {
      success: true,
      execution
    };
  } catch (error) {
    return {
      success: false,
      error: `Text parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Parses a movement object from JSON data
 * 
 * @param data - Movement data object
 * @returns Parsed Movement object
 */
function parseMovement(data: any): Movement {
  const beats: Beat[] = [];
  let duration = 0;
  let hasError = false;

  if (Array.isArray(data.beats)) {
    for (const beatData of data.beats) {
      const beat: Beat = {
        number: beatData.number || 0,
        event: beatData.event || '',
        duration: beatData.duration || 0,
        dataBaton: beatData.dataBaton,
        timestamp: beatData.timestamp,
        status: beatData.status || 'success',
        error: beatData.error
      };
      beats.push(beat);
      duration += beat.duration;
      if (beat.status === 'error') {
        hasError = true;
      }
    }
  }

  return {
    name: data.name || 'unknown',
    beats,
    duration: data.duration || duration,
    status: hasError ? 'error' : (data.status || 'success')
  };
}

/**
 * Calculates statistics from a parsed execution
 * 
 * @param execution - Parsed execution data
 * @returns Execution statistics
 */
export function calculateExecutionStats(execution: ParsedExecution): ExecutionStats {
  let totalBeats = 0;
  let successfulBeats = 0;
  let failedBeats = 0;
  let slowestBeat: ExecutionStats['slowestBeat'] = undefined;

  for (const movement of execution.movements) {
    for (const beat of movement.beats) {
      totalBeats++;
      
      if (beat.status === 'error') {
        failedBeats++;
      } else {
        successfulBeats++;
      }

      // Track slowest beat
      if (!slowestBeat || beat.duration > slowestBeat.duration) {
        slowestBeat = {
          movement: movement.name,
          beat: beat.number,
          duration: beat.duration
        };
      }
    }
  }

  const avgBeatDuration = totalBeats > 0 ? execution.totalDuration / totalBeats : 0;

  return {
    totalMovements: execution.movements.length,
    totalBeats,
    totalDuration: execution.totalDuration,
    avgBeatDuration: Math.round(avgBeatDuration),
    slowestBeat,
    successfulBeats,
    failedBeats
  };
}

/**
 * Exports parsed execution data as JSON string
 * 
 * @param execution - Parsed execution data
 * @returns JSON string representation
 */
export function exportAsJson(execution: ParsedExecution): string {
  return JSON.stringify(execution, null, 2);
}

