import { describe, it, expect, beforeEach } from 'vitest';
import { HeaderPlugin } from './header-plugin';
import type { Conductor } from '@renderx/conductor';
import type { HeaderComponent } from './types';

describe('HeaderPlugin', () => {
  let conductor: Conductor;
  let plugin: HeaderPlugin;

  beforeEach(() => {
    conductor = {} as unknown as Conductor;
    plugin = new HeaderPlugin(conductor);
  });

  it('should initialize the plugin', () => {
    expect(() => plugin.initialize()).not.toThrow();
  });

  it('should register a header component', () => {
    const component: HeaderComponent = {
      id: 'title',
      name: 'Title',
      type: 'text',
      position: 'left'
    };
    expect(() => plugin.registerComponent('title', component)).not.toThrow();
  });

  it('should retrieve a registered component', () => {
    const component: HeaderComponent = {
      id: 'title',
      name: 'Title',
      type: 'text',
      position: 'left'
    };
    plugin.registerComponent('title', component);
    expect(plugin.getComponent('title')).toEqual(component);
  });

  it('should list all components', () => {
    const component: HeaderComponent = {
      id: 'title',
      name: 'Title',
      type: 'text'
    };
    plugin.registerComponent('title', component);
    expect(plugin.listComponents()).toHaveLength(1);
  });

  it('should cleanup resources', () => {
    const component: HeaderComponent = {
      id: 'title',
      name: 'Title',
      type: 'text'
    };
    plugin.registerComponent('title', component);
    plugin.destroy();
    expect(plugin.listComponents()).toHaveLength(0);
  });
});

