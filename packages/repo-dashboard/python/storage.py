"""
Data Storage Layer

Manages persistent storage of metrics history and ADF files using SQLite
and file-based storage with support for versioning and data retention policies.
"""

import sqlite3
import json
import csv
import os
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from contextlib import contextmanager


class StorageManager:
    """Manages data persistence for metrics and ADF files"""
    
    def __init__(self, db_path: str = '.data/metrics.db'):
        """Initialize storage manager
        
        Args:
            db_path: Path to SQLite database file
        """
        self.db_path = db_path
        self.data_dir = Path(db_path).parent
        self.adf_dir = self.data_dir / 'adf'
        self.exports_dir = self.data_dir / 'exports'
        self.reports_dir = self.data_dir / 'reports'
        
        # Create directories
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.adf_dir.mkdir(parents=True, exist_ok=True)
        self.exports_dir.mkdir(parents=True, exist_ok=True)
        self.reports_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize database
        self._init_database()
    
    @contextmanager
    def _get_connection(self):
        """Context manager for database connections"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()
    
    def _init_database(self):
        """Initialize database schema"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            # Metrics table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS metrics (
                    id INTEGER PRIMARY KEY,
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
            ''')
            
            # Create indexes
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_metrics_org_time 
                ON metrics(organization, timestamp)
            ''')
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_metrics_repo_time 
                ON metrics(repository, timestamp)
            ''')
            
            # ADF files table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS adf_files (
                    id INTEGER PRIMARY KEY,
                    name TEXT UNIQUE NOT NULL,
                    content TEXT NOT NULL,
                    version TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
    
    def save_metrics(self, metrics: Dict[str, Any], timestamp: Optional[datetime] = None) -> None:
        """Save metrics to database
        
        Args:
            metrics: Metrics data dictionary
            timestamp: Timestamp for metrics (defaults to now)
        """
        if timestamp is None:
            timestamp = datetime.now()
        
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            # Extract metrics from the aggregated data
            org = metrics.get('organization', '')
            summary = metrics.get('summary', {})
            by_repo = metrics.get('byRepository', {})
            
            # Save summary metrics
            cursor.execute('''
                INSERT INTO metrics 
                (timestamp, organization, repository, health_score, build_status, 
                 test_coverage, open_issues, stale_prs, deployment_frequency, 
                 lead_time, mttr, change_failure_rate)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                timestamp,
                org,
                'SUMMARY',
                summary.get('healthScore'),
                'success' if summary.get('buildSuccessRate', 0) > 80 else 'warning',
                summary.get('testCoverageAvg'),
                summary.get('openIssuesTotal'),
                summary.get('stalePRsTotal'),
                summary.get('deploymentFrequency'),
                summary.get('leadTimeForChanges'),
                summary.get('meanTimeToRecovery'),
                summary.get('changeFailureRate')
            ))
            
            # Save per-repository metrics
            for repo_name, repo_metrics in by_repo.items():
                cursor.execute('''
                    INSERT INTO metrics 
                    (timestamp, organization, repository, health_score, build_status, 
                     test_coverage, open_issues, stale_prs, deployment_frequency, 
                     lead_time, mttr, change_failure_rate)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    timestamp,
                    org,
                    repo_name,
                    repo_metrics.get('healthScore'),
                    repo_metrics.get('buildStatus', 'unknown'),
                    repo_metrics.get('testCoverage'),
                    repo_metrics.get('openIssues'),
                    repo_metrics.get('stalePRs'),
                    repo_metrics.get('deploymentFrequency'),
                    repo_metrics.get('leadTime'),
                    repo_metrics.get('mttr'),
                    repo_metrics.get('changeFailureRate')
                ))
    
    def get_metrics(self, org: str, days: int = 30) -> List[Dict]:
        """Get metrics history
        
        Args:
            org: Organization name
            days: Number of days to retrieve
            
        Returns:
            List of metrics records
        """
        cutoff_date = datetime.now() - timedelta(days=days)
        
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM metrics 
                WHERE organization = ? AND timestamp >= ?
                ORDER BY timestamp DESC
            ''', (org, cutoff_date))
            
            return [dict(row) for row in cursor.fetchall()]
    
    def save_adf(self, adf: Dict, name: str, version: Optional[str] = None) -> None:
        """Save ADF to file and database
        
        Args:
            adf: ADF data dictionary
            name: ADF name/identifier
            version: Version string
        """
        # Save to file
        adf_file = self.adf_dir / f"{name}.json"
        with open(adf_file, 'w') as f:
            json.dump(adf, f, indent=2)
        
        # Save to database
        with self._get_connection() as conn:
            cursor = conn.cursor()
            content = json.dumps(adf)
            version = version or adf.get('version', '1.0.0')
            
            cursor.execute('''
                INSERT OR REPLACE INTO adf_files (name, content, version, updated_at)
                VALUES (?, ?, ?, ?)
            ''', (name, content, version, datetime.now()))
    
    def load_adf(self, name: str) -> Dict:
        """Load ADF from file
        
        Args:
            name: ADF name/identifier
            
        Returns:
            ADF data dictionary
        """
        adf_file = self.adf_dir / f"{name}.json"
        
        if not adf_file.exists():
            raise FileNotFoundError(f"ADF file not found: {adf_file}")
        
        with open(adf_file, 'r') as f:
            return json.load(f)
    
    def export_metrics_csv(self, org: str, output_path: str, days: int = 30) -> None:
        """Export metrics to CSV
        
        Args:
            org: Organization name
            output_path: Output file path
            days: Number of days to export
        """
        metrics = self.get_metrics(org, days)
        
        if not metrics:
            raise ValueError(f"No metrics found for organization: {org}")
        
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w', newline='') as f:
            fieldnames = [
                'timestamp', 'organization', 'repository', 'health_score',
                'build_status', 'test_coverage', 'open_issues', 'stale_prs',
                'deployment_frequency', 'lead_time', 'mttr', 'change_failure_rate'
            ]
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            
            for metric in metrics:
                writer.writerow({
                    'timestamp': metric['timestamp'],
                    'organization': metric['organization'],
                    'repository': metric['repository'],
                    'health_score': metric['health_score'],
                    'build_status': metric['build_status'],
                    'test_coverage': metric['test_coverage'],
                    'open_issues': metric['open_issues'],
                    'stale_prs': metric['stale_prs'],
                    'deployment_frequency': metric['deployment_frequency'],
                    'lead_time': metric['lead_time'],
                    'mttr': metric['mttr'],
                    'change_failure_rate': metric['change_failure_rate']
                })
    
    def cleanup_old_data(self, days: int = 90) -> int:
        """Remove metrics older than N days
        
        Args:
            days: Number of days to keep
            
        Returns:
            Number of records deleted
        """
        cutoff_date = datetime.now() - timedelta(days=days)
        
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM metrics WHERE created_at < ?', (cutoff_date,))
            return cursor.rowcount
    
    def get_adf_list(self) -> List[str]:
        """Get list of stored ADF files
        
        Returns:
            List of ADF names
        """
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT name FROM adf_files ORDER BY updated_at DESC')
            return [row[0] for row in cursor.fetchall()]
    
    def delete_adf(self, name: str) -> None:
        """Delete ADF file
        
        Args:
            name: ADF name/identifier
        """
        adf_file = self.adf_dir / f"{name}.json"
        if adf_file.exists():
            adf_file.unlink()
        
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM adf_files WHERE name = ?', (name,))

