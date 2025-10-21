// Minimal test helpers for MusicalConductor core tests

import { EventBus } from "../../modules/communication/EventBus";
import { MusicalConductor } from "../../modules/communication/sequences/MusicalConductor";
import type { MusicalSequence } from "../../modules/communication/sequences/SequenceTypes";

export const TestEnvironment = {
  createEventBus(): EventBus {
    return new (EventBus as any)();
  },

  createMusicalConductor(eventBus: EventBus): MusicalConductor {
    return MusicalConductor.getInstance(eventBus);
  },

  cleanup(): void {
    try {
      (MusicalConductor as any).resetInstance?.();
    } catch {}
  },
};

export const AsyncTestHelpers = {
  async waitFor(predicate: () => boolean, timeoutMs = 2000, intervalMs = 10) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (predicate()) return;
      await new Promise((r) => setTimeout(r, intervalMs));
    }
    throw new Error(`waitFor timed out after ${timeoutMs}ms`);
  },
  async flushPromises() {
    return new Promise<void>((resolve) => setTimeout(resolve, 0));
  },
};

export const MusicalTimingHelpers = {
  createTimingTest(tempoBpm: number) {
    const beats: number[] = [];
    return {
      recordBeat() {
        beats.push(Date.now());
      },
      getBeatDurations() {
        const result: number[] = [];
        for (let i = 1; i < beats.length; i++) {
          result.push(beats[i] - beats[i - 1]);
        }
        return result;
      },
      assertTiming(toleranceMs = 100) {
        const beatMs = 60000 / tempoBpm;
        const durations = this.getBeatDurations();
        for (const d of durations) {
          expect(Math.abs(d - beatMs)).toBeLessThanOrEqual(toleranceMs);
        }
      },
    };
  },
};

export const EventTestHelpers = {
  subscribeOnce<T = any>(bus: EventBus, event: string): Promise<T> {
    return new Promise<T>((resolve) => {
      const unsub = bus.subscribe(event, (data: T) => {
        try { unsub(); } catch {}
        resolve(data);
      });
    });
  },
};

export const SequenceBuilder = {
  simple(name: string) {
    const seq: Partial<MusicalSequence> = {
      id: name,
      name,
      description: `${name} sequence`,
      key: "C Major",
      tempo: 120,
      category: "system" as any,
      movements: [],
    };
    return {
      addMovement(m: { name: string; description?: string; beats: any[] }) {
        (seq.movements as any[]).push({
          id: `${name}-${(seq.movements as any[]).length + 1}`,
          name: m.name,
          description: m.description,
          beats: m.beats,
        });
        return this;
      },
      build() {
        return seq as MusicalSequence;
      },
    };
  },
};

export const BeatBuilder = {
  simple(beat: number, event: string) {
    const b: any = {
      beat,
      event,
      dynamics: "mf",
      timing: "immediate",
    };
    return {
      errorHandling(mode: "continue" | "abort" | "abort-sequence") {
        b.errorHandling = mode;
        return this;
      },
      build() {
        return b;
      },
    };
  },
};

