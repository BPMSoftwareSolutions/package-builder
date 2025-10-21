import { CHANNEL, PROTOCOL_VERSION, isMessage } from './protocol';
import type { TestHarnessAPI, Step, Assert, StepResult, AssertResult, LogEntry } from './types';

// Simple correlation counter for steps/asserts
let nextId = 1;

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const to = setTimeout(() => reject(new Error(`Timeout waiting for ${label} after ${ms}ms`)), ms);
    p.then(v => { clearTimeout(to); resolve(v); }, e => { clearTimeout(to); reject(e); });
  });
}

class Harness implements TestHarnessAPI {
  private iframe: HTMLIFrameElement | null = null;
  private targetOrigin: string = '*';
  private logs: LogEntry[] = [];
  private readyPhases = new Set<number>();
  private driverVersion: string | null = null;
  private capabilities: string[] = [];

  constructor() {
    window.addEventListener('message', (event) => {
      const data = event.data;
      if (!isMessage(data)) return;
      // Optionally enforce origin based on iframe src
      if (this.iframe && event.source !== this.iframe.contentWindow) return;
      this.log('driver', data.type, data.payload);
      if (data.type === 'driver:readyPhase') {
        const ph = (data.payload && data.payload.phase) ?? null;
        if (typeof ph === 'number') this.readyPhases.add(ph);
      }
    });
  }

  private post(type: string, payload?: any) {
    const msg = { channel: CHANNEL, version: PROTOCOL_VERSION, type, payload };
    this.log('host', type, payload);
    this.iframe?.contentWindow?.postMessage(msg, this.targetOrigin);
  }

  private log(dir: 'host' | 'driver', type: string, payload?: any) {
    this.logs.push({ t: Date.now(), dir, type, payload });
    // keep last N
    if (this.logs.length > 1000) this.logs.splice(0, this.logs.length - 1000);
  }

  async load(driverUrl: string, scenario: { id: string; env?: Record<string, any>; flags?: Record<string, any> }) {
    // Create iframe lazily or reset existing
    if (this.iframe) {
      await this.teardown();
    }
    this.readyPhases.clear();
    const iframe = document.createElement('iframe');
    iframe.src = driverUrl;
    iframe.style.width = '100%';
    iframe.style.height = '800px';
    iframe.style.border = '1px solid var(--border-color, #ccc)';
    document.body.appendChild(iframe);
    this.iframe = iframe;
    this.targetOrigin = '*';

    // Wait for contentWindow
    await new Promise<void>((resolve) => {
      if (iframe.contentWindow) return resolve();
      iframe.addEventListener('load', () => resolve());
    });

    // Send init
    this.post('host:init', { scenarioId: scenario.id, env: scenario.env ?? {}, flags: scenario.flags ?? {} });

    // Wait for driver:ack with capabilities
    await withTimeout(new Promise<void>((resolve) => {
      const onMsg = (event: MessageEvent) => {
        const data = event.data;
        if (!isMessage(data)) return;
        if (data.type === 'driver:ack') {
          this.driverVersion = data.payload?.driverVersion ?? null;
          this.capabilities = Array.isArray(data.payload?.capabilities) ? data.payload.capabilities : [];
          window.removeEventListener('message', onMsg as any);
          resolve();
        }
      };
      window.addEventListener('message', onMsg as any);
    }), 5000, 'driver ack');
  }

  async waitForReadyPhases(phases: number[], timeoutMs: number = 10000) {
    // Wait sequentially to ensure order
    const start = Date.now();
    for (const ph of phases) {
      const remaining = Math.max(1, timeoutMs - (Date.now() - start));
      await withTimeout(new Promise<void>((resolve) => {
        if (this.readyPhases.has(ph)) return resolve();
        const onMsg = (event: MessageEvent) => {
          const data = event.data;
          if (!isMessage(data)) return;
          if (data.type === 'driver:readyPhase' && data.payload?.phase === ph) {
            window.removeEventListener('message', onMsg as any);
            resolve();
          }
        };
        window.addEventListener('message', onMsg as any);
      }), remaining, `ready phase ${ph}`);
    }
  }

  async runSteps(steps: Step[], timeoutPerStepMs = 8000): Promise<StepResult[]> {
    const results: StepResult[] = [];
    for (const step of steps || []) {
      const id = nextId++;
      const res = await withTimeout(new Promise<StepResult>((resolve) => {
        const onMsg = (event: MessageEvent) => {
          const data = event.data;
          if (!isMessage(data)) return;
          if (data.type === 'driver:stepResult' && data.payload?.id === id) {
            window.removeEventListener('message', onMsg as any);
            resolve(data.payload as StepResult);
          }
        };
        window.addEventListener('message', onMsg as any);
        this.post('host:step', { id, type: step.type, payload: step.payload });
      }), timeoutPerStepMs, `step ${step.type}`);
      results.push(res);
    }
    return results;
  }

  async runAsserts(asserts: Assert[], timeoutPerAssertMs = 8000): Promise<AssertResult[]> {
    const results: AssertResult[] = [];
    for (const a of asserts || []) {
      const id = nextId++;
      const res = await withTimeout(new Promise<AssertResult>((resolve) => {
        const onMsg = (event: MessageEvent) => {
          const data = event.data;
          if (!isMessage(data)) return;
          if (data.type === 'driver:assertResult' && data.payload?.id === id) {
            window.removeEventListener('message', onMsg as any);
            resolve(data.payload as AssertResult);
          }
        };
        window.addEventListener('message', onMsg as any);
        this.post('host:assert', { id, type: a.type, payload: a });
      }), timeoutPerAssertMs, `assert ${a.type}`);
      results.push(res);
    }
    return results;
  }

  async getSnapshot(): Promise<any | null> {
    return await withTimeout(new Promise<any>((resolve) => {
      const onMsg = (event: MessageEvent) => {
        const data = event.data;
        if (!isMessage(data)) return;
        if (data.type === 'driver:snapshot') {
          window.removeEventListener('message', onMsg as any);
          resolve(data.payload?.state ?? null);
        }
      };
      window.addEventListener('message', onMsg as any);
      this.post('host:snapshot');
    }), 4000, 'snapshot');
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  getCapabilities(): string[] {
    return [...this.capabilities];
  }

  getDriverInfo(): { driverVersion: string | null; capabilities: string[] } {
    return { driverVersion: this.driverVersion, capabilities: [...this.capabilities] };
  }

  async teardown(): Promise<void> {
    if (!this.iframe) return;
    try {
      await withTimeout(new Promise<void>((resolve) => {
        const onMsg = (event: MessageEvent) => {
          const data = event.data;
          if (!isMessage(data)) return;
          if (data.type === 'driver:teardownResult') {
            window.removeEventListener('message', onMsg as any);
            resolve();
          }
        };
        window.addEventListener('message', onMsg as any);
        this.post('host:teardown');
      }), 3000, 'teardown');
    } catch {}
    this.iframe.remove();
    this.iframe = null;
    this.readyPhases.clear();
  }
}

// Attach to window
(function attach() {
  const h = new Harness();
  (globalThis as any).TestHarness = h;
  // Optional: auto-init when query has driver & scenario
  try {
    const usp = new URLSearchParams(globalThis.location.search);
    const driver = usp.get('driver');
    const scenarioId = usp.get('scenario');
    const phases = usp.get('phases');
    const timeout = parseInt(usp.get('timeout') || '8000', 10);
    if (driver && scenarioId) {
      h.load(driver, { id: scenarioId }).then(async () => {
        const arr = phases ? phases.split(',').map(n => parseInt(n, 10)).filter(n => !isNaN(n)) : [0,1,2];
        await h.waitForReadyPhases(arr, timeout);
        // No-op after ready; consumers can interact via page.evaluate in tests
      });
    }
  } catch {}
})();
