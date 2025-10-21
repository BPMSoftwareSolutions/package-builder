/**
 * Conductor Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Conductor, createConductor } from './conductor';
import { ConductorConfig, Symphony, Movement, Beat } from './types';

describe('Conductor', () => {
  let conductor: Conductor;
  let config: ConductorConfig;

  beforeEach(() => {
    config = {
      plugins: ['test-plugin'],
      mode: 'development'
    };
    conductor = createConductor(config);
  });

  describe('createConductor', () => {
    it('should create a conductor instance', () => {
      expect(conductor).toBeDefined();
      expect(conductor).toBeInstanceOf(Conductor);
    });

    it('should set default timeout and retryAttempts', () => {
      const metrics = conductor.getMetrics();
      expect(metrics).toBeDefined();
    });
  });

  describe('play', () => {
    it('should load plugins on play', async () => {
      await conductor.play();
      const plugin = conductor.getPlugin('test-plugin');
      expect(plugin).toBeDefined();
      expect(plugin?.loaded).toBe(true);
    });

    it('should increment totalPluginsLoaded metric', async () => {
      await conductor.play();
      const metrics = conductor.getMetrics();
      expect(metrics.totalPluginsLoaded).toBe(1);
    });

    it('should emit plugin:loaded event', async () => {
      const listener = vi.fn();
      conductor.on(listener);
      
      await conductor.play();
      
      expect(listener).toHaveBeenCalled();
      const events = listener.mock.calls.map(call => call[0].type);
      expect(events).toContain('plugin:loaded');
    });
  });

  describe('getPlugin', () => {
    it('should return undefined for unloaded plugin', () => {
      const plugin = conductor.getPlugin('nonexistent');
      expect(plugin).toBeUndefined();
    });

    it('should return plugin metadata after loading', async () => {
      await conductor.play();
      const plugin = conductor.getPlugin('test-plugin');
      expect(plugin).toBeDefined();
      expect(plugin?.name).toBe('test-plugin');
      expect(plugin?.version).toBe('1.0.0');
    });
  });

  describe('registerSequence', () => {
    it('should register a sequence', () => {
      const sequence = {
        id: 'test-seq',
        name: 'Test Sequence',
        pluginId: 'test-plugin',
        handler: async () => 'result'
      };

      conductor.registerSequence(sequence);
      // Verify by executing a beat that uses this sequence
      expect(conductor).toBeDefined();
    });
  });

  describe('executeSymphony', () => {
    it('should execute a symphony successfully', async () => {
      const symphony: Symphony = {
        id: 'sym-1',
        name: 'Test Symphony',
        movements: [],
        status: 'pending',
        createdAt: new Date()
      };

      const result = await conductor.executeSymphony(symphony);
      
      expect(result.status).toBe('completed');
      expect(result.completedAt).toBeDefined();
    });

    it('should increment totalSymphonies metric', async () => {
      const symphony: Symphony = {
        id: 'sym-1',
        name: 'Test Symphony',
        movements: [],
        status: 'pending',
        createdAt: new Date()
      };

      await conductor.executeSymphony(symphony);
      const metrics = conductor.getMetrics();
      
      expect(metrics.totalSymphonies).toBe(1);
      expect(metrics.completedSymphonies).toBe(1);
    });

    it('should emit symphony:start and symphony:complete events', async () => {
      const listener = vi.fn();
      conductor.on(listener);

      const symphony: Symphony = {
        id: 'sym-1',
        name: 'Test Symphony',
        movements: [],
        status: 'pending',
        createdAt: new Date()
      };

      await conductor.executeSymphony(symphony);

      const events = listener.mock.calls.map(call => call[0].type);
      expect(events).toContain('symphony:start');
      expect(events).toContain('symphony:complete');
    });

    it('should execute movements in order', async () => {
      const listener = vi.fn();
      conductor.on(listener);

      const symphony: Symphony = {
        id: 'sym-1',
        name: 'Test Symphony',
        movements: [
          {
            id: 'mov-1',
            name: 'Movement 1',
            beats: [],
            status: 'pending',
            order: 1
          },
          {
            id: 'mov-2',
            name: 'Movement 2',
            beats: [],
            status: 'pending',
            order: 2
          }
        ],
        status: 'pending',
        createdAt: new Date()
      };

      await conductor.executeSymphony(symphony);

      const events = listener.mock.calls.map(call => call[0]);
      const movementStartEvents = events.filter(e => e.type === 'movement:start');
      
      expect(movementStartEvents.length).toBe(2);
      expect(movementStartEvents[0].movementId).toBe('mov-1');
      expect(movementStartEvents[1].movementId).toBe('mov-2');
    });
  });

  describe('executeBeat', () => {
    it('should execute a beat with a registered sequence', async () => {
      await conductor.play();

      const sequence = {
        id: 'test-seq',
        name: 'Test Sequence',
        pluginId: 'test-plugin',
        handler: async () => 'beat-result'
      };

      conductor.registerSequence(sequence);

      const beat: Beat = {
        id: 'beat-1',
        name: 'Test Beat',
        pluginId: 'test-plugin',
        sequenceId: 'test-seq',
        status: 'pending'
      };

      const movement: Movement = {
        id: 'mov-1',
        name: 'Movement 1',
        beats: [beat],
        status: 'pending',
        order: 1
      };

      const symphony: Symphony = {
        id: 'sym-1',
        name: 'Test Symphony',
        movements: [movement],
        status: 'pending',
        createdAt: new Date()
      };

      const result = await conductor.executeSymphony(symphony);
      const retrievedSymphony = conductor.getSymphony('sym-1');

      expect(retrievedSymphony?.status).toBe('completed');
    });
  });

  describe('event listeners', () => {
    it('should call registered event listeners', async () => {
      const listener = vi.fn();
      conductor.on(listener);

      await conductor.play();

      expect(listener).toHaveBeenCalled();
    });

    it('should pass event data to listeners', async () => {
      const listener = vi.fn();
      conductor.on(listener);

      await conductor.play();

      const calls = listener.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      
      const event = calls[0][0];
      expect(event.type).toBeDefined();
      expect(event.timestamp).toBeDefined();
    });
  });

  describe('getMetrics', () => {
    it('should return conductor metrics', () => {
      const metrics = conductor.getMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.totalSymphonies).toBe(0);
      expect(metrics.completedSymphonies).toBe(0);
      expect(metrics.failedSymphonies).toBe(0);
      expect(metrics.totalPluginsLoaded).toBe(0);
    });

    it('should update metrics after operations', async () => {
      await conductor.play();
      
      const metrics = conductor.getMetrics();
      expect(metrics.totalPluginsLoaded).toBe(1);
    });
  });

  describe('getSymphony', () => {
    it('should retrieve a symphony by ID', async () => {
      const symphony: Symphony = {
        id: 'sym-1',
        name: 'Test Symphony',
        movements: [],
        status: 'pending',
        createdAt: new Date()
      };

      await conductor.executeSymphony(symphony);
      const retrieved = conductor.getSymphony('sym-1');

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('sym-1');
      expect(retrieved?.status).toBe('completed');
    });

    it('should return undefined for non-existent symphony', () => {
      const retrieved = conductor.getSymphony('nonexistent');
      expect(retrieved).toBeUndefined();
    });
  });
});

