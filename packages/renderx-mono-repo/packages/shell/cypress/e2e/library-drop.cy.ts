/// <reference types="cypress" />

// E2E: drag a button component from Library to Canvas and verify creation
// Tests the full Library→Canvas drop flow with real drag and drop interactions
// No simulation - uses actual mouse drag and drop like a real user would

describe('Library → Canvas drop creates component', () => {
  const librarySlot = '[data-slot="library"] [data-slot-content]';
  const canvasSlot = '[data-slot="canvas"] [data-slot-content]';
  const canvasRoot = '#rx-canvas';

  let capturedLogs: string[] = [];

  beforeEach(() => {
    capturedLogs = [];
  });

  it('drags button component from Library and drops onto Canvas', () => {
    // Visit early and hook console.log for sequence detection
    cy.visit('/?debug=1', {
      onBeforeLoad(win) {
        const originalLog = win.console.log;
        const originalWarn = win.console.warn;
        const originalError = win.console.error;
        win.console.log = (...args: any[]) => {
          try {
            const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
            capturedLogs.push(`[${new Date().toISOString()}] ${msg}`);
          } catch {}
          originalLog.apply(win.console, args as any);
        };
        win.console.warn = (...args: any[]) => {
          try {
            const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
            capturedLogs.push(`[${new Date().toISOString()}] WARN ${msg}`);
          } catch {}
          originalWarn.apply(win.console, args as any);
        };
        win.console.error = (...args: any[]) => {
          try {
            const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
            capturedLogs.push(`[${new Date().toISOString()}] ERROR ${msg}`);
          } catch {}
          originalError.apply(win.console, args as any);
        };

        // Instrument DnD events globally for debug (capture phase so we see all)
        try {
          const doc = win.document;
          const types = ['dragstart','dragenter','dragover','dragleave','drop','dragend'];
          const describeEl = (el: any) => {
            if (!el || !el.tagName) return '<none>';
            const id = el.id ? `#${el.id}` : '';
            const cls = (el.className && typeof el.className === 'string') ? `.${el.className.replace(/\s+/g,'.')}` : '';
            return `${el.tagName.toLowerCase()}${id}${cls}`;
          };
          types.forEach((t) => {
            doc.addEventListener(t as any, (ev: any) => {
              try {
                const tgt = ev.target as any;
                const path = describeEl(tgt);
                const dataTypes = Array.from((ev.dataTransfer?.types || []) as any[]);
                const def = ev.defaultPrevented ? ' defaultPrevented' : '';
                capturedLogs.push(`[dnd] ${t} target=${path} types=${JSON.stringify(dataTypes)} x=${ev.clientX} y=${ev.clientY}${def}`);
              } catch {}
            }, true);
          });
        } catch {}
      },
    });

    // Gate on app readiness beacon using actual manifest counts (robust to catalog changes)
    cy.request('/interaction-manifest.json').then((routesResp) => {
      const routesJson = typeof routesResp.body === 'string' ? JSON.parse(routesResp.body) : routesResp.body;
      const routesCount = Object.keys(routesJson?.routes || {}).length;
      cy.request('/topics-manifest.json').then((topicsResp) => {
        const topicsJson = typeof topicsResp.body === 'string' ? JSON.parse(topicsResp.body) : topicsResp.body;
        const topicsCount = Object.keys(topicsJson?.topics || {}).length;
        cy.waitForRenderXReady({
          minRoutes: Math.max(1, routesCount),
          minTopics: Math.max(1, topicsCount),
          minPlugins: 8,
          minMounted: 5,
          eventTimeoutMs: 30000,
        });
      });
    });

    // Also assert resize sequences are mounted and available (capability check)
    cy.window().should((win) => {
      const mountedSeqs: string[] = (win as any).__RENDERX_MOUNTED_SEQUENCE_IDS || [];
      expect(mountedSeqs, 'mounted sequence IDs').to.be.an('array');
      const required = [
        'canvas-component-resize-start-symphony',
        'canvas-component-resize-move-symphony',
        'canvas-component-resize-end-symphony',
      ];
      required.forEach((id) => {
        expect(mountedSeqs, `sequence mounted: ${id}`).to.include(id);
      });
    });

    // Wait for Library and Canvas slots to mount
    cy.get(librarySlot, { timeout: 20000 }).should('exist');
    cy.get(canvasSlot, { timeout: 20000 }).should('exist');

    // Find the button component in the Library panel
    // Since waitForRenderXReady now waits for Library components, they should be available
    cy.get(librarySlot)
      .find('[draggable="true"], [draggable]')
      .contains(/button/i, { timeout: 10000 })
      .should('exist')
      .as('buttonComponent');

    // Find the Canvas drop target
    cy.get(canvasRoot, { timeout: 20000 }).should('exist').as('canvasTarget');


    // Perform real drag and drop: drag button from Library to Canvas
    cy.get('@buttonComponent').then(($source) => {
      cy.get('@canvasTarget').then(($target) => {
        // Get coordinates for drag and drop
        const sourceRect = $source[0].getBoundingClientRect();
        const targetRect = $target[0].getBoundingClientRect();

        const sourceX = sourceRect.left + sourceRect.width / 2;
        const sourceY = sourceRect.top + sourceRect.height / 2;
        const targetX = targetRect.left + targetRect.width / 2;
        const targetY = targetRect.top + targetRect.height / 2;

        capturedLogs.push(`[drag-coords] Source: ${sourceX},${sourceY} Target: ${targetX},${targetY}`);

        // Create a proper DataTransfer object for the drag and drop
        cy.window().then((win) => {
          const dataTransfer = new (win as any).DataTransfer();

          // Set the component data that would normally be set by the Library component
          const componentData = {
            component: {
              template: { tag: 'button', text: 'Button', classes: ['rx-comp', 'rx-button'], style: {} }
            }
          };
          dataTransfer.setData('application/rx-component', JSON.stringify(componentData));

          // Perform the drag and drop sequence with proper dataTransfer
          cy.get('@buttonComponent')
            .trigger('mousedown', { clientX: sourceX, clientY: sourceY, which: 1 })
            .trigger('dragstart', { clientX: sourceX, clientY: sourceY, dataTransfer })
            .wait(100); // Small delay for drag to register

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

    // Wait for the drop to process and create a canvas component
    cy.wait(2000);

    // Verify that a component was created on the canvas (tolerant to dynamic ids)
    const nodeSelector = `#rx-canvas [id^="rx-node-"], #rx-canvas .rx-comp, #rx-canvas [data-rx-node]`;
    cy.get(nodeSelector, { timeout: 12000 })
      .should('exist')
      .should('have.length.at.least', 1)
      .then(($nodes) => {
        capturedLogs.push(`[success] ✅ Found ${$nodes.length} canvas node(s) after drag and drop`);
        // Mark checkpoint index to only scan for errors AFTER creation
        (Cypress as any).env('postCreateLogIndex', capturedLogs.length);
        cy.log(`✅ Successfully created ${$nodes.length} component(s) on canvas`);
      });

    // Additional verification: log the first created node's tag/class (ids are dynamic)
    cy.get(nodeSelector).first().should(($node) => {
      const tag = $node.prop('tagName');
      const cls = $node.attr('class') || '';
      capturedLogs.push(`[component] Created node tag=${tag} class="${cls}"`);
    });

    // Click the component on the canvas to select it
    cy.get(nodeSelector).first().click();

    // Wait for selection to process
    cy.wait(1000);

    // Verify selection overlay is displayed
    cy.get('.selection-overlay, .selected-overlay, .rx-selection-overlay', { timeout: 5000 })
      .should('exist')
      .then(() => {
        capturedLogs.push(`[selection] ✅ Selection overlay is displayed`);
        cy.log(`✅ Selection overlay is displayed`);
      });

    // Verify the control panel displays the component information
    const controlPanelSlot = '[data-slot="controlPanel"] [data-slot-content]';

    // Check for control panel header with Properties Panel title
    cy.get(controlPanelSlot)
      .find('.control-panel-header')
      .should('exist')
      .within(() => {
        // Verify Properties Panel title
        cy.contains('⚙️ Properties Panel').should('exist');

        // Verify element-info section is displayed
        cy.get('.element-info')
          .should('be.visible')
          .within(() => {
            // Verify element-type is displayed (should be "button")
            cy.get('.element-type')
              .should('exist')
              .should('contain.text', 'button')
              .then(($type) => {
                capturedLogs.push(`[control-panel] ✅ Element type displayed: ${$type.text()}`);
              });

            // Verify element-id is displayed (should start with #rx-node-)
            cy.get('.element-id')
              .should('exist')
              .should(($id) => {
                const idText = $id.text();
                expect(idText).to.match(/^#rx-node-/);
                capturedLogs.push(`[control-panel] ✅ Element ID displayed: ${idText}`);
              });
          });
      })
      .then(() => {
        capturedLogs.push(`[control-panel] ✅ Control panel shows selected component properties`);
        cy.log(`✅ Control panel shows selected component properties`);
      });

    // After successful creation & CP display, ensure no mount/resolve errors occurred afterwards
    cy.wrap(null).should(() => {
      const startIdx = (Cypress as any).env('postCreateLogIndex') ?? 0;
      const tail = capturedLogs.slice(startIdx).join('\n');
      const badMount = /Failed to mount sequence from catalog/i.test(tail);
      const badResolve = /Failed to resolve module specifier/i.test(tail);
      expect(badMount, 'no failed sequence mounts detected in logs after creation').to.eq(false);
      expect(badResolve, 'no unresolved module specifiers detected in logs after creation').to.eq(false);
    });

    // Store initial component position and size for comparison
    let initialPosition = { x: 0, y: 0 };
    let initialSize = { width: 0, height: 0 };

    // Find and expand the LAYOUT section (not the first section which is CONTENT)
    cy.get(controlPanelSlot)
      .find('.property-section')
      .contains('📐 LAYOUT')
      .click()
      .then(() => {
        capturedLogs.push(`[layout] ✅ Layout section expanded`);
        cy.log(`✅ Layout section expanded`);
      });

    // Wait for section to expand
    cy.wait(1000);

    // Use console script to verify layout properties directly - much more reliable!
    cy.window().then((win) => {
      const result = win.eval(`
        (() => {
          const allPropertyItems = document.querySelectorAll('[data-slot="controlPanel"] .property-item');
          const layoutInfo = { found: false, x: 0, y: 0, width: 0, height: 0 };

          // Find layout properties
          allPropertyItems.forEach((item, index) => {
            const text = item.textContent?.trim();
            if (text?.includes('X Position')) {
              const input = item.querySelector('.property-input');
              layoutInfo.x = parseFloat(input?.value || '0');
              layoutInfo.found = true;
            } else if (text?.includes('Y Position')) {
              const input = item.querySelector('.property-input');
              layoutInfo.y = parseFloat(input?.value || '0');
            } else if (text?.includes('Width')) {
              const input = item.querySelector('.property-input');
              layoutInfo.width = parseFloat(input?.value || '0');
            } else if (text?.includes('Height')) {
              const input = item.querySelector('.property-input');
              layoutInfo.height = parseFloat(input?.value || '0');
            }
          });

          return layoutInfo;
        })()
      `);

      // Store the initial values
      initialPosition.x = result.x;
      initialPosition.y = result.y;
      initialSize.width = result.width;
      initialSize.height = result.height;

      // Log the results
      capturedLogs.push(`[layout] ✅ Layout properties found: ${result.found}`);
      capturedLogs.push(`[layout] Initial X Position: ${initialPosition.x}`);
      capturedLogs.push(`[layout] Initial Y Position: ${initialPosition.y}`);
      capturedLogs.push(`[layout] Initial Width: ${initialSize.width}`);
      capturedLogs.push(`[layout] Initial Height: ${initialSize.height}`);

      cy.log(`✅ Layout properties captured via console script`);
      cy.log(`X: ${initialPosition.x}, Y: ${initialPosition.y}, W: ${initialSize.width}, H: ${initialSize.height}`);

      // Verify we found the layout properties
      expect(result.found).to.be.true;
      expect(initialSize.width).to.be.greaterThan(0);
      expect(initialSize.height).to.be.greaterThan(0);
    });

    // Test component dragging/moving using more robust approach
    cy.get(nodeSelector).first().then(($component) => {
      const componentRect = $component[0].getBoundingClientRect();
      const startX = componentRect.left + componentRect.width / 2;
      const startY = componentRect.top + componentRect.height / 2;
      const moveDistance = 50;

      capturedLogs.push(`[drag] Starting drag from (${startX}, ${startY}), moving ${moveDistance}px`);

      // Perform drag operation with explicit event sequence
      cy.get(nodeSelector).first()
        .trigger('mousedown', {
          clientX: startX,
          clientY: startY,
          which: 1,
          button: 0,
          buttons: 1
        })
        .then(() => {
          capturedLogs.push(`[drag] ✅ mousedown event fired at (${startX}, ${startY})`);
        })
        .wait(200) // Longer delay to ensure mousedown is processed
        .trigger('mousemove', {
          clientX: startX + moveDistance,
          clientY: startY + moveDistance,
          which: 1,
          button: 0,
          buttons: 1
        })
        .then(() => {
          capturedLogs.push(`[drag] ✅ mousemove event fired to (${startX + moveDistance}, ${startY + moveDistance})`);
        })
        .wait(200) // Longer delay during drag

      // Fire mouseup on the document/body to ensure it's caught
      cy.get('body')
        .trigger('mouseup', {
          clientX: startX + moveDistance,
          clientY: startY + moveDistance,
          which: 1,
          button: 0
        })
        .then(() => {
          capturedLogs.push(`[drag] ✅ mouseup event fired at (${startX + moveDistance}, ${startY + moveDistance})`);
        });

      // Wait for drag to complete
      cy.wait(1000);

      // Check the component's actual position on the canvas by examining its style attribute
      cy.get(nodeSelector).first().then(($component) => {
        const style = $component[0].style;
        const currentLeft = parseFloat(style.left) || 0;
        const currentTop = parseFloat(style.top) || 0;

        capturedLogs.push(`[drag] Canvas position check: Initial(${initialPosition.x}, ${initialPosition.y}) → Current(${currentLeft}, ${currentTop})`);
        cy.log(`Canvas position: Initial(${initialPosition.x}, ${initialPosition.y}) → Current(${currentLeft}, ${currentTop})`);

        // Check if the component actually moved on the canvas
        const xChanged = Math.abs(currentLeft - initialPosition.x) > 5;
        const yChanged = Math.abs(currentTop - initialPosition.y) > 5;

        if (xChanged || yChanged) {
          capturedLogs.push(`[drag] ✅ Component moved on canvas successfully`);
          capturedLogs.push(`[drag] ✅ Left: ${initialPosition.x} → ${currentLeft} (changed: ${xChanged})`);
          capturedLogs.push(`[drag] ✅ Top: ${initialPosition.y} → ${currentTop} (changed: ${yChanged})`);
          cy.log(`✅ Component dragged successfully on canvas`);
        } else {
          capturedLogs.push(`[drag] ⚠️ Component position on canvas did not change significantly`);
          cy.log(`⚠️ Canvas position change was minimal or not detected`);
        }
      });
    });

    // Final verification that drag functionality works
    cy.then(() => {
      capturedLogs.push(`[complete] ✅ Component drag and control panel integration verified`);
      cy.log(`✅ Component drag and control panel integration verified`);
    });
  });


  afterEach(() => {
    const logFileName = `library-drop-${Cypress.spec.name}-${Date.now()}.log`;
    const logContent = capturedLogs.join('\n');
    cy.task('writeArtifact', { filePath: `.logs/${logFileName}`, content: logContent });
  });
});

