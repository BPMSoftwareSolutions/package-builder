# Real-Time Feedback Dashboard - Access Guide

## Overview

The Real-Time Feedback Dashboard (Phase 1.9.1) provides live feedback on alerts, build status, test results, and deployment status for your repositories. It connects to 42 backend services to solve 10 flow problems identified in The Phoenix Project.

## ✅ How to Access the Features

### 1. **Via Web UI Navigation** (RECOMMENDED)

The Feedback Dashboard is accessible through the main navigation menu:

1. **Open the repo-dashboard web application**
   - Local: `http://localhost:3000`
   - Production: `https://your-dashboard-url.com`

2. **Look for the navigation bar at the top:**
   ```
   📊 Dashboard | Architecture | Metrics | Insights | 📡 Feedback | Repositories | Issues | Packages | ⚙️ Settings
   ```

3. **Click on "📡 Feedback"** to access the Real-Time Feedback Dashboard

### 2. **What You'll See**

Once you click on the Feedback menu item, you'll see:

**Header Section:**
- Organization selector (defaults to: BPMSoftwareSolutions)
- Repository selector (auto-populated from selected org)
- Connection status indicator (green = connected, red = disconnected)

**Dashboard Content (4 Main Sections):**

#### Section 1: Feedback Summary Card (Top)
- Overall health score (0-100)
- Trend indicator (Improving/Stable/Degrading)
- Quick summary of alerts, builds, tests, and deployments

#### Section 2: Alerts Panel (Left)
- All active alerts with severity levels
- Filter by severity: Critical, High, Medium, Low
- Filter by status: Active, Acknowledged, Resolved
- Real-time updates every 30 seconds

#### Section 3: Build Status Card (Right)
- Current build status (Passing/Failing/Flaky)
- Success rate percentage
- Flakiness percentage
- Recent failure reasons

#### Section 4: Test Results Panel (Left)
- Test pass/fail counts
- Overall pass rate
- Code coverage percentage with trend
- Failed test details
- Coverage by module

#### Section 5: Deployment Status Card (Right)
- Current deployment status
- Deployment duration
- Rollback history and count
- Deployment frequency
- Success rate

## 🎯 Quick Start

### Step 1: Start the Dashboard
```bash
cd packages/repo-dashboard
npm run dev
# Opens at http://localhost:3000
```

### Step 2: Navigate to Feedback Dashboard
- Click **📡 Feedback** in the top navigation menu

### Step 3: Select Organization & Repository
- Organization defaults to: **BPMSoftwareSolutions**
- Select a repository from the dropdown
- Dashboard auto-loads all feedback data

### Step 4: Monitor Real-Time Feedback
- Watch for real-time updates (WebSocket or polling)
- Check connection status indicator (top right)
- Filter alerts by severity and status as needed

## 📊 Dashboard Components Explained

### 1. Feedback Summary Card (Top)
**What it shows:**
- Single health score (0-100) aggregating all signals
- Trend: Is health improving, stable, or degrading?
- Quick counts: # of alerts, build status, test coverage, deployments

**Use case:** Get a quick pulse on overall system health

### 2. Alerts Panel (Left Side)
**What it shows:**
- All active alerts with color-coded severity
- Alert title, description, timestamp, affected repo
- Filtering options for severity and status

**Use case:** Identify and triage issues quickly

**Severity Levels:**
- 🔴 **Critical** - Immediate action required
- 🟠 **High** - Should be addressed soon
- 🟡 **Medium** - Monitor and plan fix
- 🟢 **Low** - Track for future improvement

### 3. Build Status Card (Right Side)
**What it shows:**
- Current build status (Passing/Failing/Flaky)
- Success rate % (how often builds pass)
- Flakiness % (how often builds are inconsistent)
- Recent failure reasons

**Use case:** Understand build reliability and identify patterns

### 4. Test Results Panel (Left Bottom)
**What it shows:**
- Total tests, pass count, fail count
- Pass rate percentage
- Code coverage % with trend (up/down/stable)
- Failed test details
- Coverage breakdown by module
- Test execution time

**Use case:** Track test quality and coverage trends

### 5. Deployment Status Card (Right Bottom)
**What it shows:**
- Current deployment status (In-Progress/Success/Failed/Rolled-Back)
- How long deployments take
- Rollback count and history
- Deployment frequency
- Success rate
- Recent deployment history

**Use case:** Monitor deployment health and frequency

## Real-Time Updates

All components support real-time updates through:
- **WebSocket Connection**: For instant updates when available
- **Polling**: 30-60 second intervals as fallback
- **Connection Status**: Indicator shows if connected to real-time updates

## API Endpoints

The Feedback Dashboard connects to these backend endpoints:

```
GET /api/metrics/alerts/:org
GET /api/metrics/alerts/:org/:team
GET /api/metrics/build-status/:org/:repo
GET /api/metrics/test-results/:org/:repo
GET /api/metrics/deployment-status/:org/:repo
GET /api/metrics/feedback-summary/:org/:team
```

## Customization

### Organization & Repository Selection

The dashboard defaults to:
- **Organization**: BPMSoftwareSolutions
- **Team**: (optional, for team-specific metrics)

You can change these through the dashboard UI selectors.

## Troubleshooting

### No Data Showing?
1. Verify the organization and repository names are correct
2. Check that the backend services are running
3. Ensure WebSocket connection is established (check connection indicator)

### Real-Time Updates Not Working?
1. Check browser console for WebSocket errors
2. Verify backend WebSocket server is running
3. Check network connectivity
4. Dashboard will fall back to polling if WebSocket fails

### Styling Issues?
1. Ensure dark mode CSS is loaded (check browser DevTools)
2. Clear browser cache and reload
3. Check that CSS variables are properly defined in `dark-mode.css`

## File Locations

- **Components**: `packages/repo-dashboard/src/web/components/`
  - `AlertsPanel.tsx`
  - `BuildStatusCard.tsx`
  - `TestResultsPanel.tsx`
  - `DeploymentStatusCard.tsx`
  - `FeedbackSummaryCard.tsx`

- **Pages**: `packages/repo-dashboard/src/web/pages/`
  - `FeedbackDashboard.tsx`

- **Hooks**: `packages/repo-dashboard/src/web/hooks/`
  - `useWebSocket.ts`

- **Tests**: `packages/repo-dashboard/test/web/`
  - Component and hook tests

## Related Documentation

- [Phase 1.9.1 Implementation Details](./PHASE_1_9_1_IMPLEMENTATION.md)
- [Backend Services Documentation](./DETAILED_SERVICE_ENDPOINT_MAPPING.md)
- [Architecture Overview](./ARCHITECTURE.md)

