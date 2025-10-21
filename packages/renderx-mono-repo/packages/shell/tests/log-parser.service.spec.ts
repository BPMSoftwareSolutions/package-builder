import { describe, it, expect } from 'vitest';
import { parseLog, calculateExecutionStats, exportAsJson } from '../src/ui/diagnostics/services/log-parser.service';
import type { LogInput, ParsedExecution } from '../src/ui/diagnostics/types';

/**
 * Unit tests for log-parser.service.ts
 * 
 * Tests parsing of sequence execution logs in JSON and text formats.
 * Part of the Diagnostic Sequence Player MVP (Issue #305).
 */

describe('Log Parser Service', () => {
  describe('parseLog - JSON format', () => {
    it('should parse valid JSON log with all fields', () => {
      const input: LogInput = {
        content: JSON.stringify({
          sequenceId: 'create-element',
          sequenceName: 'Create Element',
          pluginId: 'CanvasPlugin',
          requestId: 'req-123',
          movements: [
            {
              name: 'validate',
              beats: [
                { number: 1, event: 'validate.start', duration: 5 }
              ]
            }
          ],
          totalDuration: 5,
          status: 'success'
        }),
        format: 'json'
      };

      const result = parseLog(input);

      expect(result.success).toBe(true);
      expect(result.execution).toBeDefined();
      expect(result.execution?.sequenceId).toBe('create-element');
      expect(result.execution?.sequenceName).toBe('Create Element');
      expect(result.execution?.pluginId).toBe('CanvasPlugin');
      expect(result.execution?.requestId).toBe('req-123');
      expect(result.execution?.movements).toHaveLength(1);
      expect(result.execution?.totalDuration).toBe(5);
      expect(result.execution?.status).toBe('success');
    });

    it('should parse JSON log with multiple movements and beats', () => {
      const input: LogInput = {
        content: JSON.stringify({
          sequenceId: 'complex-sequence',
          pluginId: 'TestPlugin',
          requestId: 'req-456',
          movements: [
            {
              name: 'validate',
              beats: [
                { number: 1, event: 'validate.start', duration: 5 },
                { number: 2, event: 'validate.end', duration: 3 }
              ]
            },
            {
              name: 'execute',
              beats: [
                { number: 1, event: 'execute.start', duration: 10 },
                { number: 2, event: 'execute.end', duration: 7 }
              ]
            }
          ]
        }),
        format: 'json'
      };

      const result = parseLog(input);

      expect(result.success).toBe(true);
      expect(result.execution?.movements).toHaveLength(2);
      expect(result.execution?.movements[0].beats).toHaveLength(2);
      expect(result.execution?.movements[1].beats).toHaveLength(2);
      expect(result.execution?.totalDuration).toBe(25); // 5+3+10+7
    });

    it('should detect error status from beat errors', () => {
      const input: LogInput = {
        content: JSON.stringify({
          sequenceId: 'error-sequence',
          pluginId: 'TestPlugin',
          requestId: 'req-789',
          movements: [
            {
              name: 'validate',
              beats: [
                { number: 1, event: 'validate.start', duration: 5, status: 'error', error: 'Validation failed' }
              ]
            }
          ]
        }),
        format: 'json'
      };

      const result = parseLog(input);

      expect(result.success).toBe(true);
      expect(result.execution?.status).toBe('error');
      expect(result.execution?.movements[0].status).toBe('error');
    });

    it('should return error for missing required fields', () => {
      const input: LogInput = {
        content: JSON.stringify({
          sequenceId: 'test',
          // Missing pluginId and requestId
        }),
        format: 'json'
      };

      const result = parseLog(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required fields');
    });

    it('should return error for invalid JSON', () => {
      const input: LogInput = {
        content: 'not valid json {',
        format: 'json'
      };

      const result = parseLog(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('JSON parsing failed');
    });

    it('should use sequenceId as sequenceName if not provided', () => {
      const input: LogInput = {
        content: JSON.stringify({
          sequenceId: 'test-sequence',
          pluginId: 'TestPlugin',
          requestId: 'req-001',
          movements: []
        }),
        format: 'json'
      };

      const result = parseLog(input);

      expect(result.success).toBe(true);
      expect(result.execution?.sequenceName).toBe('test-sequence');
    });
  });

  describe('parseLog - text format', () => {
    it('should parse text log with basic fields', () => {
      const input: LogInput = {
        content: `
          sequenceId: create-element
          pluginId: CanvasPlugin
          requestId: req-123
          movement: validate
          beat: 1, event: validate.start, duration: 5
        `,
        format: 'text'
      };

      const result = parseLog(input);

      expect(result.success).toBe(true);
      expect(result.execution?.sequenceId).toBe('create-element');
      expect(result.execution?.pluginId).toBe('CanvasPlugin');
      expect(result.execution?.requestId).toBe('req-123');
      expect(result.execution?.movements).toHaveLength(1);
      expect(result.execution?.movements[0].name).toBe('validate');
      expect(result.execution?.movements[0].beats).toHaveLength(1);
    });

    it('should parse multiple movements from text', () => {
      const input: LogInput = {
        content: `
          sequenceId: test-seq
          pluginId: TestPlugin
          requestId: req-456
          movement: validate
          beat: 1, event: validate.start, duration: 5
          movement: execute
          beat: 1, event: execute.start, duration: 10
        `,
        format: 'text'
      };

      const result = parseLog(input);

      expect(result.success).toBe(true);
      expect(result.execution?.movements).toHaveLength(2);
      expect(result.execution?.movements[0].name).toBe('validate');
      expect(result.execution?.movements[1].name).toBe('execute');
    });

    it('should detect errors in text logs', () => {
      const input: LogInput = {
        content: `
          sequenceId: error-seq
          pluginId: TestPlugin
          requestId: req-789
          movement: validate
          beat: 1, event: validate.start, duration: 5
          ERROR: Validation failed
        `,
        format: 'text'
      };

      const result = parseLog(input);

      expect(result.success).toBe(true);
      expect(result.execution?.status).toBe('error');
    });

    it('should return error if required fields not found in text', () => {
      const input: LogInput = {
        content: 'some random text without required fields',
        format: 'text'
      };

      const result = parseLog(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Could not extract required fields');
    });
  });

  describe('calculateExecutionStats', () => {
    it('should calculate correct statistics', () => {
      const execution: ParsedExecution = {
        sequenceId: 'test',
        sequenceName: 'Test',
        pluginId: 'TestPlugin',
        requestId: 'req-001',
        movements: [
          {
            name: 'validate',
            beats: [
              { number: 1, event: 'validate.start', duration: 10, status: 'success' },
              { number: 2, event: 'validate.end', duration: 5, status: 'success' }
            ],
            duration: 15,
            status: 'success'
          },
          {
            name: 'execute',
            beats: [
              { number: 1, event: 'execute.start', duration: 20, status: 'success' }
            ],
            duration: 20,
            status: 'success'
          }
        ],
        totalDuration: 35,
        status: 'success'
      };

      const stats = calculateExecutionStats(execution);

      expect(stats.totalMovements).toBe(2);
      expect(stats.totalBeats).toBe(3);
      expect(stats.totalDuration).toBe(35);
      expect(stats.avgBeatDuration).toBe(Math.round(35 / 3));
      expect(stats.successfulBeats).toBe(3);
      expect(stats.failedBeats).toBe(0);
      expect(stats.slowestBeat).toEqual({
        movement: 'execute',
        beat: 1,
        duration: 20
      });
    });

    it('should count failed beats correctly', () => {
      const execution: ParsedExecution = {
        sequenceId: 'test',
        sequenceName: 'Test',
        pluginId: 'TestPlugin',
        requestId: 'req-002',
        movements: [
          {
            name: 'validate',
            beats: [
              { number: 1, event: 'validate.start', duration: 10, status: 'success' },
              { number: 2, event: 'validate.end', duration: 5, status: 'error' }
            ],
            duration: 15,
            status: 'error'
          }
        ],
        totalDuration: 15,
        status: 'error'
      };

      const stats = calculateExecutionStats(execution);

      expect(stats.successfulBeats).toBe(1);
      expect(stats.failedBeats).toBe(1);
    });
  });

  describe('exportAsJson', () => {
    it('should export execution as formatted JSON string', () => {
      const execution: ParsedExecution = {
        sequenceId: 'test',
        sequenceName: 'Test',
        pluginId: 'TestPlugin',
        requestId: 'req-001',
        movements: [],
        totalDuration: 0,
        status: 'success'
      };

      const json = exportAsJson(execution);

      expect(json).toBeDefined();
      expect(() => JSON.parse(json)).not.toThrow();

      const parsed = JSON.parse(json);
      expect(parsed.sequenceId).toBe('test');
      expect(parsed.pluginId).toBe('TestPlugin');
    });
  });

  describe('JSON Array Format Support', () => {
    it('should handle JSON array format (from log converter)', () => {
      const arrayJson = JSON.stringify([
        {
          sequenceId: 'test-seq-1',
          sequenceName: 'Test Sequence 1',
          pluginId: 'TestPlugin',
          requestId: 'req-123',
          movements: [
            {
              name: 'Movement 1',
              beats: [
                {
                  number: 1,
                  event: 'test.event',
                  duration: 5,
                  status: 'success'
                }
              ],
              duration: 5,
              status: 'success'
            }
          ],
          totalDuration: 5,
          status: 'success'
        },
        {
          sequenceId: 'test-seq-2',
          sequenceName: 'Test Sequence 2',
          pluginId: 'TestPlugin2',
          requestId: 'req-456',
          movements: [],
          totalDuration: 0,
          status: 'success'
        }
      ]);

      const result = parseLog({
        content: arrayJson,
        format: 'json'
      });

      expect(result.success).toBe(true);
      expect(result.execution).toBeDefined();
      // Should use the first execution in the array
      expect(result.execution?.sequenceId).toBe('test-seq-1');
      expect(result.execution?.sequenceName).toBe('Test Sequence 1');
    });

    it('should handle empty JSON array', () => {
      const result = parseLog({
        content: '[]',
        format: 'json'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Empty execution array');
    });
  });
});

