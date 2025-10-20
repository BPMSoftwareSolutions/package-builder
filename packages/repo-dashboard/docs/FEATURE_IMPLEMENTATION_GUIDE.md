# 🛠️ Feature Implementation Guide - Bottleneck Dashboard

**Issue**: #131  
**Current Status**: 50% Complete (7/14 features)  
**Date**: 2025-10-20

---

## 📋 Quick Reference

### ✅ Implemented (7 features)
1. Header with Title & Subtitle
2. Time Range Selector
3. Refresh Button
4. Critical Alert Banner
5. Key Metrics (4 tiles)
6. Pipeline Stage Times
7. Code Review Bottleneck Detail

### ❌ Missing (7 features)
8. Constraint Radar (Heat Map)
9. Sequential Build/Test Pipeline
10. Most Affected Repositories
11. Recommended Actions (Code Review)
12. Recommended Actions (Pipeline)
13. Action Plan Section
14. TrendingDown Icon

---

## 🔧 Implementation Details

### Feature #8: Constraint Radar (Heat Map)

**Priority**: HIGH  
**Complexity**: HIGH  
**Estimated Time**: 2-3 hours  
**Lines of Code**: ~60

**What it does**:
- SVG-based bubble chart visualization
- Shows constraint severity with bubble size/color
- 5 constraints: Review, E2E Tests, Approval, Build, Deploy
- Interactive hover effects
- Legend with 4 severity levels

**Implementation approach**:
```tsx
const ConstraintRadar = () => {
  return (
    <div style={styles.card}>
      <h2>Constraint Radar (Bottleneck Heat Map)</h2>
      <svg viewBox="0 0 300 300">
        {/* Background rings */}
        <circle cx="150" cy="150" r="120" ... />
        <circle cx="150" cy="150" r="85" ... />
        <circle cx="150" cy="150" r="50" ... />
        
        {/* Axes */}
        <line x1="150" y1="30" x2="150" y2="270" ... />
        <line x1="30" y1="150" x2="270" y2="150" ... />
        
        {/* Constraint bubbles */}
        <circle cx="210" cy="100" r="35" fill="var(--danger-color)" />
        <text x="210" y="105">Review</text>
        
        {/* More bubbles... */}
      </svg>
      
      {/* Legend */}
      <div style={styles.legend}>
        <div>🔴 Critical (18+ hrs)</div>
        <div>🟠 High (8-18 hrs)</div>
        <div>🟡 Medium (2-8 hrs)</div>
        <div>🟢 Healthy (&lt;2 hrs)</div>
      </div>
    </div>
  );
};
```

**Key considerations**:
- Use CSS variables for colors
- Make SVG responsive with viewBox
- Add hover effects for interactivity
- Position bubbles to represent severity

---

### Feature #10: Most Affected Repositories

**Priority**: HIGH  
**Complexity**: MEDIUM  
**Estimated Time**: 1-2 hours  
**Lines of Code**: ~40

**What it does**:
- Table showing 5 repos with bottleneck details
- Columns: Repo, Bottleneck, PRs Waiting, Avg Wait, Trend
- Color-coded trend indicators (↑ Worsening, → Stable, ↓ Improving)

**Implementation approach**:
```tsx
const RepoBottleneckRow = ({ repo, prsWaiting, avgWait, bottleneck, trend }) => {
  const trendColor = trend.includes('Worsening') 
    ? 'var(--danger-color)' 
    : trend.includes('Improving') 
    ? 'var(--success-color)' 
    : 'var(--warning-color)';

  return (
    <div style={styles.repoRow}>
      <div>
        <p style={styles.repoName}>{repo}</p>
        <p style={styles.bottleneck}>{bottleneck}</p>
      </div>
      <div style={styles.metrics}>
        <div>
          <p style={{ color: 'var(--danger-color)' }}>{prsWaiting}</p>
          <p>PRs waiting</p>
        </div>
        <div>
          <p style={{ color: 'var(--warning-color)' }}>{avgWait}</p>
          <p>avg wait</p>
        </div>
        <div style={{ color: trendColor }}>{trend}</div>
      </div>
    </div>
  );
};
```

**Data structure**:
```tsx
const repos = [
  { repo: 'plugin-validator', prsWaiting: 12, avgWait: '22.3 hrs', bottleneck: 'Review', trend: '↑ Worsening' },
  { repo: 'conductor-core', prsWaiting: 8, avgWait: '19.1 hrs', bottleneck: 'Review + E2E Tests', trend: '→ Stable' },
  { repo: 'valence-rules', prsWaiting: 7, avgWait: '15.8 hrs', bottleneck: 'Approval', trend: '↓ Improving' },
  { repo: 'thin-host', prsWaiting: 4, avgWait: '28.5 hrs', bottleneck: 'All stages sequential', trend: '↑ Worsening' },
  { repo: 'renderx-cli', prsWaiting: 3, avgWait: '12.4 hrs', bottleneck: 'Build', trend: '↓ Improving' },
];
```

---

### Feature #9: Sequential Build/Test Pipeline

**Priority**: MEDIUM  
**Complexity**: MEDIUM  
**Estimated Time**: 1-2 hours  
**Lines of Code**: ~50

**What it does**:
- Expandable constraint detail section
- Shows current sequential flow vs potential parallelized flow
- Displays time savings percentage
- Includes recommended actions

**Implementation approach**:
```tsx
<ConstraintDetail 
  title="Sequential Build/Test Pipeline"
  status="warning"
  expanded={expandedConstraint === 'pipeline'}
  onToggle={() => setExpandedConstraint(...)}
>
  <div>
    <h4>Current Flow (Sequential)</h4>
    <div>Build ████████ 4.2m</div>
    <div>↓ Unit Tests ████████ 6.8m</div>
    <div>↓ E2E Tests ████████ 12.3m</div>
    <p>Total: 23.3 minutes</p>
    
    <h4>Potential (Parallelized)</h4>
    <div>Build ████████ 4.2m</div>
    <div>Unit + E2E ████████ 12.3m</div>
    <p>Total: 16.5 minutes (-47% faster!)</p>
    
    <h4>✅ Recommended Actions</h4>
    <ul>
      <li>Parallelize unit and E2E tests</li>
      <li>Use matrix builds for plugins</li>
      <li>Cache dependencies to speed build</li>
    </ul>
  </div>
</ConstraintDetail>
```

---

### Features #11 & #12: Recommended Actions

**Priority**: MEDIUM  
**Complexity**: LOW  
**Estimated Time**: 30 minutes  
**Lines of Code**: ~20

**What it does**:
- Add action items to expandable constraint sections
- Green text for recommended actions
- Bullet-point list format

**Implementation approach**:
Add to existing ConstraintDetail sections:
```tsx
<div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
  <h4 style={{ color: 'var(--success-color)' }}>✅ Recommended Actions</h4>
  <ul style={{ color: 'var(--success-color)', fontSize: '0.85rem' }}>
    <li>• Distribute reviews to Carol (3/4 capacity)</li>
    <li>• Enable auto-approval for minor changes</li>
    <li>• Enforce review limit of 8 per reviewer</li>
  </ul>
</div>
```

---

### Feature #13: Action Plan Section

**Priority**: MEDIUM  
**Complexity**: MEDIUM  
**Estimated Time**: 1 hour  
**Lines of Code**: ~30

**What it does**:
- Section at bottom with 4 prioritized action items
- HIGH priority items in red, MEDIUM in yellow
- Includes title, description, and timeline

**Implementation approach**:
```tsx
const ActionItem = ({ priority, title, description, time }) => {
  const priorityColor = priority === 'high' 
    ? 'var(--danger-color)' 
    : 'var(--warning-color)';

  return (
    <div style={{
      backgroundColor: `${priorityColor}20`,
      border: `1px solid ${priorityColor}`,
      borderRadius: '4px',
      padding: '1rem',
    }}>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <div style={{
          backgroundColor: priorityColor,
          color: 'white',
          padding: '0.25rem 0.5rem',
          borderRadius: '4px',
          fontSize: '0.75rem',
          fontWeight: 'bold',
        }}>
          {priority.toUpperCase()}
        </div>
        <div>
          <p style={{ fontWeight: 'bold' }}>{title}</p>
          <p style={{ fontSize: '0.85rem' }}>{description}</p>
          <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>{time}</p>
        </div>
      </div>
    </div>
  );
};
```

---

### Feature #14: TrendingDown Icon

**Priority**: LOW  
**Complexity**: LOW  
**Estimated Time**: 5 minutes  
**Lines of Code**: 1

**What it does**:
- Import TrendingDown icon from lucide-react
- Currently unused but available for future features

**Implementation**:
```tsx
import { ..., TrendingDown } from 'lucide-react';
```

---

## 📊 Implementation Checklist

### Phase 1: HIGH Priority
- [ ] Create ConstraintRadar component
- [ ] Add SVG visualization with 5 bubbles
- [ ] Add legend with 4 severity levels
- [ ] Create RepoBottleneckRow component
- [ ] Add Most Affected Repositories section
- [ ] Wire data to components

### Phase 2: MEDIUM Priority
- [ ] Add Sequential Pipeline constraint detail
- [ ] Add recommended actions to Code Review section
- [ ] Add recommended actions to Pipeline section
- [ ] Create ActionItem component
- [ ] Add Action Plan section at bottom

### Phase 3: LOW Priority
- [ ] Import TrendingDown icon
- [ ] Test responsive design
- [ ] Optimize performance

---

## 🧪 Testing Checklist

- [ ] All components render without errors
- [ ] CSS variables applied correctly
- [ ] Responsive on mobile/tablet/desktop
- [ ] Expandable sections toggle correctly
- [ ] Colors match prototype
- [ ] Icons display properly
- [ ] Data flows correctly
- [ ] No console errors

---

**Next Step**: Start with Feature #8 (Constraint Radar) as it provides the most visual impact!

