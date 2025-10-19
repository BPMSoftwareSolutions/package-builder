/**
 * Unit tests for AlertingService
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AlertingService } from './alerting.js';

describe('AlertingService', () => {
  let service: AlertingService;

  beforeEach(() => {
    service = new AlertingService();
  });

  it('should create an alert', () => {
    const alert = service.createAlert(
      'SDK Team',
      'renderx-plugins-sdk',
      'build-failure',
      'critical',
      'Build failed',
      'Build failed after 5 minutes',
      ['Fix build configuration']
    );

    expect(alert).toBeDefined();
    expect(alert.status).toBe('active');
    expect(alert.severity).toBe('critical');
    expect(alert.team).toBe('SDK Team');
  });

  it('should acknowledge an alert', () => {
    const alert = service.createAlert(
      'SDK Team',
      'renderx-plugins-sdk',
      'build-failure',
      'critical',
      'Build failed',
      'Build failed after 5 minutes'
    );

    const acknowledged = service.acknowledgeAlert(alert.id);
    expect(acknowledged?.status).toBe('acknowledged');
    expect(acknowledged?.acknowledgedAt).toBeDefined();
  });

  it('should resolve an alert', () => {
    const alert = service.createAlert(
      'SDK Team',
      'renderx-plugins-sdk',
      'build-failure',
      'critical',
      'Build failed',
      'Build failed after 5 minutes'
    );

    const resolved = service.resolveAlert(alert.id);
    expect(resolved?.status).toBe('resolved');
    expect(resolved?.resolvedAt).toBeDefined();
  });

  it('should get alert by ID', () => {
    const alert = service.createAlert(
      'SDK Team',
      'renderx-plugins-sdk',
      'build-failure',
      'critical',
      'Build failed',
      'Build failed after 5 minutes'
    );

    const retrieved = service.getAlert(alert.id);
    expect(retrieved).toEqual(alert);
  });

  it('should return null for non-existent alert', () => {
    const alert = service.getAlert('non-existent');
    expect(alert).toBeNull();
  });

  it('should get all active alerts', () => {
    service.createAlert('SDK Team', 'renderx-plugins-sdk', 'build-failure', 'critical', 'Build failed', 'Build failed');
    service.createAlert('Conductor Team', 'musical-conductor', 'test-failure', 'high', 'Tests failed', 'Tests failed');

    const activeAlerts = service.getActiveAlerts();
    expect(activeAlerts).toHaveLength(2);
  });

  it('should get team alerts', () => {
    service.createAlert('SDK Team', 'renderx-plugins-sdk', 'build-failure', 'critical', 'Build failed', 'Build failed');
    service.createAlert('SDK Team', 'renderx-manifest-tools', 'test-failure', 'high', 'Tests failed', 'Tests failed');
    service.createAlert('Conductor Team', 'musical-conductor', 'deployment-failure', 'critical', 'Deploy failed', 'Deploy failed');

    const teamAlerts = service.getTeamAlerts('SDK Team');
    expect(teamAlerts).toHaveLength(2);
  });

  it('should get repo alerts', () => {
    service.createAlert('SDK Team', 'renderx-plugins-sdk', 'build-failure', 'critical', 'Build failed', 'Build failed');
    service.createAlert('SDK Team', 'renderx-plugins-sdk', 'test-failure', 'high', 'Tests failed', 'Tests failed');
    service.createAlert('Conductor Team', 'musical-conductor', 'deployment-failure', 'critical', 'Deploy failed', 'Deploy failed');

    const repoAlerts = service.getRepoAlerts('renderx-plugins-sdk');
    expect(repoAlerts).toHaveLength(2);
  });

  it('should calculate alert metrics', () => {
    const alert1 = service.createAlert('SDK Team', 'renderx-plugins-sdk', 'build-failure', 'critical', 'Build failed', 'Build failed');
    const alert2 = service.createAlert('Conductor Team', 'musical-conductor', 'test-failure', 'high', 'Tests failed', 'Tests failed');

    service.acknowledgeAlert(alert1.id);
    service.resolveAlert(alert2.id);

    const metrics = service.getAlertMetrics();
    expect(metrics.totalAlerts).toBe(2);
    expect(metrics.activeAlerts).toBe(0);
    expect(metrics.acknowledgedAlerts).toBe(1);
    expect(metrics.resolvedAlerts).toBe(1);
  });

  it('should calculate average response time', () => {
    const alert = service.createAlert('SDK Team', 'renderx-plugins-sdk', 'build-failure', 'critical', 'Build failed', 'Build failed');
    
    // Simulate some time passing
    setTimeout(() => {
      service.acknowledgeAlert(alert.id);
    }, 100);

    // Wait for the timeout
    return new Promise(resolve => {
      setTimeout(() => {
        const metrics = service.getAlertMetrics();
        expect(metrics.avgResponseTime).toBeGreaterThanOrEqual(0);
        resolve(null);
      }, 150);
    });
  });

  it('should clear all alerts', () => {
    service.createAlert('SDK Team', 'renderx-plugins-sdk', 'build-failure', 'critical', 'Build failed', 'Build failed');
    service.createAlert('Conductor Team', 'musical-conductor', 'test-failure', 'high', 'Tests failed', 'Tests failed');

    service.clearAlerts();

    const activeAlerts = service.getActiveAlerts();
    expect(activeAlerts).toHaveLength(0);
  });
});

