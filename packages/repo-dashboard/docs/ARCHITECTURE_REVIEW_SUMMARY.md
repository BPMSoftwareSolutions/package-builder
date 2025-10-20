# Architecture Review Summary: Services & Live Data Integration

## Review Date
October 20, 2025

## Objective
Review how services are pulling data from renderx-plugin repos and ensure the dashboard is properly wired to display live data driven by the ADF architecture.

## Key Findings

### 1. Services Architecture is Disconnected ❌
**Current State**: Services exist but are not called from the web UI or API layer.

**Evidence**:
- `src/server.ts` makes direct GitHub API calls instead of using services
- Web UI (`HomeDashboard.tsx`) fetches from `/api/summary/architecture` which bypasses services
- No API endpoints to invoke services with architecture context

**Impact**: Services are unused code. Dashboard metrics are not service-driven.

### 2. Team Mappings are Hardcoded ❌
**Current State**: Team-to-repo mappings are hardcoded in `metrics-aggregator.ts`.

**Evidence**:
```typescript
private teamRepoMapping: { [team: string]: string[] } = {
  'Host Team': ['renderx-plugins-demo'],
  'SDK Team': ['renderx-plugins-sdk', 'renderx-manifest-tools'],
  'Conductor Team': ['musical-conductor'],
  'Plugin Teams': [...]
};
```

**Impact**: 
- Not scalable - adding teams requires code changes
- Breaks architecture-first principle
- ADF is not the source of truth for teams

### 3. ADF Lacks Team Association ❌
**Current State**: ADF containers don't have explicit `team` field.

**Evidence**:
- `renderx-plugins-demo-adf.json` has containers but no team metadata
- Services try to extract `container.team` but field doesn't exist
- Team mapping must be hardcoded as workaround

**Impact**: ADF cannot be the source of truth for team structure.

### 4. Mock Data is Pervasive ❌
**Affected Services** (7+):
- conductor-metrics-collector.ts - Generates mock Conductor metrics
- bundle-metrics-collector.ts - Generates mock bundle metrics
- test-coverage-collector.ts - Generates mock test coverage
- code-quality-collector.ts - Generates mock code quality
- test-execution-collector.ts - Generates mock test execution
- deployment-status.ts - Generates mock deployment status
- build-status.ts - Generates mock build status

**Impact**: Dashboard shows fake metrics, not real data from renderx-plugin repos.

### 5. Some Services Already Pull Live Data ✅
**Working Services**:
- pull-request-metrics-collector.ts - Fetches from GitHub API
- deployment-metrics-collector.ts - Fetches from GitHub API

**Impact**: Proof that live data integration is possible and working.

### 6. No Service-Specific API Endpoints ❌
**Missing Endpoints**:
- `/api/teams` - List all teams from ADF
- `/api/teams/{team}/metrics` - Get metrics for a team
- `/api/repos/{org}/{repo}/metrics` - Get metrics for a repo
- `/api/dependencies/team/{team}` - Cross-team dependencies
- `/api/communication/team/{team}` - Team communication
- `/api/handoffs/team/{team}` - Handoff metrics

**Impact**: No way to call services with architecture context.

### 7. Web UI Doesn't Call Services ❌
**Current Flow**:
1. UI fetches `/api/summary/architecture/{org}/{repo}`
2. Server extracts repos from ADF
3. Server calls GitHub APIs directly
4. Services are never invoked

**Impact**: Services are unused. Web UI is not service-driven.

## Solution: Phase 2.3

### Phase 2.3.1: Update ADF Schema
Add `team` and `teamDescription` fields to each container.

### Phase 2.3.2: Create ADFTeamMapper Service
New service to extract team-to-repo mappings from ADF dynamically.

### Phase 2.3.3: Wire Services to Live Data
Update 7 services to fetch live data from GitHub APIs instead of generating mock data.

### Phase 2.3.4: Create Architecture-Aware API Endpoints
Create 8 new endpoints to call services with architecture context.

### Phase 2.3.5: Update Web UI
Update 5 dashboard components to call service endpoints.

### Phase 2.3.6: Update Metrics Aggregator
Replace hardcoded team mappings with ADFTeamMapper.

### Phase 2.3.7: Update Cross-Team Services
Update 3 cross-team services to use ADFTeamMapper.

## Implementation Roadmap

| Phase | Task | Effort | Status |
|-------|------|--------|--------|
| 2.3.1 | Update ADF Schema | 2h | Not Started |
| 2.3.2 | Create ADFTeamMapper | 4h | Not Started |
| 2.3.3 | Wire Services to Live Data | 12h | Not Started |
| 2.3.4 | Create API Endpoints | 6h | Not Started |
| 2.3.5 | Update Web UI | 6h | Not Started |
| 2.3.6 | Update Metrics Aggregator | 4h | Not Started |
| 2.3.7 | Update Cross-Team Services | 4h | Not Started |
| Testing | Integration & QA | 6h | Not Started |
| **Total** | | **44h** | |

## Success Metrics

1. ✅ All services pull live data (no mock data)
2. ✅ Team mappings derived from ADF (no hardcoded mappings)
3. ✅ ADF has explicit team associations
4. ✅ Web UI calls services with architecture context
5. ✅ All metrics are team-specific and architecture-aware
6. ✅ Dashboard displays only renderx-plugin repos
7. ✅ All 531+ tests pass
8. ✅ No console warnings about missing data

## GitHub Issue

**Issue #101**: Phase 2.3: Architecture-Driven Live Data Integration
https://github.com/BPMSoftwareSolutions/package-builder/issues/101

## Recommendations

1. **Prioritize Phase 2.3.1** - Update ADF schema first (foundation for everything)
2. **Implement ADFTeamMapper early** - Enables all other phases
3. **Wire services incrementally** - Start with build-status, then others
4. **Create API endpoints in parallel** - Can be done while wiring services
5. **Update Web UI last** - Depends on all other phases

## Conclusion

The dashboard has a solid foundation with working services and ADF integration, but the architecture is not fully connected. Services are unused, team mappings are hardcoded, and mock data is pervasive. Phase 2.3 will transform the dashboard into a true architecture-driven system where ADF is the source of truth and all services pull live data from renderx-plugin repos.

**Estimated Timeline**: 2-3 weeks for full implementation

