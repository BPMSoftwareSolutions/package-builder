"""
Metrics Aggregator module for collecting and aggregating CI/CD metrics across repositories.

This module provides functionality to:
- Collect GitHub metrics (issues, PRs, workflows, commits, releases)
- Calculate DORA metrics (deployment frequency, lead time, MTTR, change failure rate)
- Compute health scores based on multiple factors
- Track trends over time
- Export metrics to JSON/CSV
- Store metrics history in SQLite
"""

from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import sqlite3
import json
import csv
import os
from pathlib import Path
import requests
from dotenv import load_dotenv

load_dotenv()


@dataclass
class RepositoryMetrics:
    """Data structure for repository-level metrics."""
    repo_name: str
    health_score: float  # 0-100
    build_status: str  # success|failure|pending
    test_coverage: float  # 0-100
    open_issues: int
    stale_prs: int
    last_deployment: Optional[datetime] = None
    deployment_frequency: float = 0.0  # deploys per day
    lead_time: float = 0.0  # hours
    mttr: float = 0.0  # mean time to recovery (hours)
    change_failure_rate: float = 0.0  # 0-100
    last_updated: datetime = field(default_factory=datetime.now)


@dataclass
class AggregatedMetrics:
    """Data structure for aggregated metrics across repositories."""
    timestamp: datetime
    organization: str
    summary: Dict = field(default_factory=dict)  # Overall metrics
    by_repository: Dict[str, RepositoryMetrics] = field(default_factory=dict)
    by_component: Dict[str, Dict] = field(default_factory=dict)  # Component-level metrics
    trends: Dict[str, List[float]] = field(default_factory=dict)  # 30-day trends


class MetricsAggregator:
    """Aggregator for collecting and processing CI/CD metrics from GitHub."""

    def __init__(self, org: str, github_token: Optional[str] = None):
        """
        Initialize the MetricsAggregator.

        Args:
            org: GitHub organization name
            github_token: GitHub API token (defaults to GITHUB_TOKEN env var)
        """
        self.org = org
        self.github_token = github_token or os.getenv("GITHUB_TOKEN")
        self.base_url = "https://api.github.com"
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
            "Authorization": f"token {self.github_token}" if self.github_token else ""
        }
        self.db_path = Path(__file__).parent / "metrics_history.db"
        self._init_database()

    def _init_database(self) -> None:
        """Initialize SQLite database for metrics history."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS metrics_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME NOT NULL,
                organization TEXT NOT NULL,
                repository TEXT NOT NULL,
                health_score REAL,
                build_status TEXT,
                test_coverage REAL,
                open_issues INTEGER,
                stale_prs INTEGER,
                deployment_frequency REAL,
                lead_time REAL,
                mttr REAL,
                change_failure_rate REAL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_org_repo_timestamp 
            ON metrics_history(organization, repository, timestamp)
        """)
        
        conn.commit()
        conn.close()

    def get_repository_metrics(self, repo: str) -> RepositoryMetrics:
        """
        Get metrics for a single repository.

        Args:
            repo: Repository name

        Returns:
            RepositoryMetrics object with collected metrics
        """
        # Collect GitHub metrics
        issues = self._get_open_issues(repo)
        prs = self._get_open_prs(repo)
        stale_prs = self._get_stale_prs(repo)
        
        # Calculate metrics
        health_score = self.calculate_health_score(repo)
        dora_metrics = self.calculate_dora_metrics(repo)
        
        return RepositoryMetrics(
            repo_name=repo,
            health_score=health_score,
            build_status="pending",  # Would be fetched from workflows
            test_coverage=0.0,  # Would be fetched from workflows
            open_issues=issues,
            stale_prs=stale_prs,
            deployment_frequency=dora_metrics.get("deployment_frequency", 0.0),
            lead_time=dora_metrics.get("lead_time", 0.0),
            mttr=dora_metrics.get("mttr", 0.0),
            change_failure_rate=dora_metrics.get("change_failure_rate", 0.0),
        )

    def aggregate_repository_metrics(self, repos: List[str]) -> AggregatedMetrics:
        """
        Aggregate metrics for multiple repositories.

        Args:
            repos: List of repository names

        Returns:
            AggregatedMetrics object with aggregated data
        """
        by_repository = {}
        health_scores = []
        
        for repo in repos:
            metrics = self.get_repository_metrics(repo)
            by_repository[repo] = metrics
            health_scores.append(metrics.health_score)
            self._store_metrics(metrics)
        
        # Calculate summary metrics
        summary = {
            "totalRepos": len(repos),
            "healthScore": sum(health_scores) / len(health_scores) if health_scores else 0.0,
            "buildSuccessRate": 0.0,  # Would aggregate from repos
            "testCoverageAvg": 0.0,  # Would aggregate from repos
            "openIssuesTotal": sum(m.open_issues for m in by_repository.values()),
            "stalePRsTotal": sum(m.stale_prs for m in by_repository.values()),
            "deploymentFrequency": sum(m.deployment_frequency for m in by_repository.values()) / len(repos) if repos else 0.0,
            "leadTimeForChanges": sum(m.lead_time for m in by_repository.values()) / len(repos) if repos else 0.0,
            "meanTimeToRecovery": sum(m.mttr for m in by_repository.values()) / len(repos) if repos else 0.0,
            "changeFailureRate": sum(m.change_failure_rate for m in by_repository.values()) / len(repos) if repos else 0.0,
        }
        
        return AggregatedMetrics(
            timestamp=datetime.now(),
            organization=self.org,
            summary=summary,
            by_repository=by_repository,
            trends=self.get_metrics_history(days=30),
        )

    def calculate_health_score(self, repo: str) -> float:
        """
        Calculate health score based on multiple factors.

        Health score calculation:
        - Build success rate (40%)
        - Test coverage (20%)
        - Issue resolution rate (15%)
        - PR review time (15%)
        - Deployment frequency (10%)

        Args:
            repo: Repository name

        Returns:
            Health score (0-100)
        """
        # Placeholder implementation - would fetch actual metrics
        return 75.0

    def calculate_dora_metrics(self, repo: str) -> Dict[str, float]:
        """
        Calculate DORA metrics for a repository.

        DORA metrics:
        - Deployment Frequency: Deploys per day
        - Lead Time for Changes: Time from commit to deployment (hours)
        - Mean Time to Recovery (MTTR): Time to fix failed deployments (hours)
        - Change Failure Rate: Percentage of deployments that fail

        Args:
            repo: Repository name

        Returns:
            Dictionary with DORA metrics
        """
        # Placeholder implementation - would analyze workflows and commits
        return {
            "deployment_frequency": 1.5,
            "lead_time": 24.0,
            "mttr": 2.0,
            "change_failure_rate": 5.0,
        }

    def get_metrics_history(self, days: int = 30) -> Dict[str, List[float]]:
        """
        Get metrics history for the last N days.

        Args:
            days: Number of days to retrieve

        Returns:
            Dictionary with trend data
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        since = datetime.now() - timedelta(days=days)
        
        cursor.execute("""
            SELECT timestamp, AVG(health_score) as avg_health
            FROM metrics_history
            WHERE organization = ? AND timestamp >= ?
            GROUP BY DATE(timestamp)
            ORDER BY timestamp
        """, (self.org, since.isoformat()))
        
        rows = cursor.fetchall()
        conn.close()
        
        return {
            "healthScoreTrend": [row[1] for row in rows] if rows else [],
            "buildSuccessRateTrend": [],
            "testCoverageTrend": [],
            "deploymentFrequencyTrend": [],
        }

    def export_metrics(self, metrics: AggregatedMetrics, format: str = "json") -> str:
        """
        Export metrics to JSON or CSV format.

        Args:
            metrics: AggregatedMetrics object
            format: Export format ("json" or "csv")

        Returns:
            Exported metrics as string
        """
        if format == "json":
            return self._export_json(metrics)
        elif format == "csv":
            return self._export_csv(metrics)
        else:
            raise ValueError(f"Unsupported format: {format}")

    def _export_json(self, metrics: AggregatedMetrics) -> str:
        """Export metrics to JSON format."""
        data = {
            "timestamp": metrics.timestamp.isoformat(),
            "organization": metrics.organization,
            "summary": metrics.summary,
            "by_repository": {
                name: asdict(m) for name, m in metrics.by_repository.items()
            },
            "trends": metrics.trends,
        }
        return json.dumps(data, indent=2, default=str)

    def _export_csv(self, metrics: AggregatedMetrics) -> str:
        """Export metrics to CSV format."""
        output = []
        fieldnames = [
            "repo_name", "health_score", "build_status", "test_coverage",
            "open_issues", "stale_prs", "deployment_frequency", "lead_time",
            "mttr", "change_failure_rate"
        ]
        
        output.append(",".join(fieldnames))
        for repo_name, repo_metrics in metrics.by_repository.items():
            row = [
                repo_metrics.repo_name,
                repo_metrics.health_score,
                repo_metrics.build_status,
                repo_metrics.test_coverage,
                repo_metrics.open_issues,
                repo_metrics.stale_prs,
                repo_metrics.deployment_frequency,
                repo_metrics.lead_time,
                repo_metrics.mttr,
                repo_metrics.change_failure_rate,
            ]
            output.append(",".join(str(v) for v in row))
        
        return "\n".join(output)

    def _store_metrics(self, metrics: RepositoryMetrics) -> None:
        """Store metrics in SQLite database."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO metrics_history (
                timestamp, organization, repository, health_score, build_status,
                test_coverage, open_issues, stale_prs, deployment_frequency,
                lead_time, mttr, change_failure_rate
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            datetime.now().isoformat(),
            self.org,
            metrics.repo_name,
            metrics.health_score,
            metrics.build_status,
            metrics.test_coverage,
            metrics.open_issues,
            metrics.stale_prs,
            metrics.deployment_frequency,
            metrics.lead_time,
            metrics.mttr,
            metrics.change_failure_rate,
        ))
        
        conn.commit()
        conn.close()

    def _get_open_issues(self, repo: str) -> int:
        """Get count of open issues for a repository."""
        # Placeholder - would call GitHub API
        return 0

    def _get_open_prs(self, repo: str) -> int:
        """Get count of open PRs for a repository."""
        # Placeholder - would call GitHub API
        return 0

    def _get_stale_prs(self, repo: str) -> int:
        """Get count of stale PRs (>30 days without update) for a repository."""
        # Placeholder - would call GitHub API
        return 0

