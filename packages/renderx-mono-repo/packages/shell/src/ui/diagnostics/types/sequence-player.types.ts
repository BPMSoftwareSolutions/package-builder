/**
 * Sequence Player Types
 * 
 * Type definitions for the Diagnostic Sequence Player feature.
 * Used for parsing and replaying sequence execution logs.
 */

/**
 * Represents a single beat (step) in a sequence execution
 */
export interface Beat {
  /** Beat number in the sequence */
  number: number;
  /** Event name/identifier */
  event: string;
  /** Duration of this beat in milliseconds */
  duration: number;
  /** Optional data baton passed through this beat */
  dataBaton?: any;
  /** Timestamp when the beat started */
  timestamp?: string;
  /** Status of the beat execution */
  status?: 'success' | 'error' | 'pending';
  /** Error message if status is 'error' */
  error?: string;
}

/**
 * Represents a movement (group of beats) in a sequence
 */
export interface Movement {
  /** Name of the movement */
  name: string;
  /** Array of beats in this movement */
  beats: Beat[];
  /** Total duration of this movement in milliseconds */
  duration: number;
  /** Status of the movement execution */
  status?: 'success' | 'error' | 'pending';
}

/**
 * Represents a parsed sequence execution from logs
 */
export interface ParsedExecution {
  /** Unique identifier for the sequence */
  sequenceId: string;
  /** Human-readable name of the sequence */
  sequenceName: string;
  /** Plugin that owns this sequence */
  pluginId: string;
  /** Unique request ID for this execution */
  requestId: string;
  /** Array of movements in this execution */
  movements: Movement[];
  /** Total duration of the entire execution in milliseconds */
  totalDuration: number;
  /** Overall status of the execution */
  status: 'success' | 'error';
  /** Timestamp when execution started */
  startTime?: string;
  /** Timestamp when execution ended */
  endTime?: string;
  /** Error message if status is 'error' */
  error?: string;
}

/**
 * Input format for log parsing
 */
export interface LogInput {
  /** Raw log content (text or JSON string) */
  content: string;
  /** Format of the log */
  format: 'json' | 'text';
}

/**
 * Result of log parsing operation
 */
export interface ParseResult {
  /** Whether parsing was successful */
  success: boolean;
  /** Parsed execution data if successful */
  execution?: ParsedExecution;
  /** Error message if parsing failed */
  error?: string;
}

/**
 * Statistics about a parsed execution
 */
export interface ExecutionStats {
  /** Total number of movements */
  totalMovements: number;
  /** Total number of beats */
  totalBeats: number;
  /** Total duration in milliseconds */
  totalDuration: number;
  /** Average beat duration in milliseconds */
  avgBeatDuration: number;
  /** Slowest beat */
  slowestBeat?: {
    movement: string;
    beat: number;
    duration: number;
  };
  /** Number of successful beats */
  successfulBeats: number;
  /** Number of failed beats */
  failedBeats: number;
}

