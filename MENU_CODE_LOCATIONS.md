# Dashboard Menu - Code Locations & Implementation

## 📍 Menu Definition

**File**: `packages/repo-dashboard/src/web/components/Navigation.tsx` (Lines 18-98)

```typescript
<ul className="nav-links">
  <li>
    <a className={`nav-link ${currentPage === 'dashboard' ? 'active' : ''}`}
       onClick={() => onNavigate('dashboard')}>
      Home
    </a>
  </li>
  <li>
    <a className={`nav-link ${currentPage === 'architecture' ? 'active' : ''}`}
       onClick={() => onNavigate('architecture')}>
      Architecture
    </a>
  </li>
  <li>
    <a className={`nav-link ${currentPage === 'metrics' ? 'active' : ''}`}
       onClick={() => onNavigate('metrics')}>
      Metrics
    </a>
  </li>
  <!-- ... more items ... -->
</ul>
```

---

## 🎯 Page Components

### Architecture Dashboard
- **Component File**: `src/web/pages/ArchitectureDashboard.tsx`
- **API Call**: Line 36 - `fetch('/api/architecture')`
- **Server Endpoint**: `src/server.ts` Line 607 - `app.get('/api/architecture')`
- **Data Processing**: Returns mock ADF data with C4 model

### Metrics Dashboard
- **Component File**: `src/web/pages/MetricsDashboard.tsx`
- **API Call**: Line 24 - `fetch('/api/metrics?days=${timePeriod}')`
- **Server Endpoint**: `src/server.ts` Line 660 - `app.get('/api/metrics')`
- **Data Processing**: MetricsAggregator service

### Insights Page
- **Component File**: `src/web/pages/InsightsPage.tsx`
- **API Call**: Fetches `/api/insights`
- **Server Endpoint**: `src/server.ts` Line 1985 - `app.get('/api/insights')`
- **Data Processing**: Returns mock insights data

### Flow Dashboard
- **Component File**: `src/web/pages/FlowDashboard.tsx`
- **API Calls**:
  - `/api/metrics/flow-stages/:org/:repo` (Line 922 in server.ts)
  - `/api/metrics/wip/:org/:team` (Line 889 in server.ts)
  - `/api/metrics/deploy-cadence/:org/:repo` (Line 948 in server.ts)
- **Services Used**:
  - FlowStageAnalyzerService
  - WIPTrackerService
  - DeployCadenceService

### Learning Dashboard
- **Component File**: `src/web/pages/LearningDashboard.tsx`
- **API Calls**:
  - `/api/metrics/knowledge-sharing/:org/:team` (Line 2045 in server.ts)
  - `/api/metrics/skill-inventory/:org/:team` (Line 2072 in server.ts)
  - `/api/metrics/bus-factor/:org/:team/:repo` (Line 2024 in server.ts)
- **Services Used**:
  - KnowledgeSharingService
  - SkillInventoryService
  - BusFactorAnalysisService

### Collaboration Dashboard
- **Component File**: `src/web/pages/CollaborationDashboard.tsx`
- **API Calls**:
  - `/api/metrics/cross-team-communication/:org` (Line 1761 in server.ts)
  - `/api/metrics/dependencies/:org` (Line 1550 in server.ts)
  - `/api/metrics/handoffs/:org/:team` (Line 1648 in server.ts)
- **Services Used**:
  - CrossTeamCommunicationService
  - CrossTeamDependencyService
  - HandoffTrackingService

---

## ⚙️ Backend Services

### MetricsAggregator
- **File**: `src/services/metrics-aggregator.ts`
- **Key Methods**:
  - `initialize(adfData?: ArchitectureDefinition)` - Initializes with ADF
  - `getTeams()` - Returns teams from ADFTeamMapper
  - `getTeamRepositories(team)` - Returns repos for team
  - `aggregateTeamMetrics(org, team, period)` - Aggregates metrics
- **Initialization**: `src/server.ts` Line ~120 - Called in `initializeServices()`

### ADFTeamMapper
- **File**: `src/services/adf-team-mapper.ts`
- **Key Methods**:
  - `initializeFromADF(adf)` - Extracts team mappings from ADF
  - `getTeams()` - Returns all teams
  - `getTeamRepositories(team)` - Returns repos for team
  - `getTeamForRepository(repo)` - Returns team for repo

### Collector Services
- **PRMetricsCollector**: `src/services/pull-request-metrics-collector.ts`
  - `collectPRMetrics(org, repo, days)` - Fetches GitHub PR API
  
- **DeploymentMetricsCollector**: `src/services/deployment-metrics-collector.ts`
  - `collectDeploymentMetrics(org, repo, days)` - Fetches GitHub Deployments API
  
- **ConductorMetricsCollector**: `src/services/conductor-metrics-collector.ts`
  - `collectConductorMetrics(org, repo)` - Fetches GitHub Actions API
  
- **BundleMetricsCollector**: `src/services/bundle-metrics-collector.ts`
  - `collectBundleMetrics(org, repo)` - Fetches GitHub Releases API
  
- **TestCoverageCollector**: `src/services/test-coverage-collector.ts`
  - `collectCoverageMetrics(org, repo)` - Fetches GitHub Code Scanning API
  
- **CodeQualityCollector**: `src/services/code-quality-collector.ts`
  - `collectQualityMetrics(org, repo)` - Fetches GitHub Code Scanning API
  
- **TestExecutionCollector**: `src/services/test-execution-collector.ts`
  - `collectTestMetrics(org, repo)` - Fetches GitHub Actions API

### Cross-Team Services
- **CrossTeamDependencyService**: `src/services/cross-team-dependency.ts`
  - `initializeTeamMapping(adf, teamMapping)` - Initializes from ADF
  - `extractDependencies(adf)` - Extracts dependencies from ADF
  - `buildDependencyGraph(dependencies)` - Builds graph
  
- **CrossTeamCommunicationService**: `src/services/cross-team-communication.ts`
  - `initializeTeamMapping(teamMapping)` - Initializes team mapping
  - `trackCrossTeamIssue(issue, sourceRepo, targetRepo)` - Tracks issues
  
- **HandoffTrackingService**: `src/services/handoff-tracking.ts`
  - `initializeTeamMapping(teamMapping)` - Initializes team mapping
  - `calculateHandoffMetrics(prMetrics)` - Calculates handoff metrics

---

## 📊 Data Sources

### Architecture Definition File
- **File**: `packages/repo-dashboard/docs/renderx-plugins-demo-adf.json`
- **Used By**:
  - ADFTeamMapper (extracts team mappings)
  - CrossTeamDependencyService (extracts relationships)
  - ArchitectureDashboard (displays C4 model)

### GitHub APIs
- **PR API**: Used by PRMetricsCollector
- **Deployments API**: Used by DeploymentMetricsCollector
- **Actions API**: Used by ConductorMetricsCollector, TestExecutionCollector
- **Releases API**: Used by BundleMetricsCollector
- **Code Scanning API**: Used by TestCoverageCollector, CodeQualityCollector

---

## 🔄 Server Initialization Flow

**File**: `src/server.ts`

```typescript
// Line ~120: Initialize services on startup
async function initializeServices() {
  try {
    console.log('🔧 Initializing services...');
    await metricsAggregator.initialize();
    console.log('✅ MetricsAggregator initialized');
    console.log('✅ All services initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing services:', error);
  }
}

// Line ~130: Start server
async function startServer() {
  await initializeServices();
  
  app.listen(PORT, HOST, () => {
    console.log(`🚀 Dashboard server running at http://${HOST}:${PORT}`);
    console.log(`📊 API available at http://${HOST}:${PORT}/api`);
  });
}

startServer().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
```

---

## 🎯 How to Add a New Menu Item

1. **Add to Navigation.tsx** (Line 18-98):
   ```typescript
   <li>
     <a className={`nav-link ${currentPage === 'newitem' ? 'active' : ''}`}
        onClick={() => onNavigate('newitem')}>
       New Item
     </a>
   </li>
   ```

2. **Create Page Component**: `src/web/pages/NewItemPage.tsx`

3. **Add to App.tsx** (Line 20):
   ```typescript
   type Page = '...' | 'newitem';
   ```

4. **Add Route in App.tsx** (Line 46-58):
   ```typescript
   {currentPage === 'newitem' && <NewItemPage onNavigate={handleNavigation} />}
   ```

5. **Create API Endpoint** in `src/server.ts`:
   ```typescript
   app.get('/api/newitem', asyncHandler(async (req: Request, res: Response) => {
     // Implementation
   }));
   ```

6. **Create Backend Service** if needed

---

## 📝 Summary

- **Menu**: Hardcoded in Navigation.tsx
- **Pages**: Dynamic components that fetch data
- **APIs**: Express endpoints in server.ts
- **Services**: Backend logic for data aggregation
- **Data**: Live from GitHub APIs + ADF configuration

