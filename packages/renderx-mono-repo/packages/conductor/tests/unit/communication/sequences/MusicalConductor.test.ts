/**
 * MusicalConductor Unit Tests
 * TDD implementation for the MusicalConductor component
 */

import { MusicalConductor } from "@communication/sequences/MusicalConductor";
import { EventBus } from "@communication/EventBus";
import {
  TestEnvironment,
  MusicalTimingHelpers,
  AsyncTestHelpers,
} from "@test-utils/test-helpers";
import { TEST_SEQUENCES as TestSequences } from "@fixtures/mock-sequences";
import { SequenceBuilder, BeatBuilder } from "@test-utils/sequence-builders";
import type { MusicalSequence } from "@communication/sequences/SequenceTypes";

describe("MusicalConductor", () => {
  let conductor: MusicalConductor;
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = TestEnvironment.createEventBus();
    conductor = TestEnvironment.createMusicalConductor(eventBus);
  });

  afterEach(() => {
    TestEnvironment.cleanup();
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
  });

  describe("Sequence Registration", () => {
    it("should register a musical sequence", () => {
      const sequence = TestSequences.BASIC_TEST_SEQUENCE;

      conductor.registerSequence(sequence);

      expect(conductor).toHaveSequenceRegistered(sequence.name);
      expect(conductor.getSequenceNames()).toContain(sequence.name);
    });

    it("should handle duplicate sequence registration", () => {
      const sequence = TestSequences.BASIC_TEST_SEQUENCE;

      conductor.registerSequence(sequence);
      conductor.registerSequence(sequence); // Register again

      const sequenceNames = conductor.getSequenceNames();
      const occurrences = sequenceNames.filter(
        (name) => name === sequence.name
      ).length;
      expect(occurrences).toBe(1); // Should only appear once
    });

    it("should validate sequence structure before registration", () => {
      const invalidSequence = {
        name: "Invalid Sequence",
        // Missing required properties
      } as MusicalSequence;

      expect(() => {
        conductor.registerSequence(invalidSequence);
      }).toThrow();
    });

    it("should register multiple sequences", () => {
      const sequences = [
        TestSequences.BASIC_TEST_SEQUENCE,
        TestSequences.FAST_TEMPO_SEQUENCE,
        TestSequences.MIXED_TIMING_SEQUENCE,
      ];

      sequences.forEach((seq) => conductor.registerSequence(seq));

      sequences.forEach((seq) => {
        expect(conductor).toHaveSequenceRegistered(seq.name);
      });
      expect(conductor.getSequenceNames()).toHaveLength(sequences.length);
    });
  });

  describe("Sequence Execution", () => {
    beforeEach(() => {
      conductor.registerSequence(TestSequences.BASIC_TEST_SEQUENCE);
    });

    it("should start a sequence and return execution ID", async () => {
      const sequenceId = await conductor.startSequence(
        TestSequences.BASIC_TEST_SEQUENCE.name,
        { test: true }
      );

      expect(sequenceId).toBeDefined();
      expect(typeof sequenceId).toBe("string");
    });

    it("should execute sequence beats in order", async () => {
      const eventOrder: string[] = [];

      // Subscribe to sequence events
      eventBus.subscribe("test-start", () => eventOrder.push("start"));
      eventBus.subscribe("test-process", () => eventOrder.push("process"));
      eventBus.subscribe("test-complete", () => eventOrder.push("complete"));

      await conductor.startSequence(TestSequences.BASIC_TEST_SEQUENCE.name);

      // Wait for sequence to complete
      await AsyncTestHelpers.waitFor(() => eventOrder.length === 3, 2000);

      expect(eventOrder).toEqual(["start", "process", "complete"]);
    });

    it("should handle sequence execution with timing", async () => {
      const timingTest = MusicalTimingHelpers.createTimingTest(120); // 120 BPM

      eventBus.subscribe("test-start", () => timingTest.recordBeat());
      eventBus.subscribe("test-process", () => timingTest.recordBeat());
      eventBus.subscribe("test-complete", () => timingTest.recordBeat());

      await conductor.startSequence(TestSequences.BASIC_TEST_SEQUENCE.name);

      // Wait for sequence completion
      await AsyncTestHelpers.waitFor(
        () => timingTest.getBeatDurations().length === 2,
        3000
      );

      // Verify musical timing (500ms per beat at 120 BPM)
      timingTest.assertTiming(100); // 100ms tolerance
    });

    it("should throw error for non-existent sequence", async () => {
      await expect(
        conductor.startSequence("Non-Existent Sequence")
      ).rejects.toThrow("Sequence not found");
    });

    it("should handle concurrent sequence execution", async () => {
      conductor.registerSequence(TestSequences.FAST_TEMPO_SEQUENCE);

      const promise1 = conductor.startSequence(
        TestSequences.BASIC_TEST_SEQUENCE.name
      );
      const promise2 = conductor.startSequence(
        TestSequences.FAST_TEMPO_SEQUENCE.name
      );

      const [id1, id2] = await Promise.all([promise1, promise2]);

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });
  });

  describe("Queue Management", () => {
    it("should provide queue status", () => {
      const queueStatus = conductor.getQueueStatus();

      expect(queueStatus).toHaveProperty("pending");
      expect(queueStatus).toHaveProperty("executing");
      expect(queueStatus).toHaveProperty("completed");
      expect(typeof queueStatus.pending).toBe("number");
    });

    it("should queue sequences when conductor is busy", async () => {
      conductor.registerSequence(TestSequences.BASIC_TEST_SEQUENCE);
      conductor.registerSequence(TestSequences.FAST_TEMPO_SEQUENCE);

      // Start first sequence
      const id1 = await conductor.startSequence(
        TestSequences.BASIC_TEST_SEQUENCE.name
      );

      // Queue second sequence
      const id2Promise = conductor.startSequence(
        TestSequences.FAST_TEMPO_SEQUENCE.name
      );

      const queueStatus = conductor.getQueueStatus();
      expect(queueStatus.pending).toBeGreaterThan(0);

      const id2 = await id2Promise;
      expect(id2).toBeDefined();
    });
  });

  describe("Statistics and Monitoring", () => {
    it("should provide execution statistics", () => {
      const stats = conductor.getStatistics();

      expect(stats).toHaveProperty("totalSequencesExecuted");
      expect(stats).toHaveProperty("averageExecutionTime");
      expect(stats).toHaveProperty("successRate");
      expect(typeof stats.totalSequencesExecuted).toBe("number");
    });

    it("should update statistics after sequence execution", async () => {
      conductor.registerSequence(TestSequences.BASIC_TEST_SEQUENCE);

      const statsBefore = conductor.getStatistics();

      await conductor.startSequence(TestSequences.BASIC_TEST_SEQUENCE.name);

      // Wait for sequence completion
      await AsyncTestHelpers.flushPromises();

      const statsAfter = conductor.getStatistics();
      expect(statsAfter.totalSequencesExecuted).toBeGreaterThan(
        statsBefore.totalSequencesExecuted
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle sequence execution errors gracefully", async () => {
      const errorSequence = SequenceBuilder.simple("Error Test Sequence")
        .addMovement({
          name: "Error Movement",
          description: "Movement that causes errors",
          beats: [
            BeatBuilder.simple(1, "error-event").errorHandling("abort").build(),
          ],
        })
        .build();

      conductor.registerSequence(errorSequence);

      // Subscribe to error event and throw error
      eventBus.subscribe("error-event", () => {
        throw new Error("Test error");
      });

      // Should not throw, but handle gracefully
      await expect(
        conductor.startSequence(errorSequence.name)
      ).resolves.toBeDefined();
    });

    it("should continue execution on non-critical errors", async () => {
      const continueSequence = SequenceBuilder.simple("Continue Test Sequence")
        .addMovement({
          name: "Continue Movement",
          description: "Movement that continues after errors",
          beats: [
            BeatBuilder.simple(1, "error-event")
              .errorHandling("continue")
              .build(),
            BeatBuilder.simple(2, "success-event").build(),
          ],
        })
        .build();

      conductor.registerSequence(continueSequence);

      let successEventFired = false;
      eventBus.subscribe("error-event", () => {
        throw new Error("Test error");
      });
      eventBus.subscribe("success-event", () => {
        successEventFired = true;
      });

      await conductor.startSequence(continueSequence.name);

      // Wait for sequence completion
      await AsyncTestHelpers.waitFor(() => successEventFired, 2000);

      expect(successEventFired).toBe(true);
    });
  });

  describe("Performance", () => {
    it("should handle rapid sequence registration", () => {
      const sequences = Array.from({ length: 100 }, (_, i) =>
        SequenceBuilder.simple(`Performance Test ${i}`)
          .addMovement({
            name: "Perf Movement",
            description: "Performance test movement",
            beats: [BeatBuilder.simple(1, `perf-event-${i}`).build()],
          })
          .build()
      );

      const startTime = performance.now();
      sequences.forEach((seq) => conductor.registerSequence(seq));
      const duration = performance.now() - startTime;

      expect(conductor.getSequenceNames()).toHaveLength(100);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
