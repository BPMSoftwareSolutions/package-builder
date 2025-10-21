// Centralized replay cache for EventRouter topics
// Stores last payload for selected topics so late subscribers can be replayed once on subscribe

export const lastPayload = new Map<string, any>();

// Minimal, targeted replay list to avoid broad behavior changes
export const REPLAY_TOPICS = new Set<string>([
  'control.panel.selection.updated',
  'canvas.component.selection.changed',
]);

export function getLastPayload(topic: string): any | undefined {
  return lastPayload.get(topic);
}

export function setLastPayload(topic: string, payload: any): void {
  lastPayload.set(topic, payload);
}

export function clearReplay(): void {
  lastPayload.clear();
}

