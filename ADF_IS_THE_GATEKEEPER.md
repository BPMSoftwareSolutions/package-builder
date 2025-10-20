# ADF is the Gatekeeper - How It Controls GitHub API Calls

## 🎯 The Answer: YES - ADF Drives Everything

**The `renderx-plugins-demo-adf.json` file is the GATEKEEPER that controls:**
- ✅ Which teams exist
- ✅ Which repositories belong to each team
- ✅ Which GitHub API calls are made
- ✅ What data appears in the dashboard

---

## 🔐 How ADF Acts as the Gatekeeper

### Without ADF (Before Implementation)
```typescript
// ❌ OLD WAY - Hardcoded repositories
const TEAM_REPOS = {
  'Canvas Team': ['renderx-plugins-canvas'],
  'Components Team': ['renderx-plugins-components'],
  'Control Panel Team': ['renderx-plugins-control-panel']
};

// Problem: To add a new team/repo, you must edit code
// Problem: No single source of truth
// Problem: Easy to get out of sync
```

### With ADF (Current Implementation)
```typescript
// ✅ NEW WAY - ADF-driven repositories
const repos = adfTeamMapper.getTeamRepositories('Canvas Team');
// Returns: ['renderx-plugins-canvas']
// Source: renderx-plugins-demo-adf.json

// Benefit: Change ADF → Dashboard updates automatically
// Benefit: Single source of truth
// Benefit: No code changes needed
```

---

## 📊 The Gatekeeper Flow

```
┌─────────────────────────────────────────────────────────────┐
│ GATEKEEPER: renderx-plugins-demo-adf.json                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ Defines:                                                     │
│ • Teams (Canvas Team, Components Team, etc.)                │
│ • Repositories for each team                                │
│ • Container IDs                                             │
│ • Team descriptions                                         │
│                                                               │
│ Example:                                                     │
│ {                                                            │
│   "c4Model": {                                               │
│     "containers": [                                          │
│       {                                                      │
│         "team": "Canvas Team",                              │
│         "repository": "renderx-plugins-canvas"              │
│       }                                                      │
│     ]                                                        │
│   }                                                          │
│ }                                                            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ GATE 1: ADFTeamMapper                                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ Reads ADF and creates mapping:                              │
│ {                                                            │
│   'Canvas Team': {                                           │
│     repositories: ['renderx-plugins-canvas'],               │
│     containerIds: ['canvas-plugin']                         │
│   }                                                          │
│ }                                                            │
│                                                               │
│ Only repos in ADF can pass through this gate                │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ GATE 2: MetricsAggregator                                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ When requesting metrics for a team:                         │
│ 1. Gets repos from ADFTeamMapper (from ADF)                 │
│ 2. Only fetches metrics for those repos                     │
│ 3. Ignores any repos not in ADF                             │
│                                                               │
│ Code:                                                        │
│ const repos = this.getTeamRepositories(team);  // From ADF  │
│ for (const repo of repos) {                                 │
│   // Fetch GitHub data ONLY for ADF repos                  │
│ }                                                            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ GATE 3: Collector Services                                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ Each collector receives repo name from MetricsAggregator    │
│ (which came from ADF)                                       │
│                                                               │
│ Only makes GitHub API calls for ADF-approved repos:         │
│ GET /repos/BPMSoftwareSolutions/renderx-plugins-canvas/pulls
│ GET /repos/BPMSoftwareSolutions/renderx-plugins-components/pulls
│ ... (only ADF repos)                                        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ RESULT: Dashboard                                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ Displays metrics ONLY for:                                  │
│ • Teams defined in ADF                                      │
│ • Repositories defined in ADF                               │
│ • Data from GitHub APIs for ADF repos                       │
│                                                               │
│ No orphaned repos                                           │
│ No hardcoded lists                                          │
│ Single source of truth                                      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Code Points

### 1. ADF Defines Repositories
**File**: `packages/repo-dashboard/docs/renderx-plugins-demo-adf.json`

```json
{
  "c4Model": {
    "containers": [
      {
        "id": "canvas-plugin",
        "team": "Canvas Team",
        "repository": "BPMSoftwareSolutions/renderx-plugins-canvas"
      }
    ]
  }
}
```

### 2. ADFTeamMapper Extracts Mappings
**File**: `packages/repo-dashboard/src/services/adf-team-mapper.ts`

```typescript
async initializeFromADF(adf: ArchitectureDefinition): Promise<void> {
  for (const container of adf.c4Model.containers) {
    const team = container.team;
    const repos = this.extractRepositories(container);
    
    // Only repos from ADF are added to mapping
    this.teamMapping[team] = {
      repositories: repos,
      containerIds: [container.id]
    };
  }
}

getTeamRepositories(team: string): string[] {
  // Returns ONLY repos from ADF
  return this.teamMapping[team]?.repositories || [];
}
```

### 3. MetricsAggregator Uses ADF Repos
**File**: `packages/repo-dashboard/src/services/metrics-aggregator.ts`

```typescript
async aggregateTeamMetrics(org: string, team: string, period: '30d'): Promise<TeamMetrics> {
  // Get repos from ADF (via ADFTeamMapper)
  const repos = this.getTeamRepositories(team);
  
  // Fetch metrics ONLY for ADF repos
  for (const repo of repos) {
    const repoName = repo.split('/')[1];
    
    // GitHub API calls ONLY for ADF repos
    const prMetrics = await prMetricsCollector.collectPRMetrics(org, repoName, days);
    const deployMetrics = await deploymentMetricsCollector.collectDeploymentMetrics(org, repoName, days);
    
    // ... aggregate
  }
}
```

### 4. Collectors Make GitHub Calls
**File**: `packages/repo-dashboard/src/services/pull-request-metrics-collector.ts`

```typescript
async collectPRMetrics(org: string, repo: string, days: number) {
  // GitHub API call - ONLY for repos passed from MetricsAggregator
  // Which came from ADF
  const endpoint = `/repos/${org}/${repo}/pulls`;
  const response = await fetchGitHub<any>(endpoint);
  // Example: /repos/BPMSoftwareSolutions/renderx-plugins-canvas/pulls
}
```

---

## ✅ Proof: ADF Controls Everything

### Test 1: Add a New Repository to ADF
1. Edit `renderx-plugins-demo-adf.json`
2. Add new container with team and repository
3. Restart server
4. **Result**: New repository automatically appears in dashboard metrics
5. **No code changes needed**

### Test 2: Remove a Repository from ADF
1. Edit `renderx-plugins-demo-adf.json`
2. Remove container
3. Restart server
4. **Result**: Repository no longer appears in dashboard
5. **No code changes needed**

### Test 3: Change Team Assignment
1. Edit `renderx-plugins-demo-adf.json`
2. Change container's `team` field
3. Restart server
4. **Result**: Repository now appears under different team
5. **No code changes needed**

---

## 🎯 Why This Design?

### 1. Single Source of Truth
- ADF is the ONLY place where team/repo relationships are defined
- No duplication in code
- No hardcoded lists

### 2. Automatic Synchronization
- Change ADF → Dashboard updates automatically
- No manual code updates needed
- No risk of getting out of sync

### 3. Scalability
- Add 10 new repositories → Just update ADF
- Add 5 new teams → Just update ADF
- No code changes needed

### 4. Consistency
- All services use same ADF data
- All GitHub API calls respect ADF definitions
- All dashboard displays reflect ADF structure

---

## 📍 Summary

**ADF is the Gatekeeper because:**

1. **ADF defines** which teams and repositories exist
2. **ADFTeamMapper reads** ADF and creates team → repo mappings
3. **MetricsAggregator uses** these mappings to determine which repos to fetch
4. **Collectors fetch** GitHub data ONLY for ADF-approved repos
5. **Dashboard displays** metrics ONLY for ADF-defined teams/repos

**Change ADF → Everything changes automatically**

**The flow is:**
```
ADF → ADFTeamMapper → MetricsAggregator → Collectors → GitHub APIs → Dashboard
```

**Each step only processes data that came from ADF, ensuring ADF is the single source of truth.**

