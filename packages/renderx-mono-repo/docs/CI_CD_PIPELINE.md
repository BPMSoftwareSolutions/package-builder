# CI/CD Pipeline Documentation

## Overview

The RenderX Mono-Repo uses GitHub Actions for continuous integration and deployment. The pipeline ensures code quality, test coverage, and production readiness.

## Pipeline Architecture

### Workflow Files

- `.github/workflows/ci.yml`: Main CI/CD pipeline (Phase 6)
- `.github/workflows/validate-workspace.yml`: Workspace validation (Phase 5)

## CI/CD Pipeline (ci.yml)

### Jobs

#### 1. Lint & Unit Tests (`lint_unit`)

**Purpose**: Verify code quality and unit test coverage

**Runs on**: Ubuntu Latest (multi-version Node: 18.x, 20.x)

**Steps**:
1. Checkout code
2. Setup Node.js and pnpm
3. Install dependencies
4. Run ESLint
5. Run TypeScript type checking
6. Run unit tests (vitest)
7. Build project
8. Upload coverage to Codecov

**Artifacts**:
- Coverage reports (LCOV format)

**Failure Criteria**:
- Lint errors
- Type errors
- Test failures
- Build failures

#### 2. E2E Tests (`e2e_cypress`)

**Purpose**: Verify end-to-end functionality

**Runs on**: Ubuntu Latest (Node 20.x)

**Depends on**: `lint_unit` (must pass)

**Steps**:
1. Checkout code
2. Setup Node.js and pnpm
3. Install dependencies
4. Build for E2E
5. Start dev server
6. Wait for server readiness
7. Run Cypress E2E tests
8. Upload artifacts on failure

**Artifacts**:
- Cypress test videos (on failure)
- Cypress artifacts (on failure)

**Failure Criteria**:
- E2E test failures
- Server startup failures
- Timeout errors

#### 3. CI Precheck (`precheck`)

**Purpose**: Verify plugin availability and manifest presence

**Runs on**: Ubuntu Latest (Node 20.x)

**Depends on**: `lint_unit` (must pass)

**Steps**:
1. Checkout code
2. Setup Node.js and pnpm
3. Install dependencies
4. Run CI precheck script
5. Validate ADF (Architecture Definition File)

**Failure Criteria**:
- Missing critical packages
- Import failures
- Missing manifests
- Invalid ADF

#### 4. Quality Gates (`quality_gates`)

**Purpose**: Ensure all quality checks pass

**Runs on**: Ubuntu Latest

**Depends on**: All previous jobs

**Steps**:
1. Check all job statuses
2. Fail if any job failed

**Failure Criteria**:
- Any upstream job failure

## Triggering the Pipeline

### Automatic Triggers

The pipeline runs automatically on:

```yaml
on:
  push:
    branches: [main, develop]
    paths:
      - 'packages/renderx-mono-repo/**'
      - '.github/workflows/ci.yml'
  pull_request:
    branches: [main, develop]
    paths:
      - 'packages/renderx-mono-repo/**'
```

### Manual Triggers

To manually trigger the pipeline:

1. Go to GitHub Actions
2. Select "RenderX Mono-Repo CI/CD Pipeline"
3. Click "Run workflow"
4. Select branch and click "Run workflow"

## Environment Variables

### CI Environment

```bash
CI=true  # Enables CI mode in build tools
```

### Cypress Configuration

```bash
CYPRESS_BASE_URL=http://localhost:4173  # Production build server
```

## Artifacts

### Generated Artifacts

- **Coverage Reports**: `coverage/coverage-final.json`
- **Cypress Videos**: `cypress/videos/` (on failure)
- **Cypress Artifacts**: `cypress/artifacts/` (on failure)
- **Startup Logs**: `.logs/startup-plugins-*.json` (on failure)

### Retention Policies

- Cypress artifacts: 7 days
- Cypress videos: 7 days
- Coverage reports: Uploaded to Codecov

## Caching Strategy

### pnpm Cache

```yaml
key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
```

Cache is invalidated when `pnpm-lock.yaml` changes.

## Performance Optimization

### Multi-Version Testing

Tests run on Node 18.x and 20.x to ensure compatibility.

### Parallel Jobs

- `lint_unit` and `precheck` run in parallel
- `e2e_cypress` waits for `lint_unit`
- `quality_gates` waits for all jobs

### Caching

- pnpm store is cached to speed up dependency installation
- Cache is shared across jobs

## Troubleshooting

### Pipeline Failures

1. **Check job logs**: Click on failed job to see detailed logs
2. **Review artifacts**: Download artifacts to inspect test results
3. **Check recent changes**: Review recent commits for breaking changes

### Common Issues

#### Lint Failures
- Run `pnpm run lint` locally
- Fix issues and commit

#### Type Errors
- Run `pnpm run typecheck` locally
- Fix type issues and commit

#### Test Failures
- Run `pnpm run test` locally
- Debug and fix tests

#### E2E Failures
- Run `pnpm run test:e2e` locally
- Check Cypress videos in artifacts
- Review startup logs

#### Precheck Failures
- Run `node scripts/ci-precheck.js` locally
- Verify plugin availability
- Check manifest files

## Deployment Readiness

### Pre-Deployment Checklist

- [ ] All CI jobs pass
- [ ] Coverage meets thresholds (70%)
- [ ] E2E tests pass
- [ ] No lint errors
- [ ] No type errors
- [ ] Precheck passes

### Production Deployment

After all quality gates pass:

1. Merge to `main` branch
2. Create release tag
3. Deploy to production

## Monitoring

### GitHub Actions Dashboard

Monitor pipeline status at:
`https://github.com/BPMSoftwareSolutions/package-builder/actions`

### Codecov Integration

Coverage reports are automatically uploaded to Codecov:
`https://codecov.io/gh/BPMSoftwareSolutions/package-builder`

## Future Enhancements

- [ ] Performance benchmarking
- [ ] Visual regression testing
- [ ] Accessibility testing
- [ ] Security scanning
- [ ] Dependency vulnerability scanning

