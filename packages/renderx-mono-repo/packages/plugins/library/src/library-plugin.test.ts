import { describe, it, expect, beforeEach } from 'vitest';
import { LibraryPlugin } from './library-plugin';
import type { Conductor } from '@renderx/conductor';
import type { LibraryItem } from './types';

describe('LibraryPlugin', () => {
  let conductor: Conductor;
  let plugin: LibraryPlugin;

  beforeEach(() => {
    conductor = {} as unknown as Conductor;
    plugin = new LibraryPlugin(conductor);
  });

  it('should initialize the plugin', () => {
    expect(() => plugin.initialize()).not.toThrow();
  });

  it('should add an item to the library', () => {
    const item: LibraryItem = {
      id: 'button',
      name: 'Button',
      category: 'controls'
    };
    expect(() => plugin.addItem('button', item)).not.toThrow();
  });

  it('should retrieve an item from the library', () => {
    const item: LibraryItem = {
      id: 'button',
      name: 'Button',
      category: 'controls'
    };
    plugin.addItem('button', item);
    expect(plugin.getItem('button')).toEqual(item);
  });

  it('should list all items', () => {
    const item: LibraryItem = {
      id: 'button',
      name: 'Button',
      category: 'controls'
    };
    plugin.addItem('button', item);
    expect(plugin.listItems()).toHaveLength(1);
  });

  it('should search items by name', () => {
    const item: LibraryItem = {
      id: 'button',
      name: 'Button',
      category: 'controls'
    };
    plugin.addItem('button', item);
    expect(plugin.search('button')).toHaveLength(1);
    expect(plugin.search('input')).toHaveLength(0);
  });

  it('should cleanup resources', () => {
    const item: LibraryItem = {
      id: 'button',
      name: 'Button',
      category: 'controls'
    };
    plugin.addItem('button', item);
    plugin.destroy();
    expect(plugin.listItems()).toHaveLength(0);
  });
});

