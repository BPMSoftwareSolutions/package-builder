import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentsPlugin } from './components-plugin';
import type { Conductor } from '@renderx/conductor';
import type { ComponentDefinition } from './types';

describe('ComponentsPlugin', () => {
  let conductor: Conductor;
  let plugin: ComponentsPlugin;

  beforeEach(() => {
    conductor = {} as unknown as Conductor;
    plugin = new ComponentsPlugin(conductor);
  });

  it('should initialize the plugin', () => {
    expect(() => plugin.initialize()).not.toThrow();
  });

  it('should register a component', () => {
    const component: ComponentDefinition = {
      id: 'button',
      name: 'Button',
      type: 'component'
    };
    expect(() => plugin.registerComponent('button', component)).not.toThrow();
  });

  it('should retrieve a registered component', () => {
    const component: ComponentDefinition = {
      id: 'button',
      name: 'Button',
      type: 'component'
    };
    plugin.registerComponent('button', component);
    expect(plugin.getComponent('button')).toEqual(component);
  });

  it('should list all components', () => {
    const component: ComponentDefinition = {
      id: 'button',
      name: 'Button',
      type: 'component'
    };
    plugin.registerComponent('button', component);
    expect(plugin.listComponents()).toHaveLength(1);
  });

  it('should cleanup resources', () => {
    const component: ComponentDefinition = {
      id: 'button',
      name: 'Button',
      type: 'component'
    };
    plugin.registerComponent('button', component);
    plugin.destroy();
    expect(plugin.listComponents()).toHaveLength(0);
  });
});

