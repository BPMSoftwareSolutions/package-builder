"""
Unit tests for C4 Model Generator

Tests all C4 diagram generation functions including Mermaid, PlantUML, GraphML,
and JSON graph representation.
"""

import pytest
import json
import xml.etree.ElementTree as ET
import sys
from pathlib import Path

# Add the python directory to the path
sys.path.insert(0, str(Path(__file__).parent))

from c4_model_generator import C4ModelGenerator


# Test fixtures
@pytest.fixture
def sample_adf():
    """Sample ADF for testing."""
    return {
        "version": "1.0.0",
        "architecture": {
            "name": "Test Architecture",
            "description": "A test architecture for C4 diagrams",
            "c4Model": {
                "level": "container",
                "containers": [
                    {
                        "id": "web-app",
                        "name": "Web Application",
                        "type": "ui",
                        "description": "User-facing web application",
                        "repositories": ["repo-web"],
                        "packages": [
                            {"name": "@bpm/web-ui", "version": "1.0.0", "status": "stable"}
                        ],
                        "dependencies": ["api-service"],
                        "metrics": {
                            "healthScore": 0.95,
                            "testCoverage": 0.85,
                            "buildStatus": "success"
                        }
                    },
                    {
                        "id": "api-service",
                        "name": "API Service",
                        "type": "service",
                        "description": "Backend API service",
                        "repositories": ["repo-api"],
                        "packages": [
                            {"name": "@bpm/api-core", "version": "2.0.0", "status": "stable"}
                        ],
                        "dependencies": ["database"],
                        "metrics": {
                            "healthScore": 0.90,
                            "testCoverage": 0.80,
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
                    "from": "web-app",
                    "to": "api-service",
                    "type": "depends_on",
                    "description": "Web app calls API"
                },
                {
                    "from": "api-service",
                    "to": "database",
                    "type": "depends_on",
                    "description": "API reads/writes to database"
                }
            ]
        }
    }


class TestC4ModelGeneratorInit:
    """Test C4ModelGenerator initialization."""

    def test_init_with_valid_adf(self, sample_adf):
        """Test initialization with valid ADF."""
        generator = C4ModelGenerator(sample_adf)
        assert generator.name == "Test Architecture"
        assert generator.description == "A test architecture for C4 diagrams"
        assert len(generator.containers) == 3
        assert len(generator.relationships) == 2

    def test_init_with_empty_adf(self):
        """Test initialization with empty ADF raises error."""
        with pytest.raises(ValueError, match="ADF cannot be empty"):
            C4ModelGenerator({})

    def test_init_with_missing_architecture(self):
        """Test initialization with missing architecture field."""
        with pytest.raises(ValueError, match="must contain 'architecture'"):
            C4ModelGenerator({"version": "1.0.0"})


class TestMermaidGeneration:
    """Test Mermaid diagram generation."""

    def test_generate_mermaid_container_level(self, sample_adf):
        """Test Mermaid container level diagram generation."""
        generator = C4ModelGenerator(sample_adf)
        diagram = generator.generate_mermaid("container")

        assert "graph TB" in diagram
        assert "Web Application" in diagram
        assert "API Service" in diagram
        assert "Database" in diagram
        assert "depends_on" in diagram

    def test_generate_mermaid_system_level(self, sample_adf):
        """Test Mermaid system level diagram generation."""
        generator = C4ModelGenerator(sample_adf)
        diagram = generator.generate_mermaid("system")

        assert "graph TB" in diagram
        assert "Test Architecture" in diagram

    def test_generate_mermaid_component_level(self, sample_adf):
        """Test Mermaid component level diagram generation."""
        generator = C4ModelGenerator(sample_adf)
        diagram = generator.generate_mermaid("component")

        assert "graph TB" in diagram
        assert "Component" in diagram or "subgraph" in diagram

    def test_generate_mermaid_code_level(self, sample_adf):
        """Test Mermaid code level diagram generation."""
        generator = C4ModelGenerator(sample_adf)
        diagram = generator.generate_mermaid("code")

        assert "graph TB" in diagram
        assert "Code Level" in diagram or "📦" in diagram

    def test_generate_mermaid_invalid_level(self, sample_adf):
        """Test Mermaid with invalid level raises error."""
        generator = C4ModelGenerator(sample_adf)
        with pytest.raises(ValueError, match="Invalid level"):
            generator.generate_mermaid("invalid")


class TestPlantUMLGeneration:
    """Test PlantUML diagram generation."""

    def test_generate_plantuml_container_level(self, sample_adf):
        """Test PlantUML container level diagram generation."""
        generator = C4ModelGenerator(sample_adf)
        diagram = generator.generate_plantuml("container")

        assert "@startuml" in diagram
        assert "@enduml" in diagram
        assert "Container" in diagram
        assert "Test Architecture" in diagram

    def test_generate_plantuml_system_level(self, sample_adf):
        """Test PlantUML system level diagram generation."""
        generator = C4ModelGenerator(sample_adf)
        diagram = generator.generate_plantuml("system")

        assert "@startuml" in diagram
        assert "@enduml" in diagram
        assert "System" in diagram

    def test_generate_plantuml_component_level(self, sample_adf):
        """Test PlantUML component level diagram generation."""
        generator = C4ModelGenerator(sample_adf)
        diagram = generator.generate_plantuml("component")

        assert "@startuml" in diagram
        assert "@enduml" in diagram

    def test_generate_plantuml_code_level(self, sample_adf):
        """Test PlantUML code level diagram generation."""
        generator = C4ModelGenerator(sample_adf)
        diagram = generator.generate_plantuml("code")

        assert "@startuml" in diagram
        assert "@enduml" in diagram

    def test_generate_plantuml_invalid_level(self, sample_adf):
        """Test PlantUML with invalid level raises error."""
        generator = C4ModelGenerator(sample_adf)
        with pytest.raises(ValueError, match="Invalid level"):
            generator.generate_plantuml("invalid")


class TestGraphMLGeneration:
    """Test GraphML export."""

    def test_generate_graphml_with_metrics(self, sample_adf):
        """Test GraphML generation with metrics."""
        generator = C4ModelGenerator(sample_adf)
        graphml = generator.generate_graphml(include_metrics=True)

        assert "graphml" in graphml
        assert "graph" in graphml
        assert "node" in graphml
        assert "edge" in graphml
        assert "healthScore" in graphml

    def test_generate_graphml_without_metrics(self, sample_adf):
        """Test GraphML generation without metrics."""
        generator = C4ModelGenerator(sample_adf)
        graphml = generator.generate_graphml(include_metrics=False)

        assert "graphml" in graphml
        assert "graph" in graphml
        assert "node" in graphml
        assert "edge" in graphml

    def test_graphml_is_valid_xml(self, sample_adf):
        """Test that generated GraphML is valid XML."""
        generator = C4ModelGenerator(sample_adf)
        graphml = generator.generate_graphml()

        # Should not raise an exception
        root = ET.fromstring(graphml)
        # Check that the tag contains 'graphml' (accounting for namespace)
        assert "graphml" in root.tag


class TestJSONGraphGeneration:
    """Test JSON graph representation."""

    def test_generate_json_graph(self, sample_adf):
        """Test JSON graph generation."""
        generator = C4ModelGenerator(sample_adf)
        graph = generator.generate_json_graph()

        assert "nodes" in graph
        assert "edges" in graph
        assert "metadata" in graph
        assert len(graph["nodes"]) == 3
        assert len(graph["edges"]) == 2

    def test_json_graph_nodes_structure(self, sample_adf):
        """Test JSON graph nodes have correct structure."""
        generator = C4ModelGenerator(sample_adf)
        graph = generator.generate_json_graph()

        for node in graph["nodes"]:
            assert "id" in node
            assert "label" in node
            assert "type" in node
            assert "description" in node
            assert "metrics" in node

    def test_json_graph_edges_structure(self, sample_adf):
        """Test JSON graph edges have correct structure."""
        generator = C4ModelGenerator(sample_adf)
        graph = generator.generate_json_graph()

        for edge in graph["edges"]:
            assert "source" in edge
            assert "target" in edge
            assert "type" in edge
            assert "label" in edge

    def test_json_graph_metadata(self, sample_adf):
        """Test JSON graph metadata."""
        generator = C4ModelGenerator(sample_adf)
        graph = generator.generate_json_graph()

        assert graph["metadata"]["name"] == "Test Architecture"
        assert graph["metadata"]["description"] == "A test architecture for C4 diagrams"
        assert graph["metadata"]["level"] == "container"


class TestEdgeCases:
    """Test edge cases and error handling."""

    def test_adf_with_no_containers(self):
        """Test ADF with no containers."""
        adf = {
            "version": "1.0.0",
            "architecture": {
                "name": "Empty Architecture",
                "description": "No containers",
                "c4Model": {
                    "level": "container",
                    "containers": []
                },
                "relationships": []
            }
        }
        generator = C4ModelGenerator(adf)
        assert len(generator.containers) == 0

        # Should still generate diagrams
        mermaid = generator.generate_mermaid("container")
        assert "graph TB" in mermaid

    def test_adf_with_no_relationships(self):
        """Test ADF with no relationships."""
        adf = {
            "version": "1.0.0",
            "architecture": {
                "name": "No Relationships",
                "description": "No relationships",
                "c4Model": {
                    "level": "container",
                    "containers": [
                        {
                            "id": "service-1",
                            "name": "Service 1",
                            "type": "service",
                            "description": "A service"
                        }
                    ]
                },
                "relationships": []
            }
        }
        generator = C4ModelGenerator(adf)
        assert len(generator.relationships) == 0

        graph = generator.generate_json_graph()
        assert len(graph["edges"]) == 0

