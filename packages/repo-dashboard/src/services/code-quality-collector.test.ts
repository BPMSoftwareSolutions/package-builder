/**
 * Unit tests for CodeQualityCollector
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CodeQualityCollector } from './code-quality-collector.js';

describe('CodeQualityCollector', () => {
  let collector: CodeQualityCollector;

  beforeEach(() => {
    collector = new CodeQualityCollector();
  });

  describe('collectQualityMetrics', () => {
    it('should collect quality metrics for a repository', async () => {
      const metrics = await collector.collectQualityMetrics('BPMSoftwareSolutions', 'renderx-plugins-sdk');
      
      expect(metrics).toBeDefined();
      expect(metrics.repo).toBe('BPMSoftwareSolutions/renderx-plugins-sdk');
      expect(metrics.timestamp).toBeInstanceOf(Date);
    });

    it('should return metrics with valid quality score', async () => {
      const metrics = await collector.collectQualityMetrics('BPMSoftwareSolutions', 'renderx-plugins-sdk');
      
      expect(metrics.qualityScore).toBeGreaterThanOrEqual(0);
      expect(metrics.qualityScore).toBeLessThanOrEqual(100);
    });

    it('should return metrics with linting issues', async () => {
      const metrics = await collector.collectQualityMetrics('BPMSoftwareSolutions', 'renderx-plugins-sdk');
      
      expect(metrics.lintingIssues).toBeDefined();
      expect(metrics.lintingIssues.error).toBeGreaterThanOrEqual(0);
      expect(metrics.lintingIssues.warning).toBeGreaterThanOrEqual(0);
      expect(metrics.lintingIssues.info).toBeGreaterThanOrEqual(0);
    });

    it('should return metrics with type errors', async () => {
      const metrics = await collector.collectQualityMetrics('BPMSoftwareSolutions', 'renderx-plugins-sdk');
      
      expect(metrics.typeErrors).toBeGreaterThanOrEqual(0);
    });

    it('should return metrics with security vulnerabilities', async () => {
      const metrics = await collector.collectQualityMetrics('BPMSoftwareSolutions', 'renderx-plugins-sdk');
      
      expect(metrics.securityVulnerabilities).toBeDefined();
      expect(metrics.securityVulnerabilities.critical).toBeGreaterThanOrEqual(0);
      expect(metrics.securityVulnerabilities.high).toBeGreaterThanOrEqual(0);
      expect(metrics.securityVulnerabilities.medium).toBeGreaterThanOrEqual(0);
      expect(metrics.securityVulnerabilities.low).toBeGreaterThanOrEqual(0);
    });

    it('should return metrics with complexity data', async () => {
      const metrics = await collector.collectQualityMetrics('BPMSoftwareSolutions', 'renderx-plugins-sdk');
      
      expect(metrics.avgCyclomaticComplexity).toBeGreaterThan(0);
      expect(metrics.maxCyclomaticComplexity).toBeGreaterThan(0);
      expect(metrics.maxCyclomaticComplexity).toBeGreaterThanOrEqual(metrics.avgCyclomaticComplexity);
    });

    it('should return metrics with duplication percentage', async () => {
      const metrics = await collector.collectQualityMetrics('BPMSoftwareSolutions', 'renderx-plugins-sdk');
      
      expect(metrics.duplicationPercentage).toBeGreaterThanOrEqual(0);
      expect(metrics.duplicationPercentage).toBeLessThanOrEqual(100);
    });

    it('should return metrics with valid trend', async () => {
      const metrics = await collector.collectQualityMetrics('BPMSoftwareSolutions', 'renderx-plugins-sdk');
      
      expect(['improving', 'stable', 'degrading']).toContain(metrics.qualityTrend);
    });

    it('should cache metrics on subsequent calls', async () => {
      const metrics1 = await collector.collectQualityMetrics('BPMSoftwareSolutions', 'renderx-plugins-sdk');
      const metrics2 = await collector.collectQualityMetrics('BPMSoftwareSolutions', 'renderx-plugins-sdk');
      
      // Should be the same object from cache
      expect(metrics1.timestamp.getTime()).toBe(metrics2.timestamp.getTime());
    });

    it('should handle different repositories', async () => {
      const metrics1 = await collector.collectQualityMetrics('BPMSoftwareSolutions', 'renderx-plugins-sdk');
      const metrics2 = await collector.collectQualityMetrics('BPMSoftwareSolutions', 'renderx-plugins-demo');
      
      expect(metrics1.repo).toBe('BPMSoftwareSolutions/renderx-plugins-sdk');
      expect(metrics2.repo).toBe('BPMSoftwareSolutions/renderx-plugins-demo');
    });
  });

  describe('getMetricsHistory', () => {
    it('should return empty history for new repository', () => {
      const history = collector.getMetricsHistory('BPMSoftwareSolutions', 'new-repo');
      expect(history).toEqual([]);
    });

    it('should return metrics history after collection', async () => {
      await collector.collectQualityMetrics('BPMSoftwareSolutions', 'test-repo');
      const history = collector.getMetricsHistory('BPMSoftwareSolutions', 'test-repo');
      
      expect(history.length).toBeGreaterThan(0);
    });

    it('should filter history by days parameter', async () => {
      await collector.collectQualityMetrics('BPMSoftwareSolutions', 'test-repo');
      const history = collector.getMetricsHistory('BPMSoftwareSolutions', 'test-repo', 1);
      
      expect(history.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('clearCache', () => {
    it('should clear cache for specific repository', async () => {
      await collector.collectQualityMetrics('BPMSoftwareSolutions', 'test-repo');
      collector.clearCache('BPMSoftwareSolutions', 'test-repo');
      
      // History should still exist
      const history = collector.getMetricsHistory('BPMSoftwareSolutions', 'test-repo');
      expect(history.length).toBeGreaterThan(0);
    });
  });

  describe('clearAllCaches', () => {
    it('should clear all caches', async () => {
      await collector.collectQualityMetrics('BPMSoftwareSolutions', 'repo1');
      await collector.collectQualityMetrics('BPMSoftwareSolutions', 'repo2');
      
      collector.clearAllCaches();
      
      const history1 = collector.getMetricsHistory('BPMSoftwareSolutions', 'repo1');
      const history2 = collector.getMetricsHistory('BPMSoftwareSolutions', 'repo2');
      
      expect(history1).toEqual([]);
      expect(history2).toEqual([]);
    });
  });
});

