/**
 * Tests for shell interfaces
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BaseShell } from './shell.js';
import { BasePlugin } from './plugin.js';
import type { PluginId, SequenceId, PluginMetadata, ShellEvent } from './types.js';

class TestPlugin extends BasePlugin {
  metadata: PluginMetadata = {
    id: 'test-plugin' as PluginId,
    name: 'Test Plugin',
    version: '1.0.0',
    capabilities: ['test'],
  };

  async initialize(): Promise<void> {
    this.registerSequence({
      id: 'echo' as SequenceId,
      name: 'Echo',
      parameters: [
        {
          name: 'message',
          type: 'string',
          required: true,
        },
      ],
      returns: { type: 'string' },
      handler: async (params) => params.message,
    });
  }

  async activate(): Promise<void> {}
  async deactivate(): Promise<void> {}
}

describe('BaseShell', () => {
  let shell: BaseShell;
  let plugin: TestPlugin;

  beforeEach(async () => {
    shell = new BaseShell();
    plugin = new TestPlugin();
    await plugin.initialize();
  });

  it('should register a plugin', async () => {
    await shell.registerPlugin(plugin);
    const registered = shell.getPlugin('test-plugin' as PluginId);
    expect(registered).toBe(plugin);
  });

  it('should list registered plugins', async () => {
    await shell.registerPlugin(plugin);
    const plugins = shell.listPlugins();
    expect(plugins).toHaveLength(1);
    expect(plugins[0].id).toBe('test-plugin');
  });

  it('should prevent duplicate plugin registration', async () => {
    await shell.registerPlugin(plugin);
    await expect(shell.registerPlugin(plugin)).rejects.toThrow(
      'Plugin test-plugin is already registered'
    );
  });

  it('should unregister a plugin', async () => {
    await shell.registerPlugin(plugin);
    await shell.unregisterPlugin('test-plugin' as PluginId);
    const unregistered = shell.getPlugin('test-plugin' as PluginId);
    expect(unregistered).toBeUndefined();
  });

  it('should throw error when unregistering non-existent plugin', async () => {
    await expect(
      shell.unregisterPlugin('non-existent' as PluginId)
    ).rejects.toThrow('Plugin non-existent is not registered');
  });

  it('should execute sequence in plugin', async () => {
    await shell.registerPlugin(plugin);
    const result = await shell.executeSequence(
      'test-plugin' as PluginId,
      'echo' as SequenceId,
      { message: 'Hello' }
    );
    expect(result).toBe('Hello');
  });

  it('should throw error when executing sequence in non-existent plugin', async () => {
    await expect(
      shell.executeSequence(
        'non-existent' as PluginId,
        'echo' as SequenceId,
        {}
      )
    ).rejects.toThrow('Plugin non-existent not found');
  });

  it('should emit events on plugin registration', async () => {
    const events: ShellEvent[] = [];
    shell.on((event) => events.push(event));

    await shell.registerPlugin(plugin);

    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('plugin:registered');
    expect(events[0].pluginId).toBe('test-plugin');
  });

  it('should emit events on sequence execution', async () => {
    const events: ShellEvent[] = [];
    shell.on((event) => events.push(event));

    await shell.registerPlugin(plugin);
    events.length = 0; // Clear registration event

    await shell.executeSequence(
      'test-plugin' as PluginId,
      'echo' as SequenceId,
      { message: 'Test' }
    );

    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('sequence:executed');
  });

  it('should emit error events on sequence failure', async () => {
    const events: ShellEvent[] = [];
    shell.on((event) => events.push(event));

    await shell.registerPlugin(plugin);
    events.length = 0;

    await expect(
      shell.executeSequence(
        'test-plugin' as PluginId,
        'non-existent' as SequenceId,
        {}
      )
    ).rejects.toThrow();

    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('sequence:failed');
  });

  it('should allow unsubscribing from events', async () => {
    const events: ShellEvent[] = [];
    const listener = (event: ShellEvent) => events.push(event);

    shell.on(listener);
    shell.off(listener);

    await shell.registerPlugin(plugin);

    expect(events).toHaveLength(0);
  });

  it('should provide metrics', async () => {
    await shell.registerPlugin(plugin);
    const metrics = shell.getMetrics();

    expect(metrics.totalPlugins).toBe(1);
    expect(metrics.activePlugins).toBe(1);
    expect(metrics.uptime).toBeGreaterThan(0);
  });
});

