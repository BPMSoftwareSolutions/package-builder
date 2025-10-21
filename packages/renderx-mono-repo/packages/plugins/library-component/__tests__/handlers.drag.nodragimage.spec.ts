import { describe, it, expect, vi } from 'vitest';
import { handlers } from '../src/symphonies/drag.symphony';

describe('library-component drag handlers (no drag image support, package)', () => {
  it('onDragStart sets payload and returns { started: true } even without setDragImage', () => {
    const setData = vi.fn();
    const dataTransfer: any = { setData }; // no setDragImage provided
    const domEvent: any = { dataTransfer };

    const component = { id: 'comp-x', name: 'Heading' } as any;

    const result = handlers.onDragStart({ domEvent, component });

    expect(setData).toHaveBeenCalledWith(
      'application/rx-component',
      JSON.stringify({ component })
    );
    expect(result).toEqual({ started: true });
  });
});

