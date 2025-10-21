/**
 * Simple EventBus Tests
 * Basic TDD tests without complex imports
 */

import { EventBus, ConductorEventBus } from '../../../modules/communication/EventBus';

describe('EventBus - Simple TDD Tests', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  describe('Basic Functionality', () => {
    it('should create an EventBus instance', () => {
      expect(eventBus).toBeDefined();
      expect(eventBus).toBeInstanceOf(EventBus);
    });

    it('should subscribe to events and return unsubscribe function', () => {
      const callback = jest.fn();
      const unsubscribe = eventBus.subscribe('test-event', callback);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should call callback when event is emitted', async () => {
      const callback = jest.fn();
      const testData = { message: 'test data' };

      eventBus.subscribe('test-event', callback);
      await eventBus.emit('test-event', testData);

      expect(callback).toHaveBeenCalledWith(testData);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should unsubscribe correctly', async () => {
      const callback = jest.fn();
      const unsubscribe = eventBus.subscribe('test-event', callback);

      // Emit before unsubscribe
      await eventBus.emit('test-event', { phase: 'before' });
      expect(callback).toHaveBeenCalledTimes(1);

      // Unsubscribe
      unsubscribe();

      // Emit after unsubscribe
      await eventBus.emit('test-event', { phase: 'after' });
      expect(callback).toHaveBeenCalledTimes(1); // Should not increase
    });

    it('should provide debug information', () => {
      const callback = jest.fn();
      eventBus.subscribe('test-event', callback);

      const debugInfo = eventBus.getDebugInfo();
      expect(debugInfo).toHaveProperty('totalSubscriptions');
      expect(debugInfo).toHaveProperty('subscriptionCounts');
      expect(debugInfo.subscriptionCounts['test-event']).toBe(1);
    });
  });
});

describe('ConductorEventBus - Simple TDD Tests', () => {
  let conductorEventBus: ConductorEventBus;

  beforeEach(() => {
    conductorEventBus = new ConductorEventBus();
  });

  describe('Basic Functionality', () => {
    it('should create a ConductorEventBus instance', () => {
      expect(conductorEventBus).toBeDefined();
      expect(conductorEventBus).toBeInstanceOf(ConductorEventBus);
      expect(conductorEventBus).toBeInstanceOf(EventBus);
    });

    it('should have tempo management methods', () => {
      expect(typeof conductorEventBus.setTempo).toBe('function');
      expect(typeof conductorEventBus.getTempo).toBe('function');
      expect(typeof conductorEventBus.getBeatDuration).toBe('function');
    });

    it('should set and get tempo', () => {
      conductorEventBus.setTempo(140);
      expect(conductorEventBus.getTempo()).toBe(140);
    });

    it('should calculate beat duration from tempo', () => {
      conductorEventBus.setTempo(120); // 120 BPM = 500ms per beat
      const beatDuration = conductorEventBus.getBeatDuration();
      expect(beatDuration).toBe(500);
    });

    it('should have sequence management methods', () => {
      expect(typeof conductorEventBus.registerSequence).toBe('function');
      expect(typeof conductorEventBus.getSequenceNames).toBe('function');
      expect(typeof conductorEventBus.play).toBe('function');
    });

    it('should register and retrieve sequences', () => {
      const mockSequence = { name: 'Test Sequence', movements: [] };
      
      conductorEventBus.registerSequence('test-sequence', mockSequence);
      
      expect(conductorEventBus.sequences.has('test-sequence')).toBe(true);
      expect(conductorEventBus.sequences.get('test-sequence')).toBe(mockSequence);
      expect(conductorEventBus.getSequenceNames()).toContain('test-sequence');
    });

    it('should provide metrics', () => {
      const metrics = conductorEventBus.getMetrics();
      
      expect(metrics).toHaveProperty('sequenceCount');
      expect(metrics).toHaveProperty('sequenceExecutions');
      expect(metrics).toHaveProperty('eventBusStats');
      expect(typeof metrics.sequenceCount).toBe('number');
    });

    it('should play sequences through conductor', async () => {
      const mockConductor = {
        startSequence: jest.fn().mockResolvedValue('sequence-id-123')
      };
      
      conductorEventBus.connectToMainConductor(mockConductor);
      
      const result = await conductorEventBus.play('Test Sequence', { test: true });
      
      expect(mockConductor.startSequence).toHaveBeenCalledWith('Test Sequence', { test: true });
      expect(result).toBe('sequence-id-123');
    });
  });
});
