# Dashboard Menu Items - Quick Reference

## Menu Item Breakdown

| Menu Item | Component | API Endpoint | Data Source | What It Shows |
|-----------|-----------|--------------|-------------|---------------|
| **Architecture** | ArchitectureDashboard.tsx | `/api/architecture` | ADF + Mock data | C4 model, containers, relationships, system architecture |
| **Metrics** | MetricsDashboard.tsx | `/api/metrics?days={7\|30\|90}` | MetricsAggregator | PR metrics, deployment metrics, health scores by repo |
| **Insights** | InsightsPage.tsx | `/api/insights` | Mock data | Trends, recommendations, anomalies, insights |
| **Flow** | FlowDashboard.tsx | `/api/metrics/flow-stages/:org/:repo` | FlowStageAnalyzer, WIPTracker, DeployCadenceService | PR flow breakdown, WIP metrics, deployment cadence |
| **Learning** | LearningDashboard.tsx | `/api/metrics/knowledge-sharing/:org/:team` | KnowledgeSharingService, SkillInventoryService, BusFactorAnalysisService | Code review patterns, skill distribution, bus factor |
| **Collaboration** | CollaborationDashboard.tsx | `/api/metrics/cross-team-communication/:org` | CrossTeamCommunicationService, CrossTeamDependencyService | Communication patterns, dependencies, handoffs |
| **Repositories** | RepoStatus.tsx | `/api/repos` | GitHub API | Repository list, status, build info |
| **Issues** | Issues.tsx | `/api/issues` | GitHub API | GitHub issues, PRs, status |
| **Packages** | Packages.tsx | `/api/packages` | Local package.json | NPM packages, versions, readiness |

---

## Data Flow by Menu Item

### 1. Architecture
```
User clicks "Architecture"
  ↓
ArchitectureDashboard.tsx loads
  ↓
fetch('/api/architecture')
  ↓
server.ts: GET /api/architecture
  ↓
Returns mock ADF data with C4 model
  ↓
Renders C4 diagram, containers, relationships
```

### 2. Metrics
```
User clicks "Metrics"
  ↓
MetricsDashboard.tsx loads
  ↓
fetch('/api/metrics?days=30')
  ↓
server.ts: GET /api/metrics
  ↓
MetricsAggregator.aggregateTeamMetrics()
  ↓
Calls PRMetricsCollector & DeploymentMetricsCollector
  ↓
Fetches GitHub APIs (PRs, Deployments)
  ↓
Returns aggregated metrics
  ↓
Renders charts, health scores, trends
```

### 3. Flow
```
User clicks "Flow"
  ↓
FlowDashboard.tsx loads
  ↓
fetch('/api/metrics/flow-stages/:org/:repo')
  ↓
server.ts: GET /api/metrics/flow-stages/:org/:repo
  ↓
FlowStageAnalyzer.analyzeFlowStages()
  ↓
Calls PRMetricsCollector
  ↓
Fetches GitHub PR API
  ↓
Calculates: PR creation → review → approval → merge
  ↓
Returns flow stage breakdown
  ↓
Renders flow visualization, WIP metrics, cadence
```

### 4. Learning
```
User clicks "Learning"
  ↓
LearningDashboard.tsx loads
  ↓
fetch('/api/metrics/knowledge-sharing/:org/:team')
  ↓
server.ts: GET /api/metrics/knowledge-sharing/:org/:team
  ↓
KnowledgeSharingService.analyzeKnowledgeSharing()
  ↓
Analyzes PR review patterns
  ↓
Calculates: reviewer diversity, knowledge distribution
  ↓
Returns knowledge sharing metrics
  ↓
Renders skill inventory, bus factor, knowledge gaps
```

### 5. Collaboration
```
User clicks "Collaboration"
  ↓
CollaborationDashboard.tsx loads
  ↓
fetch('/api/metrics/cross-team-communication/:org')
  ↓
server.ts: GET /api/metrics/cross-team-communication/:org
  ↓
CrossTeamCommunicationService.trackCrossTeamIssue()
  ↓
Reads ADF for team mappings
  ↓
Analyzes cross-team issues & PRs
  ↓
Returns communication patterns
  ↓
Renders dependency graph, communication matrix, handoffs
```

---

## Data Sources Priority

### Primary Data Sources (Live)
1. **GitHub APIs** - Real-time PR, deployment, action data
2. **Architecture Definition File (ADF)** - Team structure and relationships
3. **Local package.json** - Package information

### Secondary Data Sources (Mock/Calculated)
1. **Mock data** - For Architecture, Insights pages
2. **Calculated metrics** - Flow, Learning, Collaboration (derived from GitHub data)

---

## Key Services Initialization

On server startup (`src/server.ts`):

```typescript
// Initialize MetricsAggregator with ADF
await metricsAggregator.initialize();

// Initialize Phase 1.2 services
const wipTracker = new WIPTrackerService(prMetricsCollector);
const flowStageAnalyzer = new FlowStageAnalyzerService(prMetricsCollector);
const deployCadenceService = new DeployCadenceService(deploymentMetricsCollector);

// Initialize Phase 1.4 services
const constraintDetectionService = new ConstraintDetectionService();
const rootCauseAnalysisService = new RootCauseAnalysisService();
const predictiveAnalysisService = new PredictiveAnalysisService();

// Initialize Phase 1.7 services
const busFactorAnalysisService = new BusFactorAnalysisService();
const knowledgeSharingService = new KnowledgeSharingService();
const skillInventoryService = new SkillInventoryService();
const codeOwnershipService = new CodeOwnershipService();
```

---

## Environment Variables

```bash
# Default organization for architecture
DEFAULT_ARCHITECTURE_ORG=BPMSoftwareSolutions

# Default repository for ADF
DEFAULT_ARCHITECTURE_REPO=renderx-plugins-demo

# Web server port
WEB_PORT=3000

# Web server host
WEB_HOST=localhost

# GitHub token (for API calls)
GITHUB_TOKEN=<your-token>
```

---

## Current Status

✅ **Implemented & Working**:
- Architecture menu item
- Metrics menu item (with live GitHub data)
- Insights menu item
- Flow menu item (with live GitHub data)
- Learning menu item
- Collaboration menu item
- Repositories menu item
- Issues menu item
- Packages menu item

⚠️ **In Progress**:
- Step 6: Update Web UI to Call Services (architecture-aware API endpoints)

🔄 **Data Flow**:
- All menu items fetch data from backend APIs
- Backend services pull live data from GitHub
- ADF drives team structure and architecture context

