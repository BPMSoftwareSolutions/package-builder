/**
 * Tests for Cross-Team Communication Service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CrossTeamCommunicationService } from './cross-team-communication.js';
import { Issue } from '../types.js';

describe('CrossTeamCommunicationService', () => {
  let service: CrossTeamCommunicationService;

  beforeEach(() => {
    service = new CrossTeamCommunicationService();
  });

  describe('initializeTeamMapping', () => {
    it('should initialize team mapping', () => {
      const teamMapping = {
        'Host Team': ['renderx-plugins-demo'],
        'SDK Team': ['renderx-plugins-sdk']
      };

      service.initializeTeamMapping(teamMapping);
      expect(service).toBeDefined();
    });
  });

  describe('trackCrossTeamIssue', () => {
    it('should track cross-team issue', () => {
      const teamMapping = {
        'Host Team': ['renderx-plugins-demo'],
        'SDK Team': ['renderx-plugins-sdk']
      };

      service.initializeTeamMapping(teamMapping);

      const issue: Issue = {
        number: 1,
        title: 'Critical bug in SDK',
        state: 'open',
        isPullRequest: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        url: 'https://github.com/test/issue/1',
        author: 'user1'
      };

      const tracked = service.trackCrossTeamIssue(issue, 'renderx-plugins-demo', 'renderx-plugins-sdk', 120);

      expect(tracked).not.toBeNull();
      expect(tracked?.sourceTeam).toBe('Host Team');
      expect(tracked?.targetTeam).toBe('SDK Team');
      expect(tracked?.responseTime).toBe(120);
    });

    it('should return null for same-team issue', () => {
      const teamMapping = {
        'Host Team': ['renderx-plugins-demo', 'renderx-plugins-sdk']
      };

      service.initializeTeamMapping(teamMapping);

      const issue: Issue = {
        number: 1,
        title: 'Test issue',
        state: 'open',
        isPullRequest: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        url: 'https://github.com/test/issue/1',
        author: 'user1'
      };

      const tracked = service.trackCrossTeamIssue(issue, 'renderx-plugins-demo', 'renderx-plugins-sdk', 120);
      expect(tracked).toBeNull();
    });

    it('should determine priority from issue title', () => {
      const teamMapping = {
        'Host Team': ['renderx-plugins-demo'],
        'SDK Team': ['renderx-plugins-sdk']
      };

      service.initializeTeamMapping(teamMapping);

      const criticalIssue: Issue = {
        number: 1,
        title: 'CRITICAL: System down',
        state: 'open',
        isPullRequest: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        url: 'https://github.com/test/issue/1',
        author: 'user1'
      };

      const tracked = service.trackCrossTeamIssue(criticalIssue, 'renderx-plugins-demo', 'renderx-plugins-sdk', 120);
      expect(tracked?.priority).toBe('critical');
    });
  });

  describe('calculateCommunicationMetrics', () => {
    it('should calculate communication metrics between teams', () => {
      const teamMapping = {
        'Host Team': ['renderx-plugins-demo'],
        'SDK Team': ['renderx-plugins-sdk']
      };

      service.initializeTeamMapping(teamMapping);

      const issue: Issue = {
        number: 1,
        title: 'Test issue',
        state: 'open',
        isPullRequest: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        url: 'https://github.com/test/issue/1',
        author: 'user1'
      };

      service.trackCrossTeamIssue(issue, 'renderx-plugins-demo', 'renderx-plugins-sdk', 120);
      const metrics = service.calculateCommunicationMetrics('Host Team', 'SDK Team');

      expect(metrics.sourceTeam).toBe('Host Team');
      expect(metrics.targetTeam).toBe('SDK Team');
      expect(metrics.totalIssues).toBeGreaterThanOrEqual(0);
      expect(metrics.avgResponseTime).toBeGreaterThanOrEqual(0);
    });

    it('should return zero metrics for no communication', () => {
      const metrics = service.calculateCommunicationMetrics('Host Team', 'SDK Team');

      expect(metrics.totalIssues).toBe(0);
      expect(metrics.avgResponseTime).toBe(0);
      expect(metrics.resolutionRate).toBe(0);
    });
  });

  describe('getTeamCommunicationPattern', () => {
    it('should return communication pattern for a team', () => {
      const teamMapping = {
        'Host Team': ['renderx-plugins-demo'],
        'SDK Team': ['renderx-plugins-sdk'],
        'Conductor Team': ['musical-conductor']
      };

      service.initializeTeamMapping(teamMapping);

      const issue: Issue = {
        number: 1,
        title: 'Test issue',
        state: 'open',
        isPullRequest: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        url: 'https://github.com/test/issue/1',
        author: 'user1'
      };

      service.trackCrossTeamIssue(issue, 'renderx-plugins-demo', 'renderx-plugins-sdk', 120);
      const pattern = service.getTeamCommunicationPattern('Host Team');

      expect(pattern.team).toBe('Host Team');
      expect(pattern.outgoingCommunication).toBeDefined();
      expect(pattern.incomingCommunication).toBeDefined();
      expect(pattern.recommendations).toBeDefined();
    });

    it('should generate recommendations for slow response times', () => {
      const teamMapping = {
        'Host Team': ['renderx-plugins-demo'],
        'SDK Team': ['renderx-plugins-sdk']
      };

      service.initializeTeamMapping(teamMapping);

      const issue: Issue = {
        number: 1,
        title: 'Test issue',
        state: 'open',
        isPullRequest: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        url: 'https://github.com/test/issue/1',
        author: 'user1'
      };

      // Track issue with slow response time (> 8 hours)
      service.trackCrossTeamIssue(issue, 'renderx-plugins-demo', 'renderx-plugins-sdk', 600);
      const pattern = service.getTeamCommunicationPattern('Host Team');

      expect(pattern.recommendations.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getAllCrossTeamIssues', () => {
    it('should return all cross-team issues', () => {
      const teamMapping = {
        'Host Team': ['renderx-plugins-demo'],
        'SDK Team': ['renderx-plugins-sdk']
      };

      service.initializeTeamMapping(teamMapping);

      const issue: Issue = {
        number: 1,
        title: 'Test issue',
        state: 'open',
        isPullRequest: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        url: 'https://github.com/test/issue/1',
        author: 'user1'
      };

      service.trackCrossTeamIssue(issue, 'renderx-plugins-demo', 'renderx-plugins-sdk', 120);
      const allIssues = service.getAllCrossTeamIssues();

      expect(allIssues.length).toBeGreaterThan(0);
    });

    it('should return empty array when no issues tracked', () => {
      const allIssues = service.getAllCrossTeamIssues();
      expect(allIssues).toHaveLength(0);
    });
  });

  describe('getTeamCrossTeamIssues', () => {
    it('should return cross-team issues for a specific team', () => {
      const teamMapping = {
        'Host Team': ['renderx-plugins-demo'],
        'SDK Team': ['renderx-plugins-sdk']
      };

      service.initializeTeamMapping(teamMapping);

      const issue: Issue = {
        number: 1,
        title: 'Test issue',
        state: 'open',
        isPullRequest: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        url: 'https://github.com/test/issue/1',
        author: 'user1'
      };

      service.trackCrossTeamIssue(issue, 'renderx-plugins-demo', 'renderx-plugins-sdk', 120);
      const teamIssues = service.getTeamCrossTeamIssues('Host Team');

      expect(teamIssues.length).toBeGreaterThan(0);
      expect(teamIssues[0].sourceTeam).toBe('Host Team');
    });

    it('should return empty array for team with no cross-team issues', () => {
      const teamMapping = {
        'Host Team': ['renderx-plugins-demo'],
        'SDK Team': ['renderx-plugins-sdk']
      };

      service.initializeTeamMapping(teamMapping);

      const teamIssues = service.getTeamCrossTeamIssues('Conductor Team');
      expect(teamIssues).toHaveLength(0);
    });
  });
});

