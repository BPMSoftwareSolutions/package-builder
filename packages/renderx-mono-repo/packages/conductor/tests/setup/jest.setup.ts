// Jest setup for MusicalConductor core tests
// - Adds lightweight custom matchers used by existing tests
// - Keeps environment helpers minimal and framework-agnostic

import type { EventBus } from "../../modules/communication/EventBus";
import type { MusicalConductor } from "../../modules/communication/sequences/MusicalConductor";

expect.extend({
  toHaveEventSubscription(eventBus: EventBus, eventName: string) {
    try {
      const info = (eventBus as any).getDebugInfo?.();
      const count = info?.subscriptionCounts?.[eventName];
      const pass = typeof count === "number" && count > 0;
      return {
        pass,
        message: () =>
          `Expected eventBus to have subscriptions for "${eventName}", got ${count ?? "none"}`,
      };
    } catch (e) {
      return {
        pass: false,
        message: () => `Failed to read debug info from eventBus: ${(e as Error).message}`,
      };
    }
  },

  toHaveSequenceRegistered(conductor: MusicalConductor, sequenceName: string) {
    try {
      const names = (conductor as any).getSequenceNames?.() ?? [];
      const pass = Array.isArray(names) && names.includes(sequenceName);
      return {
        pass,
        message: () => `Expected conductor to have sequence "${sequenceName}" registered`,
      };
    } catch (e) {
      return {
        pass: false,
        message: () => `Failed to query sequence names: ${(e as Error).message}`,
      };
    }
  },
});

// Global test hooks (noop placeholders for future use)
beforeEach(() => {
  // Intentionally empty
});

afterEach(() => {
  // Intentionally empty
});

