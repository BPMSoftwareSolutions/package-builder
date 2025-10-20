# Dashboard Data Sources - Complete Summary

## 🎯 Quick Answer

**Where is the single source of truth for the data being displayed?**

There are **TWO complementary sources of truth**:

1. **Architecture Definition File (ADF)** - Structural Truth
   - Location: `BPMSoftwareSolutions/renderx-plugins-demo` repository
   - File: `docs/renderx-plugins-demo-adf.json`
   - Contains: Team structure, architecture, relationships
   - Freshness: Updated when architecture changes

2. **GitHub APIs** - Operational Truth
   - Location: `https://api.github.com`
   - Provides: Live PR, deployment, build, and code quality metrics
   - Freshness: Real-time (cached for 5 minutes)

---

## 📊 Data Source by Menu Item

### Architecture Dashboard
- **Primary Source**: ADF (renderx-plugins-demo-adf.json)
- **Secondary Source**: Mock data
- **What it shows**: C4 model, containers, relationships
- **Fetched by**: ArchitectureDashboard.tsx → `/api/architecture`

### Metrics Dashboard
- **Primary Source**: GitHub APIs
- **Organized by**: ADF team mappings
- **What it shows**: PR metrics, deployment metrics, health scores
- **Fetched by**: MetricsDashboard.tsx → `/api/metrics`
- **Services**:
  - PRMetricsCollector (GitHub PR API)
  - DeploymentMetricsCollector (GitHub Deployments API)
  - MetricsAggregator (combines data)

### Flow Dashboard
- **Primary Source**: GitHub APIs
- **Organized by**: ADF team mappings
- **What it shows**: PR flow stages, WIP metrics, deployment cadence
- **Fetched by**: FlowDashboard.tsx → `/api/metrics/flow-stages`
- **Services**:
  - FlowStageAnalyzer
  - WIPTracker
  - DeployCadenceService

### Learning Dashboard
- **Primary Source**: GitHub APIs (PR reviews, commits)
- **Organized by**: ADF team mappings
- **What it shows**: Knowledge sharing, skill inventory, bus factor
- **Fetched by**: LearningDashboard.tsx → `/api/metrics/knowledge-sharing`
- **Services**:
  - KnowledgeSharingService
  - SkillInventoryService
  - BusFactorAnalysisService

### Collaboration Dashboard
- **Primary Source**: ADF + GitHub APIs
- **What it shows**: Cross-team communication, dependencies, handoffs
- **Fetched by**: CollaborationDashboard.tsx → `/api/metrics/cross-team-communication`
- **Services**:
  - CrossTeamDependencyService (reads ADF)
  - CrossTeamCommunicationService (reads GitHub issues)
  - HandoffTrackingService (reads GitHub PRs)

### Repositories
- **Primary Source**: GitHub APIs
- **What it shows**: Repository list, status, metadata
- **Fetched by**: RepoStatus.tsx → `/api/repos`

### Issues
- **Primary Source**: GitHub APIs
- **What it shows**: GitHub issues and PRs
- **Fetched by**: Issues.tsx → `/api/issues`

### Packages
- **Primary Source**: Local package.json
- **What it shows**: NPM packages, versions, readiness
- **Fetched by**: Packages.tsx → `/api/packages`

---

## 🔄 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ SOURCES OF TRUTH                                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ADF File                          GitHub APIs               │
│  (renderx-plugins-demo-adf.json)   (api.github.com)         │
│  • Team structure                  • PR metrics              │
│  • Architecture                    • Deployments             │
│  • Relationships                   • Build status            │
│  • C4 Model                        • Code quality            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ AGGREGATION LAYER                                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ADFTeamMapper              Collector Services               │
│  • Reads ADF                • PRMetricsCollector             │
│  • Extracts team mappings   • DeploymentMetricsCollector    │
│  • Provides structure       • ConductorMetricsCollector     │
│                             • BundleMetricsCollector        │
│  MetricsAggregator          • TestCoverageCollector         │
│  • Combines mappings        • CodeQualityCollector          │
│  • Combines metrics         • TestExecutionCollector        │
│  • Calculates trends                                        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ API ENDPOINTS (server.ts)                                    │
├─────────────────────────────────────────────────────────────┤
│  /api/metrics                                                │
│  /api/metrics/flow-stages                                    │
│  /api/metrics/knowledge-sharing                              │
│  /api/metrics/cross-team-communication                       │
│  /api/architecture                                           │
│  /api/repos                                                  │
│  /api/issues                                                 │
│  /api/packages                                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ UI DASHBOARDS                                                │
├─────────────────────────────────────────────────────────────┤
│  Architecture | Metrics | Insights | Flow | Learning |       │
│  Collaboration | Repositories | Issues | Packages            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Data Consistency Strategy

### How consistency is maintained:

1. **ADF is authoritative for structure**
   - Single file in GitHub repository
   - All team mappings derived from ADF
   - No hardcoded team lists in code
   - Changes to ADF automatically propagate

2. **GitHub is authoritative for metrics**
   - All metrics fetched fresh from GitHub
   - Cached for performance (5 min TTL)
   - No stale data stored locally
   - Real-time updates

3. **MetricsAggregator ensures alignment**
   - Uses ADF team mappings to organize metrics
   - Only includes repos defined in ADF
   - Validates team/repo relationships
   - Prevents orphaned data

---

## 📍 Key File Locations

### ADF Source
```
Repository: BPMSoftwareSolutions/renderx-plugins-demo
Branch: main
File: docs/renderx-plugins-demo-adf.json
```

### Fetcher Service
```
File: src/services/adf-fetcher.ts
Method: fetchADF(options: ADFFetchOptions)
Cache TTL: 1 hour
```

### Team Mapper
```
File: src/services/adf-team-mapper.ts
Method: initializeFromADF(adf: ArchitectureDefinition)
Provides: Team → Repo mappings
```

### Metrics Aggregator
```
File: src/services/metrics-aggregator.ts
Method: aggregateTeamMetrics(org, team, period)
Combines: ADF mappings + GitHub metrics
```

### Collector Services
```
Files: src/services/*-collector.ts
Fetch: GitHub APIs
Cache TTL: 5 minutes
```

---

## 🚀 Initialization Sequence

On server startup:

```
1. Server starts (src/server.ts)
   ↓
2. initializeServices() called
   ↓
3. metricsAggregator.initialize()
   ↓
4. adfFetcher.fetchADF() from GitHub
   ├─ Fetches: BPMSoftwareSolutions/renderx-plugins-demo
   ├─ Path: docs/renderx-plugins-demo-adf.json
   └─ Caches for 1 hour
   ↓
5. adfTeamMapper.initializeFromADF()
   ├─ Extracts team definitions
   ├─ Extracts container mappings
   └─ Builds team → repo mappings
   ↓
6. Services ready to serve requests
   ├─ Collectors fetch GitHub APIs on-demand
   ├─ Results cached for 5 minutes
   └─ MetricsAggregator combines data
```

---

## 📊 Data Freshness Guarantees

| Data Type | Source | Freshness | Cache TTL | Update Trigger |
|-----------|--------|-----------|-----------|-----------------|
| Team Structure | ADF | Updated when ADF changes | 1 hour | Manual ADF update |
| PR Metrics | GitHub API | Real-time | 5 minutes | Each API call |
| Deployment Data | GitHub API | Real-time | 5 minutes | Each API call |
| Build Status | GitHub API | Real-time | 5 minutes | Each API call |
| Code Quality | GitHub API | Real-time | 5 minutes | Each API call |
| Architecture | ADF | Updated when ADF changes | 1 hour | Manual ADF update |

---

## ✅ Verification

To verify the sources of truth:

1. **Check ADF location**:
   ```bash
   curl https://raw.githubusercontent.com/BPMSoftwareSolutions/renderx-plugins-demo/main/docs/renderx-plugins-demo-adf.json
   ```

2. **Check GitHub API access**:
   ```bash
   curl -H "Authorization: token YOUR_TOKEN" \
     https://api.github.com/repos/BPMSoftwareSolutions/renderx-plugins-demo/pulls
   ```

3. **Check server logs**:
   ```
   ✅ ADF cache hit for BPMSoftwareSolutions/renderx-plugins-demo/main/docs/renderx-plugins-demo-adf.json
   🔗 GitHub API Request: /repos/BPMSoftwareSolutions/renderx-plugins-demo/pulls
   ```

---

## 🎯 Summary

**Single Source of Truth = ADF + GitHub APIs**

- **ADF** defines WHAT to measure (teams, architecture, structure)
- **GitHub APIs** provide HOW WELL we're doing (metrics, status, quality)
- **MetricsAggregator** combines them into actionable insights
- **Dashboard** displays the unified view

This design ensures:
- ✅ No data duplication
- ✅ Single point of update for structure
- ✅ Real-time operational metrics
- ✅ Consistent, architecture-driven reporting

