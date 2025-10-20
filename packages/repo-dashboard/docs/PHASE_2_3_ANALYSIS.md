# Phase 2.3: Architecture-Driven Live Data Integration - Analysis Report

## Executive Summary

This document provides a comprehensive analysis of the work required to transform the repo-dashboard into a true architecture-driven system where:

1. **ADF is the source of truth** for all repositories, teams, and relationships
2. **All services pull live data** from GitHub APIs for renderx-plugin repos only
3. **Teams are dynamically derived** from the ADF plugin architecture
4. **Web UI properly calls services** with architecture context

## Current State Problems

### Problem 1: Hardcoded Team Mappings
**Location**: `src/services/metrics-aggregator.ts` (lines 45-56)

Team-to-repo mappings are hardcoded instead of being derived from the ADF:
- Host Team: renderx-plugins-demo
- SDK Team: renderx-plugins-sdk, renderx-manifest-tools
- Conductor Team: musical-conductor
- Plugin Teams: canvas, components, control-panel, header, library

**Impact**: Breaks architecture-first principle. Adding new teams requires code changes.

### Problem 2: Mock Data Generation
**Affected Services** (9 services):
- conductor-metrics-collector.ts
- bundle-metrics-collector.ts
- test-coverage-collector.ts
- code-quality-collector.ts
- test-execution-collector.ts
- deployment-status.ts
- build-status.ts
- Plus others generating synthetic data

**Impact**: Dashboard shows fake metrics, not real data from renderx-plugin repos.

### Problem 3: Missing Team Association in ADF
**Location**: `docs/renderx-plugins-demo-adf.json`

Containers lack explicit `team` field. Each plugin should be associated with its team.

**Impact**: Services can't extract team info from ADF, forcing hardcoded mappings.

### Problem 4: Services Don't Use ADF for Team Mapping
**Affected Services**:
- cross-team-dependency.ts
- cross-team-communication.ts
- handoff-tracking.ts
- metrics-aggregator.ts

**Impact**: Services attempt to extract team info from ADF but field doesn't exist.

### Problem 5: Web UI Doesn't Call Services
**Current Flow**:
1. UI fetches `/api/summary/architecture/{org}/{repo}`
2. Server extracts repos from ADF
3. Server calls GitHub APIs directly
4. Services are never invoked

**Impact**: Services are unused. Server makes direct API calls instead of using services.

### Problem 6: No Service-Specific API Endpoints
**Missing Endpoints**:
- `/api/teams` - List all teams
- `/api/teams/{team}/metrics` - Team metrics
- `/api/repos/{org}/{repo}/metrics` - Repo metrics
- `/api/dependencies/team/{team}` - Cross-team dependencies
- `/api/communication/team/{team}` - Team communication
- `/api/handoffs/team/{team}` - Handoff metrics

**Impact**: No way to call services with architecture context.

## Solution Architecture

### Phase 2.3.1: Update ADF Schema
Add `team` and `teamDescription` fields to each container:

```json
{
  "id": "host-app",
  "name": "RenderX Host Application",
  "team": "Host Team",
  "teamDescription": "Responsible for host application and plugin orchestration",
  "repository": "BPMSoftwareSolutions/renderx-plugins-demo"
}
```

**Containers to Update**:
1. host-app → Host Team
2. plugin-system → SDK Team
3. orchestration-engine → Conductor Team
4. plugin-examples → Split into individual teams (Canvas, Components, Control Panel, Header, Library)
5. ui-layer → UX/UI Team
6. artifact-system → DevOps Team

### Phase 2.3.2: Create ADFTeamMapper Service
**New File**: `src/services/adf-team-mapper.ts`

**Responsibilities**:
- Load ADF and extract team-to-repo mappings
- Provide team list
- Get repos for a team
- Get team for a repo
- Cache team mappings

**Interface**:
```typescript
export class ADFTeamMapper {
  async initializeFromADF(adf: ArchitectureDefinition): Promise<void>
  getTeams(): string[]
  getTeamRepositories(team: string): string[]
  getTeamForRepository(repo: string): string | null
  getTeamMetadata(team: string): TeamMetadata | null
}
```

### Phase 2.3.3: Wire Services to Live Data
**Services to Update** (Priority Order):

1. **Build Status Service** - Replace mock with GitHub Actions API
2. **Test Coverage Collector** - Fetch from CI/CD artifacts
3. **Code Quality Collector** - Fetch from code scanning alerts
4. **Test Execution Collector** - Fetch from CI/CD logs
5. **Deployment Status Service** - Fetch from GitHub Deployments API
6. **Conductor Metrics Collector** - Fetch from repo releases/tags
7. **Bundle Metrics Collector** - Fetch from package.json/artifacts

**Already Live**:
- Pull Request Metrics Collector ✓
- Deployment Metrics Collector ✓

### Phase 2.3.4: Create Architecture-Aware API Endpoints
**New Endpoints**:
- GET /api/teams
- GET /api/teams/{team}
- GET /api/teams/{team}/repos
- GET /api/teams/{team}/metrics
- GET /api/repos/{org}/{repo}/metrics
- GET /api/dependencies/team/{team}
- GET /api/communication/team/{team}
- GET /api/handoffs/team/{team}

### Phase 2.3.5: Update Web UI
**Components to Update**:
- HomeDashboard.tsx - Call team endpoints
- FlowDashboard.tsx - Call flow metrics endpoints
- FeedbackDashboard.tsx - Call feedback metrics endpoints
- LearningDashboard.tsx - Call learning metrics endpoints
- CollaborationDashboard.tsx - Call collaboration endpoints

## Data Flow Diagram

```
ADF (renderx-plugins-demo-adf.json)
  ↓
ADFTeamMapper (Extract teams & repos)
  ↓
Services (Pull live data from GitHub)
  ├─ PullRequestMetricsCollector
  ├─ DeploymentMetricsCollector
  ├─ BuildStatusService
  ├─ TestCoverageCollector
  ├─ CodeQualityCollector
  ├─ TestExecutionCollector
  ├─ DeploymentStatusService
  ├─ ConductorMetricsCollector
  └─ BundleMetricsCollector
  ↓
API Endpoints (/api/teams/{team}/metrics, etc.)
  ↓
Web UI (HomeDashboard, FlowDashboard, etc.)
  ↓
User Dashboard
```

## Implementation Tasks

### Task 1: Update ADF Schema (2 hours)
- Add `team` field to each container
- Add `teamDescription` field
- Validate ADF schema changes
- Update ADF documentation

### Task 2: Create ADFTeamMapper Service (4 hours)
- Create `src/services/adf-team-mapper.ts`
- Implement team extraction from ADF
- Add caching for team mappings
- Write unit tests

### Task 3: Wire Services to Live Data (12 hours)
- Update 7 services to fetch live data
- Replace all mock data generation
- Update all services to use ADFTeamMapper
- Write integration tests

### Task 4: Create API Endpoints (6 hours)
- Create 8 new endpoints
- Wire endpoints to services
- Write endpoint tests

### Task 5: Update Web UI (6 hours)
- Update 5 dashboard components
- Add team selector to navigation
- Write component tests

### Task 6: Update Metrics Aggregator (4 hours)
- Replace hardcoded team mappings
- Update aggregation logic
- Write tests

### Task 7: Update Cross-Team Services (4 hours)
- Update 3 cross-team services
- Use ADFTeamMapper instead of hardcoded mappings
- Write tests

### Testing & QA (6 hours)
- Integration testing
- End-to-end testing
- Performance testing

## Success Criteria

1. ✅ All services pull live data from GitHub APIs (no mock data)
2. ✅ Team mappings are derived from ADF (no hardcoded mappings)
3. ✅ ADF has explicit team associations for each component
4. ✅ Web UI calls services with architecture context
5. ✅ All metrics are team-specific and architecture-aware
6. ✅ Dashboard displays only renderx-plugin repos
7. ✅ All 531+ tests pass
8. ✅ No console warnings about missing data

## Estimated Effort

**Total**: ~44 hours

## Related GitHub Issue

**Issue #101**: Phase 2.3: Architecture-Driven Live Data Integration
https://github.com/BPMSoftwareSolutions/package-builder/issues/101

## Key Insights

1. **ADF is underutilized** - Currently only used to extract repos, not teams
2. **Services are disconnected** - Not called from web UI or API endpoints
3. **Mock data is pervasive** - 7+ services generate synthetic data
4. **Team mapping is hardcoded** - Breaks scalability and architecture-first principle
5. **API layer is missing** - No endpoints to call services with architecture context

## Next Steps

1. Review and approve GitHub Issue #101
2. Create sub-issues for each phase
3. Begin Phase 2.3.1: Update ADF Schema
4. Proceed with implementation in priority order

