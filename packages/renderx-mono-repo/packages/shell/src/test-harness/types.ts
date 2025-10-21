// Shared types for plugin-served, data-driven E2E

export type TestApiVersion = string; // semver string, e.g., "1.0.0"

export interface TestManifest {
  testApiVersion: TestApiVersion;
  plugin: { id: string; version: string };
  driverUrl: string; // e.g., "/test/driver.html"
  capabilities?: string[];
  scenarios: TestScenario[];
}

export interface EnvHints {
  viewport?: { width: number; height: number };
  theme?: 'light' | 'dark';
  [key: string]: unknown;
}

export interface ReadinessSpec {
  phases: number[]; // e.g., [0,1,2]
  timeoutMs?: number;
}

export interface TestScenario {
  id: string;
  title?: string;
  tags?: string[];
  readiness?: ReadinessSpec;
  env?: EnvHints;
  steps?: Step[];
  asserts?: Assert[];
  artifacts?: { screenshot?: boolean; snapshot?: boolean };
}

export interface Step {
  type: string;
  payload?: any;
}

export interface Assert {
  type: string;
  selector?: string;
  [key: string]: any;
}

export interface StepResult {
  id: string | number;
  status: 'ok' | 'fail';
  detail?: any;
}

export interface AssertResult {
  id: string | number;
  status: 'ok' | 'fail';
  detail?: any;
}

export interface TestHarnessAPI {
  load(driverUrl: string, scenario: { id: string; env?: EnvHints; flags?: Record<string, any> }): Promise<void>;
  waitForReadyPhases(phases: number[], timeoutMs?: number): Promise<void>;
  runSteps(steps: Step[], timeoutPerStepMs?: number): Promise<StepResult[]>;
  runAsserts(asserts: Assert[], timeoutPerAssertMs?: number): Promise<AssertResult[]>;
  getSnapshot(): Promise<any | null>;
  getLogs(): LogEntry[];
  teardown(): Promise<void>;
}

export interface LogEntry {
  t: number; // epoch ms
  dir: 'host' | 'driver';
  type: string;
  payload?: any;
}
