# Phase 2.3 Implementation Roadmap

## Overview
This roadmap details the implementation plan for Phase 2.3: Architecture-Driven Live Data Integration.

## Phase Breakdown

### Phase 2.3.1: Update ADF Schema (2 hours)
**Objective**: Add team associations to ADF containers

**Tasks**:
- [ ] Add `team` field to each container in `renderx-plugins-demo-adf.json`
- [ ] Add `teamDescription` field for team metadata
- [ ] Update container structure:
  - `host-app` → "Host Team"
  - `plugin-system` → "SDK Team"
  - `orchestration-engine` → "Conductor Team"
  - `plugin-examples` → Split into 5 individual plugin teams
  - `ui-layer` → "UX/UI Team"
  - `artifact-system` → "DevOps Team"
- [ ] Validate ADF schema changes
- [ ] Update ADF documentation

**Deliverables**:
- Updated `renderx-plugins-demo-adf.json` with team fields
- Updated ADF schema documentation

**Dependencies**: None

---

### Phase 2.3.2: Create ADFTeamMapper Service (4 hours)
**Objective**: Create service to extract team mappings from ADF

**Tasks**:
- [ ] Create `src/services/adf-team-mapper.ts`
- [ ] Implement `ADFTeamMapper` class with methods:
  - `initializeFromADF(adf: ArchitectureDefinition): Promise<void>`
  - `getTeams(): string[]`
  - `getTeamRepositories(team: string): string[]`
  - `getTeamForRepository(repo: string): string | null`
  - `getTeamMetadata(team: string): TeamMetadata | null`
- [ ] Add caching for team mappings
- [ ] Write unit tests
- [ ] Export from `src/services/index.ts`

**Deliverables**:
- `src/services/adf-team-mapper.ts` (150+ lines)
- Unit tests for ADFTeamMapper
- Updated exports

**Dependencies**: Phase 2.3.1

---

### Phase 2.3.3: Wire Services to Live Data (12 hours)
**Objective**: Replace mock data with live GitHub API calls

**Services to Update** (Priority Order):

1. **build-status.ts** (2h)
   - Replace mock data with GitHub Actions API
   - Fetch from `/repos/{owner}/{repo}/actions/runs`
   - Parse workflow status

2. **test-coverage-collector.ts** (2h)
   - Fetch from CI/CD artifacts or package.json
   - Parse coverage reports

3. **code-quality-collector.ts** (2h)
   - Fetch from GitHub code scanning alerts
   - Use `/repos/{owner}/{repo}/code-scanning/alerts`

4. **test-execution-collector.ts** (2h)
   - Fetch from GitHub Actions workflow runs
   - Parse test results from CI/CD logs

5. **deployment-status.ts** (2h)
   - Fetch from GitHub Deployments API
   - Use `/repos/{owner}/{repo}/deployments`

6. **conductor-metrics-collector.ts** (1h)
   - Fetch from musical-conductor repo releases/tags
   - Parse conductor-specific metrics

7. **bundle-metrics-collector.ts** (1h)
   - Fetch from package.json or build artifacts
   - Parse bundle size from CI/CD

**For Each Service**:
- [ ] Replace mock data generation with GitHub API calls
- [ ] Use ADFTeamMapper for team mapping
- [ ] Add error handling and fallbacks
- [ ] Update caching strategy
- [ ] Write integration tests

**Deliverables**:
- Updated 7 services with live data fetching
- Integration tests for each service
- Updated error handling

**Dependencies**: Phase 2.3.2

---

### Phase 2.3.4: Create Architecture-Aware API Endpoints (6 hours)
**Objective**: Create endpoints to call services with architecture context

**New Endpoints**:

1. **Team Management** (1h)
   - `GET /api/teams` - List all teams
   - `GET /api/teams/{team}` - Get team details
   - `GET /api/teams/{team}/repos` - Get repos for team
   - `GET /api/teams/{team}/metadata` - Get team metadata

2. **Team Metrics** (2h)
   - `GET /api/teams/{team}/metrics` - Aggregated metrics
   - `GET /api/teams/{team}/metrics/flow` - Flow metrics
   - `GET /api/teams/{team}/metrics/feedback` - Feedback metrics
   - `GET /api/teams/{team}/metrics/learning` - Learning metrics

3. **Repository Metrics** (1h)
   - `GET /api/repos/{org}/{repo}/metrics` - All metrics
   - `GET /api/repos/{org}/{repo}/metrics/pr` - PR metrics
   - `GET /api/repos/{org}/{repo}/metrics/deployment` - Deployment metrics
   - `GET /api/repos/{org}/{repo}/metrics/build` - Build metrics
   - `GET /api/repos/{org}/{repo}/metrics/coverage` - Coverage metrics
   - `GET /api/repos/{org}/{repo}/metrics/quality` - Quality metrics

4. **Cross-Team Metrics** (1h)
   - `GET /api/dependencies/team/{team}` - Cross-team dependencies
   - `GET /api/communication/team/{team}` - Team communication
   - `GET /api/handoffs/team/{team}` - Handoff metrics

5. **Architecture Metrics** (1h)
   - `GET /api/architecture/{org}/{repo}/teams` - Teams in architecture
   - `GET /api/architecture/{org}/{repo}/metrics` - Architecture metrics
   - `GET /api/architecture/{org}/{repo}/flow` - Architecture flow metrics

**For Each Endpoint**:
- [ ] Implement in `src/server.ts`
- [ ] Wire to appropriate service
- [ ] Add error handling
- [ ] Add caching headers
- [ ] Write endpoint tests

**Deliverables**:
- 15+ new API endpoints
- Endpoint tests
- Updated server.ts

**Dependencies**: Phase 2.3.3

---

### Phase 2.3.5: Update Web UI (6 hours)
**Objective**: Update UI components to call service endpoints

**Components to Update**:

1. **HomeDashboard.tsx** (1.5h)
   - Call `/api/architecture/{org}/{repo}/teams`
   - Call `/api/teams/{team}/metrics`
   - Display team-specific data
   - Add team selector

2. **FlowDashboard.tsx** (1.5h)
   - Call `/api/teams/{team}/metrics/flow`
   - Display team flow data
   - Update flow visualizations

3. **FeedbackDashboard.tsx** (1h)
   - Call `/api/teams/{team}/metrics/feedback`
   - Display feedback metrics

4. **LearningDashboard.tsx** (1h)
   - Call `/api/teams/{team}/metrics/learning`
   - Display learning metrics

5. **CollaborationDashboard.tsx** (1h)
   - Call `/api/dependencies/team/{team}`
   - Call `/api/communication/team/{team}`
   - Call `/api/handoffs/team/{team}`
   - Display collaboration data

**For Each Component**:
- [ ] Update API calls to use new endpoints
- [ ] Add team context to data fetching
- [ ] Update error handling
- [ ] Write component tests

**Deliverables**:
- Updated 5 dashboard components
- Component tests
- Updated data fetching logic

**Dependencies**: Phase 2.3.4

---

### Phase 2.3.6: Update Metrics Aggregator (4 hours)
**Objective**: Replace hardcoded team mappings with ADFTeamMapper

**Tasks**:
- [ ] Update `src/services/metrics-aggregator.ts`
- [ ] Remove hardcoded `teamRepoMapping`
- [ ] Inject ADFTeamMapper dependency
- [ ] Update `aggregateTeamMetrics()` to use ADF teams
- [ ] Update `getTeams()` to return ADF teams
- [ ] Update `getTeamRepositories()` to use ADFTeamMapper
- [ ] Write tests

**Deliverables**:
- Updated metrics-aggregator.ts
- Updated tests

**Dependencies**: Phase 2.3.2

---

### Phase 2.3.7: Update Cross-Team Services (4 hours)
**Objective**: Update cross-team services to use ADFTeamMapper

**Services to Update**:

1. **cross-team-dependency.ts** (1.5h)
   - Use ADFTeamMapper instead of hardcoded mapping
   - Update team extraction logic

2. **cross-team-communication.ts** (1.5h)
   - Use ADFTeamMapper instead of hardcoded mapping
   - Update team extraction logic

3. **handoff-tracking.ts** (1h)
   - Use ADFTeamMapper instead of hardcoded mapping
   - Update team extraction logic

**For Each Service**:
- [ ] Inject ADFTeamMapper dependency
- [ ] Remove hardcoded team mappings
- [ ] Update team extraction logic
- [ ] Write tests

**Deliverables**:
- Updated 3 cross-team services
- Updated tests

**Dependencies**: Phase 2.3.2

---

### Testing & QA (6 hours)
**Objective**: Comprehensive testing and quality assurance

**Tasks**:
- [ ] Run all unit tests (target: 531+ passing)
- [ ] Run integration tests
- [ ] Run end-to-end tests
- [ ] Performance testing
- [ ] Load testing
- [ ] Manual testing of all dashboards
- [ ] Verify no mock data in production code
- [ ] Check for console warnings
- [ ] Verify dark mode support
- [ ] Verify responsive design

**Deliverables**:
- Test results report
- Performance metrics
- QA sign-off

**Dependencies**: All phases

---

## Timeline

| Phase | Duration | Start | End |
|-------|----------|-------|-----|
| 2.3.1 | 2h | Week 1 | Week 1 |
| 2.3.2 | 4h | Week 1 | Week 1 |
| 2.3.3 | 12h | Week 1-2 | Week 2 |
| 2.3.4 | 6h | Week 2 | Week 2 |
| 2.3.5 | 6h | Week 2-3 | Week 3 |
| 2.3.6 | 4h | Week 3 | Week 3 |
| 2.3.7 | 4h | Week 3 | Week 3 |
| Testing | 6h | Week 3 | Week 3 |
| **Total** | **44h** | | |

**Estimated Duration**: 2-3 weeks (1-2 developers)

## Success Criteria

- [ ] All services pull live data (no mock data)
- [ ] Team mappings derived from ADF (no hardcoded mappings)
- [ ] ADF has explicit team associations
- [ ] Web UI calls services with architecture context
- [ ] All metrics are team-specific and architecture-aware
- [ ] Dashboard displays only renderx-plugin repos
- [ ] All 531+ tests pass
- [ ] No console warnings about missing data
- [ ] Performance metrics acceptable
- [ ] Dark mode support verified
- [ ] Responsive design verified

## GitHub Issue

**Issue #101**: Phase 2.3: Architecture-Driven Live Data Integration
https://github.com/BPMSoftwareSolutions/package-builder/issues/101

## Notes

- All changes must maintain backward compatibility
- GitHub API rate limits: 60/hour (unauthenticated), 5000/hour (authenticated)
- Consider request batching and caching
- Each service should have its own cache with appropriate TTL
- Error handling must gracefully degrade when GitHub APIs unavailable

