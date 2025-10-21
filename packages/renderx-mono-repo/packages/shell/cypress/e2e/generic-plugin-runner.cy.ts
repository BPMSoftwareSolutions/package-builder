/// <reference types="cypress" />

// Minimal Cypress analog of the Playwright generic runner.
// It loads the harness page and drives window.TestHarness for each scenario in /test/manifest.json.

function toHarnessUrl(driverUrl: string, scenarioId: string, phases = '0,1,2', timeout = 6000) {
  return `/src/test-plugin-loading.html?driver=${encodeURIComponent(driverUrl)}&scenario=${encodeURIComponent(scenarioId)}&phases=${phases}&timeout=${timeout}`;
}

describe('Generic Plugin Runner (Cypress)', () => {
  it('runs scenarios from local /test/manifest.json via TestHarness', function () {
    cy.request({ url: '/test/manifest.json', failOnStatusCode: false }).then((res) => {
      const contentType = String(res.headers?.['content-type'] || '');
      const isJson = contentType.includes('application/json');
      if (res.status !== 200 || !isJson) {
        // Skip if manifest is missing or server returned SPA fallback (HTML)
        cy.log('No JSON manifest at /test/manifest.json; skipping spec');
        // mark this test as skipped
        (this as any).skip();
        return;
      }

      let manifest: any = res.body;
      if (typeof manifest === 'string') {
        try { manifest = JSON.parse(manifest); } catch {
          cy.log('Manifest response is not valid JSON; skipping');
          (this as any).skip();
          return;
        }
      }

      expect(manifest).to.have.property('testApiVersion');
      expect(manifest).to.have.property('driverUrl');
      expect(Array.isArray(manifest.scenarios)).to.be.true;

      const includeTags = String(Cypress.env('includeTags') || '').split(',').map((s: string) => s.trim()).filter(Boolean);
      const excludeTags = String(Cypress.env('excludeTags') || '').split(',').map((s: string) => s.trim()).filter(Boolean);
      const reqCaps = String(Cypress.env('requireCapabilities') || '').split(',').map((s: string) => s.trim()).filter(Boolean);
      const artDir = String(Cypress.env('artifactsDir') || 'cypress/artifacts');

      const scenarios: any[] = (manifest.scenarios || []).filter((s: any) => {
        const tags: string[] = Array.isArray(s.tags) ? s.tags : [];
        if (includeTags.length && !includeTags.some(t => tags.includes(t))) return false;
        if (excludeTags.some(t => tags.includes(t))) return false;
        return true;
      });

      cy.log(`Running ${scenarios.length} scenario(s) after tag filtering`);

      for (const scenario of scenarios) {
        const url = toHarnessUrl(manifest.driverUrl, scenario.id, '0,1,2', scenario?.readiness?.timeoutMs ?? 6000);
        cy.visit(url);

        // Version check (basic): ensure manifest.testApiVersion starts with required min major
        // Accept patterns like '1.0.0' against min '1.0.0' and max '1.x'
        const minApi = String(Cypress.env('minTestApiVersion') || '1.0.0');
        const maxApi = String(Cypress.env('maxTestApiVersion') || '1.x');
        const manifestVer = String(manifest.testApiVersion || '0.0.0');
        const okMin = manifestVer.split('.')[0] >= minApi.split('.')[0];
        const okMax = maxApi.endsWith('.x') ? manifestVer.split('.')[0] === maxApi.split('.')[0] : manifestVer <= maxApi;
        if (!(okMin && okMax)) {
          cy.log(`Skipping ${scenario.id}: incompatible testApiVersion ${manifestVer}`);
          continue;
        }

        // Capabilities check
        if (reqCaps.length) {
          cy.window().then((win) => (win as any).TestHarness.getCapabilities()).then((caps: string[]) => {
            const missing = reqCaps.filter(c => !caps.includes(c));
            if (missing.length) {
              cy.log(`Skipping ${scenario.id}: missing capabilities ${missing.join(', ')}`);
              // mark as skipped by short-circuiting this iteration
              return Cypress.Promise.resolve('skip');
            }
            return Cypress.Promise.resolve('ok');
          }).then((status) => {
            if (status === 'skip') return;

            // Steps
            cy.window().then((win) => {
              return (win as any).TestHarness.runSteps(scenario.steps || []);
            }).then((stepResults: any[]) => {
              (stepResults || []).forEach((r) => expect(r.status, `step for ${scenario.id}`).to.eq('ok'));
            });

            // Asserts
            cy.window().then((win) => {
              return (win as any).TestHarness.runAsserts(scenario.asserts || []);
            }).then((assertResults: any[]) => {
              (assertResults || []).forEach((r) => expect(r.status, `assert for ${scenario.id}`).to.eq('ok'));
            });

            // Optional snapshot artifact if capability present
            cy.window().then((win) => (win as any).TestHarness.getCapabilities()).then((caps: string[]) => {
              if (caps.includes('stateSnapshot')) {
                return cy.window().then((win) => (win as any).TestHarness.getSnapshot()).then((snapshot) => {
                  const fp = `${artDir}/snapshots/${scenario.id}.json`;
                  return cy.task('writeArtifact', { filePath: fp, content: snapshot });
                });
              }
              return undefined;
            });

            // Always capture logs as artifact
            cy.window().then((win) => (win as any).TestHarness.getLogs()).then((logs) => {
              const fp = `${artDir}/logs/${scenario.id}.json`;
              return cy.task('writeArtifact', { filePath: fp, content: logs });
            });
          });
        } else {
          // No required capabilities; proceed
          cy.window().then((win) => {
            return (win as any).TestHarness.runSteps(scenario.steps || []);
          }).then((stepResults: any[]) => {
            (stepResults || []).forEach((r) => expect(r.status, `step for ${scenario.id}`).to.eq('ok'));
          });

          cy.window().then((win) => {
            return (win as any).TestHarness.runAsserts(scenario.asserts || []);
          }).then((assertResults: any[]) => {
            (assertResults || []).forEach((r) => expect(r.status, `assert for ${scenario.id}`).to.eq('ok'));
          });

          // Snapshot if available
          cy.window().then((win) => (win as any).TestHarness.getCapabilities()).then((caps: string[]) => {
            if (caps.includes('stateSnapshot')) {
              return cy.window().then((win) => (win as any).TestHarness.getSnapshot()).then((snapshot) => {
                const fp = `${artDir}/snapshots/${scenario.id}.json`;
                return cy.task('writeArtifact', { filePath: fp, content: snapshot });
              });
            }
            return undefined;
          });

          cy.window().then((win) => (win as any).TestHarness.getLogs()).then((logs) => {
            const fp = `${artDir}/logs/${scenario.id}.json`;
            return cy.task('writeArtifact', { filePath: fp, content: logs });
          });
        }
      }
    });
  });
});
