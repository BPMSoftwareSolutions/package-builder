/// <reference types="cypress" />

// E2E startup log smoke test
// Ensures every plugin listed in /plugins/plugin-manifest.json is observed as loaded in console logs
// Captures browser console logs during app startup and verifies plugin loading evidence:
//  - "🔌 Registered plugin runtime: <id>"
//  - "📚 Loading catalog directory ... for plugin <id>"
//  - "✅ Mounted sequence from catalog: ... plugin: <id>"
// This test runs first (00-prefix) to ensure clean startup state verification

describe('Startup: all manifest plugins load successfully (log-based)', () => {
  let capturedLogs: string[] = [];

  beforeEach(() => {
    capturedLogs = [];
  });

  function pluginLoadedInLogs(id: string): boolean {
    // Check if plugin loading is evidenced in the captured console logs
    const haystack = capturedLogs.join('\n');

    // Look for registration evidence
    if (haystack.includes(`🔌 Registered plugin runtime: ${id}`)) return true;

    // Look for catalog loading evidence
    if (haystack.includes(`📚 Loading catalog directory`) && haystack.includes(`for plugin ${id}`)) return true;

    // Look for sequence mounting evidence
    if (haystack.includes(`✅ Mounted sequence from catalog:`) && haystack.includes(`plugin: ${id}`)) return true;

    return false;
  }

  it('verifies all manifest plugin IDs are present in startup logs', () => {
    // Start app and begin capturing console logs before any app code runs
    cy.visit('/', {
      onBeforeLoad(win) {
        // Capture all console methods (log, warn, error, info, debug)
        const originalMethods = {
          log: win.console.log,
          warn: win.console.warn,
          error: win.console.error,
          info: win.console.info,
          debug: win.console.debug,
        };

        const captureConsole = (method: string, originalFn: Function) => (...args: any[]) => {
          try {
            const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
            capturedLogs.push(`[${method.toUpperCase()}] ${msg}`);
          } catch (e) {
            originalMethods.log('[CAPTURE ERROR]', e);
          }
          try { originalFn.apply(win.console, args as any); } catch {}
        };

        // Override all console methods
        win.console.log = captureConsole('log', originalMethods.log);
        win.console.warn = captureConsole('warn', originalMethods.warn);
        win.console.error = captureConsole('error', originalMethods.error);
        win.console.info = captureConsole('info', originalMethods.info);
        win.console.debug = captureConsole('debug', originalMethods.debug);

        // Test the capture mechanism immediately
        win.console.log('🧪 TEST: Console capture is working');
      },
    });

    // Fetch the plugin manifest to know expected plugin ids
    cy.request('/plugins/plugin-manifest.json').then((resp) => {
      expect(resp.status).to.eq(200);
      const json = typeof resp.body === 'string' ? JSON.parse(resp.body) : resp.body;
      const ids: string[] = Array.isArray(json?.plugins) ? json.plugins.map((p: any) => p?.id).filter((s: any) => typeof s === 'string' && s.length) : [];
      expect(ids.length, 'manifest plugin count').to.be.greaterThan(0);

      // Gate on readiness beacon (counts only; pluginIds represent mounted runtimes, not UI-only)
      cy.waitForRenderXReady({
        minPlugins: Math.max(1, ids.length),
        minMounted: 1,
        minRoutes: 1,
        minTopics: 1,
        eventTimeoutMs: 30000,
      });

      // Negative checks: ensure no mount/resolve errors occurred during startup
      cy.wrap(null).should(() => {
        const haystack = capturedLogs.join('\n');
        const badMount = /Failed to mount sequence from catalog/i.test(haystack);
        const badResolve = /Failed to resolve module specifier/i.test(haystack);
        expect(badMount, 'no failed sequence mounts detected in startup logs').to.eq(false);
        expect(badResolve, 'no unresolved module specifiers detected in startup logs').to.eq(false);
      });


      // Now assert that console logs show evidence of each plugin being loaded
      cy.wrap(null).should(() => {
        const missing: string[] = [];
        for (const id of ids) {
          if (!pluginLoadedInLogs(id)) missing.push(id);
        }

        if (missing.length) {
          // Debug info for troubleshooting
          console.log('Missing plugins:', missing);
          console.log('Expected plugin IDs:', ids);
          console.log('Total captured logs:', capturedLogs.length);
          console.log('Sample logs:', capturedLogs.slice(0, 10));
        }

        expect(missing, `Plugins missing from startup logs: ${missing.join(', ')}`).to.have.length(0);
      });

      // Debug: Log capture stats before writing artifacts
      cy.log(`Captured ${capturedLogs.length} log entries`);
      if (capturedLogs.length > 0) {
        cy.log(`First log: ${capturedLogs[0]}`);
        cy.log(`Last log: ${capturedLogs[capturedLogs.length - 1]}`);
      }

      // Persist artifacts for CI triage (and follow repo convention of using /.logs)
      const artifactBase = `.logs/startup-plugins-${Date.now()}`;
      const text = capturedLogs.join('\n');
      cy.task('writeArtifact', { filePath: `${artifactBase}.log`, content: text });
      cy.task('writeArtifact', { filePath: `${artifactBase}.txt`, content: text });
      cy.task('writeArtifact', { filePath: `${artifactBase}.json`, content: { logs: capturedLogs, manifestIds: ids, captureCount: capturedLogs.length } });
    });
  });
});

