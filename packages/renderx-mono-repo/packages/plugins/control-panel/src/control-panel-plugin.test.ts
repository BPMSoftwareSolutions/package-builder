import { describe, it, expect, beforeEach } from 'vitest';
import { ControlPanelPlugin } from './control-panel-plugin';
import type { Conductor } from '@renderx/conductor';
import type { PropertyDefinition } from './types';

describe('ControlPanelPlugin', () => {
  let conductor: Conductor;
  let plugin: ControlPanelPlugin;

  beforeEach(() => {
    conductor = {} as unknown as Conductor;
    plugin = new ControlPanelPlugin(conductor);
  });

  it('should initialize the plugin', () => {
    expect(() => plugin.initialize()).not.toThrow();
  });

  it('should register a property', () => {
    const property: PropertyDefinition = {
      id: 'color',
      name: 'Color',
      type: 'string',
      editable: true
    };
    expect(() => plugin.registerProperty('color', property)).not.toThrow();
  });

  it('should retrieve a registered property', () => {
    const property: PropertyDefinition = {
      id: 'color',
      name: 'Color',
      type: 'string',
      editable: true
    };
    plugin.registerProperty('color', property);
    expect(plugin.getProperty('color')).toEqual(property);
  });

  it('should update a property value', () => {
    const property: PropertyDefinition = {
      id: 'color',
      name: 'Color',
      type: 'string',
      value: 'red',
      editable: true
    };
    plugin.registerProperty('color', property);
    plugin.updateProperty('color', 'blue');
    expect(plugin.getProperty('color')?.value).toBe('blue');
  });

  it('should cleanup resources', () => {
    const property: PropertyDefinition = {
      id: 'color',
      name: 'Color',
      type: 'string'
    };
    plugin.registerProperty('color', property);
    plugin.destroy();
    expect(plugin.getProperty('color')).toBeUndefined();
  });
});

