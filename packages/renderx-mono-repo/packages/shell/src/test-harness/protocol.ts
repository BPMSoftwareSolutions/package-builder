// Message protocol envelope and helpers

export const CHANNEL = 'rx.test';
export const PROTOCOL_VERSION = '1.0.0';

export type HostToDriverType =
  | 'host:init'
  | 'host:step'
  | 'host:assert'
  | 'host:snapshot'
  | 'host:teardown';

export type DriverToHostType =
  | 'driver:ack'
  | 'driver:readyPhase'
  | 'driver:stepResult'
  | 'driver:assertResult'
  | 'driver:snapshot'
  | 'driver:teardownResult'
  | 'driver:log';

export interface Message<TType extends string = string, TPayload = any> {
  channel: typeof CHANNEL;
  version: typeof PROTOCOL_VERSION;
  type: TType;
  payload?: TPayload;
}

export function isMessage(obj: any): obj is Message {
  return !!obj && obj.channel === CHANNEL && typeof obj.type === 'string';
}

export function now() { return Date.now(); }
