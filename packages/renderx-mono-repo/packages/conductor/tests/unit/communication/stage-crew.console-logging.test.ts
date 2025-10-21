import { TestEnvironment } from "../../utils/test-helpers";

/**
 * Test that stage crew commits are logged to console in debug mode
 */
describe("Stage Crew Console Logging", () => {
  afterEach(() => TestEnvironment.cleanup());

  test("logs stage crew commits to console when ConductorLogger is enabled", async () => {
    const eventBus = TestEnvironment.createEventBus();

    // Initialize ConductorLogger manually to ensure it's enabled
    const { ConductorLogger } = await import("../../../modules/communication/sequences/monitoring/ConductorLogger");
    const logger = new ConductorLogger(eventBus as any, true);
    logger.init();

    const conductor = TestEnvironment.createMusicalConductor(eventBus as any);

    const sequence: any = {
      id: "stage-crew-console-test",
      name: "Stage Crew Console Test",
      movements: [
        {
          id: "move-1",
          name: "Console Move",
          beats: [
            {
              beat: 1,
              event: "stage:console",
              title: "console-test",
              handler: "consoleTest",
              dynamics: "mf",
              timing: "immediate",
            },
          ],
        },
      ],
      events: { triggers: ["stage:console"], emits: ["stage:console"] },
      category: "system",
    };

    // Spy on console.log to capture stage crew logging
    const logs: string[] = [];
    const spy = jest.spyOn(console, "log").mockImplementation((...args: any[]) => {
      logs.push(args.join(" "));
    });

    const handlers: any = {
      consoleTest: (_data: any, ctx: any) => {
        const txn = ctx.stageCrew.beginBeat("corr-console-1", { handlerName: "consoleTest" });

        // Add various operations to test different log formats
        txn.update("#test-element", { classes: { add: ["active", "highlighted"] } });
        txn.update("#test-element", { classes: { remove: ["inactive"] } });
        txn.update("#test-element", { attrs: { role: "button", "aria-label": "Test Button" } });
        txn.update("#test-element", { style: { left: "10px", top: "20px", color: "red" } });
        txn.create("div", { classes: ["overlay", "modal"], attrs: { id: "test-overlay", "data-test": "true" } }).appendTo("#container");
        txn.remove("#old-element");

        txn.commit();
        return { success: true };
      },
    };

    await conductor.mount(sequence, handlers, sequence.id);
    await conductor.play(sequence.id, sequence.id, {});

    // Wait briefly for async logging to complete
    await new Promise((resolve) => setTimeout(resolve, 50));

    spy.mockRestore();

    // Verify stage crew logging occurred
    const stageCrewLogs = logs.filter(log => log.includes("🎭 Stage Crew:"));
    expect(stageCrewLogs.length).toBeGreaterThan(0);

    // Verify the main stage crew header log
    const headerLog = logs.find(log =>
      log.includes("🎭 Stage Crew: stage-crew-console-test.consoleTest (corr-console-1)")
    );
    expect(headerLog).toBeDefined();

    // Verify specific operation logs
    const addClassLog = logs.find(log => log.includes('Add class "active" to #test-element'));
    expect(addClassLog).toBeDefined();

    const removeClassLog = logs.find(log => log.includes('Remove class "inactive" from #test-element'));
    expect(removeClassLog).toBeDefined();

    const attrLog = logs.find(log => log.includes('Set role="button" on #test-element'));
    expect(attrLog).toBeDefined();

    const styleLog = logs.find(log => log.includes('Set style left="10px" on #test-element'));
    expect(styleLog).toBeDefined();

    const createLog = logs.find(log =>
      log.includes('Create <div>') &&
      log.includes('classes=[overlay, modal]') &&
      log.includes('in #container')
    );
    expect(createLog).toBeDefined();

    const removeLog = logs.find(log => log.includes('Remove #old-element'));
    expect(removeLog).toBeDefined();

    // Verify tree structure with connectors
    const treeConnectors = logs.filter(log => log.includes("├─") || log.includes("└─"));
    expect(treeConnectors.length).toBeGreaterThan(0);
  });

  test("does not log stage crew commits when ConductorLogger is disabled", async () => {
    const eventBus = TestEnvironment.createEventBus();
    
    // Initialize ConductorLogger with disabled flag
    const { ConductorLogger } = await import("../../../modules/communication/sequences/monitoring/ConductorLogger");
    const logger = new ConductorLogger(eventBus as any, false);
    logger.init();

    const conductor = TestEnvironment.createMusicalConductor(eventBus as any);

    const sequence: any = {
      id: "stage-crew-disabled-test",
      name: "Stage Crew Disabled Test",
      movements: [
        {
          id: "move-1",
          name: "Disabled Move",
          beats: [
            {
              beat: 1,
              event: "stage:disabled",
              handler: "disabledTest",
              timing: "immediate",
            },
          ],
        },
      ],
      events: { triggers: ["stage:disabled"], emits: ["stage:disabled"] },
      category: "system",
    };

    const logs: string[] = [];
    const spy = jest.spyOn(console, "log").mockImplementation((...args: any[]) => {
      logs.push(args.join(" "));
    });

    const handlers: any = {
      disabledTest: (_data: any, ctx: any) => {
        const txn = ctx.stageCrew.beginBeat("corr-disabled-1", { handlerName: "disabledTest" });
        txn.update("#test-element", { classes: { add: ["active"] } });
        txn.commit();
        return { success: true };
      },
    };

    await conductor.mount(sequence, handlers, sequence.id);
    await conductor.play(sequence.id, sequence.id, {});

    await new Promise((resolve) => setTimeout(resolve, 10));

    spy.mockRestore();

    // Verify no stage crew logging occurred
    const stageCrewLogs = logs.filter(log => log.includes("🎭 Stage Crew:"));
    expect(stageCrewLogs.length).toBe(0);
  });

  test("handles empty operations gracefully", async () => {
    const eventBus = TestEnvironment.createEventBus();
    
    const { ConductorLogger } = await import("../../../modules/communication/sequences/monitoring/ConductorLogger");
    const logger = new ConductorLogger(eventBus as any, true);
    logger.init();

    const logs: string[] = [];
    const spy = jest.spyOn(console, "log").mockImplementation((...args: any[]) => {
      logs.push(args.join(" "));
    });

    // Emit a stage:cue event with empty operations
    eventBus.emit("stage:cue", {
      pluginId: "test-plugin",
      correlationId: "test-correlation",
      operations: [],
      meta: { handlerName: "testHandler" }
    });

    await new Promise((resolve) => setTimeout(resolve, 10));

    spy.mockRestore();

    // Should not log anything for empty operations
    const stageCrewLogs = logs.filter(log => log.includes("🎭 Stage Crew:"));
    expect(stageCrewLogs.length).toBe(0);
  });
});
