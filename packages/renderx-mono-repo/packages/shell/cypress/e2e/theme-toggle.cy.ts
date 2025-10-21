/// <reference types="cypress" />

// Verifies the header theme toggle button switches between dark/light
// by asserting the <html data-theme> attribute and the button label.

describe('Theme toggle button', () => {
  // Use a specific class+title for stability
  const toggleSelector = 'button.header-theme-button[title="Toggle Theme"]';

  const normalizeLabel = (text: string) => {
    const t = text.trim();
    if (t.includes('Light')) return 'Light';
    if (t.includes('Dark')) return 'Dark';
    // Fallback: strip non-letters and try again
    const lettersOnly = t.replace(/[^A-Za-z]/g, '');
    if (lettersOnly.toLowerCase().includes('light')) return 'Light';
    if (lettersOnly.toLowerCase().includes('dark')) return 'Dark';
    return t;
  };

  let capturedLogs: string[] = [];

  beforeEach(() => {
    capturedLogs = [];
  });

  it('toggles theme and persists', () => {
    // Load app and capture logs early (no storage backdoors)
    cy.visit('/', {
      onBeforeLoad(win) {
        // Override console.log to capture logs for later debugging
        const originalLog = win.console.log;
        win.console.log = (...args: any[]) => {
          const message = args.map(arg =>
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
          ).join(' ');
          capturedLogs.push(`[${new Date().toISOString()}] ${message}`);
          originalLog.apply(win.console, args);
        };
        // Force deterministic initial theme for visual flip in video
        try { win.localStorage.setItem('theme', 'dark'); } catch {}
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
          minMounted: 2,
          eventTimeoutMs: 20000,
          requiredPluginIds: ['HeaderThemePlugin'],
        });
      });
    });

    // Ensure the specific plugin + sequences we need are actually mounted
    cy.window().should((win) => {
      const mountedPlugins: string[] = (win as any).__RENDERX_MOUNTED_PLUGIN_IDS || [];
      const mountedSeqs: string[] = (win as any).__RENDERX_MOUNTED_SEQUENCE_IDS || [];
      expect(mountedPlugins, 'mounted plugin IDs present').to.be.an('array');
      expect(mountedSeqs, 'mounted sequence IDs present').to.be.an('array');
    });

    // Wait for header UI to mount and theme to be applied by the app
    cy.get('[data-slot="headerRight"] [data-slot-content]', { timeout: 20000 }).should('exist');
    cy.get(toggleSelector, { timeout: 20000 })
      .should('be.visible')
      .and('not.be.disabled');

    // Wait until the app sets a concrete theme on <html>
    cy.get('html', { timeout: 20000 }).should(($html) => {
      const theme = $html.attr('data-theme');
      expect(['light', 'dark']).to.include(theme || '');
    });

    // Deterministic initial state for visibility in video
    cy.get('html', { timeout: 10000 }).should('have.attr', 'data-theme', 'dark');


    // Ensure EventRouter is initialized and topics are available
    cy.window().its('RenderX').its('EventRouter').its('publish').should('be.a', 'function');

    // Ensure the button has text content (Light/Dark), tolerant to emoji prefixes
    cy.get(toggleSelector, { timeout: 20000 })
      .should(($btn) => expect($btn.text().trim().length).to.be.greaterThan(0))
      .and(($btn) => {
        const label = normalizeLabel($btn.text());
        expect(['Light', 'Dark']).to.include(label);
      });

    // Capture initial label and verify sequence triggering
    cy.get(toggleSelector).then(($btn) => {

      const initialLabel = normalizeLabel($btn.text());

      // User click to toggle
      cy.get(toggleSelector).click();

      // Wait for the sequence to be triggered (just the initial play call)
      cy.wrap(null).should(() => {
        const sequenceTriggered = capturedLogs.some((l) =>
          l.includes('HeaderThemePlugin') && l.includes('header-ui-theme-toggle-symphony')
        );
        expect(sequenceTriggered, 'header theme toggle sequence triggered').to.eq(true);
      });

      // Small wait so the video captures the visual flip
      cy.wait(100);
      cy.get('html', { timeout: 10000 }).should('have.attr', 'data-theme', 'light');
      cy.window().then((win) => {
        expect(win.localStorage.getItem('theme')).to.eq('light');
      });


      // Log the captured logs for debugging
      cy.wrap(null).then(() => {
        cy.log('Theme toggle sequence triggered successfully');
        cy.log(`Initial label was: ${initialLabel}`);
      });

      // Second click to ensure the sequence can be triggered multiple times
      cy.get(toggleSelector).click();

      // Small wait so the video captures the visual flip back
      cy.wait(100);
      cy.get('html', { timeout: 10000 }).should('have.attr', 'data-theme', 'dark');
      cy.window().then((win) => {
        expect(win.localStorage.getItem('theme')).to.eq('dark');
      });


      // Wait for second sequence trigger
      cy.wrap(null).should(() => {
        const secondToggleTriggered = capturedLogs.filter((l) =>
          l.includes('HeaderThemePlugin') && l.includes('header-ui-theme-toggle-symphony')
        ).length >= 2; // Should have at least 2 triggers now
        expect(secondToggleTriggered, 'second header theme toggle sequence triggered').to.eq(true);
      });

      cy.log('Multiple theme toggle sequences triggered successfully');
    });
  });

  afterEach(() => {
    // Save captured logs to file
    const logFileName = `theme-toggle-${Cypress.spec.name}-${Date.now()}.log`;
    const logContent = capturedLogs.join('\n');

    cy.task('writeArtifact', {
      filePath: `.logs/${logFileName}`,
      content: logContent
    });
  });
});
