import { readdirSync, readFileSync, statSync } from 'fs';
import path from 'path';

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      yield* walk(full);
    } else if (/\.(tsx?|jsx?)$/.test(entry)) {
      yield full;
    }
  }
}

describe('Phase 2 guard: no local ./core imports for conductor/manifests/startup/events', () => {
  it('has zero imports from ./core/* in src/**', () => {
    const root = path.resolve(__dirname, '..', 'src');
    const offenders: Array<{ file: string; line: number; text: string }> = [];
    const patterns = [
      "'./core/",
      '"./core/',
    ];
    for (const file of walk(root)) {
      const text = readFileSync(file, 'utf8');
      const lines = text.split(/\r?\n/);
      lines.forEach((ln, i) => {
        if (/^\s*import\s+/.test(ln)) {
          if (patterns.some(p => ln.includes(p))) {
            offenders.push({ file: path.relative(process.cwd(), file), line: i + 1, text: ln.trim() });
          }
        }
      });
    }
    if (offenders.length) {
      const msg = offenders.map(o => `${o.file}:${o.line} -> ${o.text}`).join('\n');
      throw new Error(`Found local ./core imports. Migrate to @renderx-plugins/host-sdk core subpaths or root APIs.\n${msg}`);
    }
  });
});

