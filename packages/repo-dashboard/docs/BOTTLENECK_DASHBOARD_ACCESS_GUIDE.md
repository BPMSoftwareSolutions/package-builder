# 🚨 Bottleneck Detection Dashboard - Access Guide

**Status**: ✅ **LIVE AND ACCESSIBLE**  
**Component**: `BottleneckDetectionDashboard.tsx`  
**Route**: `bottleneck`  
**Issue**: #131 (Child of #130)

---

## 🚀 Quick Start

### Option 1: Via Navigation Menu (Easiest)

1. **Start the dev server**:
   ```bash
   npm run dev
   ```

2. **Open in browser**:
   ```
   http://localhost:5173
   ```

3. **Click the menu item**:
   - Look for **🚨 Bottleneck Detection** in the main navigation bar
   - Located between "Conductor Logs" and "Repositories"
   - Click to navigate to the dashboard

### Option 2: Direct Navigation (Programmatic)

```typescript
// From any component with access to onNavigate
onNavigate('bottleneck');
```

### Option 3: URL Navigation (Future)

When routing is fully implemented:
```
http://localhost:5173/bottleneck
```

---

## 📍 Navigation Menu Location

The Bottleneck Detection Dashboard is integrated into the main navigation menu:

```
📊 RenderX CI/CD Dashboard
├── Home
├── Architecture
├── Metrics
├── Insights
├── Flow
├── Learning
├── Collaboration
├── Conductor Logs
├── 🚨 Bottleneck Detection  ← YOU ARE HERE
├── Repositories
├── Issues
└── Packages
```

---

## 📊 Dashboard Overview

### What You'll See

The Bottleneck Detection Dashboard displays:

#### **Header Section**
- Title: "Bottleneck Detection & Constraint Radar"
- Problem subtitle: "Problem #1: Bottlenecks and Long Lead Times"
- Time range selector (24h, 7d, 30d)
- Refresh button

#### **Critical Alert Banner**
- Red alert showing critical bottleneck status
- Impact metrics (e.g., "34 PRs blocked")

#### **Key Metrics** (4 tiles)
- **Avg Lead Time**: 28.3 hrs
- **PRs Waiting**: 34
- **Top Bottleneck**: Code Review
- **Fastest Stage**: Build

#### **Main Visualizations**
- **Constraint Radar**: SVG bubble chart showing bottleneck severity
- **Pipeline Stage Times**: Horizontal bar charts with time breakdown

#### **Detailed Analysis**
- **Code Review Bottleneck**: Reviewer load analysis
- **Sequential Build/Test Pipeline**: Parallelization opportunities

#### **Repository Details**
- Most affected repositories
- PRs waiting per repo
- Bottleneck type per repo
- Trend indicators (↑ worsening, → stable, ↓ improving)

#### **Action Plan**
- Prioritized recommendations
- Implementation timeline
- Expected impact

---

## 🎨 Visual Design

### Color Scheme
- **Background**: Dark gradient (slate-900 to slate-800)
- **Critical**: Red (#dc2626)
- **Warning**: Orange (#ea580c)
- **Healthy**: Green (#22c55e)
- **Text**: White (primary), slate-400 (secondary)

### Components
- Semi-transparent cards with subtle borders
- Lucide React icons throughout
- Responsive grid layouts
- Smooth transitions and hover effects

### Responsive Design
- **Mobile**: Single column layout
- **Tablet**: 2-column layout
- **Desktop**: 3-4 column layout

---

## 🔧 Technical Details

### Files Modified

**1. `packages/repo-dashboard/src/web/App.tsx`**
```typescript
// Added import
import BottleneckDetectionDashboard from './pages/BottleneckDetectionDashboard';

// Added to Page type
type Page = '...' | 'bottleneck';

// Added rendering logic
{currentPage === 'bottleneck' && <BottleneckDetectionDashboard />}
```

**2. `packages/repo-dashboard/src/web/components/Navigation.tsx`**
```typescript
<li>
  <a
    className={`nav-link ${currentPage === 'bottleneck' ? 'active' : ''}`}
    onClick={() => onNavigate('bottleneck')}
  >
    🚨 Bottleneck Detection
  </a>
</li>
```

### Component Structure

```
BottleneckDetectionDashboard
├── Header
├── Critical Alert Banner
├── Key Metrics Row (4 tiles)
├── Main Content (2 columns)
│   ├── Constraint Radar
│   └── Pipeline Stage Times
├── Constraint Details (2 expandable sections)
├── Most Affected Repositories
└── Action Plan
```

### Sub-Components

- `MetricTile` - Key metric display
- `StageBar` - Pipeline stage progress bar
- `ReviewerLoad` - Reviewer capacity visualization
- `ConstraintDetail` - Expandable constraint details
- `RepoBottleneckRow` - Repository bottleneck info
- `ActionItem` - Action plan item
- `ConstraintRadar` - SVG constraint visualization

---

## 📈 Next Steps

### Immediate (This Week)
- [ ] Wire to real data from services
- [ ] Implement data fetching with loading states
- [ ] Add error handling

### Short Term (Next Week)
- [ ] Write unit tests
- [ ] Test responsive design
- [ ] Verify accessibility (WCAG 2.1 AA)

### Medium Term (2-3 Weeks)
- [ ] Create remaining 9 dashboards
- [ ] Implement drill-down capabilities
- [ ] Add export functionality

---

## 🐛 Troubleshooting

### Dashboard Not Showing?

1. **Check dev server is running**:
   ```bash
   npm run dev
   ```

2. **Clear browser cache**:
   - Press `Ctrl+Shift+Delete` (or `Cmd+Shift+Delete` on Mac)
   - Clear cache and reload

3. **Check console for errors**:
   - Press `F12` to open DevTools
   - Check Console tab for any errors

### Menu Item Not Visible?

1. **Verify Navigation.tsx was updated**:
   ```bash
   grep -n "Bottleneck Detection" packages/repo-dashboard/src/web/components/Navigation.tsx
   ```

2. **Verify App.tsx was updated**:
   ```bash
   grep -n "bottleneck" packages/repo-dashboard/src/web/App.tsx
   ```

3. **Restart dev server**:
   ```bash
   npm run dev
   ```

---

## 📞 Support

For issues or questions:
- Check GitHub Issue #131
- Review the implementation documentation
- Check the component code comments

---

## 🎯 Success Criteria

✅ Dashboard component created and renders  
✅ Navigation menu item added  
✅ Route configured in App.tsx  
✅ Accessible via menu click  
⏳ Real data integration (in progress)  
⏳ Unit tests (pending)  
⏳ Accessibility verification (pending)  

---

**Status**: 🚀 **READY TO USE**

The Bottleneck Detection Dashboard is now live and accessible from the main navigation menu!

