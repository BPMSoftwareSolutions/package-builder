# Single Source of Truth - Dashboard Data Architecture

## 🎯 The Answer: TWO Sources of Truth (Complementary)

The dashboard has **TWO complementary single sources of truth**, not one:

### 1. **Architecture Definition File (ADF)** - Structural Truth
**File**: `packages/repo-dashboard/docs/renderx-plugins-demo-adf.json`

**Location**: GitHub Repository
- Organization: `BPMSoftwareSolutions`
- Repository: `renderx-plugins-demo`
- Branch: `main`
- Path: `docs/renderx-plugins-demo-adf.json`

**What it contains**:
- Team definitions and associations
- Container/Component mappings
- System relationships
- C4 Model structure
- Architecture metadata

**Who reads it**:
- `ADFTeamMapper` - Extracts team → repository mappings
- `CrossTeamDependencyService` - Extracts relationships
- `ArchitectureDashboard` - Displays C4 model

**How it's fetched**:
```typescript
// In MetricsAggregator.initialize()
adf = await adfFetcher.fetchADF({
  org: 'BPMSoftwareSolutions',
  repo: 'renderx-plugins-demo',
  branch: 'main',
  path: 'docs/renderx-plugins-demo-adf.json'
});
```

---

### 2. **GitHub APIs** - Operational Truth
**Source**: Live GitHub data

**What it provides**:
- Pull Request metrics (cycle time, review time, approval time)
- Deployment frequency and status
- Build/Action execution results
- Release information
- Code quality and security alerts
- Test execution results

**Who fetches it**:
- `PRMetricsCollector` - Fetches `/repos/{org}/{repo}/pulls` API
- `DeploymentMetricsCollector` - Fetches `/repos/{org}/{repo}/deployments` API
- `ConductorMetricsCollector` - Fetches `/repos/{org}/{repo}/actions/runs` API
- `BundleMetricsCollector` - Fetches `/repos/{org}/{repo}/releases` API
- `TestCoverageCollector` - Fetches `/repos/{org}/{repo}/code-scanning/alerts` API
- `CodeQualityCollector` - Fetches `/repos/{org}/{repo}/code-scanning/alerts` API
- `TestExecutionCollector` - Fetches `/repos/{org}/{repo}/actions/runs` API

**How it's fetched**:
```typescript
// In each collector service
const response = await fetchGitHub<any>(endpoint);
// Example: /repos/BPMSoftwareSolutions/renderx-plugins-demo/pulls
```

---

## 🔄 Data Flow: How They Work Together

```
┌─────────────────────────────────────────────────────────────┐
│ SINGLE SOURCE OF TRUTH LAYER                                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ADF (Structural)              GitHub APIs (Operational)    │
│  ├─ Team definitions           ├─ PR metrics                │
│  ├─ Container mappings         ├─ Deployment data           │
│  ├─ Relationships              ├─ Build status              │
│  └─ C4 Model                   └─ Code quality              │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ AGGREGATION LAYER                                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ADFTeamMapper                 Collector Services            │
│  ├─ Reads ADF                  ├─ Fetch GitHub APIs         │
│  ├─ Extracts team mappings     ├─ Cache results             │
│  └─ Provides structure         └─ Normalize data            │
│                                                               │
│  MetricsAggregator                                           │
│  ├─ Combines team mappings + metrics                        │
│  ├─ Calculates trends                                       │
│  └─ Aggregates by team                                      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ ANALYSIS SERVICES LAYER                                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Flow Analysis          Learning Analysis    Collaboration  │
│  ├─ Flow stages         ├─ Knowledge sharing ├─ Dependencies│
│  ├─ WIP metrics         ├─ Skill inventory   ├─ Communication
│  └─ Deploy cadence      └─ Bus factor        └─ Handoffs    │
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
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ UI DASHBOARDS                                                │
├─────────────────────────────────────────────────────────────┤
│  Metrics Dashboard    Flow Dashboard    Learning Dashboard   │
│  Collaboration Dashboard                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📍 Key Files & Locations

### ADF Source
```
GitHub Repository: BPMSoftwareSolutions/renderx-plugins-demo
File: docs/renderx-plugins-demo-adf.json
Fetched by: adfFetcher.fetchADF()
Cached by: ADFTeamMapper
```

### GitHub APIs Source
```
Base URL: https://api.github.com
Endpoints:
  - /repos/{org}/{repo}/pulls
  - /repos/{org}/{repo}/deployments
  - /repos/{org}/{repo}/actions/runs
  - /repos/{org}/{repo}/releases
  - /repos/{org}/{repo}/code-scanning/alerts
```

### Aggregation Point
```
File: src/services/metrics-aggregator.ts
Method: aggregateTeamMetrics()
Combines: ADF team mappings + GitHub metrics
```

---

## ✅ Why This Design?

1. **Separation of Concerns**
   - ADF = Architecture/Structure (changes rarely)
   - GitHub APIs = Operations/Metrics (changes constantly)

2. **Single Responsibility**
   - Each source owns its domain
   - No duplication of data
   - Clear ownership

3. **Scalability**
   - Can add new data sources without changing ADF
   - Can update ADF without affecting GitHub data collection
   - Services are loosely coupled

4. **Reliability**
   - If GitHub API is slow, ADF is still available
   - If ADF is unavailable, metrics can still be collected
   - Caching at multiple levels

---

## 🔐 Data Consistency

### How consistency is maintained:

1. **ADF is the source of truth for team structure**
   - All team mappings come from ADF
   - No hardcoded team lists in code
   - Single point of update

2. **GitHub is the source of truth for metrics**
   - All metrics fetched fresh from GitHub
   - Cached for performance (1 hour TTL)
   - No stale data stored locally

3. **MetricsAggregator ensures alignment**
   - Uses ADF team mappings to organize metrics
   - Only includes repos defined in ADF
   - Validates team/repo relationships

---

## 🚀 Initialization Flow

On server startup:

```typescript
// 1. Initialize MetricsAggregator
await metricsAggregator.initialize();

// 2. This fetches ADF from GitHub
adf = await adfFetcher.fetchADF({
  org: 'BPMSoftwareSolutions',
  repo: 'renderx-plugins-demo',
  branch: 'main',
  path: 'docs/renderx-plugins-demo-adf.json'
});

// 3. ADFTeamMapper extracts team mappings
await adfTeamMapper.initializeFromADF(adf);

// 4. Services are ready to fetch GitHub metrics
// Collectors will fetch on-demand when APIs are called
```

---

## 📊 Data Freshness

| Data Type | Source | Freshness | Cache TTL |
|-----------|--------|-----------|-----------|
| Team Structure | ADF | Updated when ADF changes | 1 hour |
| PR Metrics | GitHub API | Real-time | 5 minutes |
| Deployment Data | GitHub API | Real-time | 5 minutes |
| Build Status | GitHub API | Real-time | 5 minutes |
| Code Quality | GitHub API | Real-time | 5 minutes |

---

## 🎯 Summary

**Single Source of Truth = Two Complementary Sources**

1. **ADF** (renderx-plugins-demo-adf.json)
   - Defines: Team structure, architecture, relationships
   - Location: GitHub repository
   - Freshness: Updated when architecture changes
   - Used by: ADFTeamMapper, CrossTeamServices

2. **GitHub APIs**
   - Provides: Live operational metrics
   - Location: GitHub.com API endpoints
   - Freshness: Real-time with caching
   - Used by: Collector services, Analysis services

**Result**: Dashboard displays accurate, consistent, architecture-driven metrics from live GitHub data.

