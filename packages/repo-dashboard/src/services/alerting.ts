/**
 * Alerting Service
 * Generates alerts for critical issues and tracks alert response time
 */

export interface Alert {
  id: string;
  timestamp: Date;
  team: string;
  repo: string;
  
  // Alert info
  type: 'build-failure' | 'test-failure' | 'deployment-failure' | 'coverage-drop';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  
  // Status
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  
  // Metadata
  relatedIssues: string[];
  recommendations: string[];
}

export interface AlertMetrics {
  totalAlerts: number;
  activeAlerts: number;
  acknowledgedAlerts: number;
  resolvedAlerts: number;
  avgResponseTime: number; // minutes
  avgResolutionTime: number; // minutes
}

export class AlertingService {
  private alerts: Map<string, Alert> = new Map();
  private alertCounter: number = 0;

  /**
   * Create a new alert
   */
  createAlert(
    team: string,
    repo: string,
    type: Alert['type'],
    severity: Alert['severity'],
    title: string,
    description: string,
    recommendations: string[] = []
  ): Alert {
    const id = `alert-${++this.alertCounter}`;
    const alert: Alert = {
      id,
      timestamp: new Date(),
      team,
      repo,
      type,
      severity,
      title,
      description,
      status: 'active',
      relatedIssues: [],
      recommendations
    };

    this.alerts.set(id, alert);
    console.log(`🚨 Created alert: ${id} - ${title}`);
    return alert;
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): Alert | null {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      console.error(`❌ Alert not found: ${alertId}`);
      return null;
    }

    alert.status = 'acknowledged';
    alert.acknowledgedAt = new Date();
    console.log(`✅ Acknowledged alert: ${alertId}`);
    return alert;
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): Alert | null {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      console.error(`❌ Alert not found: ${alertId}`);
      return null;
    }

    alert.status = 'resolved';
    alert.resolvedAt = new Date();
    console.log(`✅ Resolved alert: ${alertId}`);
    return alert;
  }

  /**
   * Get alert by ID
   */
  getAlert(alertId: string): Alert | null {
    return this.alerts.get(alertId) || null;
  }

  /**
   * Get all active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(a => a.status === 'active');
  }

  /**
   * Get alerts for a team
   */
  getTeamAlerts(team: string): Alert[] {
    return Array.from(this.alerts.values()).filter(a => a.team === team);
  }

  /**
   * Get alerts for a repository
   */
  getRepoAlerts(repo: string): Alert[] {
    return Array.from(this.alerts.values()).filter(a => a.repo === repo);
  }

  /**
   * Calculate alert metrics
   */
  getAlertMetrics(): AlertMetrics {
    const allAlerts = Array.from(this.alerts.values());
    const activeAlerts = allAlerts.filter(a => a.status === 'active');
    const acknowledgedAlerts = allAlerts.filter(a => a.status === 'acknowledged');
    const resolvedAlerts = allAlerts.filter(a => a.status === 'resolved');

    // Calculate average response time (time to acknowledge)
    const responseTimesMs = acknowledgedAlerts
      .filter(a => a.acknowledgedAt)
      .map(a => a.acknowledgedAt!.getTime() - a.timestamp.getTime());
    const avgResponseTime = responseTimesMs.length > 0
      ? Math.round(responseTimesMs.reduce((a, b) => a + b, 0) / responseTimesMs.length / 60000)
      : 0;

    // Calculate average resolution time
    const resolutionTimesMs = resolvedAlerts
      .filter(a => a.resolvedAt)
      .map(a => a.resolvedAt!.getTime() - a.timestamp.getTime());
    const avgResolutionTime = resolutionTimesMs.length > 0
      ? Math.round(resolutionTimesMs.reduce((a, b) => a + b, 0) / resolutionTimesMs.length / 60000)
      : 0;

    return {
      totalAlerts: allAlerts.length,
      activeAlerts: activeAlerts.length,
      acknowledgedAlerts: acknowledgedAlerts.length,
      resolvedAlerts: resolvedAlerts.length,
      avgResponseTime,
      avgResolutionTime
    };
  }

  /**
   * Clear all alerts
   */
  clearAlerts(): void {
    this.alerts.clear();
    this.alertCounter = 0;
  }
}

// Export singleton instance
export const alertingService = new AlertingService();

