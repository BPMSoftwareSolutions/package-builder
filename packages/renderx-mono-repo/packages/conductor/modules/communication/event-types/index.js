/**
 * Event Types Index
 * Central export point for all event type definitions
 *
 * This follows the legacy RX.React pattern:
 * import { EVENT_TYPES } from './event-types/index.js';
 */
// Import all event type modules
import { CORE_EVENT_TYPES } from "./core.event-types.js";
// Import musical conductor event types from sequences
import { MUSICAL_CONDUCTOR_EVENT_TYPES, } from "../sequences/SequenceTypes.js";
/**
 * Consolidated EVENT_TYPES object
 * Combines all event types into a single object for easy access
 */
export const EVENT_TYPES = {
    // Core Events
    ...CORE_EVENT_TYPES,
    // Musical Conductor Events
    ...MUSICAL_CONDUCTOR_EVENT_TYPES,
};
/**
 * Individual event type exports for specific use cases
 */
export { CORE_EVENT_TYPES, MUSICAL_CONDUCTOR_EVENT_TYPES };
/**
 * Event Categories
 * Organizational categories for different types of events
 */
export const EVENT_CATEGORIES = {
    CORE: "core",
    MUSICAL_CONDUCTOR: "musical-conductor",
};
/**
 * Get event category for a given event type
 * @param eventType - The event type to categorize
 * @returns The category of the event type
 */
export function getEventCategory(eventType) {
    if (Object.values(CORE_EVENT_TYPES).includes(eventType)) {
        return EVENT_CATEGORIES.CORE;
    }
    if (Object.values(MUSICAL_CONDUCTOR_EVENT_TYPES).includes(eventType)) {
        return EVENT_CATEGORIES.MUSICAL_CONDUCTOR;
    }
    return null;
}
/**
 * Get all event types for a specific category
 * @param category - The category to get events for
 * @returns Array of event types in the category
 */
export function getEventsByCategory(category) {
    switch (category) {
        case EVENT_CATEGORIES.CORE:
            return Object.values(CORE_EVENT_TYPES);
        case EVENT_CATEGORIES.MUSICAL_CONDUCTOR:
            return Object.values(MUSICAL_CONDUCTOR_EVENT_TYPES);
        default:
            return [];
    }
}
//# sourceMappingURL=index.js.map