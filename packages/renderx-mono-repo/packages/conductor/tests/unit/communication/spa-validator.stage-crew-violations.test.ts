import { TestEnvironment } from "../../utils/test-helpers";
import { SPAValidator } from "../../../modules/communication/SPAValidator";
import { setConductorEnv } from "../../../modules/communication/sequences/environment/ConductorEnv";
import { emitStageCue } from "../../plugins/theme-management-plugin/fake-plugin";

/**
 * Intentional failing test (Red in TDD):
 * Reproduces SPA violations when a plugin (incorrectly) emits stage:cue via eventBus directly during commit.
 * We assert there should be NO violations for stage commit usage so it fails under current behavior.
 */

describe("SPAValidator integration: StageCrew commit & play should not violate (intentional RED)", () => {
  beforeEach(() => {
    setConductorEnv({ dev: true, mode: "development" });
  });
  afterEach(() => {
    TestEnvironment.cleanup();
    setConductorEnv({ dev: false });
  });

  test("commit() should not produce SPA violation when stage:cue is emitted via StageCrew internals", async () => {
    const eventBus = TestEnvironment.createEventBus();
    const conductor = TestEnvironment.createMusicalConductor(eventBus as any);

    // Clear any prior violations
    const validator = (conductor as any).conductorCore.getSPAValidator() as SPAValidator;
    validator.clearViolations();

    // Prepare DOM
    document.body.innerHTML = `<div id="z"></div>`;

    // Define a plugin-like sequence that triggers a StageCrew commit
    const sequence: any = {
      id: "spa-commit-violation-repro",
      name: "SPA Commit Violation Repro",
      movements: [
        {
          id: "mv",
          name: "mv",
          beats: [
            {
              beat: 1,
              event: "go",
              title: "go",
              handler: "do",
              dynamics: "mf",
              timing: "immediate",
            },
          ],
        },
      ],
      events: { triggers: ["go"], emits: ["go"] },
      category: "system",
    };

    const handlers: any = {
      do: (_d: any, _ctx: any) => {
        // Simulate direct eventBus.emit('stage:cue') from a plugin file (ensures stack path includes /plugins/)
        const cue = {
          correlationId: "corr-spa-1",
          pluginId: sequence.id,
          handlerName: "do",
          operations: [{ op: "classes.add", selector: "#z", value: "ok" }],
        } as any;
        emitStageCue(eventBus, cue);
      },
    };

    await conductor.mount(sequence, handlers, sequence.id);
    await conductor.play(sequence.id, sequence.id, {});

    // RED expectation: No SPA violations at all for StageCrew commit path
    const violations = validator.getViolations();
    expect(violations.length).toBe(0);
  });

  test("ctx.conductor.play() should not produce SPA violation when invoked from plugin handler", async () => {
    const eventBus = TestEnvironment.createEventBus();
    const conductor = TestEnvironment.createMusicalConductor(eventBus as any);
    const validator = (conductor as any).conductorCore.getSPAValidator() as SPAValidator;
    validator.clearViolations();

    const seqA: any = {
      id: "spa-play-repro",
      name: "SPA Play Repro",
      movements: [
        {
          id: "mv",
          name: "mv",
          beats: [
            { beat: 1, event: "go", title: "go", handler: "callPlay", dynamics: "mf", timing: "immediate" },
          ],
        },
      ],
      events: { triggers: ["go"], emits: ["go"] },
      category: "system",
    };

    const seqB: any = {
      id: "spa-play-target",
      name: "SPA Play Target",
      movements: [
        { id: "m2", name: "m2", beats: [{ beat: 1, event: "done", title: "done", handler: "noop", dynamics: "p", timing: "immediate" }] },
      ],
      events: { triggers: ["done"], emits: ["done"] },
      category: "system",
    };

    const handlersA: any = {
      callPlay: (_d: any, ctx: any) => {
        // Proper SPA: use conductor.play instead of eventBus.emit
        ctx.conductor.play(seqB.id, seqB.id, {});
      },
    };
    const handlersB: any = { noop: () => ({ ok: true }) };

    await conductor.mount(seqA, handlersA, seqA.id);
    await conductor.mount(seqB, handlersB, seqB.id);
    await conductor.play(seqA.id, seqA.id, {});

    // We expect no violations for play path. If validator misclassifies, this should fail.
    const violations = validator.getViolations();
    expect(violations.length).toBe(0);
  });
});

