# Current ADF Repositories - What's Being Tracked

## 📋 Current Teams and Repositories in ADF

The `renderx-plugins-demo-adf.json` file currently defines these teams and repositories:

### 1. Host Team
**Repository**: `BPMSoftwareSolutions/renderx-plugins-demo`
- **Container ID**: `host-app`
- **Name**: RenderX Host Application
- **Type**: Web Application
- **Technology**: React 19, TypeScript, Vite
- **Responsibility**: Plugin system initialization, manifest-driven plugin loading, UI slot management

### 2. SDK Team
**Repositories**: 
- `BPMSoftwareSolutions/renderx-plugins-sdk`
- `BPMSoftwareSolutions/renderx-manifest-tools`

- **Container ID**: `plugin-system`
- **Name**: Plugin System
- **Type**: Library
- **Technology**: TypeScript, Node.js
- **Responsibility**: Plugin interface definitions, manifest schema validation, plugin lifecycle management

### 3. Conductor Team
**Repository**: `BPMSoftwareSolutions/musical-conductor`
- **Container ID**: `orchestration-engine`
- **Name**: MusicalConductor Orchestration Engine
- **Type**: Library
- **Technology**: TypeScript, Node.js
- **Responsibility**: Plugin coordination, workflow orchestration, event management

### 4. Canvas Team
**Repository**: `BPMSoftwareSolutions/renderx-plugins-canvas`
- **Container ID**: `plugin-canvas`
- **Name**: Canvas Plugin
- **Type**: Plugin
- **Technology**: React, TypeScript
- **Responsibility**: Canvas rendering, drawing operations, canvas orchestration

### 5. Components Team
**Repository**: `BPMSoftwareSolutions/renderx-plugins-components`
- **Container ID**: `plugin-components`
- **Name**: Components Plugin
- **Type**: Plugin
- **Technology**: React, TypeScript
- **Responsibility**: Component library, component rendering, component orchestration

### 6. Control Panel Team
**Repository**: `BPMSoftwareSolutions/renderx-plugins-control-panel`
- **Container ID**: `plugin-control-panel`
- **Name**: Control Panel Plugin
- **Type**: Plugin
- **Technology**: React, TypeScript
- **Responsibility**: Control panel UI, settings management, configuration interface

### 7. Header Team
**Repository**: `BPMSoftwareSolutions/renderx-plugins-header`
- **Container ID**: `plugin-header`
- **Name**: Header Plugin
- **Type**: Plugin
- **Technology**: React, TypeScript
- **Responsibility**: Header UI, navigation, branding

### 8. Library Team
**Repository**: `BPMSoftwareSolutions/renderx-plugins-library`
- **Container ID**: `plugin-library`
- **Name**: Library Plugin
- **Type**: Plugin
- **Technology**: React, TypeScript
- **Responsibility**: Library management, asset organization, resource discovery

### 9. DevOps Team
**Repository**: `BPMSoftwareSolutions/renderx-plugins-demo`
- **Container ID**: `artifact-system`
- **Name**: Artifact System
- **Type**: Build System
- **Technology**: Node.js, Crypto
- **Responsibility**: Manifest generation, artifact bundling, integrity verification

---

## 🔄 How These Repositories Are Used

### When Dashboard Starts
1. **Server initializes** `MetricsAggregator`
2. **MetricsAggregator fetches** ADF from GitHub
3. **ADFTeamMapper extracts** team → repository mappings
4. **Services are ready** to fetch GitHub metrics

### When User Requests Metrics
1. **User clicks** "Metrics" dashboard
2. **Dashboard calls** `/api/metrics?team=Canvas%20Team`
3. **MetricsAggregator gets** repositories for Canvas Team from ADF
4. **Returns**: `['BPMSoftwareSolutions/renderx-plugins-canvas']`
5. **Collectors fetch** GitHub data for that repository:
   - Pull Requests: `/repos/BPMSoftwareSolutions/renderx-plugins-canvas/pulls`
   - Deployments: `/repos/BPMSoftwareSolutions/renderx-plugins-canvas/deployments`
   - Actions: `/repos/BPMSoftwareSolutions/renderx-plugins-canvas/actions/runs`
   - Releases: `/repos/BPMSoftwareSolutions/renderx-plugins-canvas/releases`
   - Code Scanning: `/repos/BPMSoftwareSolutions/renderx-plugins-canvas/code-scanning/alerts`
6. **Dashboard displays** aggregated metrics

---

## 📊 GitHub API Calls Made

For each repository in ADF, the dashboard makes these GitHub API calls:

```
GET /repos/BPMSoftwareSolutions/renderx-plugins-demo/pulls
GET /repos/BPMSoftwareSolutions/renderx-plugins-demo/deployments
GET /repos/BPMSoftwareSolutions/renderx-plugins-demo/actions/runs
GET /repos/BPMSoftwareSolutions/renderx-plugins-demo/releases
GET /repos/BPMSoftwareSolutions/renderx-plugins-demo/code-scanning/alerts

GET /repos/BPMSoftwareSolutions/renderx-plugins-sdk/pulls
GET /repos/BPMSoftwareSolutions/renderx-plugins-sdk/deployments
... (same for each repo)

GET /repos/BPMSoftwareSolutions/renderx-manifest-tools/pulls
... (same for each repo)

GET /repos/BPMSoftwareSolutions/musical-conductor/pulls
... (same for each repo)

GET /repos/BPMSoftwareSolutions/renderx-plugins-canvas/pulls
... (same for each repo)

GET /repos/BPMSoftwareSolutions/renderx-plugins-components/pulls
... (same for each repo)

GET /repos/BPMSoftwareSolutions/renderx-plugins-control-panel/pulls
... (same for each repo)

GET /repos/BPMSoftwareSolutions/renderx-plugins-header/pulls
... (same for each repo)

GET /repos/BPMSoftwareSolutions/renderx-plugins-library/pulls
... (same for each repo)
```

---

## ✅ Key Points

### 1. ADF Defines Everything
- **9 teams** are defined in ADF
- **9 repositories** are tracked
- **No hardcoded lists** in code
- **Single source of truth**

### 2. All GitHub API Calls Respect ADF
- Only repositories in ADF are fetched
- Only teams in ADF are displayed
- Only metrics for ADF repos are aggregated

### 3. To Add a New Repository
1. Edit `renderx-plugins-demo-adf.json`
2. Add new container with team and repository
3. Restart server
4. **Done** - Dashboard automatically includes new repo

### 4. To Remove a Repository
1. Edit `renderx-plugins-demo-adf.json`
2. Remove container
3. Restart server
4. **Done** - Dashboard no longer tracks that repo

---

## 📍 File Location

**ADF File**: `packages/repo-dashboard/docs/renderx-plugins-demo-adf.json`

**GitHub Location**: 
- Repository: `BPMSoftwareSolutions/renderx-plugins-demo`
- Branch: `main`
- Path: `docs/renderx-plugins-demo-adf.json`

**Raw URL**: 
```
https://raw.githubusercontent.com/BPMSoftwareSolutions/renderx-plugins-demo/main/docs/renderx-plugins-demo-adf.json
```

---

## 🎯 Summary

**The ADF file currently drives GitHub API calls for:**

| Team | Repository | Container ID |
|------|-----------|--------------|
| Host Team | renderx-plugins-demo | host-app |
| SDK Team | renderx-plugins-sdk | plugin-system |
| SDK Team | renderx-manifest-tools | plugin-system |
| Conductor Team | musical-conductor | orchestration-engine |
| Canvas Team | renderx-plugins-canvas | plugin-canvas |
| Components Team | renderx-plugins-components | plugin-components |
| Control Panel Team | renderx-plugins-control-panel | plugin-control-panel |
| Header Team | renderx-plugins-header | plugin-header |
| Library Team | renderx-plugins-library | plugin-library |
| DevOps Team | renderx-plugins-demo | artifact-system |

**Total**: 9 teams, 9 repositories (with SDK Team having 2 repos)

**All GitHub API calls are made ONLY for these repositories.**

