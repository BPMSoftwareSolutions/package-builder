/**
 * Runtime Configuration Types
 * 
 * Type definitions for plugin runtime configuration including handlers,
 * sequences, movements, executions, background jobs, and caching.
 */

export interface RuntimeHandler {
  name: string;
  duration?: number;
  errorRate?: number;
}

export interface RuntimeMovement {
  from: string;
  to: string;
  mapping?: any;
}

export interface RuntimeExecution {
  id: string;
  timestamp: string;
  duration: number;
  input?: any;
  output?: any;
  errors?: any;
  trace?: any;
}

export interface RuntimeSequence {
  id: string;
  name: string;
  description?: string;
  handlers?: RuntimeHandler[];
  movements?: RuntimeMovement[];
  parameters?: Record<string, any>;
  dataBatonContracts?: any;
  returns?: any;
  executions?: RuntimeExecution[];
  metrics?: {
    avgDuration?: number;
    successRate?: number;
    errorPatterns?: any;
  };
}

export interface RuntimeBackgroundJob {
  id: string;
  schedule?: string;
  status: string;
}

export interface RuntimeCaching {
  strategy?: string;
  hitRate?: number;
  missRate?: number;
}

export interface RuntimeConfiguration {
  module: string;
  export: string;
  sequences?: RuntimeSequence[];
  capabilities?: string[];
  backgroundJobs?: RuntimeBackgroundJob[];
  caching?: RuntimeCaching;
}

