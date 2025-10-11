import { describe, it, expect } from 'vitest';
import { SPAValidator } from '../../src/validators/spa-validator';

describe('SPAValidator', () => {
  const validator = new SPAValidator();

  it('should validate a correct manifest', () => {
    const manifest = {
      name: 'test-plugin',
      version: '1.0.0',
      type: 'panel' as const,
      exports: ['TestPanel']
    };

    const result = validator.validate(manifest);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject manifest without name', () => {
    const manifest = {
      name: '',
      version: '1.0.0',
      type: 'panel' as const,
      exports: ['TestPanel']
    };

    const result = validator.validate(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Plugin name is required');
  });

  it('should reject invalid plugin type', () => {
    const manifest = {
      name: 'test-plugin',
      version: '1.0.0',
      type: 'invalid' as any,
      exports: ['TestPanel']
    };

    const result = validator.validate(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid plugin type');
  });
});
