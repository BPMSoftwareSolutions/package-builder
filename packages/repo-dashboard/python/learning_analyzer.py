"""
Continuous Learning Analyzer module for analyzing patterns in metrics over time.

This module provides functionality to:
- Analyze patterns in metrics over time
- Detect anomalies (statistical, behavioral, seasonal)
- Identify correlations between metrics
- Generate actionable recommendations
- Identify bottlenecks and performance issues
- Generate markdown reports with insights
"""

from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
import statistics
import math
from enum import Enum


class AnomalySeverity(Enum):
    """Severity levels for anomalies."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class RecommendationPriority(Enum):
    """Priority levels for recommendations."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class Trend:
    """Data structure for trend analysis."""
    metric_name: str
    direction: str  # "increasing", "decreasing", "stable"
    slope: float
    confidence: float  # 0-1
    inflection_points: List[int] = field(default_factory=list)
    forecast_value: Optional[float] = None


@dataclass
class Anomaly:
    """Data structure for detected anomalies."""
    metric_name: str
    timestamp: datetime
    value: float
    expected_value: float
    severity: AnomalySeverity
    anomaly_type: str  # "statistical", "behavioral", "seasonal"
    description: str
    deviation_percent: float


@dataclass
class Correlation:
    """Data structure for metric correlations."""
    metric1: str
    metric2: str
    correlation_coefficient: float  # -1 to 1
    is_leading_indicator: bool
    description: str


@dataclass
class Recommendation:
    """Data structure for actionable recommendations."""
    id: str
    title: str
    description: str
    priority: RecommendationPriority
    impact: str  # "low", "medium", "high"
    effort: str  # "low", "medium", "high"
    affected_repos: List[str] = field(default_factory=list)
    metrics_affected: List[str] = field(default_factory=list)
    expected_improvement: float = 0.0
    action_items: List[str] = field(default_factory=list)


@dataclass
class Insight:
    """Data structure for insights."""
    category: str  # "health", "performance", "quality", "bottleneck"
    title: str
    description: str
    metrics_involved: List[str] = field(default_factory=list)
    severity: str = "info"  # "info", "warning", "critical"


class LearningAnalyzer:
    """Analyzer for detecting patterns and generating insights from metrics history."""

    def __init__(self, metrics_history: List[Dict]):
        """
        Initialize the Learning Analyzer.

        Args:
            metrics_history: List of metrics dictionaries with timestamp and metric values
        """
        self.metrics_history = metrics_history
        self.trends: List[Trend] = []
        self.anomalies: List[Anomaly] = []
        self.correlations: List[Correlation] = []
        self.insights: List[Insight] = []
        self.recommendations: List[Recommendation] = []

    def analyze_patterns(self) -> Dict:
        """
        Analyze patterns in metrics over time.

        Returns:
            Dictionary with trends, anomalies, correlations, and insights
        """
        if not self.metrics_history:
            return {
                "trends": [],
                "anomalies": [],
                "correlations": [],
                "insights": []
            }

        # Analyze trends for each metric
        self.trends = self._analyze_trends()
        
        # Detect anomalies
        self.anomalies = self._detect_anomalies()
        
        # Calculate correlations
        self.correlations = self._calculate_correlations()
        
        # Generate insights
        self.insights = self._generate_insights()

        return {
            "trends": [asdict(t) for t in self.trends],
            "anomalies": [asdict(a) for a in self.anomalies],
            "correlations": [asdict(c) for c in self.correlations],
            "insights": [asdict(i) for i in self.insights]
        }

    def _analyze_trends(self) -> List[Trend]:
        """Analyze trends for each metric in the history."""
        trends = []
        
        if not self.metrics_history or len(self.metrics_history) < 2:
            return trends

        # Get all metric names from first entry
        metric_names = [k for k in self.metrics_history[0].keys() 
                       if k != "timestamp" and isinstance(self.metrics_history[0][k], (int, float))]

        for metric_name in metric_names:
            values = []
            for entry in self.metrics_history:
                if metric_name in entry and isinstance(entry[metric_name], (int, float)):
                    values.append(entry[metric_name])

            if len(values) >= 2:
                trend = self.calculate_trend(values)
                trend.metric_name = metric_name
                trends.append(trend)

        return trends

    def calculate_trend(self, values: List[float]) -> Trend:
        """
        Calculate trend for a series of values.

        Args:
            values: List of numeric values

        Returns:
            Trend object with direction, slope, and confidence
        """
        if len(values) < 2:
            return Trend(
                metric_name="",
                direction="stable",
                slope=0.0,
                confidence=0.0
            )

        # Calculate slope using linear regression
        n = len(values)
        x_mean = (n - 1) / 2
        y_mean = statistics.mean(values)
        
        numerator = sum((i - x_mean) * (values[i] - y_mean) for i in range(n))
        denominator = sum((i - x_mean) ** 2 for i in range(n))
        
        slope = numerator / denominator if denominator != 0 else 0
        
        # Determine direction
        if slope > 0.01:
            direction = "increasing"
        elif slope < -0.01:
            direction = "decreasing"
        else:
            direction = "stable"

        # Calculate confidence based on variance
        variance = statistics.variance(values) if len(values) > 1 else 0
        confidence = min(1.0, abs(slope) / (variance + 1))

        return Trend(
            metric_name="",
            direction=direction,
            slope=slope,
            confidence=confidence
        )

    def _detect_anomalies(self) -> List[Anomaly]:
        """Detect anomalies in metrics using statistical methods."""
        anomalies = []

        if not self.metrics_history or len(self.metrics_history) < 3:
            return anomalies

        metric_names = [k for k in self.metrics_history[0].keys()
                       if k != "timestamp" and isinstance(self.metrics_history[0][k], (int, float))]

        for metric_name in metric_names:
            values = []
            timestamps = []

            for entry in self.metrics_history:
                if metric_name in entry and isinstance(entry[metric_name], (int, float)):
                    values.append(entry[metric_name])
                    timestamps.append(entry.get("timestamp", datetime.now()))

            if len(values) >= 3:
                # Use z-score method for statistical anomalies
                mean = statistics.mean(values)
                stdev = statistics.stdev(values) if len(values) > 1 else 0

                if stdev > 0:
                    for i, value in enumerate(values):
                        z_score = abs((value - mean) / stdev)
                        if z_score > 1.5:  # Threshold for anomaly (lowered from 2.0)
                            deviation_percent = ((value - mean) / mean * 100) if mean != 0 else 0
                            anomalies.append(Anomaly(
                                metric_name=metric_name,
                                timestamp=timestamps[i],
                                value=value,
                                expected_value=mean,
                                severity=self._calculate_severity(z_score),
                                anomaly_type="statistical",
                                description=f"Value {value} deviates significantly from mean {mean:.2f}",
                                deviation_percent=deviation_percent
                            ))

        return anomalies

    def _calculate_severity(self, z_score: float) -> AnomalySeverity:
        """Calculate anomaly severity based on z-score."""
        if z_score > 4:
            return AnomalySeverity.CRITICAL
        elif z_score > 3:
            return AnomalySeverity.HIGH
        elif z_score >= 2.5:
            return AnomalySeverity.MEDIUM
        else:
            return AnomalySeverity.LOW

    def _calculate_correlations(self) -> List[Correlation]:
        """Calculate correlations between metrics."""
        correlations = []
        
        if not self.metrics_history or len(self.metrics_history) < 2:
            return correlations

        metric_names = [k for k in self.metrics_history[0].keys() 
                       if k != "timestamp" and isinstance(self.metrics_history[0][k], (int, float))]

        # Calculate correlations between all metric pairs
        for i, metric1 in enumerate(metric_names):
            for metric2 in metric_names[i+1:]:
                values1 = []
                values2 = []
                
                for entry in self.metrics_history:
                    if (metric1 in entry and metric2 in entry and 
                        isinstance(entry[metric1], (int, float)) and 
                        isinstance(entry[metric2], (int, float))):
                        values1.append(entry[metric1])
                        values2.append(entry[metric2])

                if len(values1) >= 2:
                    corr = self.calculate_correlation(values1, values2)
                    if abs(corr) > 0.5:  # Only include significant correlations
                        correlations.append(Correlation(
                            metric1=metric1,
                            metric2=metric2,
                            correlation_coefficient=corr,
                            is_leading_indicator=corr > 0.7,
                            description=f"Strong correlation between {metric1} and {metric2}"
                        ))

        return correlations

    def calculate_correlation(self, metric1: List[float], metric2: List[float]) -> float:
        """
        Calculate Pearson correlation coefficient between two metrics.

        Args:
            metric1: First metric values
            metric2: Second metric values

        Returns:
            Correlation coefficient (-1 to 1)
        """
        if len(metric1) < 2 or len(metric2) < 2 or len(metric1) != len(metric2):
            return 0.0

        mean1 = statistics.mean(metric1)
        mean2 = statistics.mean(metric2)
        
        numerator = sum((metric1[i] - mean1) * (metric2[i] - mean2) for i in range(len(metric1)))
        
        var1 = sum((x - mean1) ** 2 for x in metric1)
        var2 = sum((x - mean2) ** 2 for x in metric2)
        denominator = math.sqrt(var1 * var2)
        
        if denominator == 0:
            return 0.0
        
        return numerator / denominator

    def _generate_insights(self) -> List[Insight]:
        """Generate insights from trends and anomalies."""
        insights = []

        # Health insights
        if self.trends:
            health_trends = [t for t in self.trends if "health" in t.metric_name.lower()]
            if health_trends:
                trend = health_trends[0]
                insights.append(Insight(
                    category="health",
                    title=f"Health Score Trend: {trend.direction.capitalize()}",
                    description=f"Health score is {trend.direction} with confidence {trend.confidence:.2%}",
                    metrics_involved=["health_score"],
                    severity="info"
                ))

        # Anomaly insights - check for any anomalies, not just critical
        if self.anomalies:
            critical_anomalies = [a for a in self.anomalies if a.severity == AnomalySeverity.CRITICAL]
            high_anomalies = [a for a in self.anomalies if a.severity == AnomalySeverity.HIGH]

            if critical_anomalies:
                insights.append(Insight(
                    category="bottleneck",
                    title="Critical Anomalies Detected",
                    description=f"Found {len(critical_anomalies)} critical anomalies requiring attention",
                    metrics_involved=[a.metric_name for a in critical_anomalies],
                    severity="critical"
                ))
            elif high_anomalies or len(self.anomalies) > 2:
                insights.append(Insight(
                    category="bottleneck",
                    title="Anomalies Detected",
                    description=f"Found {len(self.anomalies)} anomalies in metrics",
                    metrics_involved=[a.metric_name for a in self.anomalies],
                    severity="warning"
                ))

        return insights

    def identify_bottlenecks(self) -> List[Dict]:
        """Identify bottlenecks and performance issues."""
        bottlenecks = []

        # Check for high anomaly counts
        if len(self.anomalies) > 3:
            bottlenecks.append({
                "type": "anomalies",
                "description": f"High number of anomalies detected ({len(self.anomalies)})",
                "severity": "high",
                "affected_metrics": list(set(a.metric_name for a in self.anomalies))
            })

        # Check for declining trends (with lower confidence threshold)
        declining_trends = [t for t in self.trends if t.direction == "decreasing" and t.confidence > 0.1]
        if declining_trends:
            bottlenecks.append({
                "type": "declining_metrics",
                "description": f"Declining trends in {len(declining_trends)} metrics",
                "severity": "medium",
                "affected_metrics": [t.metric_name for t in declining_trends]
            })

        return bottlenecks

    def generate_recommendations(self) -> List[Dict]:
        """Generate actionable recommendations based on analysis."""
        recommendations = []
        rec_id = 1

        # Recommendation for declining health
        declining_health = [t for t in self.trends if "health" in t.metric_name.lower() and t.direction == "decreasing"]
        if declining_health:
            recommendations.append({
                "id": f"rec-{rec_id:03d}",
                "title": "Improve System Health",
                "description": "Health score is declining. Review recent changes and metrics.",
                "priority": "high",
                "impact": "high",
                "effort": "medium",
                "action_items": [
                    "Review recent deployments",
                    "Check build success rates",
                    "Analyze test coverage trends"
                ]
            })
            rec_id += 1

        # Recommendation for anomalies (lowered threshold from 3 to 2)
        if len(self.anomalies) > 2:
            recommendations.append({
                "id": f"rec-{rec_id:03d}",
                "title": "Investigate Anomalies",
                "description": f"Multiple anomalies detected in metrics",
                "priority": "medium",
                "impact": "medium",
                "effort": "medium",
                "action_items": [
                    "Review anomaly details",
                    "Check for external factors",
                    "Implement monitoring alerts"
                ]
            })
            rec_id += 1

        return recommendations

    def generate_report(self, adf: Dict, metrics: Dict) -> str:
        """
        Generate markdown report with insights.

        Args:
            adf: Architecture Definition File
            metrics: Aggregated metrics

        Returns:
            Markdown formatted report
        """
        report = []
        report.append("# Continuous Learning Report\n")
        report.append(f"**Organization**: {adf.get('architecture', {}).get('name', 'Unknown')}\n")
        report.append(f"**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")

        # Executive Summary
        report.append("## Executive Summary\n")
        report.append(f"- Total Trends Analyzed: {len(self.trends)}\n")
        report.append(f"- Anomalies Detected: {len(self.anomalies)}\n")
        report.append(f"- Correlations Found: {len(self.correlations)}\n")
        report.append(f"- Insights Generated: {len(self.insights)}\n\n")

        # Trends Section
        if self.trends:
            report.append("## Trends\n")
            for trend in self.trends:
                report.append(f"### {trend.metric_name}\n")
                report.append(f"- Direction: {trend.direction}\n")
                report.append(f"- Slope: {trend.slope:.4f}\n")
                report.append(f"- Confidence: {trend.confidence:.2%}\n\n")

        # Anomalies Section
        if self.anomalies:
            report.append("## Anomalies Detected\n")
            for anomaly in self.anomalies:
                report.append(f"### {anomaly.metric_name}\n")
                report.append(f"- Severity: {anomaly.severity.value}\n")
                report.append(f"- Value: {anomaly.value}\n")
                report.append(f"- Expected: {anomaly.expected_value:.2f}\n")
                report.append(f"- Description: {anomaly.description}\n\n")

        # Recommendations Section
        recommendations = self.generate_recommendations()
        if recommendations:
            report.append("## Recommendations\n")
            for rec in recommendations:
                report.append(f"### [{rec['priority'].upper()}] {rec['title']}\n")
                report.append(f"{rec['description']}\n\n")

        return "".join(report)

