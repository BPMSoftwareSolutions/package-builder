import { TestEnvironment } from "../../utils/test-helpers";

// Use a temp file in ./.logs for tests
const path = require("path");
const fs = require("fs");

describe("StageCueLogger", () => {
  afterEach(() => TestEnvironment.cleanup());

  test("writes JSONL lines to a file when stage:cue fires", async () => {
    const logsDir = path.resolve(".logs");
    try { fs.mkdirSync(logsDir, { recursive: true }); } catch {}
    const filePath = path.join(logsDir, `mc-stage-cues-test.log`);
    try { fs.unlinkSync(filePath); } catch {}

    const eventBus = TestEnvironment.createEventBus();
    const { StageCueLogger } = await import("../../../modules/communication/sequences/stage/StageCueLogger");
    const logger = new StageCueLogger(eventBus as any, filePath);
    logger.init();

    // Create StageCrew directly and fire a stage:cue event
    const { StageCrew } = await import("../../../modules/communication/sequences/stage/StageCrew");
    const stageCrew = new StageCrew(eventBus as any, "test-plugin");

    // Create a transaction and commit it to trigger stage:cue
    const txn = stageCrew.beginBeat("corr-log-1", { handlerName: "testHandler" });
    txn.update("#not-present", { classes: { add: ["noop"] } });
    txn.commit();

    // Wait a bit for async file operations
    await new Promise(resolve => setTimeout(resolve, 50));

    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.trim().split(/\r?\n/);
    expect(lines.length).toBeGreaterThanOrEqual(1);

    const obj = JSON.parse(lines[0]);
    expect(obj.correlationId).toBe("corr-log-1");
    expect(Array.isArray(obj.operations)).toBe(true);
    expect(obj.pluginId).toBe("test-plugin");
    expect(obj.operations).toHaveLength(1);
    expect(obj.operations[0]).toEqual({
      op: "classes.add",
      selector: "#not-present",
      value: "noop"
    });
  });
});

