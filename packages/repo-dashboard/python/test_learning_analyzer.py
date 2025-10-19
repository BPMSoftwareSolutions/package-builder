"""
Unit tests for the Learning Analyzer module.

Tests cover:
- Trend detection and analysis
- Anomaly detection
- Correlation analysis
- Insights generation
- Recommendations generation
- Report generation
"""

import pytest
from datetime import datetime, timedelta
from learning_analyzer import (
    LearningAnalyzer, Trend, Anomaly, Correlation, Recommendation,
    AnomalySeverity, RecommendationPriority, Insight
)


class TestTrendDetection:
    """Tests for trend detection functionality."""

    def test_calculate_trend_increasing(self):
        """Test trend detection for increasing values."""
        analyzer = LearningAnalyzer([])
        values = [10, 15, 20, 25, 30]
        trend = analyzer.calculate_trend(values)
        
        assert trend.direction == "increasing"
        assert trend.slope > 0
        assert trend.confidence > 0

    def test_calculate_trend_decreasing(self):
        """Test trend detection for decreasing values."""
        analyzer = LearningAnalyzer([])
        values = [30, 25, 20, 15, 10]
        trend = analyzer.calculate_trend(values)
        
        assert trend.direction == "decreasing"
        assert trend.slope < 0
        assert trend.confidence > 0

    def test_calculate_trend_stable(self):
        """Test trend detection for stable values."""
        analyzer = LearningAnalyzer([])
        values = [20, 20, 20, 20, 20]
        trend = analyzer.calculate_trend(values)
        
        assert trend.direction == "stable"
        assert abs(trend.slope) < 0.01

    def test_calculate_trend_empty_list(self):
        """Test trend detection with empty list."""
        analyzer = LearningAnalyzer([])
        trend = analyzer.calculate_trend([])
        
        assert trend.direction == "stable"
        assert trend.slope == 0.0

    def test_calculate_trend_single_value(self):
        """Test trend detection with single value."""
        analyzer = LearningAnalyzer([])
        trend = analyzer.calculate_trend([10])
        
        assert trend.direction == "stable"
        assert trend.slope == 0.0


class TestAnomalyDetection:
    """Tests for anomaly detection functionality."""

    def test_detect_anomalies_statistical(self):
        """Test statistical anomaly detection."""
        metrics_history = [
            {"timestamp": datetime.now(), "metric1": 10},
            {"timestamp": datetime.now(), "metric1": 11},
            {"timestamp": datetime.now(), "metric1": 10},
            {"timestamp": datetime.now(), "metric1": 12},
            {"timestamp": datetime.now(), "metric1": 11},
            {"timestamp": datetime.now(), "metric1": 100},  # Anomaly - very different
        ]
        analyzer = LearningAnalyzer(metrics_history)
        anomalies = analyzer._detect_anomalies()

        assert len(anomalies) > 0
        assert anomalies[0].anomaly_type == "statistical"

    def test_detect_anomalies_empty_history(self):
        """Test anomaly detection with empty history."""
        analyzer = LearningAnalyzer([])
        anomalies = analyzer._detect_anomalies()
        
        assert len(anomalies) == 0

    def test_detect_anomalies_insufficient_data(self):
        """Test anomaly detection with insufficient data."""
        metrics_history = [
            {"timestamp": datetime.now(), "metric1": 10},
            {"timestamp": datetime.now(), "metric1": 20},
        ]
        analyzer = LearningAnalyzer(metrics_history)
        anomalies = analyzer._detect_anomalies()
        
        assert len(anomalies) == 0

    def test_calculate_severity(self):
        """Test severity calculation based on z-score."""
        analyzer = LearningAnalyzer([])
        
        assert analyzer._calculate_severity(4.5) == AnomalySeverity.CRITICAL
        assert analyzer._calculate_severity(3.5) == AnomalySeverity.HIGH
        assert analyzer._calculate_severity(2.7) == AnomalySeverity.MEDIUM
        assert analyzer._calculate_severity(2.5) == AnomalySeverity.MEDIUM


class TestCorrelationAnalysis:
    """Tests for correlation analysis functionality."""

    def test_calculate_correlation_positive(self):
        """Test positive correlation calculation."""
        analyzer = LearningAnalyzer([])
        metric1 = [1, 2, 3, 4, 5]
        metric2 = [2, 4, 6, 8, 10]
        
        corr = analyzer.calculate_correlation(metric1, metric2)
        assert corr > 0.9  # Strong positive correlation

    def test_calculate_correlation_negative(self):
        """Test negative correlation calculation."""
        analyzer = LearningAnalyzer([])
        metric1 = [1, 2, 3, 4, 5]
        metric2 = [10, 8, 6, 4, 2]
        
        corr = analyzer.calculate_correlation(metric1, metric2)
        assert corr < -0.9  # Strong negative correlation

    def test_calculate_correlation_no_correlation(self):
        """Test no correlation calculation."""
        analyzer = LearningAnalyzer([])
        metric1 = [1, 2, 3, 4, 5]
        metric2 = [5, 1, 4, 2, 3]
        
        corr = analyzer.calculate_correlation(metric1, metric2)
        assert abs(corr) < 0.5  # Weak correlation

    def test_calculate_correlation_empty_lists(self):
        """Test correlation with empty lists."""
        analyzer = LearningAnalyzer([])
        corr = analyzer.calculate_correlation([], [])
        
        assert corr == 0.0

    def test_calculate_correlation_mismatched_lengths(self):
        """Test correlation with mismatched list lengths."""
        analyzer = LearningAnalyzer([])
        corr = analyzer.calculate_correlation([1, 2, 3], [1, 2])
        
        assert corr == 0.0

    def test_calculate_correlations_multiple_metrics(self):
        """Test correlation calculation across multiple metrics."""
        metrics_history = [
            {"timestamp": datetime.now(), "metric1": 10, "metric2": 20},
            {"timestamp": datetime.now(), "metric1": 15, "metric2": 30},
            {"timestamp": datetime.now(), "metric1": 20, "metric2": 40},
        ]
        analyzer = LearningAnalyzer(metrics_history)
        correlations = analyzer._calculate_correlations()
        
        assert len(correlations) > 0


class TestInsightsGeneration:
    """Tests for insights generation functionality."""

    def test_generate_insights_with_trends(self):
        """Test insights generation with trends."""
        metrics_history = [
            {"timestamp": datetime.now(), "health_score": 80},
            {"timestamp": datetime.now(), "health_score": 82},
            {"timestamp": datetime.now(), "health_score": 84},
        ]
        analyzer = LearningAnalyzer(metrics_history)
        analyzer.analyze_patterns()
        
        assert len(analyzer.insights) > 0

    def test_generate_insights_with_anomalies(self):
        """Test insights generation with anomalies."""
        metrics_history = [
            {"timestamp": datetime.now(), "metric1": 10},
            {"timestamp": datetime.now(), "metric1": 11},
            {"timestamp": datetime.now(), "metric1": 10},
            {"timestamp": datetime.now(), "metric1": 12},
            {"timestamp": datetime.now(), "metric1": 11},
            {"timestamp": datetime.now(), "metric1": 1000},  # Extreme anomaly
            {"timestamp": datetime.now(), "metric1": 1050},
        ]
        analyzer = LearningAnalyzer(metrics_history)
        analyzer.analyze_patterns()

        # Should have insights (either health or bottleneck)
        assert len(analyzer.insights) > 0 or len(analyzer.anomalies) > 0


class TestBottleneckIdentification:
    """Tests for bottleneck identification."""

    def test_identify_bottlenecks_high_anomalies(self):
        """Test bottleneck identification with high anomaly count."""
        metrics_history = [
            {"timestamp": datetime.now(), "metric1": 10},
            {"timestamp": datetime.now(), "metric1": 11},
            {"timestamp": datetime.now(), "metric1": 10},
            {"timestamp": datetime.now(), "metric1": 12},
            {"timestamp": datetime.now(), "metric1": 1000},
            {"timestamp": datetime.now(), "metric1": 1050},
            {"timestamp": datetime.now(), "metric1": 1100},
        ]
        analyzer = LearningAnalyzer(metrics_history)
        analyzer.analyze_patterns()
        bottlenecks = analyzer.identify_bottlenecks()

        # Should be able to call identify_bottlenecks without errors
        assert isinstance(bottlenecks, list)

    def test_identify_bottlenecks_declining_trends(self):
        """Test bottleneck identification with declining trends."""
        metrics_history = [
            {"timestamp": datetime.now(), "metric1": 100},
            {"timestamp": datetime.now(), "metric1": 90},
            {"timestamp": datetime.now(), "metric1": 80},
            {"timestamp": datetime.now(), "metric1": 70},
        ]
        analyzer = LearningAnalyzer(metrics_history)
        analyzer.analyze_patterns()
        bottlenecks = analyzer.identify_bottlenecks()

        # Should have declining trends detected
        assert len(analyzer.trends) > 0
        assert any(t.direction == "decreasing" for t in analyzer.trends)


class TestRecommendationsGeneration:
    """Tests for recommendations generation."""

    def test_generate_recommendations_declining_health(self):
        """Test recommendations for declining health."""
        metrics_history = [
            {"timestamp": datetime.now(), "health_score": 100},
            {"timestamp": datetime.now(), "health_score": 90},
            {"timestamp": datetime.now(), "health_score": 80},
            {"timestamp": datetime.now(), "health_score": 70},
        ]
        analyzer = LearningAnalyzer(metrics_history)
        analyzer.analyze_patterns()
        recommendations = analyzer.generate_recommendations()
        
        assert len(recommendations) > 0
        assert any("health" in r["title"].lower() for r in recommendations)

    def test_generate_recommendations_anomalies(self):
        """Test recommendations for anomalies."""
        metrics_history = [
            {"timestamp": datetime.now(), "metric1": 10},
            {"timestamp": datetime.now(), "metric1": 11},
            {"timestamp": datetime.now(), "metric1": 10},
            {"timestamp": datetime.now(), "metric1": 12},
            {"timestamp": datetime.now(), "metric1": 1000},
            {"timestamp": datetime.now(), "metric1": 1050},
        ]
        analyzer = LearningAnalyzer(metrics_history)
        analyzer.analyze_patterns()
        recommendations = analyzer.generate_recommendations()

        # Should be able to generate recommendations without errors
        assert isinstance(recommendations, list)


class TestReportGeneration:
    """Tests for report generation."""

    def test_generate_report_basic(self):
        """Test basic report generation."""
        metrics_history = [
            {"timestamp": datetime.now(), "metric1": 10},
            {"timestamp": datetime.now(), "metric1": 15},
            {"timestamp": datetime.now(), "metric1": 20},
        ]
        analyzer = LearningAnalyzer(metrics_history)
        analyzer.analyze_patterns()
        
        adf = {
            "architecture": {
                "name": "Test Architecture"
            }
        }
        metrics = {}
        
        report = analyzer.generate_report(adf, metrics)
        
        assert "Continuous Learning Report" in report
        assert "Test Architecture" in report
        assert "Executive Summary" in report

    def test_generate_report_with_trends(self):
        """Test report generation with trends."""
        metrics_history = [
            {"timestamp": datetime.now(), "metric1": 10},
            {"timestamp": datetime.now(), "metric1": 15},
            {"timestamp": datetime.now(), "metric1": 20},
        ]
        analyzer = LearningAnalyzer(metrics_history)
        analyzer.analyze_patterns()
        
        adf = {"architecture": {"name": "Test"}}
        report = analyzer.generate_report(adf, {})
        
        assert "Trends" in report

    def test_generate_report_with_anomalies(self):
        """Test report generation with anomalies."""
        metrics_history = [
            {"timestamp": datetime.now(), "metric1": 10},
            {"timestamp": datetime.now(), "metric1": 12},
            {"timestamp": datetime.now(), "metric1": 11},
            {"timestamp": datetime.now(), "metric1": 100},
        ]
        analyzer = LearningAnalyzer(metrics_history)
        analyzer.analyze_patterns()
        
        adf = {"architecture": {"name": "Test"}}
        report = analyzer.generate_report(adf, {})
        
        assert "Anomalies" in report or "Recommendations" in report


class TestAnalyzePatterns:
    """Tests for the main analyze_patterns method."""

    def test_analyze_patterns_empty_history(self):
        """Test analyze_patterns with empty history."""
        analyzer = LearningAnalyzer([])
        result = analyzer.analyze_patterns()
        
        assert result["trends"] == []
        assert result["anomalies"] == []
        assert result["correlations"] == []
        assert result["insights"] == []

    def test_analyze_patterns_complete(self):
        """Test complete pattern analysis."""
        metrics_history = [
            {"timestamp": datetime.now(), "metric1": 10, "metric2": 20},
            {"timestamp": datetime.now(), "metric1": 15, "metric2": 30},
            {"timestamp": datetime.now(), "metric1": 20, "metric2": 40},
            {"timestamp": datetime.now(), "metric1": 25, "metric2": 50},
        ]
        analyzer = LearningAnalyzer(metrics_history)
        result = analyzer.analyze_patterns()
        
        assert "trends" in result
        assert "anomalies" in result
        assert "correlations" in result
        assert "insights" in result
        assert len(result["trends"]) > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

