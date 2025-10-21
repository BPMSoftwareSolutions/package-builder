/**
 * Minimal MusicalConductor Tests
 * Basic TDD tests focusing on core functionality
 */

import { MusicalConductor } from "../../../../modules/communication/sequences/MusicalConductor";
import { EventBus } from "../../../../modules/communication/EventBus";

describe("MusicalConductor - Minimal TDD Tests", () => {
  let conductor: MusicalConductor;
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
    // Reset singleton for testing
    MusicalConductor.resetInstance();
    conductor = MusicalConductor.getInstance(eventBus);
  });

  afterEach(() => {
    MusicalConductor.resetInstance();
  });

  describe("Basic Instantiation", () => {
    it("should create a MusicalConductor instance", () => {
      expect(conductor).toBeDefined();
      expect(conductor).toBeInstanceOf(MusicalConductor);
    });

    it("should be a singleton", () => {
      const instance1 = MusicalConductor.getInstance(eventBus);
      const instance2 = MusicalConductor.getInstance(eventBus);

      expect(instance1).toBe(instance2);
      expect(instance1).toBe(conductor);
    });

    it("should reset instance correctly", () => {
      const originalInstance = MusicalConductor.getInstance(eventBus);

      MusicalConductor.resetInstance();
      const newInstance = MusicalConductor.getInstance(eventBus);

      expect(newInstance).not.toBe(originalInstance);
    });
  });

  describe("Basic Methods Exist", () => {
    it("should have sequence management methods", () => {
      expect(typeof conductor.registerSequence).toBe("function");
      expect(typeof conductor.unregisterSequence).toBe("function");
      expect(typeof conductor.getSequence).toBe("function");
      expect(typeof conductor.getSequenceNames).toBe("function");
      expect(typeof conductor.startSequence).toBe("function");
    });

    it("should have queue management methods", () => {
      expect(typeof conductor.getQueueStatus).toBe("function");
      expect(typeof conductor.getQueuedSequences).toBe("function");
      expect(typeof conductor.clearSequenceQueue).toBe("function");
    });

    it("should have statistics methods", () => {
      expect(typeof conductor.getStatistics).toBe("function");
      expect(typeof conductor.getStatus).toBe("function");
      expect(typeof conductor.resetStatistics).toBe("function");
    });

    it("should have sequence execution methods", () => {
      expect(typeof conductor.isSequenceRunning).toBe("function");
      expect(typeof conductor.getCurrentSequence).toBe("function");
    });
  });

  describe("Basic Functionality", () => {
    it("should return empty sequence names initially", () => {
      const names = conductor.getSequenceNames();
      expect(Array.isArray(names)).toBe(true);
      expect(names.length).toBe(0);
    });

    it("should return null for non-existent sequence", () => {
      const sequence = conductor.getSequence("non-existent");
      expect(sequence).toBeUndefined();
    });

    it("should provide queue status", () => {
      const queueStatus = conductor.getQueueStatus();

      expect(queueStatus).toHaveProperty("pending");
      expect(queueStatus).toHaveProperty("executing");
      expect(queueStatus).toHaveProperty("completed");
      expect(queueStatus).toHaveProperty("length");
      expect(queueStatus).toHaveProperty("activeSequence");

      expect(typeof queueStatus.pending).toBe("number");
      expect(typeof queueStatus.executing).toBe("number");
      expect(typeof queueStatus.completed).toBe("number");
      expect(queueStatus.activeSequence).toBeNull();
    });

    it("should provide statistics", () => {
      const stats = conductor.getStatistics();

      expect(stats).toHaveProperty("totalSequencesExecuted");
      expect(stats).toHaveProperty("totalBeatsExecuted");
      expect(stats).toHaveProperty("averageExecutionTime");
      expect(stats).toHaveProperty("sequenceCompletionRate");
      expect(stats).toHaveProperty("mountedPlugins");

      expect(typeof stats.totalSequencesExecuted).toBe("number");
      expect(typeof stats.mountedPlugins).toBe("number");
    });

    it("should provide status information", () => {
      const status = conductor.getStatus();

      expect(status).toHaveProperty("statistics");
      expect(status).toHaveProperty("eventBus");
      expect(status).toHaveProperty("sequences");
      expect(status).toHaveProperty("plugins");

      expect(typeof status.eventBus).toBe("boolean");
      expect(typeof status.sequences).toBe("number");
      expect(typeof status.plugins).toBe("number");
      expect(status.eventBus).toBe(true); // Should have eventBus
    });

    it("should not be running any sequence initially", () => {
      expect(conductor.isSequenceRunning()).toBe(false);
      expect(conductor.isSequenceRunning("Any Sequence")).toBe(false);
      expect(conductor.getCurrentSequence()).toBeNull();
    });

    it("should have empty queue initially", () => {
      const queuedSequences = conductor.getQueuedSequences();
      expect(Array.isArray(queuedSequences)).toBe(true);
      expect(queuedSequences.length).toBe(0);

      const clearedCount = conductor.clearSequenceQueue();
      expect(clearedCount).toBe(0);
    });

    it("should reset statistics", () => {
      conductor.resetStatistics();

      const stats = conductor.getStatistics();
      expect(stats.totalSequencesExecuted).toBe(0);
      expect(stats.totalBeatsExecuted).toBe(0);
    });
  });

  describe("Error Handling", () => {
    it("should throw error when getInstance called without eventBus on first call", () => {
      MusicalConductor.resetInstance();

      expect(() => {
        MusicalConductor.getInstance();
      }).toThrow("EventBus is required for first initialization");
    });

    it("should handle startSequence with non-existent sequence", async () => {
      await expect(
        conductor.startSequence("Non-Existent Sequence")
      ).rejects.toThrow("Sequence not found");
    });
  });
});
