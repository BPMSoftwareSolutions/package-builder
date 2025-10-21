import { TestEnvironment } from "../../utils/test-helpers";

describe("MusicalConductor version logging", () => {
  afterEach(() => TestEnvironment.cleanup());

  test("logs version on first initialization", async () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    const eventBus = TestEnvironment.createEventBus();

    const { version } = require("../../../package.json");

    // initialize
    TestEnvironment.createMusicalConductor(eventBus);

    const calls = spy.mock.calls.map((c) => String(c[0]));
    const hasVersionLog = calls.some((s) => s.includes(`MusicalConductor v${version}`));
    expect(hasVersionLog).toBe(true);

    spy.mockRestore();
  });
});

