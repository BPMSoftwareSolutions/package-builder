import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getConductor,
  isConductorAvailable,
  getAvailableSequences,
  generateRequestId,
  validateParameters,
  convertToHistoryItem,
  getSequenceMetadata
} from '../src/ui/diagnostics/services/sequence-execution.service';
import type { LiveExecution } from '../src/ui/diagnostics/types';

/**
 * Unit tests for sequence-execution.service.ts
 * 
 * Tests live sequence triggering and execution monitoring functionality.
 * Part of Issue #306 - Release 2: Live Sequence Triggering.
 */

describe('Sequence Execution Service', () => {
  describe('getConductor', () => {
    beforeEach(() => {
      // Clear globalThis.RenderX before each test
      delete (globalThis as any).RenderX;
    });

    it('should return conductor when available', () => {
      const mockConductor = { play: vi.fn() };
      (globalThis as any).RenderX = { conductor: mockConductor };

      const conductor = getConductor();

      expect(conductor).toBe(mockConductor);
    });

    it('should throw error when conductor is not initialized', () => {
      expect(() => getConductor()).toThrow('Conductor not initialized');
    });
  });

  describe('isConductorAvailable', () => {
    beforeEach(() => {
      delete (globalThis as any).RenderX;
    });

    it('should return true when conductor is available', () => {
      (globalThis as any).RenderX = { conductor: {} };

      expect(isConductorAvailable()).toBe(true);
    });

    it('should return false when conductor is not available', () => {
      expect(isConductorAvailable()).toBe(false);
    });

    it('should return false when RenderX exists but conductor is missing', () => {
      (globalThis as any).RenderX = {};

      expect(isConductorAvailable()).toBe(false);
    });
  });

  describe('generateRequestId', () => {
    it('should generate unique request IDs', () => {
      const id1 = generateRequestId('test-sequence');
      const id2 = generateRequestId('test-sequence');

      expect(id1).not.toBe(id2);
      expect(id1).toContain('test-sequence-symphony-');
      expect(id2).toContain('test-sequence-symphony-');
    });

    it('should include sequence ID in request ID', () => {
      const requestId = generateRequestId('my-sequence');

      expect(requestId).toContain('my-sequence');
    });

    it('should include timestamp in request ID', () => {
      const beforeTime = Date.now();
      const requestId = generateRequestId('test');
      const afterTime = Date.now();

      // Extract timestamp from request ID (format: sequenceId-symphony-timestamp-random)
      const parts = requestId.split('-');
      const timestamp = parseInt(parts[2]);

      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('validateParameters', () => {
    it('should validate empty string as valid with empty object', () => {
      const result = validateParameters('');

      expect(result.valid).toBe(true);
      expect(result.data).toEqual({});
    });

    it('should validate whitespace string as valid with empty object', () => {
      const result = validateParameters('   ');

      expect(result.valid).toBe(true);
      expect(result.data).toEqual({});
    });

    it('should validate valid JSON object', () => {
      const result = validateParameters('{"key": "value", "number": 42}');

      expect(result.valid).toBe(true);
      expect(result.data).toEqual({ key: 'value', number: 42 });
    });

    it('should reject invalid JSON', () => {
      const result = validateParameters('{invalid json}');

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject JSON array', () => {
      const result = validateParameters('[1, 2, 3]');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Parameters must be a JSON object');
    });

    it('should reject JSON null', () => {
      const result = validateParameters('null');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Parameters must be a JSON object');
    });

    it('should reject JSON string', () => {
      const result = validateParameters('"string"');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Parameters must be a JSON object');
    });

    it('should reject JSON number', () => {
      const result = validateParameters('42');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Parameters must be a JSON object');
    });
  });

  describe('convertToHistoryItem', () => {
    it('should convert successful execution to history item', () => {
      const execution: LiveExecution = {
        sequenceId: 'test-seq',
        pluginId: 'TestPlugin',
        requestId: 'req-123',
        status: 'success',
        startTime: '2025-10-01T10:00:00.000Z',
        endTime: '2025-10-01T10:00:01.000Z',
        beats: [
          { number: 1, event: 'beat1', status: 'success', duration: 500 },
          { number: 2, event: 'beat2', status: 'success', duration: 500 }
        ],
        totalDuration: 1000,
        parameters: { key: 'value' }
      };

      const historyItem = convertToHistoryItem(execution, 'Test Sequence');

      expect(historyItem.sequenceId).toBe('test-seq');
      expect(historyItem.sequenceName).toBe('Test Sequence');
      expect(historyItem.pluginId).toBe('TestPlugin');
      expect(historyItem.requestId).toBe('req-123');
      expect(historyItem.status).toBe('success');
      expect(historyItem.totalDuration).toBe(1000);
      expect(historyItem.beatCount).toBe(2);
      expect(historyItem.parameters).toEqual({ key: 'value' });
      expect(historyItem.execution).toBe(execution);
    });

    it('should convert failed execution to history item', () => {
      const execution: LiveExecution = {
        sequenceId: 'test-seq',
        pluginId: 'TestPlugin',
        requestId: 'req-456',
        status: 'error',
        startTime: '2025-10-01T10:00:00.000Z',
        endTime: '2025-10-01T10:00:00.500Z',
        beats: [
          { number: 1, event: 'beat1', status: 'success', duration: 300 },
          { number: 2, event: 'beat2', status: 'error', duration: 200 }
        ],
        totalDuration: 500,
        error: 'Something went wrong'
      };

      const historyItem = convertToHistoryItem(execution, 'Test Sequence');

      expect(historyItem.status).toBe('error');
      expect(historyItem.error).toBe('Something went wrong');
      expect(historyItem.totalDuration).toBe(500);
    });

    it('should calculate duration from timestamps if totalDuration is missing', () => {
      const execution: LiveExecution = {
        sequenceId: 'test-seq',
        pluginId: 'TestPlugin',
        requestId: 'req-789',
        status: 'success',
        startTime: '2025-10-01T10:00:00.000Z',
        endTime: '2025-10-01T10:00:02.500Z',
        beats: []
      };

      const historyItem = convertToHistoryItem(execution, 'Test Sequence');

      expect(historyItem.totalDuration).toBe(2500);
    });

    it('should use current time for endTime if missing', () => {
      const beforeTime = new Date().toISOString();
      
      const execution: LiveExecution = {
        sequenceId: 'test-seq',
        pluginId: 'TestPlugin',
        requestId: 'req-999',
        status: 'success',
        startTime: '2025-10-01T10:00:00.000Z',
        beats: []
      };

      const historyItem = convertToHistoryItem(execution, 'Test Sequence');
      const afterTime = new Date().toISOString();

      expect(historyItem.endTime).toBeDefined();
      expect(historyItem.endTime >= beforeTime).toBe(true);
      expect(historyItem.endTime <= afterTime).toBe(true);
    });
  });

  describe('getAvailableSequences', () => {
    beforeEach(() => {
      delete (globalThis as any).RenderX;
      vi.clearAllMocks();
    });

    it('should return empty array when conductor is not available', async () => {
      const sequences = await getAvailableSequences();

      expect(sequences).toEqual([]);
    });

    // Note: Full integration tests for getAvailableSequences would require
    // mocking fetch and conductor, which is better suited for integration tests
  });
});

