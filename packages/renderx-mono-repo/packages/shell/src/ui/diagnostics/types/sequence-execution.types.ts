/**
 * Sequence Execution Types
 * 
 * Type definitions for live sequence triggering and execution monitoring.
 * Part of Issue #306 - Release 2: Live Sequence Triggering.
 */

/**
 * Represents an available sequence that can be triggered
 */
export interface AvailableSequence {
  /** Unique identifier for the sequence */
  sequenceId: string;
  /** Human-readable name of the sequence */
  sequenceName: string;
  /** Plugin that owns this sequence */
  pluginId: string;
  /** Description of what the sequence does */
  description?: string;
  /** Expected parameters for the sequence */
  parameters?: Record<string, any>;
  /** Whether the sequence is currently mounted in the conductor */
  isMounted: boolean;
}

/**
 * Represents a single beat in a live execution
 */
export interface LiveBeat {
  /** Beat number in the sequence */
  number: number;
  /** Event name/identifier */
  event: string;
  /** Status of the beat execution */
  status: 'pending' | 'running' | 'success' | 'error';
  /** Timestamp when the beat started */
  startTime?: string;
  /** Duration of this beat in milliseconds */
  duration?: number;
  /** Error message if status is 'error' */
  error?: string;
  /** Optional data baton passed through this beat */
  dataBaton?: any;
}

/**
 * Represents a live sequence execution in progress
 */
export interface LiveExecution {
  /** Unique identifier for the sequence */
  sequenceId: string;
  /** Plugin that owns this sequence */
  pluginId: string;
  /** Unique request ID for this execution */
  requestId: string;
  /** Overall status of the execution */
  status: 'pending' | 'running' | 'success' | 'error';
  /** Timestamp when execution started */
  startTime: string;
  /** Timestamp when execution ended */
  endTime?: string;
  /** Current beat being executed */
  currentBeat?: string;
  /** Array of beats in this execution */
  beats: LiveBeat[];
  /** Parameters used for this execution */
  parameters?: Record<string, any>;
  /** Error message if status is 'error' */
  error?: string;
  /** Total duration in milliseconds (calculated when complete) */
  totalDuration?: number;
}

/**
 * Represents a historical execution record
 */
export interface ExecutionHistoryItem {
  /** Unique identifier for the sequence */
  sequenceId: string;
  /** Human-readable name of the sequence */
  sequenceName: string;
  /** Plugin that owns this sequence */
  pluginId: string;
  /** Unique request ID for this execution */
  requestId: string;
  /** Overall status of the execution */
  status: 'success' | 'error';
  /** Timestamp when execution started */
  startTime: string;
  /** Timestamp when execution ended */
  endTime: string;
  /** Total duration in milliseconds */
  totalDuration: number;
  /** Number of beats executed */
  beatCount: number;
  /** Parameters used for this execution */
  parameters?: Record<string, any>;
  /** Error message if status is 'error' */
  error?: string;
  /** Full execution data for replay */
  execution: LiveExecution;
}

/**
 * Filter options for execution history
 */
export interface HistoryFilter {
  /** Filter by status */
  status?: 'all' | 'success' | 'error';
  /** Filter by plugin ID */
  pluginId?: string;
  /** Filter by sequence ID */
  sequenceId?: string;
}

/**
 * Statistics about execution history
 */
export interface HistoryStats {
  /** Total number of executions */
  total: number;
  /** Number of successful executions */
  successCount: number;
  /** Number of failed executions */
  errorCount: number;
  /** Success rate as a percentage */
  successRate: number;
  /** Average execution duration in milliseconds */
  avgDuration: number;
}

