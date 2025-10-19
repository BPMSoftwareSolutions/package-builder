import React, { useState } from 'react';
import { BusFactorCard } from '../components/BusFactorCard';
import { CodeOwnershipChart } from '../components/CodeOwnershipChart';
import { KnowledgeSharingBoard } from '../components/KnowledgeSharingBoard';
import { SkillInventoryCard } from '../components/SkillInventoryCard';
import { MetricsTrendAnalysis } from '../components/MetricsTrendAnalysis';
import { PredictionChart } from '../components/PredictionChart';
import { RootCauseAnalysisCard } from '../components/RootCauseAnalysisCard';
import { LearningRecommendations } from '../components/LearningRecommendations';

export const LearningDashboard: React.FC = () => {
  const [org, setOrg] = useState('BPMSoftwareSolutions');
  const [team, setTeam] = useState('platform-team');

  // Mock data for demonstration
  const mockBusFactorMetrics = {
    score: 7,
    riskLevel: 'medium' as const,
    keyPeople: [
      { name: 'Alice Johnson', riskPercentage: 75 },
      { name: 'Bob Smith', riskPercentage: 60 },
      { name: 'Carol White', riskPercentage: 45 },
    ],
    recommendations: [
      'Document critical processes',
      'Cross-train team members',
      'Create knowledge base',
    ],
    trend: 'improving' as const,
    timestamp: new Date().toISOString(),
  };

  const mockCodeOwnershipMetrics = {
    data: [
      { owner: 'Alice Johnson', percentage: 35, filesOwned: 120 },
      { owner: 'Bob Smith', percentage: 28, filesOwned: 95 },
      { owner: 'Carol White', percentage: 22, filesOwned: 75 },
      { owner: 'Others', percentage: 15, filesOwned: 50 },
    ],
    concentration: 63,
    recommendations: [
      'Spread ownership of critical files',
      'Pair programming sessions',
      'Code review rotation',
    ],
    timestamp: new Date().toISOString(),
  };

  const mockKnowledgeSharingMetrics = {
    sessions: [
      {
        id: '1',
        title: 'React Hooks Deep Dive',
        date: '2025-10-15',
        participants: ['Alice', 'Bob', 'Carol'],
        topic: 'React',
        resourcesShared: 5,
      },
      {
        id: '2',
        title: 'TypeScript Best Practices',
        date: '2025-10-10',
        participants: ['Bob', 'Carol', 'David'],
        topic: 'TypeScript',
        resourcesShared: 3,
      },
    ],
    totalParticipants: 8,
    upcomingSessions: 2,
    timestamp: new Date().toISOString(),
  };

  const mockSkillInventoryMetrics = {
    skills: [
      { name: 'React', level: 'expert' as const, people: 4 },
      { name: 'TypeScript', level: 'expert' as const, people: 3 },
      { name: 'Node.js', level: 'intermediate' as const, people: 5 },
      { name: 'DevOps', level: 'beginner' as const, people: 2 },
    ],
    skillGaps: [
      { skill: 'DevOps', gap: 75 },
      { skill: 'Kubernetes', gap: 85 },
      { skill: 'GraphQL', gap: 60 },
    ],
    trainingRecommendations: [
      'DevOps fundamentals course',
      'Kubernetes workshop',
      'GraphQL training',
    ],
    timestamp: new Date().toISOString(),
  };

  const mockMetricsTrendMetrics = {
    metricName: 'Code Coverage',
    data: [
      { date: '2025-10-01', value: 72 },
      { date: '2025-10-05', value: 74 },
      { date: '2025-10-10', value: 76 },
      { date: '2025-10-15', value: 78 },
      { date: '2025-10-19', value: 80 },
    ],
    trend: 'improving' as const,
    correlation: 0.85,
    anomalies: 0,
    timestamp: new Date().toISOString(),
  };

  const mockPredictionMetrics = {
    metricName: 'Code Coverage',
    predictions: [
      { date: '2025-10-20', predicted: 81, confidence: 95 },
      { date: '2025-10-25', predicted: 83, confidence: 90 },
      { date: '2025-10-30', predicted: 85, confidence: 85 },
    ],
    trend: 'improving' as const,
    scenarios: [
      { name: 'Optimistic', value: 90 },
      { name: 'Realistic', value: 85 },
      { name: 'Pessimistic', value: 78 },
    ],
    timestamp: new Date().toISOString(),
  };

  const mockRootCauseMetrics = {
    rootCauses: [
      {
        cause: 'Insufficient test coverage',
        frequency: 12,
        severity: 'high' as const,
        affectedMetrics: ['Code Quality', 'Reliability'],
      },
      {
        cause: 'Complex code logic',
        frequency: 8,
        severity: 'medium' as const,
        affectedMetrics: ['Maintainability'],
      },
    ],
    recommendations: [
      'Increase unit test coverage',
      'Refactor complex functions',
      'Add integration tests',
    ],
    patterns: [
      'Failures occur after large PRs',
      'Issues in legacy code modules',
    ],
    timestamp: new Date().toISOString(),
  };

  const mockRecommendationsMetrics = {
    recommendations: [
      {
        id: '1',
        title: 'Improve Test Coverage',
        description: 'Increase unit test coverage to 85%',
        priority: 'high' as const,
        expectedImpact: 85,
        implementationSteps: [
          'Identify untested code paths',
          'Write unit tests',
          'Run coverage analysis',
        ],
        status: 'in-progress' as const,
      },
      {
        id: '2',
        title: 'Refactor Legacy Code',
        description: 'Modernize old codebase',
        priority: 'medium' as const,
        expectedImpact: 60,
        implementationSteps: [
          'Analyze legacy code',
          'Plan refactoring',
          'Execute in phases',
        ],
        status: 'not-started' as const,
      },
    ],
    timestamp: new Date().toISOString(),
  };

  return (
    <div style={{ padding: '2rem', backgroundColor: 'var(--page-background)', minHeight: '100vh' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>Learning Dashboard</h1>
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
        <BusFactorCard metrics={mockBusFactorMetrics} />
        <CodeOwnershipChart metrics={mockCodeOwnershipMetrics} />
        <SkillInventoryCard metrics={mockSkillInventoryMetrics} />
        <KnowledgeSharingBoard metrics={mockKnowledgeSharingMetrics} />
        <MetricsTrendAnalysis metrics={mockMetricsTrendMetrics} />
        <PredictionChart metrics={mockPredictionMetrics} />
        <RootCauseAnalysisCard metrics={mockRootCauseMetrics} />
        <LearningRecommendations metrics={mockRecommendationsMetrics} />
      </div>
    </div>
  );
};

export default LearningDashboard;

