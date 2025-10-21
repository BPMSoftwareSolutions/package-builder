/**
 * EventBus Unit Tests
 * Comprehensive tests for the EventBus component
 */

import { EventBus, ConductorEventBus } from "@communication/EventBus";
import {
  TestEnvironment,
  EventTestHelpers,
  AsyncTestHelpers,
} from "@test-utils/test-helpers";
import { MockEventBusFactory } from "@mocks/MockEventBus";

describe("EventBus", () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = TestEnvironment.createEventBus();
  });

  afterEach(() => {
    TestEnvironment.cleanup();
  });

  describe("Subscription Management", () => {
    it("should subscribe to events and return unsubscribe function", () => {
      const callback = jest.fn();
      const unsubscribe = eventBus.subscribe("test-event", callback);

      expect(typeof unsubscribe).toBe("function");
      expect(eventBus).toHaveEventSubscription("test-event");
    });

    it("should call callback when event is emitted", async () => {
      const callback = jest.fn();
      const testData = { message: "test data" };

      eventBus.subscribe("test-event", callback);
      await eventBus.emit("test-event", testData);

      expect(callback).toHaveBeenCalledWith(testData);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should support multiple subscribers for same event", async () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const callback3 = jest.fn();
      const testData = { message: "broadcast test" };

      eventBus.subscribe("broadcast-event", callback1);
      eventBus.subscribe("broadcast-event", callback2);
      eventBus.subscribe("broadcast-event", callback3);

      await eventBus.emit("broadcast-event", testData);

      expect(callback1).toHaveBeenCalledWith(testData);
      expect(callback2).toHaveBeenCalledWith(testData);
      expect(callback3).toHaveBeenCalledWith(testData);
    });

    it("should unsubscribe correctly", async () => {
      const callback = jest.fn();
      const unsubscribe = eventBus.subscribe("test-event", callback);

      // Emit before unsubscribe
      await eventBus.emit("test-event", { phase: "before" });
      expect(callback).toHaveBeenCalledTimes(1);

      // Unsubscribe
      unsubscribe();

      // Emit after unsubscribe
      await eventBus.emit("test-event", { phase: "after" });
      expect(callback).toHaveBeenCalledTimes(1); // Should not increase
    });

    it("should handle multiple unsubscribes safely", () => {
      const callback = jest.fn();
      const unsubscribe = eventBus.subscribe("test-event", callback);

      // Multiple unsubscribes should not throw
      expect(() => {
        unsubscribe();
        unsubscribe();
        unsubscribe();
      }).not.toThrow();
    });

    it("should support context and plugin ID in subscriptions", () => {
      const callback = jest.fn();
      const context = { pluginId: "test-plugin", version: "1.0.0" };

      eventBus.subscribe("test-event", callback, context);

      const debugInfo = eventBus.getDebugInfo();
      expect(debugInfo.subscriptionCounts["test-event"]).toBe(1);
    });
  });

  describe("Event Emission", () => {
    it("should emit events to all subscribers", async () => {
      const callbacks = [jest.fn(), jest.fn(), jest.fn()];
      const testData = { broadcast: true };

      callbacks.forEach((callback) => {
        eventBus.subscribe("broadcast-test", callback);
      });

      await eventBus.emit("broadcast-test", testData);

      callbacks.forEach((callback) => {
        expect(callback).toHaveBeenCalledWith(testData);
      });
    });

    it("should handle events with no subscribers", async () => {
      // Should not throw when emitting to non-existent event
      await expect(
        eventBus.emit("non-existent-event", { data: "test" })
      ).resolves.not.toThrow();
    });

    it("should handle undefined and null data", async () => {
      const callback = jest.fn();
      eventBus.subscribe("data-test", callback);

      await eventBus.emit("data-test", undefined);
      expect(callback).toHaveBeenCalledWith(undefined);

      await eventBus.emit("data-test", null);
      expect(callback).toHaveBeenCalledWith(null);

      await eventBus.emit("data-test"); // No data parameter
      expect(callback).toHaveBeenCalledWith(undefined);
    });

    it("should maintain event emission order", async () => {
      const results: string[] = [];
      const callback = jest.fn((data) => results.push(data.order));

      eventBus.subscribe("order-test", callback);

      // Emit events in sequence
      await eventBus.emit("order-test", { order: "first" });
      await eventBus.emit("order-test", { order: "second" });
      await eventBus.emit("order-test", { order: "third" });

      expect(results).toEqual(["first", "second", "third"]);
    });
  });

  describe("Error Handling", () => {
    it("should isolate callback errors", async () => {
      const goodCallback = jest.fn();
      const badCallback = jest.fn(() => {
        throw new Error("Callback error");
      });
      const anotherGoodCallback = jest.fn();

      eventBus.subscribe("error-test", goodCallback);
      eventBus.subscribe("error-test", badCallback);
      eventBus.subscribe("error-test", anotherGoodCallback);

      // Should not throw despite bad callback
      await expect(
        eventBus.emit("error-test", { data: "test" })
      ).resolves.not.toThrow();

      // Good callbacks should still be called
      expect(goodCallback).toHaveBeenCalled();
      expect(anotherGoodCallback).toHaveBeenCalled();
      expect(badCallback).toHaveBeenCalled();
    });

    it("should handle async callback errors", async () => {
      const goodCallback = jest.fn();
      const asyncBadCallback = jest.fn(async () => {
        throw new Error("Async callback error");
      });

      eventBus.subscribe("async-error-test", goodCallback);
      eventBus.subscribe("async-error-test", asyncBadCallback);

      await expect(
        eventBus.emit("async-error-test", { data: "test" })
      ).resolves.not.toThrow();

      expect(goodCallback).toHaveBeenCalled();
      expect(asyncBadCallback).toHaveBeenCalled();
    });
  });

  describe("Debug Information", () => {
    it("should provide accurate debug information", async () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      eventBus.subscribe("event-1", callback1);
      eventBus.subscribe("event-1", callback2);
      eventBus.subscribe("event-2", callback1);

      await eventBus.emit("event-1", { data: "test1" });
      await eventBus.emit("event-1", { data: "test2" });
      await eventBus.emit("event-2", { data: "test3" });

      const debugInfo = eventBus.getDebugInfo();

      expect(debugInfo.totalSubscriptions).toBe(3);
      expect(debugInfo.totalEvents).toBe(3);
      expect(debugInfo.subscriptionCounts["event-1"]).toBe(2);
      expect(debugInfo.subscriptionCounts["event-2"]).toBe(1);
      expect(debugInfo.eventCounts["event-1"]).toBe(2);
      expect(debugInfo.eventCounts["event-2"]).toBe(1);
    });

    it("should update debug info when subscriptions change", () => {
      const callback = jest.fn();
      const unsubscribe = eventBus.subscribe("debug-test", callback);

      let debugInfo = eventBus.getDebugInfo();
      expect(debugInfo.subscriptionCounts["debug-test"]).toBe(1);

      unsubscribe();

      debugInfo = eventBus.getDebugInfo();
      expect(debugInfo.subscriptionCounts["debug-test"]).toBeUndefined();
    });
  });

  describe("Performance", () => {
    it("should handle rapid event emissions", async () => {
      const callback = jest.fn();
      eventBus.subscribe("performance-test", callback);

      const startTime = performance.now();

      // Emit 1000 events rapidly
      const promises = [];
      for (let i = 0; i < 1000; i++) {
        promises.push(eventBus.emit("performance-test", { index: i }));
      }

      await Promise.all(promises);

      const duration = performance.now() - startTime;

      expect(callback).toHaveBeenCalledTimes(1000);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it("should handle many subscribers efficiently", async () => {
      const callbacks = Array.from({ length: 100 }, () => jest.fn());

      callbacks.forEach((callback) => {
        eventBus.subscribe("many-subscribers-test", callback);
      });

      const startTime = performance.now();
      await eventBus.emit("many-subscribers-test", { data: "test" });
      const duration = performance.now() - startTime;

      callbacks.forEach((callback) => {
        expect(callback).toHaveBeenCalledTimes(1);
      });

      expect(duration).toBeLessThan(100); // Should complete quickly
    });
  });

  describe("Memory Management", () => {
    it("should not leak memory when subscribing and unsubscribing", () => {
      const initialDebugInfo = eventBus.getDebugInfo();

      // Create and destroy many subscriptions
      for (let i = 0; i < 100; i++) {
        const unsubscribe = eventBus.subscribe(`temp-event-${i}`, jest.fn());
        unsubscribe();
      }

      const finalDebugInfo = eventBus.getDebugInfo();

      expect(finalDebugInfo.totalSubscriptions).toBe(
        initialDebugInfo.totalSubscriptions
      );
    });
  });
});

describe("ConductorEventBus", () => {
  let conductorEventBus: ConductorEventBus;
  let mockConductor: any;

  beforeEach(() => {
    mockConductor = {
      sequences: new Map(),
      startSequence: jest.fn(),
      getSequenceNames: jest.fn(() => []),
      getStatistics: jest.fn(() => ({})),
    };

    conductorEventBus = new ConductorEventBus(mockConductor);
  });

  afterEach(() => {
    TestEnvironment.cleanup();
  });

  describe("Conductor Integration", () => {
    it("should connect to main conductor", () => {
      const mainConductor = {
        sequences: new Map(),
        registerSequence: jest.fn(),
        getSequenceNames: jest.fn(() => []),
      };

      conductorEventBus.connectToMainConductor(mainConductor);

      // Should use external conductor's sequence registry
      expect(conductorEventBus.sequences).toBe(mainConductor.sequences);
    });

    it("should play sequences through conductor", async () => {
      const sequenceName = "Test Sequence";
      const sequenceData = { test: true };

      await conductorEventBus.play(sequenceName, sequenceData);

      expect(mockConductor.startSequence).toHaveBeenCalledWith(
        sequenceName,
        sequenceData
      );
    });

    it("should handle conductor play errors gracefully", async () => {
      mockConductor.startSequence.mockRejectedValue(
        new Error("Conductor error")
      );

      await expect(
        conductorEventBus.play("Test Sequence", {})
      ).resolves.not.toThrow();
    });
  });

  describe("Musical Sequence Management", () => {
    it("should register musical sequences", () => {
      const mockSequence = {
        name: "Test Sequence",
        description: "Test sequence",
        movements: [],
      };

      conductorEventBus.registerSequence("test-sequence", mockSequence);

      expect(conductorEventBus.sequences.has("test-sequence")).toBe(true);
      expect(conductorEventBus.sequences.get("test-sequence")).toBe(
        mockSequence
      );
    });

    it("should get sequence names", () => {
      conductorEventBus.registerSequence("seq1", { name: "Sequence 1" } as any);
      conductorEventBus.registerSequence("seq2", { name: "Sequence 2" } as any);

      const names = conductorEventBus.getSequenceNames();
      expect(names).toContain("seq1");
      expect(names).toContain("seq2");
    });
  });

  describe("Metrics and Statistics", () => {
    it("should provide conductor metrics", () => {
      const metrics = conductorEventBus.getMetrics();

      expect(metrics).toHaveProperty("sequenceCount");
      expect(metrics).toHaveProperty("eventBusStats");
      expect(metrics).toHaveProperty("conductorStats");
    });

    it("should track sequence execution metrics", async () => {
      mockConductor.startSequence.mockResolvedValue("sequence-id-123");

      await conductorEventBus.play("Test Sequence", {});

      const metrics = conductorEventBus.getMetrics();
      expect(metrics.sequenceExecutions).toBeGreaterThan(0);
    });
  });

  describe("Tempo and Musical Timing", () => {
    it("should set and get tempo", () => {
      conductorEventBus.setTempo(140);
      expect(conductorEventBus.getTempo()).toBe(140);
    });

    it("should calculate beat duration from tempo", () => {
      conductorEventBus.setTempo(120); // 120 BPM = 500ms per beat
      const beatDuration = conductorEventBus.getBeatDuration();
      expect(beatDuration).toBe(500);
    });

    it("should handle tempo changes during execution", async () => {
      conductorEventBus.setTempo(120);

      const callback = jest.fn();
      conductorEventBus.subscribe("tempo-test", callback);

      // Change tempo mid-execution
      conductorEventBus.setTempo(240);

      await conductorEventBus.emit("tempo-test", {
        tempo: conductorEventBus.getTempo(),
      });

      expect(callback).toHaveBeenCalledWith({ tempo: 240 });
    });
  });
});
