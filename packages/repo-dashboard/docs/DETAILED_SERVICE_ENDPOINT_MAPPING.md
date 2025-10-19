# Detailed Service → Endpoint → Component Mapping

## Phase 1: Flow Services (13 services, 0 UI components)

```
┌─────────────────────────────────────────────────────────────────────┐
│ PullRequestMetricsCollector                                         │
├─────────────────────────────────────────────────────────────────────┤
│ Endpoints:                                                          │
│  • GET /api/metrics/value-stream/:org/:repo                        │
│  • GET /api/metrics/team/:team                                     │
│ UI Component: ❌ MISSING                                            │
│ Needed: ValueStreamCard, PRFlowChart                               │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ DeploymentMetricsCollector                                          │
├─────────────────────────────────────────────────────────────────────┤
│ Endpoints:                                                          │
│  • GET /api/metrics/deployment/:org/:repo                          │
│  • GET /api/metrics/teams                                          │
│ UI Component: ❌ MISSING                                            │
│ Needed: DeploymentFrequencyChart, DeploymentSuccessRate            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ WIPTracker                                                          │
├─────────────────────────────────────────────────────────────────────┤
│ Endpoints:                                                          │
│  • GET /api/metrics/wip/:org/:team                                 │
│  • GET /api/metrics/wip-alerts/:org/:team                          │
│ UI Component: ❌ MISSING                                            │
│ Needed: WIPGauge, WIPTrendChart, WIPAlerts                         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ FlowStageAnalyzer                                                   │
├─────────────────────────────────────────────────────────────────────┤
│ Endpoints:                                                          │
│  • GET /api/metrics/flow-stages/:org/:repo                         │
│ UI Component: ❌ MISSING                                            │
│ Needed: FlowStageBreakdown, StageTimeChart                         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ DeployCadence                                                       │
├─────────────────────────────────────────────────────────────────────┤
│ Endpoints:                                                          │
│  • GET /api/metrics/deploy-cadence/:org/:repo                      │
│ UI Component: ❌ MISSING                                            │
│ Needed: DeployCadenceChart, DeployFrequencyTrend                   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ ConstraintDetection                                                 │
├─────────────────────────────────────────────────────────────────────┤
│ Endpoints:                                                          │
│  • GET /api/metrics/constraints/:org                               │
│  • GET /api/metrics/constraints/:org/:team                         │
│  • GET /api/metrics/constraints/:org/:team/:repo                   │
│  • GET /api/metrics/bottlenecks/:org                               │
│  • GET /api/metrics/constraint-history/:org/:team/:repo            │
│  • POST /api/metrics/constraints/:org/:team/acknowledge            │
│ UI Component: ❌ MISSING                                            │
│ Needed: ConstraintRadar, BottleneckAlert, ConstraintTrend          │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ ConductorMetricsCollector                                           │
├─────────────────────────────────────────────────────────────────────┤
│ Endpoints:                                                          │
│  • GET /api/metrics/conductor/:org                                 │
│  • GET /api/metrics/conductor/:org/:repo                           │
│ UI Component: ❌ MISSING                                            │
│ Needed: ConductorThroughputChart, QueueLengthGauge                 │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ BundleMetricsCollector                                              │
├─────────────────────────────────────────────────────────────────────┤
│ Endpoints:                                                          │
│  • GET /api/metrics/bundle/:org                                    │
│  • GET /api/metrics/bundle/:org/:repo                              │
│  • GET /api/metrics/bundle-alerts/:org                             │
│ UI Component: ❌ MISSING                                            │
│ Needed: BundleSizeGauge, BudgetStatus, BundleAlerts                │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ ArchitectureValidationCollector                                     │
├─────────────────────────────────────────────────────────────────────┤
│ Endpoints:                                                          │
│  • GET /api/metrics/architecture-validation/:org                   │
│  • GET /api/metrics/architecture-validation/:org/:repo             │
│ UI Component: ❌ MISSING                                            │
│ Needed: ValidationPassRate, ViolationsList, GateStatus             │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ PredictiveAnalysis                                                  │
├─────────────────────────────────────────────────────────────────────┤
│ Endpoints:                                                          │
│  • GET /api/metrics/predictive/:org/:team/:repo                    │
│ UI Component: ❌ MISSING                                            │
│ Needed: PredictionChart, TrendForecast, RiskIndicator              │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ RootCauseAnalysis, ADFRepositoryExtractor, MetricsAggregator       │
├─────────────────────────────────────────────────────────────────────┤
│ Status: Internal services (no direct endpoints)                    │
│ UI Component: ❌ MISSING                                            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Phase 2: Feedback Services (13 services, 1 UI component)

```
┌─────────────────────────────────────────────────────────────────────┐
│ TestCoverageCollector ✅ CONNECTED                                  │
├─────────────────────────────────────────────────────────────────────┤
│ Endpoints:                                                          │
│  • GET /api/metrics/coverage/:org                                  │
│  • GET /api/metrics/coverage/:org/:repo                            │
│  • GET /api/metrics/coverage/:org/:team                            │
│ UI Component: ✅ CoverageCard                                       │
│ Status: FULLY INTEGRATED                                           │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ CodeQualityCollector                                                │
├─────────────────────────────────────────────────────────────────────┤
│ Endpoints:                                                          │
│  • GET /api/metrics/quality/:org                                   │
│  • GET /api/metrics/quality/:org/:repo                             │
│ UI Component: ❌ MISSING (QualityMetricsCard exists but unused)     │
│ Needed: Connect QualityMetricsCard to endpoints                    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ TestExecutionCollector                                              │
├─────────────────────────────────────────────────────────────────────┤
│ Endpoints:                                                          │
│  • GET /api/metrics/tests/:org                                     │
│  • GET /api/metrics/tests/:org/:repo                               │
│ UI Component: ❌ MISSING (TestMetricsCard exists but unused)        │
│ Needed: Connect TestMetricsCard to endpoints                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ EnvironmentConfiguration, EnvironmentHealth, BuildEnvironment      │
├─────────────────────────────────────────────────────────────────────┤
│ Endpoints:                                                          │
│  • GET /api/metrics/environment/:org/:env                          │
│  • GET /api/metrics/environment-health/:org                        │
│  • GET /api/metrics/build-environment/:org/:repo                   │
│  • GET /api/metrics/environment-drift/:org                         │
│  • GET /api/metrics/environment-consistency/:org                   │
│ UI Component: ❌ MISSING                                            │
│ Needed: EnvironmentHealthDashboard, DriftDetectionPanel            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ ConfigurationDriftDetection                                         │
├─────────────────────────────────────────────────────────────────────┤
│ Endpoints: (see above)                                              │
│ UI Component: ❌ MISSING                                            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ BuildStatusService (NEW #83)                                        │
├─────────────────────────────────────────────────────────────────────┤
│ Endpoints:                                                          │
│  • GET /api/metrics/build-status/:org/:repo                        │
│ UI Component: ❌ MISSING                                            │
│ Needed: BuildStatusCard, FlakinessIndicator                        │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ TestResultsService (NEW #83)                                        │
├─────────────────────────────────────────────────────────────────────┤
│ Endpoints:                                                          │
│  • GET /api/metrics/test-results/:org/:repo                        │
│ UI Component: ❌ MISSING                                            │
│ Needed: TestResultsPanel, FailingTestsList                         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ DeploymentStatusService (NEW #83)                                   │
├─────────────────────────────────────────────────────────────────────┤
│ Endpoints:                                                          │
│  • GET /api/metrics/deployment-status/:org/:repo                   │
│ UI Component: ❌ MISSING                                            │
│ Needed: DeploymentStatusCard, RollbackIndicator                    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ AlertingService (NEW #83)                                           │
├─────────────────────────────────────────────────────────────────────┤
│ Endpoints:                                                          │
│  • GET /api/metrics/alerts/:org                                    │
│  • GET /api/metrics/alerts/:org/:team                              │
│  • POST /api/metrics/alerts/:org/:alertId/acknowledge              │
│  • POST /api/metrics/alerts/:org/:alertId/resolve                  │
│ UI Component: ❌ MISSING                                            │
│ Needed: AlertsPanel, AlertsList, AlertDetails                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ FeedbackAggregationService (NEW #83)                                │
├─────────────────────────────────────────────────────────────────────┤
│ Endpoints:                                                          │
│  • GET /api/metrics/feedback-summary/:org                          │
│ UI Component: ❌ MISSING                                            │
│ Needed: FeedbackSummaryCard, SignalAggregator                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ WebSocketManager (NEW #83)                                          │
├─────────────────────────────────────────────────────────────────────┤
│ Endpoints: WebSocket (Socket.IO)                                   │
│ UI Component: ❌ MISSING                                            │
│ Needed: Real-time update listeners in all components               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Phase 3 & 4: Learning & Collaboration (21 services, 0 UI components)

```
All 21 services have REST API endpoints but NO frontend visualization:

Phase 3 (Learning):
  • SkillInventory → /api/metrics/skill-inventory/*
  • KnowledgeSharing → /api/metrics/knowledge-sharing/*
  • BusFactorAnalysis → /api/metrics/bus-factor/*
  • CodeOwnership → /api/metrics/code-ownership/*
  • MetricsStorage → (internal)
  • DependencyHealth → /api/metrics/dependency-health/*
  • (2 more)

Phase 4 (Collaboration):
  • CrossTeamDependencyService → /api/metrics/dependencies/*
  • HandoffTrackingService → /api/metrics/handoffs/*
  • CrossTeamCommunicationService → /api/metrics/cross-team-communication/*
  • ADFCache, ADFFetcher → (internal)
  • (8 more)

UI Components: ❌ NONE
```

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Total Services | 42 |
| Services with Endpoints | 35 |
| Services with UI Components | 1 |
| UI Integration Rate | **2.4%** |
| Missing UI Components | 41 |
| REST API Endpoints | 73 |
| Web Pages | 9 |
| Web Components | 13 |

---

## Critical Gaps

### Immediate Needs (for Phase 1.8 Real-Time Alerting)
1. **AlertsPanel** - Display active alerts with severity
2. **AlertsList** - Detailed alert history
3. **FeedbackDashboard** - Aggregate feedback signals
4. **BuildStatusCard** - Build status visualization
5. **TestResultsPanel** - Test results display
6. **DeploymentStatusCard** - Deployment tracking

### High Priority (Phase 1 Flow)
1. **ValueStreamCard** - PR cycle time visualization
2. **DeploymentFrequencyChart** - Deployment trends
3. **WIPGauge** - Work-in-progress tracking
4. **ConstraintRadar** - Bottleneck identification
5. **ConductorThroughputChart** - Conductor metrics
6. **BundleSizeGauge** - Bundle budget tracking

### Medium Priority (Phase 2 Feedback)
1. Connect existing **QualityMetricsCard** to endpoints
2. Connect existing **TestMetricsCard** to endpoints
3. **EnvironmentHealthDashboard** - Environment status
4. **DriftDetectionPanel** - Configuration drift

### Long-term (Phase 3 & 4)
1. **LearningDashboard** - Skill inventory, knowledge sharing
2. **CollaborationDashboard** - Cross-team dependencies, handoffs
3. **DependencyGraph** - Dependency visualization (component exists but unused)

