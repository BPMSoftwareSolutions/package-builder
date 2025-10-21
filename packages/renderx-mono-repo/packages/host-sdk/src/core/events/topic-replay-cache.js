// Centralized replay cache for EventRouter topics
// Stores last payload for selected topics so late subscribers can be replayed once on subscribe
export const lastPayload = new Map();
// Minimal, targeted replay list to avoid broad behavior changes
export const REPLAY_TOPICS = new Set([
    'control.panel.selection.updated',
    'canvas.component.selection.changed',
]);
export function getLastPayload(topic) {
    return lastPayload.get(topic);
}
export function setLastPayload(topic, payload) {
    lastPayload.set(topic, payload);
}
export function clearReplay() {
    lastPayload.clear();
}
//# sourceMappingURL=topic-replay-cache.js.map