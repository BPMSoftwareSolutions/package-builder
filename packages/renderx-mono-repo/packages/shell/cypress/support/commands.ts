// Cypress custom commands for app readiness

declare global {
  namespace Cypress {
    interface Chainable {
      waitForRenderXReady(opts?: {
        minPlugins?: number;
        minMounted?: number;
        minRoutes?: number;
        minTopics?: number;
        eventTimeoutMs?: number;
        requiredPluginIds?: string[];
      }): Chainable<unknown>;
    }
  }
}

Cypress.Commands.add('waitForRenderXReady', (opts: any = {}) => {
  const {
    minPlugins = 1,
    minMounted = 1,
    minRoutes = 1,
    minTopics = 1,
    eventTimeoutMs = 8000,
    requiredPluginIds = [],
  } = opts || {};

  // Wait for the app to be fully ready, including Library components
  cy.window({ log: false })
    .should((win: any) => {
      const ready = win.__rx?.ready;
      expect(ready, 'window.__rx.ready').to.exist;
      expect(ready.flag, 'ready.flag').to.eq(true); // This will be true only after Library components load
      expect(ready.libraryComponentsLoaded, 'library components loaded').to.eq(true);
      expect(ready.plugins, 'ready.plugins').to.be.gte(minPlugins);
      expect(ready.mountedCount, 'ready.mountedCount').to.be.gte(minMounted);
      expect(ready.routes, 'ready.routes').to.be.gte(minRoutes);
      expect(ready.topics, 'ready.topics').to.be.gte(minTopics);
      if (Array.isArray(requiredPluginIds) && requiredPluginIds.length) {
        const ids = Array.isArray(ready?.pluginIds) ? ready.pluginIds : [];
        requiredPluginIds.forEach((id: string) =>
          expect(ids, `plugin ${id} mounted`).to.include(id)
        );
      }
    })
    .then((win: any) => {
      // Slow path (rare): if beacon not set yet, listen once for the event
      if (!win.__rx?.ready?.flag) {
        return new Cypress.Promise<void>((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('renderx:ready timed out')), eventTimeoutMs);
          const handler = () => { clearTimeout(timer); resolve(); };
          win.addEventListener('renderx:ready', handler as any, { once: true } as any);
        });
      }
      return undefined;
    });
});

export {};
