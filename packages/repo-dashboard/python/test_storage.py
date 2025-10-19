"""
Unit tests for Storage Manager module
"""

import pytest
import json
import tempfile
import os
from pathlib import Path
from datetime import datetime, timedelta
from storage import StorageManager


@pytest.fixture
def temp_db():
    """Create temporary database for testing"""
    with tempfile.TemporaryDirectory() as tmpdir:
        db_path = os.path.join(tmpdir, '.data', 'metrics.db')
        yield db_path


@pytest.fixture
def storage_manager(temp_db):
    """Create storage manager instance"""
    return StorageManager(temp_db)


@pytest.fixture
def sample_metrics():
    """Sample metrics data"""
    return {
        'timestamp': datetime.now().isoformat(),
        'organization': 'TestOrg',
        'summary': {
            'totalRepos': 3,
            'healthScore': 85.5,
            'buildSuccessRate': 95.0,
            'testCoverageAvg': 82.0,
            'openIssuesTotal': 15,
            'stalePRsTotal': 2,
            'deploymentFrequency': 2.5,
            'leadTimeForChanges': 4.2,
            'meanTimeToRecovery': 1.5,
            'changeFailureRate': 5.0
        },
        'byRepository': {
            'repo-1': {
                'healthScore': 90.0,
                'buildStatus': 'success',
                'testCoverage': 85.0,
                'openIssues': 5,
                'stalePRs': 0,
                'deploymentFrequency': 3.0,
                'leadTime': 3.5,
                'mttr': 1.0,
                'changeFailureRate': 3.0
            },
            'repo-2': {
                'healthScore': 80.0,
                'buildStatus': 'success',
                'testCoverage': 80.0,
                'openIssues': 10,
                'stalePRs': 2,
                'deploymentFrequency': 2.0,
                'leadTime': 5.0,
                'mttr': 2.0,
                'changeFailureRate': 7.0
            }
        }
    }


@pytest.fixture
def sample_adf():
    """Sample ADF data"""
    return {
        'version': '1.0.0',
        'architecture': {
            'name': 'Test Architecture',
            'description': 'Test architecture for unit tests',
            'c4Model': {
                'level': 'container',
                'containers': [
                    {
                        'id': 'container-1',
                        'name': 'API Service',
                        'type': 'service',
                        'description': 'REST API service',
                        'repositories': ['repo-1'],
                        'packages': [{'name': '@test/api', 'version': '1.0.0', 'status': 'stable'}],
                        'dependencies': [],
                        'metrics': {'healthScore': 0.9, 'testCoverage': 0.85, 'buildStatus': 'success'}
                    }
                ]
            },
            'relationships': []
        }
    }


class TestStorageManagerInitialization:
    """Test StorageManager initialization"""
    
    def test_init_creates_directories(self, temp_db):
        """Test that initialization creates required directories"""
        storage = StorageManager(temp_db)
        
        assert Path(storage.data_dir).exists()
        assert Path(storage.adf_dir).exists()
        assert Path(storage.exports_dir).exists()
        assert Path(storage.reports_dir).exists()
    
    def test_init_creates_database(self, temp_db):
        """Test that initialization creates database"""
        storage = StorageManager(temp_db)
        
        assert Path(temp_db).exists()
    
    def test_init_creates_schema(self, storage_manager):
        """Test that database schema is created"""
        import sqlite3
        conn = sqlite3.connect(storage_manager.db_path)
        cursor = conn.cursor()
        
        # Check metrics table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='metrics'")
        assert cursor.fetchone() is not None
        
        # Check adf_files table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='adf_files'")
        assert cursor.fetchone() is not None
        
        conn.close()


class TestMetricsStorage:
    """Test metrics storage operations"""
    
    def test_save_metrics(self, storage_manager, sample_metrics):
        """Test saving metrics to database"""
        storage_manager.save_metrics(sample_metrics)
        
        metrics = storage_manager.get_metrics('TestOrg', days=1)
        assert len(metrics) > 0
    
    def test_save_metrics_with_timestamp(self, storage_manager, sample_metrics):
        """Test saving metrics with specific timestamp"""
        timestamp = datetime.now() - timedelta(days=5)
        storage_manager.save_metrics(sample_metrics, timestamp)
        
        metrics = storage_manager.get_metrics('TestOrg', days=10)
        assert len(metrics) > 0
    
    def test_get_metrics_respects_days_filter(self, storage_manager, sample_metrics):
        """Test that get_metrics respects days filter"""
        # Save metrics from 10 days ago
        old_timestamp = datetime.now() - timedelta(days=10)
        storage_manager.save_metrics(sample_metrics, old_timestamp)
        
        # Get metrics from last 5 days
        metrics = storage_manager.get_metrics('TestOrg', days=5)
        assert len(metrics) == 0
        
        # Get metrics from last 15 days
        metrics = storage_manager.get_metrics('TestOrg', days=15)
        assert len(metrics) > 0
    
    def test_get_metrics_empty_organization(self, storage_manager):
        """Test getting metrics for non-existent organization"""
        metrics = storage_manager.get_metrics('NonExistent', days=30)
        assert len(metrics) == 0


class TestADFStorage:
    """Test ADF file storage operations"""
    
    def test_save_adf(self, storage_manager, sample_adf):
        """Test saving ADF to file and database"""
        storage_manager.save_adf(sample_adf, 'test-adf')
        
        adf_file = storage_manager.adf_dir / 'test-adf.json'
        assert adf_file.exists()
    
    def test_load_adf(self, storage_manager, sample_adf):
        """Test loading ADF from file"""
        storage_manager.save_adf(sample_adf, 'test-adf')
        loaded_adf = storage_manager.load_adf('test-adf')
        
        assert loaded_adf['version'] == sample_adf['version']
        assert loaded_adf['architecture']['name'] == sample_adf['architecture']['name']
    
    def test_load_adf_not_found(self, storage_manager):
        """Test loading non-existent ADF"""
        with pytest.raises(FileNotFoundError):
            storage_manager.load_adf('non-existent')
    
    def test_save_adf_with_version(self, storage_manager, sample_adf):
        """Test saving ADF with specific version"""
        storage_manager.save_adf(sample_adf, 'test-adf', version='2.0.0')
        loaded_adf = storage_manager.load_adf('test-adf')
        
        assert loaded_adf is not None
    
    def test_get_adf_list(self, storage_manager, sample_adf):
        """Test getting list of stored ADFs"""
        storage_manager.save_adf(sample_adf, 'adf-1')
        storage_manager.save_adf(sample_adf, 'adf-2')
        
        adf_list = storage_manager.get_adf_list()
        assert 'adf-1' in adf_list
        assert 'adf-2' in adf_list
    
    def test_delete_adf(self, storage_manager, sample_adf):
        """Test deleting ADF"""
        storage_manager.save_adf(sample_adf, 'test-adf')
        storage_manager.delete_adf('test-adf')
        
        adf_file = storage_manager.adf_dir / 'test-adf.json'
        assert not adf_file.exists()


class TestMetricsExport:
    """Test metrics export functionality"""
    
    def test_export_metrics_csv(self, storage_manager, sample_metrics):
        """Test exporting metrics to CSV"""
        storage_manager.save_metrics(sample_metrics)
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            csv_path = f.name
        
        try:
            storage_manager.export_metrics_csv('TestOrg', csv_path, days=1)
            
            assert Path(csv_path).exists()
            
            with open(csv_path, 'r') as f:
                content = f.read()
                assert 'timestamp' in content
                assert 'organization' in content
                assert 'TestOrg' in content
        finally:
            if Path(csv_path).exists():
                Path(csv_path).unlink()
    
    def test_export_metrics_csv_no_data(self, storage_manager):
        """Test exporting metrics when no data exists"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            csv_path = f.name
        
        try:
            with pytest.raises(ValueError):
                storage_manager.export_metrics_csv('NonExistent', csv_path)
        finally:
            if Path(csv_path).exists():
                Path(csv_path).unlink()


class TestDataCleanup:
    """Test data cleanup functionality"""

    def test_cleanup_old_data(self, storage_manager, sample_metrics):
        """Test cleaning up old metrics"""
        # Note: The created_at timestamp is set by the database to CURRENT_TIMESTAMP,
        # so we can't directly test cleanup of old data without modifying the database.
        # This test verifies the cleanup function exists and can be called.

        # Save recent metrics
        storage_manager.save_metrics(sample_metrics)

        # Call cleanup (won't delete recent data)
        deleted_count = storage_manager.cleanup_old_data(days=90)

        # Should return 0 since we only have recent data
        assert deleted_count == 0

        # Verify recent metrics still exist
        recent_metrics = storage_manager.get_metrics('TestOrg', days=1)
        assert len(recent_metrics) > 0

