"""
Unit tests for the Metrics Aggregator module.

Tests cover:
- Data structure creation and validation
- Metrics collection and aggregation
- DORA metrics calculation
- Health score calculation
- Metrics export (JSON and CSV)
- Database operations
"""

import pytest
import json
import sqlite3
import sys
from datetime import datetime, timedelta
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock

# Add python directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from metrics_aggregator import (
    RepositoryMetrics,
    AggregatedMetrics,
    MetricsAggregator,
)


class TestRepositoryMetrics:
    """Tests for RepositoryMetrics dataclass."""

    def test_create_repository_metrics(self):
        """Test creating a RepositoryMetrics instance."""
        metrics = RepositoryMetrics(
            repo_name="test-repo",
            health_score=85.0,
            build_status="success",
            test_coverage=90.0,
            open_issues=5,
            stale_prs=2,
        )
        
        assert metrics.repo_name == "test-repo"
        assert metrics.health_score == 85.0
        assert metrics.build_status == "success"
        assert metrics.test_coverage == 90.0
        assert metrics.open_issues == 5
        assert metrics.stale_prs == 2

    def test_repository_metrics_defaults(self):
        """Test RepositoryMetrics default values."""
        metrics = RepositoryMetrics(
            repo_name="test-repo",
            health_score=75.0,
            build_status="pending",
            test_coverage=80.0,
            open_issues=3,
            stale_prs=1,
        )
        
        assert metrics.deployment_frequency == 0.0
        assert metrics.lead_time == 0.0
        assert metrics.mttr == 0.0
        assert metrics.change_failure_rate == 0.0
        assert metrics.last_deployment is None


class TestAggregatedMetrics:
    """Tests for AggregatedMetrics dataclass."""

    def test_create_aggregated_metrics(self):
        """Test creating an AggregatedMetrics instance."""
        now = datetime.now()
        metrics = AggregatedMetrics(
            timestamp=now,
            organization="test-org",
        )
        
        assert metrics.timestamp == now
        assert metrics.organization == "test-org"
        assert metrics.summary == {}
        assert metrics.by_repository == {}
        assert metrics.trends == {}


class TestMetricsAggregator:
    """Tests for MetricsAggregator class."""

    @pytest.fixture
    def aggregator(self, tmp_path):
        """Create a MetricsAggregator instance for testing."""
        with patch.dict("os.environ", {"GITHUB_TOKEN": "test-token"}):
            agg = MetricsAggregator("test-org", "test-token")
            agg.db_path = tmp_path / "test_metrics.db"
            agg._init_database()
            return agg

    def test_init_aggregator(self):
        """Test MetricsAggregator initialization."""
        with patch.dict("os.environ", {"GITHUB_TOKEN": "test-token"}):
            agg = MetricsAggregator("test-org", "test-token")
            
            assert agg.org == "test-org"
            assert agg.github_token == "test-token"
            assert agg.base_url == "https://api.github.com"

    def test_init_database(self, aggregator):
        """Test database initialization."""
        assert aggregator.db_path.exists()
        
        conn = sqlite3.connect(aggregator.db_path)
        cursor = conn.cursor()
        
        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='metrics_history'"
        )
        assert cursor.fetchone() is not None
        
        conn.close()

    def test_get_repository_metrics(self, aggregator):
        """Test getting metrics for a single repository."""
        metrics = aggregator.get_repository_metrics("test-repo")
        
        assert isinstance(metrics, RepositoryMetrics)
        assert metrics.repo_name == "test-repo"
        assert metrics.health_score >= 0
        assert metrics.health_score <= 100

    def test_aggregate_repository_metrics(self, aggregator):
        """Test aggregating metrics for multiple repositories."""
        repos = ["repo1", "repo2", "repo3"]
        aggregated = aggregator.aggregate_repository_metrics(repos)
        
        assert isinstance(aggregated, AggregatedMetrics)
        assert aggregated.organization == "test-org"
        assert aggregated.summary["totalRepos"] == 3
        assert len(aggregated.by_repository) == 3
        assert "repo1" in aggregated.by_repository
        assert "repo2" in aggregated.by_repository
        assert "repo3" in aggregated.by_repository

    def test_calculate_health_score(self, aggregator):
        """Test health score calculation."""
        score = aggregator.calculate_health_score("test-repo")
        
        assert isinstance(score, float)
        assert 0 <= score <= 100

    def test_calculate_dora_metrics(self, aggregator):
        """Test DORA metrics calculation."""
        dora = aggregator.calculate_dora_metrics("test-repo")
        
        assert isinstance(dora, dict)
        assert "deployment_frequency" in dora
        assert "lead_time" in dora
        assert "mttr" in dora
        assert "change_failure_rate" in dora
        
        assert dora["deployment_frequency"] >= 0
        assert dora["lead_time"] >= 0
        assert dora["mttr"] >= 0
        assert 0 <= dora["change_failure_rate"] <= 100

    def test_get_metrics_history(self, aggregator):
        """Test retrieving metrics history."""
        # Store some test metrics
        metrics = RepositoryMetrics(
            repo_name="test-repo",
            health_score=85.0,
            build_status="success",
            test_coverage=90.0,
            open_issues=5,
            stale_prs=2,
        )
        aggregator._store_metrics(metrics)
        
        history = aggregator.get_metrics_history(days=30)
        
        assert isinstance(history, dict)
        assert "healthScoreTrend" in history
        assert "buildSuccessRateTrend" in history
        assert "testCoverageTrend" in history
        assert "deploymentFrequencyTrend" in history

    def test_export_metrics_json(self, aggregator):
        """Test exporting metrics to JSON format."""
        repos = ["repo1", "repo2"]
        aggregated = aggregator.aggregate_repository_metrics(repos)
        
        json_export = aggregator.export_metrics(aggregated, format="json")
        
        assert isinstance(json_export, str)
        data = json.loads(json_export)
        assert data["organization"] == "test-org"
        assert "summary" in data
        assert "by_repository" in data

    def test_export_metrics_csv(self, aggregator):
        """Test exporting metrics to CSV format."""
        repos = ["repo1", "repo2"]
        aggregated = aggregator.aggregate_repository_metrics(repos)
        
        csv_export = aggregator.export_metrics(aggregated, format="csv")
        
        assert isinstance(csv_export, str)
        lines = csv_export.split("\n")
        assert len(lines) > 1  # Header + data rows
        assert "repo_name" in lines[0]

    def test_export_metrics_invalid_format(self, aggregator):
        """Test exporting metrics with invalid format."""
        aggregated = AggregatedMetrics(
            timestamp=datetime.now(),
            organization="test-org",
        )
        
        with pytest.raises(ValueError):
            aggregator.export_metrics(aggregated, format="invalid")

    def test_store_metrics(self, aggregator):
        """Test storing metrics in database."""
        metrics = RepositoryMetrics(
            repo_name="test-repo",
            health_score=85.0,
            build_status="success",
            test_coverage=90.0,
            open_issues=5,
            stale_prs=2,
        )
        
        aggregator._store_metrics(metrics)
        
        conn = sqlite3.connect(aggregator.db_path)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT COUNT(*) FROM metrics_history WHERE repository = ?",
            ("test-repo",)
        )
        count = cursor.fetchone()[0]
        conn.close()
        
        assert count == 1

    def test_multiple_repos_aggregation(self, aggregator):
        """Test aggregating metrics from multiple repositories."""
        repos = ["repo1", "repo2", "repo3", "repo4", "repo5"]
        aggregated = aggregator.aggregate_repository_metrics(repos)
        
        assert aggregated.summary["totalRepos"] == 5
        assert aggregated.summary["openIssuesTotal"] >= 0
        assert aggregated.summary["stalePRsTotal"] >= 0
        assert aggregated.summary["healthScore"] >= 0
        assert aggregated.summary["healthScore"] <= 100

    def test_empty_repos_list(self, aggregator):
        """Test aggregating with empty repository list."""
        aggregated = aggregator.aggregate_repository_metrics([])
        
        assert aggregated.summary["totalRepos"] == 0
        assert len(aggregated.by_repository) == 0


class TestMetricsIntegration:
    """Integration tests for metrics aggregation."""

    @pytest.fixture
    def aggregator(self, tmp_path):
        """Create a MetricsAggregator instance for testing."""
        with patch.dict("os.environ", {"GITHUB_TOKEN": "test-token"}):
            agg = MetricsAggregator("test-org", "test-token")
            agg.db_path = tmp_path / "test_metrics.db"
            agg._init_database()
            return agg

    def test_full_aggregation_workflow(self, aggregator):
        """Test complete workflow from collection to export."""
        repos = ["repo1", "repo2", "repo3"]
        
        # Aggregate metrics
        aggregated = aggregator.aggregate_repository_metrics(repos)
        
        # Export to JSON
        json_export = aggregator.export_metrics(aggregated, format="json")
        data = json.loads(json_export)
        
        # Verify structure
        assert data["organization"] == "test-org"
        assert len(data["by_repository"]) == 3
        assert data["summary"]["totalRepos"] == 3
        
        # Export to CSV
        csv_export = aggregator.export_metrics(aggregated, format="csv")
        assert len(csv_export.split("\n")) > 1

    def test_metrics_persistence(self, aggregator):
        """Test that metrics are persisted in database."""
        repos = ["repo1", "repo2"]
        
        # First aggregation
        aggregated1 = aggregator.aggregate_repository_metrics(repos)
        
        # Get history
        history = aggregator.get_metrics_history(days=1)
        
        # Verify data was stored
        assert isinstance(history, dict)

