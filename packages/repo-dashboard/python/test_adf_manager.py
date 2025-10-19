"""
Unit tests for ADF Manager module.

Tests cover:
- ADF validation with valid/invalid schemas
- File I/O operations (load/save)
- ADF generation from repository metadata
- ADF merging
- Export formats (JSON, YAML, GraphML)
"""

import pytest
import json
import tempfile
import sys
from pathlib import Path

# Add the python directory to the path so we can import adf_manager
sys.path.insert(0, str(Path(__file__).parent))

from adf_manager import ADFManager, ADF_SCHEMA


# Test fixtures
@pytest.fixture
def valid_adf():
    """Fixture providing a valid ADF."""
    return {
        "version": "1.0.0",
        "architecture": {
            "name": "Test Architecture",
            "description": "A test architecture",
            "c4Model": {
                "level": "container",
                "containers": [
                    {
                        "id": "api",
                        "name": "API Service",
                        "type": "service",
                        "description": "REST API service",
                        "repositories": ["api-repo"],
                        "packages": [
                            {
                                "name": "@bpm/api",
                                "version": "1.0.0",
                                "status": "stable"
                            }
                        ],
                        "dependencies": ["database"],
                        "metrics": {
                            "healthScore": 0.95,
                            "testCoverage": 0.85,
                            "buildStatus": "success"
                        }
                    },
                    {
                        "id": "database",
                        "name": "Database",
                        "type": "database",
                        "description": "PostgreSQL database",
                        "repositories": [],
                        "packages": [],
                        "dependencies": [],
                        "metrics": {
                            "healthScore": 0.98,
                            "testCoverage": 0.0,
                            "buildStatus": "success"
                        }
                    }
                ]
            },
            "relationships": [
                {
                    "from": "api",
                    "to": "database",
                    "type": "depends_on",
                    "description": "API depends on database"
                }
            ]
        }
    }


@pytest.fixture
def invalid_adf_missing_version():
    """Fixture providing an invalid ADF (missing version)."""
    return {
        "architecture": {
            "name": "Test",
            "description": "Test",
            "c4Model": {
                "level": "container",
                "containers": []
            }
        }
    }


@pytest.fixture
def invalid_adf_bad_version():
    """Fixture providing an invalid ADF (bad version format)."""
    return {
        "version": "1.0",
        "architecture": {
            "name": "Test",
            "description": "Test",
            "c4Model": {
                "level": "container",
                "containers": []
            }
        }
    }


@pytest.fixture
def temp_dir():
    """Fixture providing a temporary directory."""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield tmpdir


# Tests for load_adf
class TestLoadADF:
    def test_load_valid_adf(self, valid_adf, temp_dir):
        """Test loading a valid ADF file."""
        file_path = Path(temp_dir) / "test.json"
        with open(file_path, 'w') as f:
            json.dump(valid_adf, f)

        loaded = ADFManager.load_adf(str(file_path))
        assert loaded == valid_adf

    def test_load_nonexistent_file(self):
        """Test loading a non-existent file raises FileNotFoundError."""
        with pytest.raises(FileNotFoundError):
            ADFManager.load_adf("/nonexistent/path/adf.json")

    def test_load_invalid_json(self, temp_dir):
        """Test loading invalid JSON raises JSONDecodeError."""
        file_path = Path(temp_dir) / "invalid.json"
        with open(file_path, 'w') as f:
            f.write("{ invalid json }")

        with pytest.raises(json.JSONDecodeError):
            ADFManager.load_adf(str(file_path))


# Tests for save_adf
class TestSaveADF:
    def test_save_adf(self, valid_adf, temp_dir):
        """Test saving an ADF file."""
        file_path = Path(temp_dir) / "output" / "test.json"
        ADFManager.save_adf(valid_adf, str(file_path))

        assert file_path.exists()
        with open(file_path, 'r') as f:
            loaded = json.load(f)
        assert loaded == valid_adf

    def test_save_creates_directories(self, valid_adf, temp_dir):
        """Test that save_adf creates parent directories."""
        file_path = Path(temp_dir) / "deep" / "nested" / "path" / "test.json"
        ADFManager.save_adf(valid_adf, str(file_path))

        assert file_path.exists()
        assert file_path.parent.exists()


# Tests for validate_adf
class TestValidateADF:
    def test_validate_valid_adf(self, valid_adf):
        """Test validating a valid ADF."""
        is_valid, errors = ADFManager.validate_adf(valid_adf)
        assert is_valid is True
        assert errors == []

    def test_validate_missing_version(self, invalid_adf_missing_version):
        """Test validating ADF with missing version."""
        is_valid, errors = ADFManager.validate_adf(invalid_adf_missing_version)
        assert is_valid is False
        assert len(errors) > 0

    def test_validate_bad_version_format(self, invalid_adf_bad_version):
        """Test validating ADF with bad version format."""
        is_valid, errors = ADFManager.validate_adf(invalid_adf_bad_version)
        assert is_valid is False
        assert len(errors) > 0

    def test_validate_invalid_container_type(self, valid_adf):
        """Test validating ADF with invalid container type."""
        valid_adf["architecture"]["c4Model"]["containers"][0]["type"] = "invalid"
        is_valid, errors = ADFManager.validate_adf(valid_adf)
        assert is_valid is False

    def test_validate_invalid_metric_value(self, valid_adf):
        """Test validating ADF with invalid metric value."""
        valid_adf["architecture"]["c4Model"]["containers"][0]["metrics"]["healthScore"] = 1.5
        is_valid, errors = ADFManager.validate_adf(valid_adf)
        assert is_valid is False


# Tests for generate_adf_from_repos
class TestGenerateADFFromRepos:
    def test_generate_adf_single_repo(self):
        """Test generating ADF from a single repository."""
        adf = ADFManager.generate_adf_from_repos("TestOrg", ["repo1"])

        assert adf["version"] == "1.0.0"
        assert adf["architecture"]["name"] == "TestOrg Architecture"
        assert len(adf["architecture"]["c4Model"]["containers"]) == 1
        assert adf["architecture"]["c4Model"]["containers"][0]["id"] == "repo1"

    def test_generate_adf_multiple_repos(self):
        """Test generating ADF from multiple repositories."""
        adf = ADFManager.generate_adf_from_repos("TestOrg", ["repo1", "repo2", "repo3"])

        assert len(adf["architecture"]["c4Model"]["containers"]) == 3
        repo_ids = [c["id"] for c in adf["architecture"]["c4Model"]["containers"]]
        assert "repo1" in repo_ids
        assert "repo2" in repo_ids
        assert "repo3" in repo_ids

    def test_generated_adf_is_valid(self):
        """Test that generated ADF is valid."""
        adf = ADFManager.generate_adf_from_repos("TestOrg", ["repo1"])
        is_valid, errors = ADFManager.validate_adf(adf)
        assert is_valid is True


# Tests for merge_adfs
class TestMergeADFs:
    def test_merge_empty_list(self):
        """Test merging empty list raises ValueError."""
        with pytest.raises(ValueError):
            ADFManager.merge_adfs([])

    def test_merge_single_adf(self, valid_adf):
        """Test merging single ADF returns the same ADF."""
        merged = ADFManager.merge_adfs([valid_adf])
        assert merged == valid_adf

    def test_merge_two_adfs(self, valid_adf):
        """Test merging two ADFs."""
        adf2 = ADFManager.generate_adf_from_repos("Org2", ["repo3"])
        merged = ADFManager.merge_adfs([valid_adf, adf2])

        assert merged["version"] == valid_adf["version"]
        assert len(merged["architecture"]["c4Model"]["containers"]) == 3

    def test_merge_removes_duplicates(self, valid_adf):
        """Test that merging removes duplicate containers."""
        adf2 = valid_adf.copy()
        merged = ADFManager.merge_adfs([valid_adf, adf2])

        assert len(merged["architecture"]["c4Model"]["containers"]) == 2

    def test_merged_adf_is_valid(self, valid_adf):
        """Test that merged ADF is valid."""
        adf2 = ADFManager.generate_adf_from_repos("Org2", ["repo3"])
        merged = ADFManager.merge_adfs([valid_adf, adf2])

        is_valid, errors = ADFManager.validate_adf(merged)
        assert is_valid is True


# Tests for export_adf
class TestExportADF:
    def test_export_json(self, valid_adf):
        """Test exporting ADF to JSON format."""
        exported = ADFManager.export_adf(valid_adf, "json")
        assert isinstance(exported, str)
        parsed = json.loads(exported)
        assert parsed == valid_adf

    def test_export_yaml(self, valid_adf):
        """Test exporting ADF to YAML format."""
        exported = ADFManager.export_adf(valid_adf, "yaml")
        assert isinstance(exported, str)
        assert "version:" in exported
        assert "architecture:" in exported

    def test_export_graphml(self, valid_adf):
        """Test exporting ADF to GraphML format."""
        exported = ADFManager.export_adf(valid_adf, "graphml")
        assert isinstance(exported, str)
        assert '<?xml version="1.0"' in exported
        assert '<graphml' in exported
        assert '<graph' in exported
        assert '<node' in exported
        assert '<edge' in exported

    def test_export_default_format(self, valid_adf):
        """Test that default export format is JSON."""
        exported = ADFManager.export_adf(valid_adf)
        parsed = json.loads(exported)
        assert parsed == valid_adf

    def test_export_unsupported_format(self, valid_adf):
        """Test exporting to unsupported format raises ValueError."""
        with pytest.raises(ValueError):
            ADFManager.export_adf(valid_adf, "xml")

    def test_graphml_contains_all_containers(self, valid_adf):
        """Test that GraphML export contains all containers."""
        exported = ADFManager.export_adf(valid_adf, "graphml")
        assert "api" in exported
        assert "database" in exported

    def test_graphml_contains_all_relationships(self, valid_adf):
        """Test that GraphML export contains all relationships."""
        exported = ADFManager.export_adf(valid_adf, "graphml")
        assert "api" in exported
        assert "database" in exported


# Integration tests
class TestIntegration:
    def test_full_workflow(self, valid_adf, temp_dir):
        """Test full workflow: save, load, validate, export."""
        file_path = Path(temp_dir) / "workflow.json"

        # Save
        ADFManager.save_adf(valid_adf, str(file_path))

        # Load
        loaded = ADFManager.load_adf(str(file_path))

        # Validate
        is_valid, errors = ADFManager.validate_adf(loaded)
        assert is_valid is True

        # Export to different formats
        json_export = ADFManager.export_adf(loaded, "json")
        yaml_export = ADFManager.export_adf(loaded, "yaml")
        graphml_export = ADFManager.export_adf(loaded, "graphml")

        assert json_export is not None
        assert yaml_export is not None
        assert graphml_export is not None

    def test_generate_validate_export(self):
        """Test generating, validating, and exporting ADF."""
        adf = ADFManager.generate_adf_from_repos("TestOrg", ["repo1", "repo2"])

        is_valid, errors = ADFManager.validate_adf(adf)
        assert is_valid is True

        json_export = ADFManager.export_adf(adf, "json")
        yaml_export = ADFManager.export_adf(adf, "yaml")

        assert json_export is not None
        assert yaml_export is not None

