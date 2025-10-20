# Where is the Single Source of Truth for Dashboard Data?

## 🎯 Direct Answer

**There are TWO complementary single sources of truth:**

### 1️⃣ Architecture Definition File (ADF)
**The Structural Source of Truth**

```
Location: GitHub Repository
  Organization: BPMSoftwareSolutions
  Repository: renderx-plugins-demo
  Branch: main
  File: docs/renderx-plugins-demo-adf.json
```

**What it contains**:
- Team definitions and associations
- Container/Component mappings
- System relationships
- C4 Model structure
- Architecture metadata

**Who uses it**:
- `ADFTeamMapper` - Extracts team → repository mappings
- `CrossTeamDependencyService` - Extracts relationships
- `ArchitectureDashboard` - Displays C4 model
- `MetricsAggregator` - Organizes metrics by team

**How it's fetched**:
```typescript
// In src/services/adf-fetcher.ts
const adf = await fetchGitHub<ArchitectureDefinition>(
  `/repos/BPMSoftwareSolutions/renderx-plugins-demo/contents/docs/renderx-plugins-demo-adf.json?ref=main`
);
```

**Cache**: 1 hour TTL

---

### 2️⃣ GitHub APIs
**The Operational Source of Truth**

```
Location: https://api.github.com
Base URL: https://api.github.com/repos/{org}/{repo}
```

**What it provides**:
- Pull Request metrics (cycle time, review time, approval time)
- Deployment frequency and status
- Build/Action execution results
- Release information
- Code quality and security alerts
- Test execution results

**GitHub API Endpoints Used**:

| Endpoint | Used By | Data |
|----------|---------|------|
| `/repos/{org}/{repo}/pulls` | PRMetricsCollector | PR metrics |
| `/repos/{org}/{repo}/deployments` | DeploymentMetricsCollector | Deployment data |
| `/repos/{org}/{repo}/actions/runs` | ConductorMetricsCollector, TestExecutionCollector | Build/test status |
| `/repos/{org}/{repo}/releases` | BundleMetricsCollector | Release info |
| `/repos/{org}/{repo}/code-scanning/alerts` | TestCoverageCollector, CodeQualityCollector | Code quality |

**Cache**: 5 minutes TTL

---

## 🔄 How They Work Together

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
│  Fetched from:                 Fetched from:                │
│  BPMSoftwareSolutions/         api.github.com               │
│  renderx-plugins-demo          (multiple repos)             │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ AGGREGATION LAYER (src/services/)                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ADFTeamMapper                 Collector Services            │
│  ├─ Reads ADF                  ├─ PRMetricsCollector        │
│  ├─ Extracts team mappings     ├─ DeploymentMetricsCollector
│  └─ Provides structure         ├─ ConductorMetricsCollector │
│                                ├─ BundleMetricsCollector    │
│  MetricsAggregator             ├─ TestCoverageCollector     │
│  ├─ Combines team mappings     ├─ CodeQualityCollector      │
│  ├─ Combines metrics           └─ TestExecutionCollector    │
│  └─ Calculates trends                                       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ API ENDPOINTS (src/server.ts)                                │
├─────────────────────────────────────────────────────────────┤
│  /api/metrics                                                │
│  /api/metrics/flow-stages                                    │
│  /api/metrics/knowledge-sharing                              │
│  /api/metrics/cross-team-communication                       │
│  /api/architecture                                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ UI DASHBOARDS                                                │
├─────────────────────────────────────────────────────────────┤
│  Metrics | Flow | Learning | Collaboration | Architecture   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📍 Exact File Locations

### ADF Source
```
GitHub: https://github.com/BPMSoftwareSolutions/renderx-plugins-demo
File: docs/renderx-plugins-demo-adf.json
Raw URL: https://raw.githubusercontent.com/BPMSoftwareSolutions/renderx-plugins-demo/main/docs/renderx-plugins-demo-adf.json
```

### Dashboard Code
```
Fetcher: packages/repo-dashboard/src/services/adf-fetcher.ts
Mapper: packages/repo-dashboard/src/services/adf-team-mapper.ts
Aggregator: packages/repo-dashboard/src/services/metrics-aggregator.ts
Server: packages/repo-dashboard/src/server.ts
```

---

## 🚀 Initialization Flow

When the dashboard server starts:

```
1. Server starts (src/server.ts)
   ↓
2. initializeServices() called
   ↓
3. metricsAggregator.initialize()
   ├─ Checks if already initialized
   ├─ Fetches ADF from GitHub
   │  └─ BPMSoftwareSolutions/renderx-plugins-demo/docs/renderx-plugins-demo-adf.json
   ├─ Caches ADF for 1 hour
   └─ Initializes ADFTeamMapper with ADF data
   ↓
4. ADFTeamMapper.initializeFromADF()
   ├─ Extracts team definitions
   ├─ Extracts container mappings
   └─ Builds team → repo mappings
   ↓
5. Services ready to serve requests
   ├─ Collectors fetch GitHub APIs on-demand
   ├─ Results cached for 5 minutes
   └─ MetricsAggregator combines data
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

3. **Consistency**
   - ADF is authoritative for team structure
   - GitHub is authoritative for metrics
   - MetricsAggregator ensures alignment

4. **Scalability**
   - Can add new data sources without changing ADF
   - Can update ADF without affecting GitHub data collection
   - Services are loosely coupled

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

**Single Source of Truth = ADF + GitHub APIs**

- **ADF** (renderx-plugins-demo-adf.json) defines WHAT to measure
  - Teams, architecture, structure
  - Located in GitHub repository
  - Cached for 1 hour

- **GitHub APIs** provide HOW WELL we're doing
  - Metrics, status, quality
  - Real-time data
  - Cached for 5 minutes

- **MetricsAggregator** combines them
  - Uses ADF team mappings to organize metrics
  - Calls collectors to fetch GitHub data
  - Returns unified view

- **Dashboard** displays the result
  - Architecture-driven metrics
  - Team-organized data
  - Real-time insights

**Result**: Accurate, consistent, architecture-driven metrics from live GitHub data.

