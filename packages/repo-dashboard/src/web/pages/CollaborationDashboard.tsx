import React, { useState } from 'react';
import { DependencyGraph } from '../components/DependencyGraph';
import { HandoffTimeline } from '../components/HandoffTimeline';
import { CrossTeamCommunicationHub } from '../components/CrossTeamCommunicationHub';
import { CIAGateStatus } from '../components/CIAGateStatus';
import { SPAGateStatus } from '../components/SPAGateStatus';
import { DependencyHealthChart } from '../components/DependencyHealthChart';
import { BlockerTracker } from '../components/BlockerTracker';
import { TeamSatisfactionScore } from '../components/TeamSatisfactionScore';

export const CollaborationDashboard: React.FC = () => {
  const [org, setOrg] = useState('BPMSoftwareSolutions');
  const [team, setTeam] = useState('platform-team');

  // Mock data for demonstration
  const mockDependencyGraphMetrics = {
    nodes: [
      { id: 'team-a', label: 'Team A', type: 'team' },
      { id: 'team-b', label: 'Team B', type: 'team' },
      { id: 'team-c', label: 'Team C', type: 'team' },
    ],
    edges: [
      { from: 'team-a', to: 'team-b', health: 'green' },
      { from: 'team-b', to: 'team-c', health: 'yellow' },
    ],
    timestamp: new Date().toISOString(),
  };

  const mockHandoffMetrics = {
    handoffs: [
      {
        id: '1',
        fromTeam: 'Team A',
        toTeam: 'Team B',
        startDate: '2025-10-15',
        endDate: '2025-10-16',
        duration: 24,
        status: 'completed' as const,
        blockers: [],
      },
      {
        id: '2',
        fromTeam: 'Team B',
        toTeam: 'Team C',
        startDate: '2025-10-18',
        endDate: '2025-10-19',
        duration: 18,
        status: 'in-progress' as const,
        blockers: ['Waiting for approval'],
      },
    ],
    averageDuration: 21,
    efficiency: 78,
    timestamp: new Date().toISOString(),
  };

  const mockCommunicationMetrics = {
    channels: [
      {
        id: '1',
        name: 'Platform Team',
        teams: ['Team A', 'Team B'],
        messageCount: 245,
        lastMessage: '2 hours ago',
        status: 'active' as const,
      },
      {
        id: '2',
        name: 'Architecture Review',
        teams: ['Team B', 'Team C'],
        messageCount: 89,
        lastMessage: '1 day ago',
        status: 'active' as const,
      },
    ],
    activeTeams: 3,
    blockers: [
      { title: 'API Design Decision', teams: ['Team A', 'Team B'] },
    ],
    timestamp: new Date().toISOString(),
  };

  const mockCIAGateMetrics = {
    results: [
      {
        repository: 'repo-dashboard',
        status: 'passing' as const,
        violations: 0,
        timestamp: '2025-10-19',
      },
      {
        repository: 'package-builder',
        status: 'failing' as const,
        violations: 2,
        timestamp: '2025-10-19',
      },
    ],
    passRate: 85,
    trend: 'improving' as const,
    recommendations: [
      'Fix import boundary violations',
      'Review dependency cycles',
    ],
    timestamp: new Date().toISOString(),
  };

  const mockSPAGateMetrics = {
    results: [
      {
        repository: 'renderx-plugins',
        status: 'passing' as const,
        violations: 0,
        timestamp: '2025-10-19',
      },
      {
        repository: 'conductor-core',
        status: 'passing' as const,
        violations: 0,
        timestamp: '2025-10-19',
      },
    ],
    passRate: 95,
    trend: 'stable' as const,
    recommendations: [
      'Maintain current architecture standards',
    ],
    timestamp: new Date().toISOString(),
  };

  const mockDependencyHealthMetrics = {
    dependencies: [
      {
        name: 'react',
        currentVersion: '18.2.0',
        latestVersion: '18.3.0',
        status: 'outdated' as const,
        vulnerabilities: 0,
      },
      {
        name: 'typescript',
        currentVersion: '5.1.0',
        latestVersion: '5.2.0',
        status: 'outdated' as const,
        vulnerabilities: 0,
      },
      {
        name: 'lodash',
        currentVersion: '4.17.20',
        latestVersion: '4.17.21',
        status: 'critical' as const,
        vulnerabilities: 1,
      },
    ],
    healthScore: 72,
    outdatedCount: 2,
    vulnerabilityCount: 1,
    timestamp: new Date().toISOString(),
  };

  const mockBlockerMetrics = {
    blockers: [
      {
        id: '1',
        title: 'API Design Decision',
        status: 'open' as const,
        severity: 'high' as const,
        affectedTeams: ['Team A', 'Team B'],
        createdDate: '2025-10-18',
      },
      {
        id: '2',
        title: 'Database Migration',
        status: 'in-progress' as const,
        severity: 'critical' as const,
        affectedTeams: ['Team C'],
        createdDate: '2025-10-15',
        resolutionTime: 48,
      },
    ],
    openCount: 1,
    averageResolutionTime: 36,
    timestamp: new Date().toISOString(),
  };

  const mockSatisfactionMetrics = {
    teams: [
      {
        team: 'Team A',
        score: 82,
        trend: 'improving' as const,
        feedback: ['Good collaboration', 'Clear communication'],
      },
      {
        team: 'Team B',
        score: 75,
        trend: 'stable' as const,
        feedback: ['Needs better handoffs'],
      },
      {
        team: 'Team C',
        score: 88,
        trend: 'improving' as const,
        feedback: ['Excellent teamwork'],
      },
    ],
    overallScore: 82,
    areasForImprovement: [
      'Cross-team communication',
      'Handoff efficiency',
      'Documentation',
    ],
    actionItems: [
      'Weekly sync meetings',
      'Improve documentation',
      'Handoff checklist',
    ],
    timestamp: new Date().toISOString(),
  };

  return (
    <div style={{ padding: '2rem', backgroundColor: 'var(--page-background)', minHeight: '100vh' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>Collaboration Dashboard</h1>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginRight: '0.5rem' }}>
              Organization:
            </label>
            <input
              type="text"
              value={org}
              onChange={(e) => setOrg(e.target.value)}
              style={{
                padding: '0.5rem',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--card-background)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginRight: '0.5rem' }}>
              Team:
            </label>
            <input
              type="text"
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              style={{
                padding: '0.5rem',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--card-background)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        <HandoffTimeline metrics={mockHandoffMetrics} />
        <CrossTeamCommunicationHub metrics={mockCommunicationMetrics} />
        <CIAGateStatus metrics={mockCIAGateMetrics} />
        <SPAGateStatus metrics={mockSPAGateMetrics} />
        <DependencyHealthChart metrics={mockDependencyHealthMetrics} />
        <BlockerTracker metrics={mockBlockerMetrics} />
        <TeamSatisfactionScore metrics={mockSatisfactionMetrics} />
      </div>
    </div>
  );
};

export default CollaborationDashboard;

