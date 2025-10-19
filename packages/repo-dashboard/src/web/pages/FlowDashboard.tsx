import React, { useState } from 'react';
import ValueStreamCard from '../components/ValueStreamCard';
import PRFlowChart from '../components/PRFlowChart';
import WIPGauge from '../components/WIPGauge';
import WIPTrendChart from '../components/WIPTrendChart';
import ConstraintRadar from '../components/ConstraintRadar';
import BottleneckAlert from '../components/BottleneckAlert';
import FlowStageBreakdown from '../components/FlowStageBreakdown';
import DeployCadenceChart from '../components/DeployCadenceChart';
import ConductorThroughputChart from '../components/ConductorThroughputChart';
import BundleSizeGauge from '../components/BundleSizeGauge';

interface FlowDashboardProps {
  onNavigate?: (page: string, data?: any) => void;
}

export default function FlowDashboard({ onNavigate }: FlowDashboardProps) {
  const [selectedOrg, setSelectedOrg] = useState('BPMSoftwareSolutions');
  const [selectedTeam, setSelectedTeam] = useState('platform-team');

  // Mock data for demonstration
  const mockValueStreamMetrics = {
    stages: [
      { name: 'Idea', medianTime: 2, p95Time: 4, p5Time: 0.5, trend: 'stable' as const },
      { name: 'PR', medianTime: 8, p95Time: 16, p5Time: 2, trend: 'improving' as const },
      { name: 'Review', medianTime: 6, p95Time: 12, p5Time: 1, trend: 'stable' as const },
      { name: 'Build', medianTime: 1, p95Time: 2, p5Time: 0.5, trend: 'improving' as const },
      { name: 'Test', medianTime: 4, p95Time: 8, p5Time: 1, trend: 'stable' as const },
      { name: 'Deploy', medianTime: 0.5, p95Time: 1, p5Time: 0.25, trend: 'improving' as const },
    ],
    totalMedianTime: 21.5,
    sevenDayTrend: 'improving' as const,
    thirtyDayTrend: 'stable' as const,
    timestamp: new Date().toISOString(),
  };

  const mockPRFlowMetrics = {
    stages: [
      { stage: 'Review', percentage: 28.6, hours: 6, color: '#fce4ec' },
      { stage: 'Build', percentage: 4.8, hours: 1, color: '#fff3e0' },
      { stage: 'Test', percentage: 19.0, hours: 4, color: '#f1f8e9' },
      { stage: 'Waiting', percentage: 47.6, hours: 10, color: '#e3f2fd' },
    ],
    totalTime: 21,
    trend: 'stable' as const,
    timestamp: new Date().toISOString(),
  };

  const mockWIPMetrics = {
    currentWIP: 12,
    wipLimit: 15,
    team: selectedTeam,
    status: 'healthy' as const,
    percentageOfLimit: 80,
    timestamp: new Date().toISOString(),
  };

  const mockWIPTrendMetrics = {
    data: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      wip: Math.floor(Math.random() * 10) + 8,
      limit: 15,
    })),
    averageWIP: 10.5,
    maxWIP: 18,
    minWIP: 6,
    trend: 'stable' as const,
    timestamp: new Date().toISOString(),
  };

  const mockConstraintMetrics = {
    constraints: [
      { team: 'Platform', severity: 75, stage: 'Review', description: 'High review time' },
      { team: 'Backend', severity: 45, stage: 'Test', description: 'Flaky tests' },
      { team: 'Frontend', severity: 30, stage: 'Build', description: 'Build optimization needed' },
      { team: 'DevOps', severity: 55, stage: 'Deploy', description: 'Deployment delays' },
    ],
    criticalCount: 1,
    highCount: 2,
    mediumCount: 1,
    timestamp: new Date().toISOString(),
  };

  const mockBottleneckAlerts = [
    {
      id: '1',
      stage: 'Review',
      severity: 'high' as const,
      description: 'Review time exceeds 6 hours median',
      affectedTeams: ['Platform', 'Backend'],
      suggestedActions: ['Increase reviewer capacity', 'Implement code review guidelines'],
      detectedAt: new Date().toISOString(),
    },
  ];

  const mockFlowStageMetrics = {
    stages: [
      { stage: 'Review', median: 6, p95: 12, p99: 18, p5: 1, trend: 'degrading' as const },
      { stage: 'Build', median: 1, p95: 2, p99: 3, p5: 0.5, trend: 'improving' as const },
      { stage: 'Test', median: 4, p95: 8, p99: 12, p5: 1, trend: 'stable' as const },
      { stage: 'Deploy', median: 0.5, p95: 1, p99: 2, p5: 0.25, trend: 'improving' as const },
    ],
    timestamp: new Date().toISOString(),
  };

  const mockDeployCadenceMetrics = {
    data: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      deployments: Math.floor(Math.random() * 5) + 2,
      successRate: 95 + Math.random() * 5,
      rollbacks: Math.floor(Math.random() * 2),
    })),
    averageDeploysPerDay: 3.5,
    averageSuccessRate: 97.2,
    totalDeployments: 105,
    totalRollbacks: 3,
    trend: 'improving' as const,
    timestamp: new Date().toISOString(),
  };

  const mockConductorMetrics = {
    throughput: 1250.5,
    queueLength: 45,
    averageExecutionTime: 125,
    successRate: 98.5,
    errorRate: 0.3,
    trend: 'improving' as const,
    timestamp: new Date().toISOString(),
  };

  const mockBundleMetrics = {
    bundles: [
      { name: 'Main Bundle', size: 450, budget: 500, status: 'green' as const },
      { name: 'Vendor Bundle', size: 280, budget: 300, status: 'green' as const },
      { name: 'Styles Bundle', size: 85, budget: 100, status: 'green' as const },
    ],
    totalSize: 815,
    totalBudget: 900,
    loadTime: 2.3,
    trend: 'improving' as const,
    timestamp: new Date().toISOString(),
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>Flow Dashboard</h1>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginRight: '0.5rem' }}>
              Organization:
            </label>
            <select
              value={selectedOrg}
              onChange={(e) => setSelectedOrg(e.target.value)}
              style={{
                padding: '0.5rem',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--card-background)',
                color: 'var(--text-primary)',
              }}
            >
              <option>BPMSoftwareSolutions</option>
              <option>RenderX</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginRight: '0.5rem' }}>
              Team:
            </label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              style={{
                padding: '0.5rem',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--card-background)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="platform-team">Platform Team</option>
              <option value="backend-team">Backend Team</option>
              <option value="frontend-team">Frontend Team</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        {/* Value Stream */}
        <ValueStreamCard metrics={mockValueStreamMetrics} />

        {/* PR Flow and Constraint Radar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <PRFlowChart metrics={mockPRFlowMetrics} />
          <ConstraintRadar metrics={mockConstraintMetrics} />
        </div>

        {/* WIP Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <WIPGauge metrics={mockWIPMetrics} />
          <WIPTrendChart metrics={mockWIPTrendMetrics} />
        </div>

        {/* Bottleneck Alerts */}
        <BottleneckAlert alerts={mockBottleneckAlerts} />

        {/* Flow Stage Breakdown */}
        <FlowStageBreakdown metrics={mockFlowStageMetrics} />

        {/* Deploy Cadence and Conductor */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <DeployCadenceChart metrics={mockDeployCadenceMetrics} />
          <ConductorThroughputChart metrics={mockConductorMetrics} />
        </div>

        {/* Bundle Size */}
        <BundleSizeGauge metrics={mockBundleMetrics} />
      </div>
    </div>
  );
}

