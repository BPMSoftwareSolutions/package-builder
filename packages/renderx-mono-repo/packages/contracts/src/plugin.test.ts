/**
 * Tests for plugin interfaces
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BasePlugin } from './plugin.js';
import type { PluginId, SequenceId, PluginMetadata, Sequence } from './types.js';

class TestPlugin extends BasePlugin {
  metadata: PluginMetadata = {
    id: 'test-plugin' as PluginId,
    name: 'Test Plugin',
    version: '1.0.0',
    capabilities: ['test'],
  };

  async initialize(): Promise<void> {
    // Register test sequences
    this.registerSequence({
      id: 'greet' as SequenceId,
      name: 'Greet',
      parameters: [
        {
          name: 'name',
          type: 'string',
          required: true,
        },
      ],
      returns: {
        type: 'string',
      },
      handler: async (params) => {
        return `Hello, ${params.name}!`;
      },
    });
  }

  async activate(): Promise<void> {
    // Activation logic
  }

  async deactivate(): Promise<void> {
    // Deactivation logic
  }
}

describe('BasePlugin', () => {
  let plugin: TestPlugin;

  beforeEach(async () => {
    plugin = new TestPlugin();
    await plugin.initialize();
  });

  it('should have metadata', () => {
    expect(plugin.metadata.id).toBe('test-plugin');
    expect(plugin.metadata.name).toBe('Test Plugin');
    expect(plugin.metadata.version).toBe('1.0.0');
  });

  it('should register and retrieve sequences', () => {
    const sequence = plugin.getSequence('greet' as SequenceId);
    expect(sequence).toBeDefined();
    expect(sequence?.name).toBe('Greet');
  });

  it('should return undefined for non-existent sequence', () => {
    const sequence = plugin.getSequence('non-existent' as SequenceId);
    expect(sequence).toBeUndefined();
  });

  it('should execute registered sequence', async () => {
    const result = await plugin.executeSequence('greet' as SequenceId, {
      name: 'World',
    });
    expect(result).toBe('Hello, World!');
  });

  it('should throw error for non-existent sequence execution', async () => {
    await expect(
      plugin.executeSequence('non-existent' as SequenceId, {})
    ).rejects.toThrow('Sequence non-existent not found');
  });

  it('should support multiple sequences', async () => {
    plugin.registerSequence({
      id: 'add' as SequenceId,
      name: 'Add',
      parameters: [
        { name: 'a', type: 'number', required: true },
        { name: 'b', type: 'number', required: true },
      ],
      returns: { type: 'number' },
      handler: async (params) => {
        return (params.a as number) + (params.b as number);
      },
    });

    const result = await plugin.executeSequence('add' as SequenceId, {
      a: 5,
      b: 3,
    });
    expect(result).toBe(8);
  });

  it('should allow unregistering sequences', () => {
    const sequence = plugin.getSequence('greet' as SequenceId);
    expect(sequence).toBeDefined();

    // Unregister the sequence
    (plugin as any).unregisterSequence('greet' as SequenceId);

    const unregistered = plugin.getSequence('greet' as SequenceId);
    expect(unregistered).toBeUndefined();
  });

  it('should support lifecycle methods', async () => {
    await expect(plugin.activate()).resolves.toBeUndefined();
    await expect(plugin.deactivate()).resolves.toBeUndefined();
  });
});

