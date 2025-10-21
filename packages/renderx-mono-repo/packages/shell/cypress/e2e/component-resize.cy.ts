/// <reference types="cypress" />

// E2E: resize a component on the canvas using selection overlay handles
// Red-Green-Refactor: this starts RED if handles/behaviour are not wired

describe('Canvas component resize via overlay handles', () => {
  const librarySlot = '[data-slot="library"] [data-slot-content]';
  const canvasSlot = '[data-slot="canvas"] [data-slot-content]';
  const canvasRoot = '#rx-canvas';

  const nodeSelector = `#rx-canvas [id^="rx-node-"], #rx-canvas .rx-comp, #rx-canvas [data-rx-node]`;
  const _handleSelectors = [
    '#rx-selection-overlay .rx-handle',
    '.rx-handle',
    '.rx-resize-handle',
    '.resize-handle',
    '[data-resize-handle]',
    '[data-handle]'
  ].join(', ');

  let capturedLogs: string[] = [];

  beforeEach(() => {
    capturedLogs = [];
  });

  it('drops a button on canvas and resizes it by dragging a handle', () => {
    cy.visit('/?debug=1', {
      onBeforeLoad(win) {
        const orig = { log: win.console.log, warn: win.console.warn, error: win.console.error };
        const cap = (kind: string, fn: Function) => (...args: any[]) => {
          try { capturedLogs.push(`[${new Date().toISOString()}] ${kind.toUpperCase()} ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')}`); } catch {}
          try { fn.apply(win.console, args as any); } catch {}
        };
        win.console.log = cap('log', orig.log);
        win.console.warn = cap('warn', orig.warn);
        win.console.error = cap('error', orig.error);
      }
    });

    // Wait for Library and Canvas to be ready
    cy.waitForRenderXReady({ minPlugins: 1, minMounted: 1, minRoutes: 1, minTopics: 1, eventTimeoutMs: 30000 });
    cy.get(librarySlot, { timeout: 20000 }).should('exist');
    cy.get(canvasSlot, { timeout: 20000 }).should('exist');

    // Find a draggable library item that contains the word Button
    cy.get(librarySlot)
      .find('[draggable="true"], [draggable]')
      .contains(/button/i, { timeout: 10000 })
      .should('exist')
      .as('buttonComponent');

    // Canvas target
    cy.get(canvasRoot, { timeout: 20000 }).should('exist').as('canvasTarget');

    // Perform drag & drop from Library to Canvas
    cy.get('@buttonComponent').then(($source) => {
      cy.get('@canvasTarget').then(($target) => {
        const sourceRect = $source[0].getBoundingClientRect();
        const targetRect = $target[0].getBoundingClientRect();
        const sourceX = sourceRect.left + sourceRect.width / 2;
        const sourceY = sourceRect.top + sourceRect.height / 2;
        const targetX = targetRect.left + targetRect.width / 2;
        const targetY = targetRect.top + targetRect.height / 2;

        cy.window().then((win) => {
          const dataTransfer = new (win as any).DataTransfer();
          const componentData = { component: { template: { tag: 'button', text: 'Button', classes: ['rx-comp','rx-button'], style: {} } } };
          dataTransfer.setData('application/rx-component', JSON.stringify(componentData));

          cy.get('@buttonComponent')
            .trigger('mousedown', { clientX: sourceX, clientY: sourceY, which: 1 })
            .trigger('dragstart', { clientX: sourceX, clientY: sourceY, dataTransfer })
            .wait(100);

          cy.get('@canvasTarget')
            .trigger('dragenter', { clientX: targetX, clientY: targetY, dataTransfer })
            .trigger('dragover', { clientX: targetX, clientY: targetY, dataTransfer })
            .trigger('drop', { clientX: targetX, clientY: targetY, dataTransfer });

          cy.get('@buttonComponent')
            .trigger('dragend', { clientX: targetX, clientY: targetY, dataTransfer })
            .trigger('mouseup', { clientX: targetX, clientY: targetY });
        });
      });
    });

    // Wait for creation
    cy.wait(1000);

    // Ensure component exists
    cy.get(nodeSelector, { timeout: 10000 }).should('exist').first().as('node');

    // Click to select so the selection overlay/handles appear
    cy.get('@node').click({ force: true });
    cy.wait(600);

    // Measure initial size
    cy.get('@node').then(($n) => {
      const r = $n[0].getBoundingClientRect();
      (Cypress as any).env('initialWidth', r.width);
      (Cypress as any).env('initialHeight', r.height);
    });

    // Try to find a southeast/east resize handle on the selection overlay
    cy.get('body').find('#rx-selection-overlay .rx-handle.se, .rx-handle.se, #rx-selection-overlay .rx-handle.e, .rx-handle.e', { timeout: 8000 }).should('exist').then(($handles) => {
      const handleEl = $handles[0] as HTMLElement;
      const rect = handleEl.getBoundingClientRect();
      const startX = rect.left + rect.width / 2;
      const startY = rect.top + rect.height / 2;
      const deltaX = 40; // drag to the right
      const deltaY = 20; // drag downward slightly

      // Drag the handle
      cy.wrap($handles.eq(0))
        .trigger('mousedown', { clientX: startX, clientY: startY, which: 1, button: 0, buttons: 1, force: true })
        .wait(150);

      cy.get('body')
        .trigger('mousemove', { clientX: startX + deltaX, clientY: startY + deltaY, which: 1, button: 0, buttons: 1, force: true })
        .wait(150)
        .trigger('mouseup', { force: true });

      // Allow time for layout to settle
      cy.wait(500);

      // Verify size changed
      cy.get('@node').then(($n) => {
        const initialWidth = (Cypress as any).env('initialWidth') as number;
        const after = $n[0].getBoundingClientRect();
        const widthIncreased = after.width - initialWidth;
        capturedLogs.push(`[resize] initial width: ${initialWidth}, after: ${after.width}, delta: ${widthIncreased}`);
        expect(widthIncreased).to.be.greaterThan(5);
      });
    });

    // Persist artifacts
    cy.then(() => {
      const logFileName = `component-resize-${Cypress.spec.name}-${Date.now()}.log`;
      cy.task('writeArtifact', { filePath: `.logs/${logFileName}`, content: capturedLogs.join('\n') });
    });
  });
});

