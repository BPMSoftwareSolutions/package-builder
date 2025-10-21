# Troubleshooting Guide

## E2E Testing Issues

### Tests Timeout

**Symptom**: Cypress tests timeout waiting for readiness

**Solutions**:
1. Increase `eventTimeoutMs` in test configuration
2. Check browser console for errors: `cy.log()`
3. Verify plugins are loading: Check `.logs/startup-plugins-*.json`
4. Increase server startup time in CI workflow

```typescript
cy.waitForRenderXReady({
  eventTimeoutMs: 60000  // Increase from default 8000
});
```

### Plugin Not Found

**Symptom**: "Plugin not found" or "Cannot resolve module"

**Solutions**:
1. Verify plugin manifest: `GET /plugins/plugin-manifest.json`
2. Check plugin registration in conductor
3. Review startup logs: `.logs/startup-plugins-*.json`
4. Verify import paths use `@renderx/*` not `@renderx-plugins/*`

### Test Harness Not Available

**Symptom**: `window.TestHarness is undefined`

**Solutions**:
1. Verify `src/test-harness/harness.ts` is loaded
2. Check browser console for script errors
3. Ensure test page loads: `src/test-plugin-loading.html`
4. Verify postMessage protocol is working

### Cypress Server Connection Failed

**Symptom**: "Failed to connect to server"

**Solutions**:
1. Verify dev server is running: `pnpm run dev`
2. Check server port (default 5173 dev, 4173 CI)
3. Check firewall/network settings
4. Review server logs for startup errors

## CI/CD Pipeline Issues

### Lint Failures

**Symptom**: ESLint errors in CI

**Solutions**:
1. Run locally: `pnpm run lint`
2. Fix issues or run: `pnpm run lint --fix`
3. Review ESLint configuration: `eslint.config.js`
4. Check for boundary rule violations

### Type Errors

**Symptom**: TypeScript compilation errors

**Solutions**:
1. Run locally: `pnpm run typecheck`
2. Fix type issues
3. Review `tsconfig.json` settings
4. Check for missing type definitions

### Unit Test Failures

**Symptom**: Vitest failures in CI

**Solutions**:
1. Run locally: `pnpm run test`
2. Run in watch mode: `pnpm run test:watch`
3. Check test output for specific failures
4. Review test files for issues

### Build Failures

**Symptom**: Build fails in CI

**Solutions**:
1. Run locally: `pnpm run build`
2. Check for missing dependencies
3. Review build output for errors
4. Check `package.json` build scripts

### Precheck Failures

**Symptom**: CI precheck fails

**Solutions**:
1. Run locally: `node scripts/ci-precheck.js`
2. Verify plugin packages are installed
3. Check `node_modules/@renderx/` directory
4. Verify manifest files exist

### Coverage Threshold Not Met

**Symptom**: Coverage below 70% threshold

**Solutions**:
1. Run coverage locally: `pnpm run test -- --coverage`
2. Review coverage report: `coverage/index.html`
3. Add tests for uncovered code
4. Update coverage thresholds if needed

## Dependency Issues

### pnpm Lock File Out of Sync

**Symptom**: "pnpm-lock.yaml is out of sync"

**Solutions**:
1. Run: `pnpm install`
2. Commit updated `pnpm-lock.yaml`
3. Clear pnpm cache: `pnpm store prune`

### Missing Dependencies

**Symptom**: "Cannot find module" errors

**Solutions**:
1. Run: `pnpm install`
2. Check `package.json` for missing dependencies
3. Verify peer dependencies are installed
4. Clear node_modules: `rm -rf node_modules && pnpm install`

### Version Conflicts

**Symptom**: "Conflicting peer dependency" warnings

**Solutions**:
1. Review `package.json` versions
2. Update conflicting packages
3. Run: `pnpm install`
4. Check for breaking changes in dependencies

## Performance Issues

### Slow Test Execution

**Symptom**: Tests take too long to run

**Solutions**:
1. Run tests in parallel: `pnpm run test -- --reporter=verbose`
2. Profile tests: `pnpm run test -- --reporter=verbose --reporter=json`
3. Optimize test setup/teardown
4. Consider splitting large test files

### High Memory Usage

**Symptom**: Out of memory errors during tests

**Solutions**:
1. Increase Node memory: `NODE_OPTIONS=--max-old-space-size=4096 pnpm run test`
2. Run tests sequentially: `pnpm run test -- --threads=1`
3. Clear coverage data: `rm -rf coverage/`
4. Check for memory leaks in tests

## Debugging

### Enable Verbose Logging

```bash
# Cypress
DEBUG=cypress:* pnpm run test:e2e

# Vitest
pnpm run test -- --reporter=verbose

# CI Precheck
node scripts/ci-precheck.js 2>&1 | tee precheck.log
```

### Inspect Test Artifacts

```bash
# View startup logs
cat .logs/startup-plugins-*.json | jq .

# View Cypress artifacts
ls -la cypress/artifacts/

# View coverage report
open coverage/index.html
```

### Local CI Simulation

```bash
# Run CI pipeline locally
act -j lint_unit
act -j e2e_cypress
act -j precheck
```

## Getting Help

### Resources

- [Cypress Documentation](https://docs.cypress.io/)
- [Vitest Documentation](https://vitest.dev/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [RenderX Architecture Documentation](./ARCHITECTURE.md)

### Reporting Issues

1. Collect logs and artifacts
2. Create GitHub issue with:
   - Error message
   - Steps to reproduce
   - Environment (Node version, OS)
   - Relevant logs/artifacts
3. Tag with appropriate labels

### Contact

- Team: @BPMSoftwareSolutions
- Slack: #renderx-development

