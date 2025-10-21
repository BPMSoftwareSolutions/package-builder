/**
 * Tests for Shell implementation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Shell, createShell } from './shell.js';
import { BasePlugin } from '@renderx/contracts';
import type { PluginId, SequenceId, PluginMetadata } from '@renderx/contracts';

class TestPlugin extends BasePlugin {
  metadata: PluginMetadata = {
    id: 'test-plugin' as PluginId,
    name: 'Test Plugin',
    version: '1.0.0',
    capabilities: ['test'],
  };

  async initialize(): Promise<void> {
    this.registerSequence({
      id: 'test-seq' as SequenceId,
      name: 'Test Sequence',
      parameters: [],
      returns: { type: 'string' },
      handler: async () => 'test result',
    });
  }

  async activate(): Promise<void> {}
  async deactivate(): Promise<void> {}
}

describe('Shell', () => {
  let shell: Shell;

  beforeEach(() => {
    shell = new Shell({
      name: 'Test Shell',
      autoInitialize: false,
    });
  });

  it('should create shell instance', () => {
    expect(shell).toBeDefined();
    expect(shell.isInitialized()).toBe(false);
  });

  it('should initialize shell', async () => {
    await shell.initialize();
    expect(shell.isInitialized()).toBe(true);
  });

  it('should not reinitialize if already initialized', async () => {
    await shell.initialize();
    await shell.initialize();
    expect(shell.isInitialized()).toBe(true);
  });

  it('should register and manage plugins', async () => {
    const plugin = new TestPlugin();
    await plugin.initialize();

    await shell.registerPlugin(plugin);
    const registered = shell.getPlugin('test-plugin' as PluginId);
    expect(registered).toBe(plugin);
  });

  it('should execute sequences', async () => {
    const plugin = new TestPlugin();
    await plugin.initialize();

    await shell.registerPlugin(plugin);
    const result = await shell.executeSequence(
      'test-plugin' as PluginId,
      'test-seq' as SequenceId,
      {}
    );

    expect(result).toBe('test result');
  });

  it('should shutdown gracefully', async () => {
    const plugin = new TestPlugin();
    await plugin.initialize();

    await shell.registerPlugin(plugin);
    await shell.shutdown();

    expect(shell.isInitialized()).toBe(false);
    expect(shell.listPlugins()).toHaveLength(0);
  });

  it('should emit events during lifecycle', async () => {
    const events: any[] = [];
    shell.on((event) => events.push(event));

    const plugin = new TestPlugin();
    await plugin.initialize();

    await shell.registerPlugin(plugin);
    expect(events.some((e) => e.type === 'plugin:registered')).toBe(true);
  });

  it('should support factory function', () => {
    const newShell = createShell({ name: 'Factory Shell' });
    expect(newShell).toBeInstanceOf(Shell);
    expect(newShell.isInitialized()).toBe(false);
  });

  it('should handle multiple plugins', async () => {
    const plugin1 = new TestPlugin();
    plugin1.metadata.id = 'plugin-1' as PluginId;
    await plugin1.initialize();

    const plugin2 = new TestPlugin();
    plugin2.metadata.id = 'plugin-2' as PluginId;
    await plugin2.initialize();

    await shell.registerPlugin(plugin1);
    await shell.registerPlugin(plugin2);

    const plugins = shell.listPlugins();
    expect(plugins).toHaveLength(2);
  });

  it('should provide metrics', async () => {
    const plugin = new TestPlugin();
    await plugin.initialize();

    await shell.registerPlugin(plugin);
    const metrics = shell.getMetrics();

    expect(metrics.totalPlugins).toBe(1);
    expect(metrics.activePlugins).toBe(1);
    expect(metrics.uptime).toBeGreaterThan(0);
  });
});

