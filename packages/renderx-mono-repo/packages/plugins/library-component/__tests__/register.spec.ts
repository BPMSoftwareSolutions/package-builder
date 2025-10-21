import { describe, it, expect, vi } from 'vitest';
import { register } from '../src/index';
import pkg from '../package.json';
import { readFileSync } from 'fs';
import { join } from 'path';

function createFakeConductor() {
  const mounted: any[] = [];
  return {
    mounted,
    logger: { warn: vi.fn(), info: vi.fn() },
    async mount(seq: any, _handlers: any, pluginId: string) {
      mounted.push({ seq, pluginId });
    },
    getMountedPluginIds() {
      return Array.from(new Set(mounted.map(m => m.pluginId)));
    },
  } as any;
}

describe('renderx-plugin-library-component: register()', () => {
  it('mounts the three library-component sequences exactly once with expected pluginIds', async () => {
    const c = createFakeConductor();
    await register(c);

    const ids = c.mounted.map((m: any) => m.seq?.id);
    const count = (id: string) => ids.filter((x: string) => x === id).length;

    expect(count('library-component-drag-symphony')).toBe(1);
    expect(count('library-component-drop-symphony')).toBe(1);
    expect(count('library-component-container-drop-symphony')).toBe(1);

    const pluginIds = c.getMountedPluginIds();
    expect(pluginIds).toContain('LibraryComponentPlugin');
    expect(pluginIds).toContain('LibraryComponentPlugin');
  }, 30000);

  it('exposes json-sequences via renderx.sequences metadata', () => {
    expect(pkg.renderx?.sequences).toContain('json-sequences');
    expect(pkg.files).toContain('json-sequences');
  });

  it('json-sequences catalog is loadable and contains expected sequences', () => {
    const indexPath = join(process.cwd(), 'json-sequences', 'library-component', 'index.json');
    const indexContent = readFileSync(indexPath, 'utf-8');
    const catalog = JSON.parse(indexContent);

    expect(catalog.version).toBe('1.0.0');
    expect(catalog.sequences).toHaveLength(3);

    const sequenceFiles = catalog.sequences.map((s: any) => s.file);
    expect(sequenceFiles).toContain('drag.json');
    expect(sequenceFiles).toContain('drop.json');
    expect(sequenceFiles).toContain('container.drop.json');

    // Verify all handlersPath point to the bare package specifier
    catalog.sequences.forEach((seq: any) => {
      expect(seq.handlersPath).toBe('@renderx-plugins/library-component');
    });
  });
});

