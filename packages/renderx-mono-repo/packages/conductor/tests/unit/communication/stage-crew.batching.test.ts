import { TestEnvironment } from "../../utils/test-helpers";

describe("StageCrew batching (rAF)", () => {
  afterEach(() => TestEnvironment.cleanup());

  test("commit({batch:true}) defers DOM writes until next rAF", async () => {
    // Setup DOM
    document.body.innerHTML = `<div id="x"></div>`;

    // Provide a fake rAF we can control
    let scheduled: any = null;
    const origRAF = (window as any).requestAnimationFrame;
    (window as any).requestAnimationFrame = (cb: (t: number) => void) => {
      scheduled = cb;
      return 1 as any;
    };

    try {
      const eventBus = TestEnvironment.createEventBus();
      const conductor = TestEnvironment.createMusicalConductor(eventBus as any);

      const sequence: any = {
        id: "sc-batch-seq",
        name: "sc-batch-seq",
        movements: [
          {
            id: "m1",
            name: "m1",
            beats: [
              {
                beat: 1,
                event: "go",
                title: "Go",
                handler: "h",
                dynamics: "mf",
                timing: "immediate",
                errorHandling: "continue",
              },
            ],
          },
        ],
        events: { triggers: ["go"], emits: ["go"] },
        category: "system",
      };

      const handlers: any = {
        h: (_d: any, ctx: any) => {
          const txn = ctx.stageCrew.beginBeat("corr-batch-1", { handlerName: "h" });
          txn.update("#x", { classes: { add: ["batched"] } });
          txn.commit({ batch: true });
        },
      };

      await conductor.mount(sequence, handlers, sequence.id);
      await conductor.play(sequence.id, sequence.id, {});

      const el = document.querySelector("#x") as HTMLElement;
      expect(el.classList.contains("batched")).toBe(false);

      // Fire rAF callback
      expect(scheduled).toBeTruthy();
      scheduled && scheduled(0);

      await new Promise((r) => setTimeout(r, 0));
      expect(el.classList.contains("batched")).toBe(true);
    } finally {
      (window as any).requestAnimationFrame = origRAF;
    }
  });
});

