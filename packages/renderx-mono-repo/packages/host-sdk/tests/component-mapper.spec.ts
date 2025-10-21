import { describe, it, expect, beforeEach } from 'vitest';
import { getTagForType, computeTagFromJson, setConfig } from '../component-mapper';

describe('Component Mapper', () => {
  beforeEach(() => {
    delete (globalThis as any).window;
    delete (globalThis as any).RenderX;
  });

  describe('getTagForType', () => {
    it('should return div for empty/null type', () => {
      expect(getTagForType('')).toBe('div');
      expect(getTagForType(null)).toBe('div');
      expect(getTagForType(undefined)).toBe('div');
    });

    it('should map known types correctly', () => {
      expect(getTagForType('container')).toBe('div');
      expect(getTagForType('input')).toBe('input');
      expect(getTagForType('image')).toBe('img');
      expect(getTagForType('paragraph')).toBe('p');
    });

    it('should return the type itself for unknown types', () => {
      expect(getTagForType('custom-element')).toBe('custom-element');
    });
  });

  describe('computeTagFromJson', () => {
    it('should respect runtime.tag override', () => {
      const json = {
        metadata: { type: 'button' },
        runtime: { tag: 'custom-button' },
      };
      expect(computeTagFromJson(json)).toBe('custom-button');
    });

    it('should map heading with level', () => {
      const json = {
        metadata: { type: 'heading' },
        integration: {
          properties: {
            defaultValues: { level: 'h3' },
          },
        },
      };
      expect(computeTagFromJson(json)).toBe('h3');
    });

    it('should fallback to h2 for invalid heading level', () => {
      const json = {
        metadata: { type: 'heading' },
        integration: {
          properties: {
            defaultValues: { level: 'invalid' },
          },
        },
      };
      expect(computeTagFromJson(json)).toBe('h2');
    });

    it('should use metadata.type as fallback', () => {
      const json = {
        metadata: { type: 'custom-type' },
      };
      expect(computeTagFromJson(json)).toBe('custom-type');
    });

    it('should use default div for empty json', () => {
      expect(computeTagFromJson({})).toBe('div');
    });

    it('should handle conditional rules', () => {
      const json = {
        metadata: { type: 'container' },
      };
      expect(computeTagFromJson(json)).toBe('div');
    });
  });

  describe('config loading', () => {
    it('should use custom config when set', () => {
      const customConfig = {
        version: '2.0.0',
        defaults: {
          tagRules: [
            { when: "metadata.type == 'custom'", tag: 'custom-tag' },
            { defaultTag: 'span' },
          ],
        },
      };

      setConfig(customConfig);

      const json = { metadata: { type: 'custom' } };
      expect(computeTagFromJson(json)).toBe('custom-tag');

      const unknownJson = { metadata: { type: 'unknown' } };
      expect(computeTagFromJson(unknownJson)).toBe('unknown');
    });
  });
});
