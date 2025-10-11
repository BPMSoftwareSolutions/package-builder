import { describe, it, expect } from 'vitest';
import { createConductor } from '../../src/orchestration/conductor-setup';

describe('Conductor', () => {
  it('should create a conductor instance', () => {
    const conductor = createConductor({
      plugins: ['test-plugin'],
      mode: 'development'
    });

    expect(conductor).toBeDefined();
  });

  it('should load plugins on play', async () => {
    const conductor = createConductor({
      plugins: ['test-plugin'],
      mode: 'development'
    });

    await conductor.play();
    const plugin = conductor.getPlugin('test-plugin');

    expect(plugin).toBeDefined();
    expect(plugin.loaded).toBe(true);
  });
});
