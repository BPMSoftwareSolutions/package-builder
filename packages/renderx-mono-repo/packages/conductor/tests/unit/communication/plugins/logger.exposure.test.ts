import { TestEnvironment } from "../../../utils/test-helpers";

/**
 * Verifies ctx.logger.log routes through ConductorLogger with handler prefix
 */
describe("Plugin ctx.logger.log exposure", () => {
  afterEach(() => TestEnvironment.cleanup());

  test("ctx.logger.log prints via ConductorLogger", async () => {
    const bus = TestEnvironment.createEventBus();
    const conductor = TestEnvironment.createMusicalConductor(bus as any);

    // Initialize ConductorLogger to ensure it's listening for log events
    const { ConductorLogger } = await import("../../../../modules/communication/sequences/monitoring/ConductorLogger");
    const logger = new ConductorLogger(bus as any, true);
    logger.init();

    const seq: any = {
      id: "plug-logger",
      name: "plug-logger",
      movements: [
        { id: "m1", name: "m1", beats: [{ beat: 1, event: "go", title: "Go", handler: "h", timing: "immediate", errorHandling: "continue", dynamics: "mf" }] },
      ],
      events: { triggers: ["go"], emits: ["go"] },
      category: "system",
    };

    const logs: string[] = [];
    const spy = jest.spyOn(console, "log").mockImplementation((...args: any[]) => {
      logs.push(args.join(" "));
    });

    const handlers: any = {
      h: (_d: any, ctx: any) => {
        ctx.logger.log("hello", 42);
      },
    };

    // Mount via CIA-compliant API and then play
    await (conductor as any).mount(seq, handlers, seq.id);
    await conductor.play(seq.id, seq.id, {});

    spy.mockRestore();

    const match = logs.some((l) => /🧩 plug-logger\.h/.test(l) && /hello/.test(l) && /42/.test(l));
    expect(match).toBe(true);
  });
});

