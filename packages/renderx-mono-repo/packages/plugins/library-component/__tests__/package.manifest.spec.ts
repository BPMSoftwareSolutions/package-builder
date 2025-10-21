import fs from 'node:fs';
import { describe, it, expect } from 'vitest';

describe('package manifest contribution', () => {
  it('contributes renderx plugin manifest', () => {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    
    // Verify keywords includes 'renderx-plugin'
    expect(pkg.keywords).toContain('renderx-plugin');
    
    // Verify renderx.plugins exists and contains LibraryComponentPlugin
    const plugins = pkg.renderx?.plugins ?? [];
    expect(plugins).toHaveLength(1);
    
    const entry = plugins.find((p: { id?: string }) => p?.id === 'LibraryComponentPlugin');
    expect(entry).toBeDefined();
    expect(entry?.runtime?.module).toBe('@renderx-plugins/library-component');
    expect(entry?.runtime?.export).toBe('register');
    
    // Verify existing renderx.sequences is preserved
    expect(pkg.renderx?.sequences).toEqual(['json-sequences']);
  });

  it('maintains existing package structure', () => {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

    // Verify essential package properties are maintained
    expect(pkg.name).toBe('@renderx-plugins/library-component');
    expect(pkg.main).toBe('./dist/index.js');
    expect(pkg.exports['.']).toBe('./dist/index.js');

    // Verify files array includes necessary items
    expect(pkg.files).toContain('dist');
    expect(pkg.files).toContain('src');
    expect(pkg.files).toContain('json-sequences');
  });

  it('ensures consistent plugin ID across all plugin metadata and sequences', () => {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    const expectedPluginId = 'LibraryComponentPlugin';

    // Verify plugin manifest declares the correct plugin ID
    const pluginEntry = pkg.renderx?.plugins?.[0];
    expect(pluginEntry?.id).toBe(expectedPluginId);

    // Verify all JSON sequences use the same plugin ID
    const dragSeq = JSON.parse(fs.readFileSync('json-sequences/library-component/drag.json', 'utf-8'));
    const dropSeq = JSON.parse(fs.readFileSync('json-sequences/library-component/drop.json', 'utf-8'));
    const containerDropSeq = JSON.parse(fs.readFileSync('json-sequences/library-component/container.drop.json', 'utf-8'));

    expect(dragSeq.pluginId).toBe(expectedPluginId);
    expect(dropSeq.pluginId).toBe(expectedPluginId);
    expect(containerDropSeq.pluginId).toBe(expectedPluginId);

    // Verify no references to the old plugin ID exist
    const packageJsonContent = fs.readFileSync('package.json', 'utf-8');
    const dragContent = fs.readFileSync('json-sequences/library-component/drag.json', 'utf-8');
    const dropContent = fs.readFileSync('json-sequences/library-component/drop.json', 'utf-8');
    const containerDropContent = fs.readFileSync('json-sequences/library-component/container.drop.json', 'utf-8');

    expect(packageJsonContent).not.toContain('LibraryComponentDropPlugin');
    expect(dragContent).not.toContain('LibraryComponentDropPlugin');
    expect(dropContent).not.toContain('LibraryComponentDropPlugin');
    expect(containerDropContent).not.toContain('LibraryComponentDropPlugin');
  });
});
