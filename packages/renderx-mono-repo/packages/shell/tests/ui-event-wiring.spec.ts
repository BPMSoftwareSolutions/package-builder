// @vitest-environment jsdom
import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';

// Mock host-sdk EventRouter before importing module under test
vi.mock('@renderx-plugins/host-sdk', () => {
  const publish = vi.fn(async () => {});
  return { EventRouter: { publish } };
});

import { wireUiEvents, type UiEventDef } from '../src/ui/events/wiring';

let publishMock: any;

describe('UI Event Wiring (data-driven)', () => {
  let cleanup: (() => void) | null = null;

  beforeEach(async () => {
    // Reset DOM and globals
    document.body.innerHTML = '';
    (window as any).RenderX = (window as any).RenderX || {};
    (window as any).RenderX.conductor = {};
    const { EventRouter } = await import('@renderx-plugins/host-sdk');
    publishMock = EventRouter.publish as any;
    publishMock.mockClear();
  });

  afterEach(() => {
    if (cleanup) cleanup();
    cleanup = null;
  });

  const defs: UiEventDef[] = [
    {
      id: 'canvas.deselect.onCanvasClick',
      target: { selector: '#rx-canvas' },
      event: 'click',
      options: true,
      guard: { notClosestMatch: ".rx-comp,[id^='rx-node-']" },
      publish: { topic: 'canvas.component.deselect.requested', payload: {} },
    },
    {
      id: 'canvas.deselect.onEscape',
      target: { window: true },
      event: 'keydown',
      guard: { key: 'Escape' },
      publish: { topic: 'canvas.component.deselect.requested', payload: {} },
    },
    {
      id: 'canvas.delete.onDelete',
      target: { window: true },
      event: 'keydown',
      guard: { key: 'Delete' },
      publish: { topic: 'canvas.component.delete.requested', payload: {} },
    },
  ];

  it('publishes deselect when clicking on canvas (outside component)', async () => {
    const canvas = document.createElement('div');
    canvas.id = 'rx-canvas';
    document.body.appendChild(canvas);

    cleanup = wireUiEvents(defs);

    canvas.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await Promise.resolve();

    expect(publishMock).toHaveBeenCalled();
    const [topic] = publishMock.mock.calls[0];
    expect(topic).toBe('canvas.component.deselect.requested');
  });

  it('publishes deselect on Escape key', async () => {
    cleanup = wireUiEvents(defs);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await Promise.resolve();

    expect(publishMock).toHaveBeenCalled();
    const [topic] = publishMock.mock.calls[0];
    expect(topic).toBe('canvas.component.deselect.requested');
  });

  it('publishes delete on Delete key', async () => {
    cleanup = wireUiEvents(defs);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));
    await Promise.resolve();

    expect(publishMock).toHaveBeenCalled();
    const [topic] = publishMock.mock.calls[0];
    expect(topic).toBe('canvas.component.delete.requested');
  });
});

