import type { EventBus } from "../../EventBus.js";

// Simple JSONL logger for stage:cue events (Node/test environments)
export class StageCueLogger {
  private filePath: string;
  private fs: any | null = null;

  constructor(private eventBus: EventBus, filePath?: string) {
    const date = new Date();
    const y = String(date.getFullYear());
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    this.filePath = filePath || `./.logs/mc-stage-cues-${y}${m}${d}.log`;
    try {
      // Lazy-require fs to avoid bundler issues in browser
      this.fs = require("fs");
    } catch {
      this.fs = null;
    }
  }

  init(): void {
    this.eventBus.subscribe("stage:cue", (cue: any) => this.writeCue(cue));
  }

  private writeCue(cue: any): void {
    if (!this.fs) return;
    try {
      const line = JSON.stringify(cue);
      this.fs.appendFileSync(this.filePath, line + "\n");
    } catch (e) {
      // swallow errors in tests
    }
  }
}

