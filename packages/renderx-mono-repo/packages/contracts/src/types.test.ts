/**
 * Tests for contracts types
 */

import { describe, it, expect } from 'vitest';
import type {
  PluginId,
  SequenceId,
  PluginMetadata,
  Sequence,
  ShellEvent,
  ShellConfig,
  SequenceExecutionResult,
  ShellMetrics,
} from './types.js';

describe('Contracts Types', () => {
  describe('PluginMetadata', () => {
    it('should create valid plugin metadata', () => {
      const metadata: PluginMetadata = {
        id: 'test-plugin' as PluginId,
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        capabilities: ['test', 'demo'],
        dependencies: [],
      };

      expect(metadata.id).toBe('test-plugin');
      expect(metadata.name).toBe('Test Plugin');
      expect(metadata.version).toBe('1.0.0');
      expect(metadata.capabilities).toHaveLength(2);
    });

    it('should allow optional fields', () => {
      const metadata: PluginMetadata = {
        id: 'minimal-plugin' as PluginId,
        name: 'Minimal Plugin',
        version: '1.0.0',
        capabilities: [],
      };

      expect(metadata.description).toBeUndefined();
      expect(metadata.author).toBeUndefined();
      expect(metadata.dependencies).toBeUndefined();
    });
  });

  describe('Sequence', () => {
    it('should create valid sequence', async () => {
      const sequence: Sequence = {
        id: 'test-sequence' as SequenceId,
        name: 'Test Sequence',
        description: 'A test sequence',
        parameters: [
          {
            name: 'input',
            type: 'string',
            required: true,
            description: 'Input parameter',
          },
        ],
        returns: {
          type: 'string',
          description: 'Output string',
        },
        handler: async (params) => {
          return `Processed: ${params.input}`;
        },
      };

      expect(sequence.id).toBe('test-sequence');
      expect(sequence.parameters).toHaveLength(1);
      expect(sequence.returns.type).toBe('string');

      const result = await sequence.handler({ input: 'test' });
      expect(result).toBe('Processed: test');
    });
  });

  describe('ShellEvent', () => {
    it('should create valid shell event', () => {
      const event: ShellEvent = {
        type: 'plugin:registered',
        timestamp: new Date(),
        pluginId: 'test-plugin' as PluginId,
        data: { name: 'Test Plugin' },
      };

      expect(event.type).toBe('plugin:registered');
      expect(event.pluginId).toBe('test-plugin');
      expect(event.data).toEqual({ name: 'Test Plugin' });
    });

    it('should handle error events', () => {
      const error = new Error('Test error');
      const event: ShellEvent = {
        type: 'error',
        timestamp: new Date(),
        error,
      };

      expect(event.type).toBe('error');
      expect(event.error).toBe(error);
    });
  });

  describe('ShellConfig', () => {
    it('should create valid shell config', () => {
      const config: ShellConfig = {
        name: 'Test Shell',
        version: '1.0.0',
        autoInitialize: true,
        maxConcurrentSequences: 10,
        timeout: 5000,
      };

      expect(config.name).toBe('Test Shell');
      expect(config.autoInitialize).toBe(true);
      expect(config.maxConcurrentSequences).toBe(10);
    });

    it('should allow empty config', () => {
      const config: ShellConfig = {};
      expect(Object.keys(config)).toHaveLength(0);
    });
  });

  describe('SequenceExecutionResult', () => {
    it('should create successful execution result', () => {
      const result: SequenceExecutionResult = {
        sequenceId: 'test-seq' as SequenceId,
        pluginId: 'test-plugin' as PluginId,
        status: 'success',
        result: { data: 'test' },
        duration: 100,
        timestamp: new Date(),
      };

      expect(result.status).toBe('success');
      expect(result.duration).toBe(100);
      expect(result.result).toEqual({ data: 'test' });
    });

    it('should create failed execution result', () => {
      const error = new Error('Execution failed');
      const result: SequenceExecutionResult = {
        sequenceId: 'test-seq' as SequenceId,
        pluginId: 'test-plugin' as PluginId,
        status: 'failed',
        error,
        duration: 50,
        timestamp: new Date(),
      };

      expect(result.status).toBe('failed');
      expect(result.error).toBe(error);
    });
  });

  describe('ShellMetrics', () => {
    it('should create valid shell metrics', () => {
      const metrics: ShellMetrics = {
        totalPlugins: 5,
        activePlugins: 4,
        totalSequencesExecuted: 100,
        failedSequences: 2,
        averageExecutionTime: 150,
        uptime: 3600000,
      };

      expect(metrics.totalPlugins).toBe(5);
      expect(metrics.activePlugins).toBe(4);
      expect(metrics.totalSequencesExecuted).toBe(100);
      expect(metrics.failedSequences).toBe(2);
    });
  });
});

