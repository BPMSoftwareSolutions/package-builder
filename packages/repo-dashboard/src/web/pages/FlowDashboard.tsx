import React, { useState, useEffect } from 'react';
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
import LoadingSpinner from '../components/LoadingSpinner';

interface FlowDashboardProps {
  onNavigate?: (page: string, data?: any) => void;
}

export default function FlowDashboard({ onNavigate }: FlowDashboardProps) {
  const [selectedOrg, setSelectedOrg] = useState('BPMSoftwareSolutions');
  const [selectedTeam, setSelectedTeam] = useState('platform-team');
  const [selectedRepo, setSelectedRepo] = useState('renderx-plugins-sdk');

  // State for real data
  const [valueStreamMetrics, setValueStreamMetrics] = useState<any>(null);
  const [prFlowMetrics, setPRFlowMetrics] = useState<any>(null);
  const [wipMetrics, setWIPMetrics] = useState<any>(null);
  const [wipTrendMetrics, setWIPTrendMetrics] = useState<any>(null);
  const [constraintMetrics, setConstraintMetrics] = useState<any>(null);
  const [bottleneckAlerts, setBottleneckAlerts] = useState<any[]>([]);
  const [flowStageMetrics, setFlowStageMetrics] = useState<any>(null);
  const [deployCadenceMetrics, setDeployCadenceMetrics] = useState<any>(null);
  const [conductorMetrics, setConductorMetrics] = useState<any>(null);
  const [bundleMetrics, setBundleMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real data from API
  useEffect(() => {
    const fetchFlowMetrics = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all metrics in parallel
        const [
          flowStagesRes,
          wipRes,
          deployCadenceRes,
          constraintsRes,
          conductorRes,
          bundleRes,
        ] = await Promise.all([
          fetch(`/api/metrics/flow-stages/${selectedOrg}/${selectedRepo}?team=${selectedTeam}&days=30`),
          fetch(`/api/metrics/wip/${selectedOrg}/${selectedTeam}?days=30`),
          fetch(`/api/metrics/deploy-cadence/${selectedOrg}/${selectedRepo}?team=${selectedTeam}&days=30`),
          fetch(`/api/metrics/constraints/${selectedOrg}`),
          fetch(`/api/metrics/conductor/${selectedOrg}/${selectedRepo}`),
          fetch(`/api/metrics/bundle/${selectedOrg}/${selectedRepo}`),
        ]);

        // Parse responses
        const flowStagesData = await flowStagesRes.json();
        const wipData = await wipRes.json();
        const deployCadenceData = await deployCadenceRes.json();
        const constraintsData = await constraintsRes.json();
        const conductorData = await conductorRes.json();
        const bundleData = await bundleRes.json();

        // Transform flow stages to value stream metrics
        if (flowStagesData.breakdown?.stages) {
          const stages = flowStagesData.breakdown.stages.map((stage: any) => ({
            name: stage.stage.charAt(0).toUpperCase() + stage.stage.slice(1),
            medianTime: stage.medianTime || 0,
            p95Time: stage.p95Time || 0,
            p5Time: stage.p5Time || 0,
            trend: stage.trend || 'stable',
          }));
          setValueStreamMetrics({
            stages,
            totalMedianTime: stages.reduce((sum: number, s: any) => sum + s.medianTime, 0),
            sevenDayTrend: 'stable',
            thirtyDayTrend: 'stable',
            timestamp: new Date().toISOString(),
          });

          // Set flow stage breakdown
          setFlowStageMetrics({
            stages,
            timestamp: new Date().toISOString(),
          });

          // Set PR flow metrics from stages
          setPRFlowMetrics({
            stages: stages.map((s: any, idx: number) => ({
              stage: s.name,
              percentage: (s.medianTime / (stages.reduce((sum: number, st: any) => sum + st.medianTime, 0) || 1)) * 100,
              hours: s.medianTime / 60,
              color: `var(--stage-${s.name.toLowerCase()})`,
            })),
            totalTime: stages.reduce((sum: number, s: any) => sum + s.medianTime, 0) / 60,
            trend: 'stable',
            timestamp: new Date().toISOString(),
          });
        }

        // Set WIP metrics
        if (wipData.metrics) {
          setWIPMetrics({
            currentWIP: wipData.metrics.openPRCount || 0,
            wipLimit: 15,
            team: selectedTeam,
            status: (wipData.metrics.openPRCount || 0) <= 15 ? 'healthy' : 'warning',
            percentageOfLimit: ((wipData.metrics.openPRCount || 0) / 15) * 100,
            timestamp: new Date().toISOString(),
          });

          // Set WIP trend
          if (wipData.metrics.history) {
            setWIPTrendMetrics({
              data: wipData.metrics.history.map((point: any) => ({
                date: new Date(point.timestamp).toLocaleDateString(),
                wip: point.openPRCount,
                limit: 15,
              })),
              averageWIP: wipData.metrics.openPRCount || 0,
              maxWIP: Math.max(...(wipData.metrics.history?.map((p: any) => p.openPRCount) || [0])),
              minWIP: Math.min(...(wipData.metrics.history?.map((p: any) => p.openPRCount) || [0])),
              trend: wipData.metrics.trend || 'stable',
              timestamp: new Date().toISOString(),
            });
          }
        }

        // Set deploy cadence metrics
        if (deployCadenceData.metrics) {
          setDeployCadenceMetrics({
            data: deployCadenceData.metrics.history?.map((point: any) => ({
              date: new Date(point.timestamp).toLocaleDateString(),
              deployments: point.deploysPerDay || 0,
              successRate: point.successRate || 0,
              rollbacks: point.rollbackCount || 0,
            })) || [],
            averageDeploysPerDay: deployCadenceData.metrics.totalDeploysPerDay || 0,
            averageSuccessRate: deployCadenceData.metrics.overallSuccessRate || 0,
            totalDeployments: deployCadenceData.metrics.totalDeploysPerDay || 0,
            totalRollbacks: deployCadenceData.metrics.totalRollbacks || 0,
            trend: deployCadenceData.metrics.trend || 'stable',
            timestamp: new Date().toISOString(),
          });
        }

        // Set constraint metrics
        if (constraintsData.constraints) {
          setConstraintMetrics({
            constraints: constraintsData.constraints.map((c: any) => ({
              team: c.team || 'Unknown',
              severity: c.severity || 'low',
              stage: c.stage || 'Unknown',
              description: c.description || 'No description',
            })),
            criticalCount: constraintsData.summary?.criticalConstraints || 0,
            highCount: constraintsData.summary?.highConstraints || 0,
            mediumCount: (constraintsData.summary?.totalConstraints || 0) - (constraintsData.summary?.criticalConstraints || 0) - (constraintsData.summary?.highConstraints || 0),
            timestamp: new Date().toISOString(),
          });

          // Set bottleneck alerts
          const alerts = constraintsData.constraints
            .filter((c: any) => c.severity === 'high' || c.severity === 'critical')
            .slice(0, 3)
            .map((c: any, idx: number) => ({
              id: `${idx}`,
              stage: c.stage,
              severity: c.severity,
              description: c.description,
              affectedTeams: [c.team],
              suggestedActions: ['Review and optimize this stage'],
              detectedAt: new Date().toISOString(),
            }));
          setBottleneckAlerts(alerts);
        }

        // Set conductor metrics
        if (conductorData.metrics) {
          setConductorMetrics({
            throughput: conductorData.metrics.throughput || 0,
            queueLength: conductorData.metrics.queueLength || 0,
            averageExecutionTime: conductorData.metrics.averageExecutionTime || 0,
            successRate: conductorData.metrics.successRate || 0,
            errorRate: conductorData.metrics.errorRate || 0,
            trend: conductorData.metrics.trend || 'stable',
            timestamp: new Date().toISOString(),
          });
        }

        // Set bundle metrics
        if (bundleData.metrics) {
          setBundleMetrics({
            bundles: bundleData.metrics.bundles || [],
            totalSize: bundleData.metrics.totalSize || 0,
            totalBudget: bundleData.metrics.totalBudget || 0,
            loadTime: bundleData.metrics.loadTime || 0,
            trend: bundleData.metrics.trend || 'stable',
            timestamp: new Date().toISOString(),
          });
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching flow metrics:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
        setLoading(false);
      }
    };

    fetchFlowMetrics();
  }, [selectedOrg, selectedTeam, selectedRepo]);

  if (loading) {
    return (
      <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <div style={{ color: 'var(--error-color)', padding: '1rem', backgroundColor: 'var(--error-background)', borderRadius: '4px' }}>
          <h2>Error Loading Flow Metrics</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>Flow Dashboard</h1>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
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
              Repository:
            </label>
            <select
              value={selectedRepo}
              onChange={(e) => setSelectedRepo(e.target.value)}
              style={{
                padding: '0.5rem',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--card-background)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="renderx-plugins-sdk">renderx-plugins-sdk</option>
              <option value="renderx-plugins-canvas">renderx-plugins-canvas</option>
              <option value="renderx-plugins-components">renderx-plugins-components</option>
              <option value="renderx-plugins-control-panel">renderx-plugins-control-panel</option>
              <option value="renderx-plugins-header">renderx-plugins-header</option>
              <option value="renderx-plugins-library">renderx-plugins-library</option>
              <option value="renderx-manifest-tools">renderx-manifest-tools</option>
              <option value="musical-conductor">musical-conductor</option>
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
              <option value="devops-team">DevOps Team</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        {/* Value Stream */}
        {valueStreamMetrics && <ValueStreamCard metrics={valueStreamMetrics} />}

        {/* PR Flow and Constraint Radar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {prFlowMetrics && <PRFlowChart metrics={prFlowMetrics} />}
          {constraintMetrics && <ConstraintRadar metrics={constraintMetrics} />}
        </div>

        {/* WIP Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {wipMetrics && <WIPGauge metrics={wipMetrics} />}
          {wipTrendMetrics && <WIPTrendChart metrics={wipTrendMetrics} />}
        </div>

        {/* Bottleneck Alerts */}
        {bottleneckAlerts.length > 0 && <BottleneckAlert alerts={bottleneckAlerts} />}

        {/* Flow Stage Breakdown */}
        {flowStageMetrics && <FlowStageBreakdown metrics={flowStageMetrics} />}

        {/* Deploy Cadence and Conductor */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {deployCadenceMetrics && <DeployCadenceChart metrics={deployCadenceMetrics} />}
          {conductorMetrics && <ConductorThroughputChart metrics={conductorMetrics} />}
        </div>

        {/* Bundle Size */}
        {bundleMetrics && <BundleSizeGauge metrics={bundleMetrics} />}
      </div>
    </div>
  );
}

