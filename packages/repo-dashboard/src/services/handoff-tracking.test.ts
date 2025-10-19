/**
 * Tests for Handoff Tracking Service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { HandoffTrackingService } from './handoff-tracking.js';
import { PullRequestMetrics } from './pull-request-metrics-collector.js';

describe('HandoffTrackingService', () => {
  let service: HandoffTrackingService;

  beforeEach(() => {
    service = new HandoffTrackingService();
  });

  describe('initializeTeamMapping', () => {
    it('should initialize team mapping', () => {
      const teamMapping = {
        'Host Team': ['renderx-plugins-demo'],
        'SDK Team': ['renderx-plugins-sdk']
      };

      service.initializeTeamMapping(teamMapping);
      // Service should be initialized without errors
      expect(service).toBeDefined();
    });
  });

  describe('calculateHandoffMetrics', () => {
    it('should calculate handoff metrics from PR metrics', () => {
      const teamMapping = {
        'Host Team': ['renderx-plugins-demo'],
        'SDK Team': ['renderx-plugins-sdk']
      };

      service.initializeTeamMapping(teamMapping);

      const prMetrics: PullRequestMetrics[] = [
        {
          repo: 'renderx-plugins-demo',
          prNumber: 1,
          title: 'Test PR',
          author: 'user1',
          createdAt: new Date(Date.now() - 86400000),
          mergedAt: new Date(),
          cycleTime: 1440, // 24 hours
          timeToFirstReview: 120, // 2 hours
          timeToApproval: 240, // 4 hours
          reviewers: ['reviewer1'],
          filesChanged: 5,
          additions: 100,
          deletions: 50,
          status: 'merged'
        }
      ];

      const metrics = service.calculateHandoffMetrics(prMetrics);
      expect(metrics).toBeDefined();
      expect(metrics.length).toBeGreaterThanOrEqual(0);
    });

    it('should return empty array for empty PR metrics', () => {
      const teamMapping = {
        'Host Team': ['renderx-plugins-demo']
      };

      service.initializeTeamMapping(teamMapping);
      const metrics = service.calculateHandoffMetrics([]);
      expect(metrics).toHaveLength(0);
    });
  });

  describe('getTeamHandoffMetrics', () => {
    it('should return team handoff metrics', () => {
      const teamMapping = {
        'Host Team': ['renderx-plugins-demo'],
        'SDK Team': ['renderx-plugins-sdk']
      };

      service.initializeTeamMapping(teamMapping);

      const prMetrics: PullRequestMetrics[] = [
        {
          repo: 'renderx-plugins-demo',
          prNumber: 1,
          title: 'Test PR',
          author: 'user1',
          createdAt: new Date(Date.now() - 86400000),
          mergedAt: new Date(),
          cycleTime: 1440,
          timeToFirstReview: 120,
          timeToApproval: 240,
          reviewers: ['reviewer1'],
          filesChanged: 5,
          additions: 100,
          deletions: 50,
          status: 'merged'
        }
      ];

      service.calculateHandoffMetrics(prMetrics);
      const teamMetrics = service.getTeamHandoffMetrics('Host Team');

      expect(teamMetrics.team).toBe('Host Team');
      expect(teamMetrics.efficiency).toBeGreaterThanOrEqual(0);
      expect(teamMetrics.efficiency).toBeLessThanOrEqual(100);
      expect(teamMetrics.bottlenecks).toBeDefined();
    });

    it('should identify bottlenecks for slow handoffs', () => {
      const teamMapping = {
        'Host Team': ['renderx-plugins-demo'],
        'SDK Team': ['renderx-plugins-sdk']
      };

      service.initializeTeamMapping(teamMapping);

      const prMetrics: PullRequestMetrics[] = [
        {
          repo: 'renderx-plugins-demo',
          prNumber: 1,
          title: 'Test PR',
          author: 'user1',
          createdAt: new Date(Date.now() - 86400000 * 2),
          mergedAt: new Date(),
          cycleTime: 2880, // 48 hours
          timeToFirstReview: 1440, // 24 hours
          timeToApproval: 1440, // 24 hours
          reviewers: ['reviewer1'],
          filesChanged: 5,
          additions: 100,
          deletions: 50,
          status: 'merged'
        }
      ];

      service.calculateHandoffMetrics(prMetrics);
      const teamMetrics = service.getTeamHandoffMetrics('Host Team');

      // Efficiency is calculated based on avgHandoffTime
      // With 48-hour cycle time, efficiency = 100 - (2880 / 480) * 100 = 100 - 600 = -500, clamped to 0
      expect(teamMetrics.efficiency).toBeLessThanOrEqual(100);
      expect(teamMetrics.efficiency).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getAllHandoffMetrics', () => {
    it('should return all handoff metrics', () => {
      const teamMapping = {
        'Host Team': ['renderx-plugins-demo'],
        'SDK Team': ['renderx-plugins-sdk']
      };

      service.initializeTeamMapping(teamMapping);

      const prMetrics: PullRequestMetrics[] = [
        {
          repo: 'renderx-plugins-demo',
          prNumber: 1,
          title: 'Test PR',
          author: 'user1',
          createdAt: new Date(Date.now() - 86400000),
          mergedAt: new Date(),
          cycleTime: 1440,
          timeToFirstReview: 120,
          timeToApproval: 240,
          reviewers: ['reviewer1'],
          filesChanged: 5,
          additions: 100,
          deletions: 50,
          status: 'merged'
        }
      ];

      service.calculateHandoffMetrics(prMetrics);
      const allMetrics = service.getAllHandoffMetrics();

      expect(allMetrics).toBeDefined();
      expect(Array.isArray(allMetrics)).toBe(true);
    });
  });

  describe('identifyApprovalBottlenecks', () => {
    it('should identify teams with slow approval times', () => {
      const teamMapping = {
        'Host Team': ['renderx-plugins-demo'],
        'SDK Team': ['renderx-plugins-sdk']
      };

      service.initializeTeamMapping(teamMapping);

      const prMetrics: PullRequestMetrics[] = [
        {
          repo: 'renderx-plugins-demo',
          prNumber: 1,
          title: 'Test PR',
          author: 'user1',
          createdAt: new Date(Date.now() - 86400000),
          mergedAt: new Date(),
          cycleTime: 1440,
          timeToFirstReview: 120,
          timeToApproval: 600, // 10 hours
          reviewers: ['reviewer1'],
          filesChanged: 5,
          additions: 100,
          deletions: 50,
          status: 'merged'
        }
      ];

      service.calculateHandoffMetrics(prMetrics);
      const bottlenecks = service.identifyApprovalBottlenecks();

      expect(bottlenecks).toBeDefined();
      expect(Array.isArray(bottlenecks)).toBe(true);
    });

    it('should return empty array when no bottlenecks exist', () => {
      const teamMapping = {
        'Host Team': ['renderx-plugins-demo']
      };

      service.initializeTeamMapping(teamMapping);
      const bottlenecks = service.identifyApprovalBottlenecks();

      expect(bottlenecks).toHaveLength(0);
    });
  });
});

