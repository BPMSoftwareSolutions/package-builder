# Dashboard Menu Data Flow Analysis

## 📊 Menu Items Overview

The dashboard displays 9 menu items in the navigation bar:
1. **Architecture** - System architecture visualization
2. **Metrics** - Performance and health metrics
3. **Insights** - Trend analysis and recommendations
4. **Flow** - Value stream and deployment metrics
5. **Learning** - Knowledge sharing and skill inventory
6. **Collaboration** - Cross-team communication and dependencies
7. **Repositories** - Repository status and details
8. **Issues** - GitHub issues tracking
9. **Packages** - Package management

---

## 🎨 UI Layer: Navigation Component

**File**: `packages/repo-dashboard/src/web/components/Navigation.tsx`

The menu items are **HARDCODED** in the Navigation component. Each menu item is a static link that triggers navigation to a specific page:

```typescript
<li>
  <a className={`nav-link ${currentPage === 'architecture' ? 'active' : ''}`}
     onClick={() => onNavigate('architecture')}>
    Architecture
  </a>
</li>
```

**Key Point**: The menu structure is NOT dynamic - it's defined in the component code, not fetched from an API or configuration file.

---

## 📄 Page Components & Data Fetching

When a menu item is clicked, it navigates to a corresponding page component that fetches data:

### Architecture Dashboard
- **File**: `ArchitectureDashboard.tsx`
- **API Endpoint**: `GET /api/architecture`
- **Data Source**: Mock ADF data (currently hardcoded in server.ts)
- **Returns**: C4 model containers, relationships, and architecture metadata

### Metrics Dashboard
- **File**: `MetricsDashboard.tsx`
- **API Endpoint**: `GET /api/metrics?days={7|30|90}`
- **Data Source**: MetricsAggregator service
- **Returns**: PR metrics, deployment metrics, health scores by repository

### Insights Page
- **File**: `InsightsPage.tsx`
- **API Endpoint**: `GET /api/insights`
- **Data Source**: Mock insights data
- **Returns**: Trends, recommendations, anomalies

### Flow Dashboard
- **File**: `FlowDashboard.tsx`
- **API Endpoints**:
  - `GET /api/metrics/flow-stages/:org/:repo`
  - `GET /api/metrics/wip/:org/:team`
  - `GET /api/metrics/deploy-cadence/:org/:repo`
- **Data Source**: FlowStageAnalyzer, WIPTracker, DeployCadenceService
- **Returns**: PR flow breakdown, WIP metrics, deployment cadence

### Learning Dashboard
- **File**: `LearningDashboard.tsx`
- **API Endpoints**:
  - `GET /api/metrics/knowledge-sharing/:org/:team`
  - `GET /api/metrics/skill-inventory/:org/:team`
  - `GET /api/metrics/bus-factor/:org/:team/:repo`
- **Data Source**: KnowledgeSharingService, SkillInventoryService, BusFactorAnalysisService
- **Returns**: Code review patterns, skill distribution, bus factor analysis

### Collaboration Dashboard
- **File**: `CollaborationDashboard.tsx`
- **API Endpoints**:
  - `GET /api/metrics/cross-team-communication/:org`
  - `GET /api/metrics/dependencies/:org`
  - `GET /api/metrics/handoffs/:org/:team`
- **Data Source**: CrossTeamCommunicationService, CrossTeamDependencyService, HandoffTrackingService
- **Returns**: Communication patterns, dependency graphs, handoff metrics

---

## ⚙️ Backend Services Layer

### Core Services

**MetricsAggregator** (`metrics-aggregator.ts`)
- Aggregates PR and deployment metrics by team
- Uses **ADFTeamMapper** to get team-to-repository mappings
- Calls PRMetricsCollector and DeploymentMetricsCollector
- **Initialized on server startup** with ADF data

**ADFTeamMapper** (`adf-team-mapper.ts`)
- Extracts team mappings from Architecture Definition File
- Maps teams to their repositories
- Single source of truth for team structure

**Collector Services**:
- **PRMetricsCollector**: Fetches GitHub PR API data
- **DeploymentMetricsCollector**: Fetches GitHub Deployments API
- **ConductorMetricsCollector**: Fetches GitHub Actions API
- **BundleMetricsCollector**: Fetches GitHub Releases API
- **TestCoverageCollector**: Fetches GitHub Code Scanning API
- **CodeQualityCollector**: Fetches GitHub Code Scanning API
- **TestExecutionCollector**: Fetches GitHub Actions API

**Cross-Team Services**:
- **CrossTeamDependencyService**: Tracks dependencies between teams
- **CrossTeamCommunicationService**: Tracks cross-team issues
- **HandoffTrackingService**: Measures PR review handoff efficiency

---

## 📊 Data Sources

### 1. Architecture Definition File (ADF)
**File**: `packages/repo-dashboard/docs/renderx-plugins-demo-adf.json`

Contains:
- System architecture definition
- Container definitions with team associations
- Relationships between components
- C4 model structure

### 2. GitHub APIs
The dashboard pulls live data from GitHub:
- **Pull Requests API**: PR metrics, cycle time, review time
- **Deployments API**: Deployment frequency, success rates
- **Actions API**: Build status, test execution, workflow runs
- **Releases API**: Bundle metrics, release information
- **Code Scanning API**: Code quality, security alerts

---

## 🔄 Data Flow Summary

```
User clicks menu item
    ↓
Navigation component routes to page
    ↓
Page component calls API endpoint
    ↓
Server.ts endpoint handler
    ↓
Backend service (MetricsAggregator, etc.)
    ↓
Collector services fetch GitHub APIs
    ↓
Data aggregated and returned to UI
    ↓
Page component renders data
```

---

## 🎯 Key Insights

1. **Menu is Hardcoded**: The 9 menu items are static, defined in Navigation.tsx
2. **Data is Dynamic**: Each page fetches live data from backend APIs
3. **ADF is Central**: The Architecture Definition File drives team mappings
4. **GitHub is Source of Truth**: All metrics come from live GitHub APIs
5. **Services are Initialized**: MetricsAggregator initializes on server startup with ADF data
6. **Architecture-First**: Dashboard respects architecture context from ADF

---

## 📝 Files Involved

**Frontend**:
- `src/web/App.tsx` - Main app component
- `src/web/components/Navigation.tsx` - Menu definition
- `src/web/pages/*.tsx` - Page components

**Backend**:
- `src/server.ts` - API endpoints
- `src/services/metrics-aggregator.ts` - Metrics aggregation
- `src/services/adf-team-mapper.ts` - Team mapping from ADF
- `src/services/*-collector.ts` - Data collectors

**Configuration**:
- `docs/renderx-plugins-demo-adf.json` - Architecture definition

