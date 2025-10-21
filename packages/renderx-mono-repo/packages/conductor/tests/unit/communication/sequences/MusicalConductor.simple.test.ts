/**
 * Simple MusicalConductor Tests
 * TDD tests for MusicalConductor without complex imports
 */

import { MusicalConductor } from "../../../../modules/communication/sequences/MusicalConductor";
import { EventBus } from "../../../../modules/communication/EventBus";
import {
  SEQUENCE_CATEGORIES,
  MUSICAL_DYNAMICS,
  MUSICAL_TIMING,
} from "../../../../modules/communication/sequences/SequenceTypes";

describe("MusicalConductor - Simple TDD Tests", () => {
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

  describe("Singleton Pattern", () => {
    it("should return the same instance when called multiple times", () => {
      const instance1 = MusicalConductor.getInstance(eventBus);
      const instance2 = MusicalConductor.getInstance(eventBus);

      expect(instance1).toBe(instance2);
      expect(instance1).toBe(conductor);
    });

    it("should reset instance when resetInstance is called", () => {
      const originalInstance = MusicalConductor.getInstance(eventBus);

      MusicalConductor.resetInstance();
      const newInstance = MusicalConductor.getInstance(eventBus);

      expect(newInstance).not.toBe(originalInstance);
    });

    it("should throw error when getInstance called without eventBus on first call", () => {
      MusicalConductor.resetInstance();

      expect(() => {
        MusicalConductor.getInstance();
      }).toThrow("EventBus is required for first initialization");
    });
  });

  describe("Sequence Registration", () => {
    it("should register a musical sequence", () => {
      const sequence = {
        id: "test-sequence",
        name: "Test Sequence",
        description: "A test sequence",
        key: "C Major",
        tempo: 120,
        timeSignature: "4/4",
        category: SEQUENCE_CATEGORIES.COMPONENT_UI,
        movements: [
          {
            id: "test-movement",
            name: "Test Movement",
            description: "A test movement",
            beats: [
              {
                beat: 1,
                event: "test-event",
                title: "Test Beat",
                description: "A test beat",
                dynamics: MUSICAL_DYNAMICS.MEZZO_FORTE,
                timing: MUSICAL_TIMING.IMMEDIATE,
                data: { test: true },
                errorHandling: "continue" as const,
              },
            ],
          },
        ],
      };

      conductor.registerSequence(sequence);

      expect(conductor.getSequenceNames()).toContain(sequence.name);
      expect(conductor.getSequence(sequence.id)).toBe(sequence);
    });

    it("should handle duplicate sequence registration", () => {
      const sequence = {
        id: "duplicate-test",
        name: "Duplicate Test",
        description: "A test sequence",
        key: "C Major",
        tempo: 120,
        timeSignature: "4/4",
        category: SEQUENCE_CATEGORIES.COMPONENT_UI,
        movements: [
          {
            id: "test-movement",
            name: "test-movement",
            beats: [
              {
                beat: 1,
                event: "test-event",
                title: "Test Event",
                description: "Test event for duplicate registration",
                dynamics: MUSICAL_DYNAMICS.FORTE,
                timing: MUSICAL_TIMING.IMMEDIATE,
                errorHandling: "continue" as const,
                data: {},
              },
            ],
          },
        ],
      };

      conductor.registerSequence(sequence);
      conductor.registerSequence(sequence); // Register again

      const sequenceNames = conductor.getSequenceNames();
      const occurrences = sequenceNames.filter(
        (name) => name === sequence.name
      ).length;
      expect(occurrences).toBe(1); // Should only appear once
    });

    it("should get all registered sequence names", () => {
      const sequences = [
        {
          id: "sequence-1",
          name: "Sequence 1",
          description: "Test sequence 1",
          key: "C Major",
          tempo: 120,
          timeSignature: "4/4",
          category: SEQUENCE_CATEGORIES.COMPONENT_UI,
          movements: [
            {
              id: "movement-1",
              name: "movement-1",
              beats: [
                {
                  beat: 1,
                  event: "test-event-1",
                  title: "Test Event 1",
                  description: "Test event 1",
                  dynamics: MUSICAL_DYNAMICS.FORTE,
                  timing: MUSICAL_TIMING.IMMEDIATE,
                  errorHandling: "continue" as const,
                  data: {},
                },
              ],
            },
          ],
        },
        {
          id: "sequence-2",
          name: "Sequence 2",
          description: "Test sequence 2",
          key: "C Major",
          tempo: 120,
          timeSignature: "4/4",
          category: SEQUENCE_CATEGORIES.COMPONENT_UI,
          movements: [
            {
              id: "movement-2",
              name: "movement-2",
              beats: [
                {
                  beat: 1,
                  event: "test-event-2",
                  title: "Test Event 2",
                  description: "Test event 2",
                  dynamics: MUSICAL_DYNAMICS.FORTE,
                  timing: MUSICAL_TIMING.IMMEDIATE,
                  errorHandling: "continue" as const,
                  data: {},
                },
              ],
            },
          ],
        },
        {
          id: "sequence-3",
          name: "Sequence 3",
          description: "Test sequence 3",
          key: "C Major",
          tempo: 120,
          timeSignature: "4/4",
          category: SEQUENCE_CATEGORIES.COMPONENT_UI,
          movements: [
            {
              id: "movement-3",
              name: "movement-3",
              beats: [
                {
                  beat: 1,
                  event: "test-event-3",
                  title: "Test Event 3",
                  description: "Test event 3",
                  dynamics: MUSICAL_DYNAMICS.FORTE,
                  timing: MUSICAL_TIMING.IMMEDIATE,
                  errorHandling: "continue" as const,
                  data: {},
                },
              ],
            },
          ],
        },
      ];

      sequences.forEach((seq) => conductor.registerSequence(seq as any));

      const names = conductor.getSequenceNames();
      sequences.forEach((seq) => {
        expect(names).toContain(seq.name);
      });
      expect(names.length).toBe(sequences.length);
    });

    it("should unregister sequences", () => {
      const sequence = {
        id: "unregister-test",
        name: "Unregister Test",
        description: "A test sequence for unregistration",
        key: "C Major",
        tempo: 120,
        timeSignature: "4/4",
        category: SEQUENCE_CATEGORIES.COMPONENT_UI,
        movements: [
          {
            id: "unregister-movement",
            name: "unregister-movement",
            beats: [
              {
                beat: 1,
                event: "unregister-event",
                title: "Unregister Event",
                description: "Test event for unregistration",
                dynamics: MUSICAL_DYNAMICS.FORTE,
                timing: MUSICAL_TIMING.IMMEDIATE,
                errorHandling: "continue" as const,
                data: {},
              },
            ],
          },
        ],
      };

      conductor.registerSequence(sequence);
      expect(conductor.getSequenceNames()).toContain(sequence.name);

      conductor.unregisterSequence(sequence.id);
      expect(conductor.getSequenceNames()).not.toContain(sequence.name);
    });
  });

  describe("Sequence Execution", () => {
    beforeEach(() => {
      const testSequence = {
        id: "basic-test-sequence",
        name: "Basic Test Sequence",
        description: "Simple test sequence",
        key: "C Major",
        tempo: 120,
        timeSignature: "4/4",
        category: SEQUENCE_CATEGORIES.COMPONENT_UI,
        movements: [
          {
            id: "test-movement",
            name: "Test Movement",
            description: "Simple movement",
            beats: [
              {
                beat: 1,
                event: "test-start",
                title: "Start Beat",
                description: "Initial beat",
                dynamics: MUSICAL_DYNAMICS.FORTE,
                timing: MUSICAL_TIMING.IMMEDIATE,
                data: { phase: "start" },
                errorHandling: "continue" as const,
              },
              {
                beat: 2,
                event: "test-complete",
                title: "Complete Beat",
                description: "Final beat",
                dynamics: MUSICAL_DYNAMICS.PIANO,
                timing: MUSICAL_TIMING.IMMEDIATE,
                data: { phase: "complete" },
                errorHandling: "continue" as const,
              },
            ],
          },
        ],
      };

      conductor.registerSequence(testSequence);
    });

    it("should start a sequence and return execution ID", async () => {
      const sequenceId = await conductor.startSequence("basic-test-sequence", {
        test: true,
      });

      expect(sequenceId).toBeDefined();
      expect(typeof sequenceId).toBe("string");
    });

    it("should throw error for non-existent sequence", async () => {
      await expect(
        conductor.startSequence("Non-Existent Sequence")
      ).rejects.toThrow("Sequence not found");
    });

    it("should handle sequence execution with data", async () => {
      const testData = { userId: 123, action: "test" };

      const sequenceId = await conductor.startSequence(
        "basic-test-sequence",
        testData
      );

      expect(sequenceId).toBeDefined();
    });
  });

  describe("Queue Management", () => {
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
    });

    it("should track active sequence", () => {
      const queueStatus = conductor.getQueueStatus();

      // Initially no active sequence
      expect(queueStatus.activeSequence).toBeNull();
      expect(queueStatus.executing).toBe(0);
    });
  });

  describe("Statistics and Monitoring", () => {
    it("should provide execution statistics", () => {
      const stats = conductor.getStatistics();

      expect(stats).toHaveProperty("totalSequencesExecuted");
      expect(stats).toHaveProperty("totalBeatsExecuted");
      expect(stats).toHaveProperty("averageExecutionTime");
      expect(stats).toHaveProperty("successRate");
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
    });

    it("should reset statistics", () => {
      conductor.resetStatistics();

      const stats = conductor.getStatistics();
      expect(stats.totalSequencesExecuted).toBe(0);
      expect(stats.totalBeatsExecuted).toBe(0);
    });
  });

  describe("Sequence Management", () => {
    it("should check if sequence is running", () => {
      expect(conductor.isSequenceRunning()).toBe(false);
      expect(conductor.isSequenceRunning("Any Sequence")).toBe(false);
    });

    it("should get current sequence", () => {
      const currentSequence = conductor.getCurrentSequence();
      expect(currentSequence).toBeNull(); // No sequence running initially
    });

    it("should get queued sequences", () => {
      const queuedSequences = conductor.getQueuedSequences();
      expect(Array.isArray(queuedSequences)).toBe(true);
      expect(queuedSequences.length).toBe(0); // Initially empty
    });

    it("should clear sequence queue", () => {
      const clearedCount = conductor.clearSequenceQueue();
      expect(typeof clearedCount).toBe("number");
      expect(clearedCount).toBe(0); // Initially empty
    });
  });
});
