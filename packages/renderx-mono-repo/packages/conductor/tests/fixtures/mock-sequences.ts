// Minimal mock sequences used by core tests
import type { MusicalSequence } from "../../modules/communication/sequences/SequenceTypes";

export const TEST_SEQUENCES: Record<string, MusicalSequence> = {
  BASIC_TEST_SEQUENCE: {
    id: "basic-test-seq",
    name: "Basic Test Sequence",
    description: "A simple 3-beat test sequence",
    key: "C Major",
    tempo: 120,
    category: "system" as any,
    movements: [
      {
        id: "move-1",
        name: "Test Movement",
        description: "Testing movement",
        beats: [
          { beat: 1, event: "test-start", dynamics: "mf", timing: "immediate" },
          { beat: 2, event: "test-process", dynamics: "mf", timing: "on-beat" },
          {
            beat: 3,
            event: "test-complete",
            dynamics: "mf",
            timing: "on-beat",
          },
        ],
      },
    ],
  },
  FAST_TEMPO_SEQUENCE: {
    id: "fast-seq",
    name: "Fast Tempo Sequence",
    description: "Faster sequence",
    key: "C Major",
    tempo: 240,
    category: "system" as any,
    movements: [
      {
        id: "move-1",
        name: "Fast Movement",
        beats: [
          { beat: 1, event: "fast-start", dynamics: "mf", timing: "immediate" },
          {
            beat: 2,
            event: "fast-complete",
            dynamics: "mf",
            timing: "immediate",
          },
        ],
      },
    ],
  },
  MIXED_TIMING_SEQUENCE: {
    id: "mixed-seq",
    name: "Mixed Timing Sequence",
    description: "Mixed timing",
    key: "C Major",
    tempo: 120,
    category: "system" as any,
    movements: [
      {
        id: "move-1",
        name: "Mixed Movement",
        beats: [
          {
            beat: 1,
            event: "mixed-start",
            dynamics: "mf",
            timing: "immediate",
          },
          {
            beat: 2,
            event: "mixed-after",
            dynamics: "mf",
            timing: "after-beat",
          },
          {
            beat: 3,
            event: "mixed-complete",
            dynamics: "mf",
            timing: "immediate",
          },
        ],
      },
    ],
  },
};
