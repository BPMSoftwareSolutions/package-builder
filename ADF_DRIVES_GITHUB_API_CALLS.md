# How ADF Drives GitHub API Calls

## 🎯 Direct Answer: YES

**The `renderx-plugins-demo-adf.json` file DIRECTLY drives which repositories are fetched from GitHub APIs.**

---

## 📊 The Flow

### Step 1: ADF Defines Repositories
The ADF file contains container definitions with team and repository mappings:

```json
{
  "c4Model": {
    "containers": [
      {
        "id": "canvas-plugin",
        "name": "Canvas Plugin",
        "team": "Canvas Team",
        "repository": "BPMSoftwareSolutions/renderx-plugins-canvas"
      },
      {
        "id": "components-plugin",
        "name": "Components Plugin",
        "team": "Components Team",
        "repository": "BPMSoftwareSolutions/renderx-plugins-components"
      },
      {
        "id": "control-panel-plugin",
        "name": "Control Panel Plugin",
        "team": "Control Panel Team",
        "repository": "BPMSoftwareSolutions/renderx-plugins-control-panel"
      }
    ]
  }
}
```

### Step 2: ADFTeamMapper Extracts Mappings
The `ADFTeamMapper` service reads the ADF and extracts team → repository mappings:

```typescript
// In src/services/adf-team-mapper.ts
async initializeFromADF(adf: ArchitectureDefinition): Promise<void> {
  // Loop through all containers in ADF
  for (const container of adf.c4Model.containers) {
    const team = container.team;  // e.g., "Canvas Team"
    const repos = this.extractRepositories(container);  // e.g., ["renderx-plugins-canvas"]
    
    // Build mapping: Canvas Team → [renderx-plugins-canvas]
    this.teamMapping[team] = {
      repositories: repos,
      containerIds: [container.id]
    };
  }
}
```

**Result**: A mapping object like:
```typescript
{
  "Canvas Team": {
    repositories: ["BPMSoftwareSolutions/renderx-plugins-canvas"],
    containerIds: ["canvas-plugin"]
  },
  "Components Team": {
    repositories: ["BPMSoftwareSolutions/renderx-plugins-components"],
    containerIds: ["components-plugin"]
  },
  "Control Panel Team": {
    repositories: ["BPMSoftwareSolutions/renderx-plugins-control-panel"],
    containerIds: ["control-panel-plugin"]
  }
}
```

### Step 3: MetricsAggregator Uses Mappings to Fetch GitHub Data
When you request metrics for a team, the aggregator:

```typescript
// In src/services/metrics-aggregator.ts
async aggregateTeamMetrics(org: string, team: string, period: '30d'): Promise<TeamMetrics> {
  // Step 1: Get repositories for this team FROM ADF
  const repos = this.getTeamRepositories(team);
  // repos = ["BPMSoftwareSolutions/renderx-plugins-canvas"]
  
  // Step 2: For EACH repository from ADF, fetch GitHub metrics
  for (const repo of repos) {
    const repoName = repo.split('/')[1];  // "renderx-plugins-canvas"
    
    // Fetch PR metrics from GitHub
    const prMetrics = await prMetricsCollector.collectPRMetrics(org, repoName, days);
    
    // Fetch deployment metrics from GitHub
    const deployMetrics = await deploymentMetricsCollector.collectDeploymentMetrics(org, repoName, days);
    
    // Fetch build metrics from GitHub
    const buildMetrics = await conductorMetricsCollector.collectConductorMetrics(org, repoName);
    
    // ... aggregate all metrics
  }
}
```

### Step 4: Collectors Make GitHub API Calls
Each collector makes GitHub API calls **ONLY for repositories defined in ADF**:

```typescript
// In src/services/pull-request-metrics-collector.ts
async collectPRMetrics(org: string, repo: string, days: number) {
  // GitHub API call - ONLY for repos from ADF
  const endpoint = `/repos/${org}/${repo}/pulls`;
  const response = await fetchGitHub<any>(endpoint);
  // Example: /repos/BPMSoftwareSolutions/renderx-plugins-canvas/pulls
}
```

---

## 🔄 Complete Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. ADF File (renderx-plugins-demo-adf.json)                 │
│    Contains: Team → Repository mappings                      │
│    Example: Canvas Team → renderx-plugins-canvas            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. ADFTeamMapper.initializeFromADF()                         │
│    Extracts: Team → Repo mappings from ADF                  │
│    Creates: teamMapping object                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. MetricsAggregator.aggregateTeamMetrics(team)             │
│    Gets: repos = getTeamRepositories(team)                  │
│    Returns: repos from ADF (NOT hardcoded)                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. For Each Repo from ADF:                                  │
│    • PRMetricsCollector.collectPRMetrics()                  │
│    • DeploymentMetricsCollector.collectDeploymentMetrics()  │
│    • ConductorMetricsCollector.collectConductorMetrics()    │
│    • BundleMetricsCollector.collectBundleMetrics()          │
│    • TestCoverageCollector.collectCoverageMetrics()         │
│    • CodeQualityCollector.collectQualityMetrics()           │
│    • TestExecutionCollector.collectTestMetrics()            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. GitHub API Calls (ONLY for ADF repos)                    │
│    GET /repos/BPMSoftwareSolutions/renderx-plugins-canvas/pulls
│    GET /repos/BPMSoftwareSolutions/renderx-plugins-components/pulls
│    GET /repos/BPMSoftwareSolutions/renderx-plugins-control-panel/pulls
│    ... (only repos defined in ADF)                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Dashboard Displays Results                               │
│    Metrics ONLY for teams/repos in ADF                      │
│    No orphaned repos                                        │
│    Single source of truth                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Key Points

### 1. ADF is the Gatekeeper
- **Only repositories defined in ADF are fetched from GitHub**
- If a repo is not in ADF, it will NOT be included in metrics
- If a repo is added to ADF, it will automatically be included

### 2. No Hardcoded Repository Lists
- Repository list is NOT hardcoded in code
- Repository list comes ONLY from ADF
- Change ADF → Change which repos are tracked

### 3. Team-Driven Filtering
- Metrics are organized by teams
- Teams are defined in ADF
- Each team has repositories defined in ADF
- Collectors fetch metrics ONLY for team's repositories

### 4. Automatic Synchronization
- Add a new container to ADF → New team appears in dashboard
- Add a new repository to container → New repo is tracked
- Remove repository from ADF → No longer tracked
- No code changes needed

---

## 📍 Code Locations

### ADF File
```
File: packages/repo-dashboard/docs/renderx-plugins-demo-adf.json
Location in GitHub: BPMSoftwareSolutions/renderx-plugins-demo/docs/renderx-plugins-demo-adf.json
```

### ADFTeamMapper (Extracts Mappings)
```
File: packages/repo-dashboard/src/services/adf-team-mapper.ts
Method: initializeFromADF(adf)
Lines: 34-80
```

### MetricsAggregator (Uses Mappings)
```
File: packages/repo-dashboard/src/services/metrics-aggregator.ts
Method: aggregateTeamMetrics(org, team, period)
Lines: 113-162
Key line: const repos = this.getTeamRepositories(team);
```

### Collector Services (Fetch GitHub Data)
```
Files: src/services/*-collector.ts
Examples:
  - pull-request-metrics-collector.ts
  - deployment-metrics-collector.ts
  - conductor-metrics-collector.ts
  - bundle-metrics-collector.ts
  - test-coverage-collector.ts
  - code-quality-collector.ts
  - test-execution-collector.ts
```

---

## 🎯 Summary

**YES - The ADF file drives GitHub API calls:**

1. **ADF defines** which repositories belong to which teams
2. **ADFTeamMapper extracts** team → repository mappings from ADF
3. **MetricsAggregator uses** these mappings to determine which repos to fetch
4. **Collectors fetch** GitHub data ONLY for repositories in ADF
5. **Dashboard displays** metrics ONLY for ADF-defined repositories

**Result**: The ADF is the single source of truth for:
- Which teams exist
- Which repositories belong to each team
- Which repositories are tracked in the dashboard
- Which GitHub API calls are made

**Change the ADF → Change what the dashboard tracks (automatically)**

