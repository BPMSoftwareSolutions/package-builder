import { describe, it, expect, vi } from 'vitest';
import { handlers } from '../src/symphonies/drop.container.symphony';
import { EventRouter } from '@renderx-plugins/host-sdk';

vi.mock('@renderx-plugins/host-sdk', () => {
  return {
    EventRouter: {
      publish: vi.fn(async () => undefined),
    },
  };
});

describe('library-component container drop handlers (package)', () => {
  it('publishCreateRequested publishes canvas.component.create.requested with payload and ctx conductor', async () => {
    const data = {
      component: { id: 'btn-2', name: 'Button' },
      position: { x: 15, y: 25 },
      containerId: 'parent-999',
    };
    const ctx = { conductor: { id: 'fake-conductor' } } as any;

    await handlers.publishCreateRequested(data as any, ctx);

    expect(EventRouter.publish).toHaveBeenCalledTimes(1);
    const [topic, payload, conductor] = (EventRouter.publish as any).mock.calls[0];
    expect(topic).toBe('canvas.component.create.requested');
    expect(payload.component).toEqual(data.component);
    expect(payload.position).toEqual(data.position);
    expect(payload.containerId).toBe(data.containerId);
    expect(typeof payload.correlationId).toBe('string');
    expect((payload.correlationId as string).length).toBeGreaterThan(0);
    expect(conductor).toBe(ctx.conductor);
  });
});

