"""
Architecture Definition File (ADF) Manager

Manages architecture definition files in JSON format with C4 modeling support.
Provides functionality to load, save, validate, generate, merge, and export ADFs.
"""

import json
import os
from typing import Dict, List, Tuple, Any
from pathlib import Path
import jsonschema
from jsonschema import validate, ValidationError
import yaml


# ADF JSON Schema Definition
ADF_SCHEMA = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "required": ["version", "architecture"],
    "properties": {
        "version": {
            "type": "string",
            "pattern": "^\\d+\\.\\d+\\.\\d+$"
        },
        "architecture": {
            "type": "object",
            "required": ["name", "description", "c4Model"],
            "properties": {
                "name": {"type": "string"},
                "description": {"type": "string"},
                "c4Model": {
                    "type": "object",
                    "required": ["level", "containers"],
                    "properties": {
                        "level": {
                            "type": "string",
                            "enum": ["system", "container", "component", "code"]
                        },
                        "containers": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "required": ["id", "name", "type", "description"],
                                "properties": {
                                    "id": {"type": "string"},
                                    "name": {"type": "string"},
                                    "type": {
                                        "type": "string",
                                        "enum": ["service", "library", "ui", "database"]
                                    },
                                    "description": {"type": "string"},
                                    "repositories": {
                                        "type": "array",
                                        "items": {"type": "string"}
                                    },
                                    "packages": {
                                        "type": "array",
                                        "items": {
                                            "type": "object",
                                            "required": ["name", "version", "status"],
                                            "properties": {
                                                "name": {"type": "string"},
                                                "version": {"type": "string"},
                                                "status": {
                                                    "type": "string",
                                                    "enum": ["stable", "beta", "alpha", "deprecated"]
                                                }
                                            }
                                        }
                                    },
                                    "dependencies": {
                                        "type": "array",
                                        "items": {"type": "string"}
                                    },
                                    "metrics": {
                                        "type": "object",
                                        "properties": {
                                            "healthScore": {
                                                "type": "number",
                                                "minimum": 0,
                                                "maximum": 1
                                            },
                                            "testCoverage": {
                                                "type": "number",
                                                "minimum": 0,
                                                "maximum": 1
                                            },
                                            "buildStatus": {
                                                "type": "string",
                                                "enum": ["success", "failure", "pending"]
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                "relationships": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "required": ["from", "to", "type"],
                        "properties": {
                            "from": {"type": "string"},
                            "to": {"type": "string"},
                            "type": {
                                "type": "string",
                                "enum": ["depends_on", "communicates_with", "extends"]
                            },
                            "description": {"type": "string"}
                        }
                    }
                }
            }
        }
    }
}


class ADFManager:
    """Manages Architecture Definition Files (ADF)."""

    @staticmethod
    def load_adf(file_path: str) -> Dict:
        """
        Load ADF from JSON file.

        Args:
            file_path: Path to the ADF JSON file

        Returns:
            Dictionary containing the ADF data

        Raises:
            FileNotFoundError: If file does not exist
            json.JSONDecodeError: If file is not valid JSON
        """
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"ADF file not found: {file_path}")

        try:
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except json.JSONDecodeError as e:
            raise json.JSONDecodeError(f"Invalid JSON in ADF file: {e.msg}", e.doc, e.pos)

    @staticmethod
    def save_adf(adf: Dict, file_path: str) -> None:
        """
        Save ADF to JSON file.

        Args:
            adf: Dictionary containing the ADF data
            file_path: Path where the ADF JSON file will be saved

        Raises:
            IOError: If file cannot be written
        """
        path = Path(file_path)
        path.parent.mkdir(parents=True, exist_ok=True)

        try:
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(adf, f, indent=2, ensure_ascii=False)
        except IOError as e:
            raise IOError(f"Failed to save ADF file: {e}")

    @staticmethod
    def validate_adf(adf: Dict) -> Tuple[bool, List[str]]:
        """
        Validate ADF against JSON schema.

        Args:
            adf: Dictionary containing the ADF data

        Returns:
            Tuple of (is_valid, errors) where errors is a list of error messages
        """
        errors = []
        try:
            validate(instance=adf, schema=ADF_SCHEMA)
            return True, []
        except ValidationError as e:
            errors.append(f"Validation error: {e.message}")
            return False, errors

    @staticmethod
    def generate_adf_from_repos(org: str, repos: List[str]) -> Dict:
        """
        Generate ADF from repository metadata.

        Args:
            org: GitHub organization name
            repos: List of repository names

        Returns:
            Dictionary containing the generated ADF

        Note:
            This is a placeholder implementation. Full implementation would
            require GitHub API integration to fetch repository metadata.
        """
        containers = []
        for repo in repos:
            container = {
                "id": repo,
                "name": repo,
                "type": "service",
                "description": f"Repository: {repo}",
                "repositories": [repo],
                "packages": [],
                "dependencies": [],
                "metrics": {
                    "healthScore": 0.5,
                    "testCoverage": 0.5,
                    "buildStatus": "pending"
                }
            }
            containers.append(container)

        adf = {
            "version": "1.0.0",
            "architecture": {
                "name": f"{org} Architecture",
                "description": f"Architecture definition for {org} organization",
                "c4Model": {
                    "level": "container",
                    "containers": containers
                },
                "relationships": []
            }
        }
        return adf

    @staticmethod
    def merge_adfs(adfs: List[Dict]) -> Dict:
        """
        Merge multiple ADFs into one.

        Args:
            adfs: List of ADF dictionaries to merge

        Returns:
            Merged ADF dictionary

        Raises:
            ValueError: If list is empty or ADFs have incompatible versions
        """
        if not adfs:
            raise ValueError("Cannot merge empty list of ADFs")

        if len(adfs) == 1:
            return adfs[0]

        # Use first ADF as base
        merged = {
            "version": adfs[0]["version"],
            "architecture": {
                "name": "Merged Architecture",
                "description": "Merged from multiple ADFs",
                "c4Model": {
                    "level": adfs[0]["architecture"]["c4Model"]["level"],
                    "containers": []
                },
                "relationships": []
            }
        }

        # Merge containers and relationships
        seen_containers = set()
        for adf in adfs:
            for container in adf["architecture"]["c4Model"]["containers"]:
                if container["id"] not in seen_containers:
                    merged["architecture"]["c4Model"]["containers"].append(container)
                    seen_containers.add(container["id"])

            for relationship in adf["architecture"].get("relationships", []):
                merged["architecture"]["relationships"].append(relationship)

        return merged

    @staticmethod
    def export_adf(adf: Dict, format: str = "json") -> str:
        """
        Export ADF to different formats.

        Args:
            adf: Dictionary containing the ADF data
            format: Export format ('json', 'yaml', or 'graphml')

        Returns:
            String representation of the ADF in the specified format

        Raises:
            ValueError: If format is not supported
        """
        if format == "json":
            return json.dumps(adf, indent=2, ensure_ascii=False)
        elif format == "yaml":
            return yaml.dump(adf, default_flow_style=False, allow_unicode=True)
        elif format == "graphml":
            return ADFManager._export_graphml(adf)
        else:
            raise ValueError(f"Unsupported export format: {format}")

    @staticmethod
    def _export_graphml(adf: Dict) -> str:
        """
        Export ADF to GraphML format for graph visualization.

        Args:
            adf: Dictionary containing the ADF data

        Returns:
            GraphML XML string
        """
        graphml = '<?xml version="1.0" encoding="UTF-8"?>\n'
        graphml += '<graphml xmlns="http://graphml.graphdrawing.org/xmlns">\n'
        graphml += '  <graph edgedefault="directed">\n'

        # Add nodes for containers
        for container in adf["architecture"]["c4Model"]["containers"]:
            graphml += f'    <node id="{container["id"]}" label="{container["name"]}"/>\n'

        # Add edges for relationships
        for i, relationship in enumerate(adf["architecture"].get("relationships", [])):
            graphml += f'    <edge id="e{i}" source="{relationship["from"]}" target="{relationship["to"]}"/>\n'

        graphml += '  </graph>\n'
        graphml += '</graphml>\n'

        return graphml

