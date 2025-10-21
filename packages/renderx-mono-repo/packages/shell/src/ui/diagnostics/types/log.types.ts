/**
 * Log Types
 * 
 * Type definitions for diagnostic logging.
 */

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  data?: any;
}

