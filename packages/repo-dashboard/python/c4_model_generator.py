"""
C4 Model Generator

Generates C4 architecture diagrams from Architecture Definition Files (ADF)
in multiple formats (Mermaid, PlantUML, GraphML).

Supports all four levels of C4 modeling:
- System Context: High-level overview of the system and external dependencies
- Container: Major containers/applications within the system
- Component: Components within a container
- Code: Classes/functions within a component
"""

from typing import Dict, List, Any, Optional
import json
import xml.etree.ElementTree as ET
from xml.dom import minidom


class C4ModelGenerator:
    """Generates C4 architecture diagrams from ADF."""

    def __init__(self, adf: Dict):
        """
        Initialize generator with ADF.

        Args:
            adf: Architecture Definition File dictionary

        Raises:
            ValueError: If ADF is invalid or missing required fields
        """
        if not adf:
            raise ValueError("ADF cannot be empty")

        if "architecture" not in adf:
            raise ValueError("ADF must contain 'architecture' field")

        self.adf = adf
        self.architecture = adf.get("architecture", {})
        self.name = self.architecture.get("name", "Unknown Architecture")
        self.description = self.architecture.get("description", "")
        self.c4_model = self.architecture.get("c4Model", {})
        self.containers = self.c4_model.get("containers", [])
        self.relationships = self.architecture.get("relationships", [])

    def generate_mermaid(self, level: str = "container") -> str:
        """
        Generate Mermaid diagram from ADF.

        Args:
            level: 'system', 'container', 'component', or 'code'

        Returns:
            Mermaid diagram code

        Raises:
            ValueError: If level is invalid
        """
        valid_levels = ["system", "container", "component", "code"]
        if level not in valid_levels:
            raise ValueError(f"Invalid level: {level}. Must be one of {valid_levels}")

        if level == "system":
            return self._generate_mermaid_system()
        elif level == "container":
            return self._generate_mermaid_container()
        elif level == "component":
            return self._generate_mermaid_component()
        else:  # code
            return self._generate_mermaid_code()

    def _generate_mermaid_system(self) -> str:
        """Generate Mermaid system context diagram."""
        lines = ["graph TB"]
        lines.append(f'    System["🎯 {self.name}"]')

        # Add containers as external systems for system level
        for container in self.containers[:3]:  # Limit to 3 for clarity
            container_id = container.get("id", "").replace("-", "_")
            container_name = container.get("name", "Unknown")
            lines.append(f'    {container_id}["📦 {container_name}"]')

        # Add relationships
        for rel in self.relationships[:3]:
            from_id = rel.get("from", "").replace("-", "_")
            to_id = rel.get("to", "").replace("-", "_")
            rel_type = rel.get("type", "depends_on")
            lines.append(f'    {from_id} -->|{rel_type}| {to_id}')

        return "\n".join(lines)

    def _generate_mermaid_container(self) -> str:
        """Generate Mermaid container diagram."""
        lines = ["graph TB"]
        lines.append(f'    subgraph System["{self.name}"]')

        for container in self.containers:
            container_id = container.get("id", "").replace("-", "_")
            container_name = container.get("name", "Unknown")
            container_type = container.get("type", "service")

            # Use emoji based on type
            emoji_map = {
                "service": "⚙️",
                "library": "📚",
                "ui": "🖥️",
                "database": "🗄️"
            }
            emoji = emoji_map.get(container_type, "📦")

            lines.append(f'        {container_id}["{emoji} {container_name}"]')

        lines.append("    end")

        # Add relationships
        for rel in self.relationships:
            from_id = rel.get("from", "").replace("-", "_")
            to_id = rel.get("to", "").replace("-", "_")
            rel_type = rel.get("type", "depends_on")
            lines.append(f'    {from_id} -->|{rel_type}| {to_id}')

        return "\n".join(lines)

    def _generate_mermaid_component(self) -> str:
        """Generate Mermaid component diagram."""
        lines = ["graph TB"]

        if self.containers:
            first_container = self.containers[0]
            container_id = first_container.get("id", "").replace("-", "_")
            container_name = first_container.get("name", "Unknown")

            lines.append(f'    subgraph Container["{container_name}"]')

            # Generate components from container dependencies
            dependencies = first_container.get("dependencies", [])
            for i, dep in enumerate(dependencies[:5]):  # Limit to 5
                dep_id = f"comp_{i}"
                lines.append(f'        {dep_id}["Component: {dep}"]')

            lines.append("    end")

        return "\n".join(lines)

    def _generate_mermaid_code(self) -> str:
        """Generate Mermaid code level diagram."""
        lines = ["graph TB"]

        if self.containers:
            first_container = self.containers[0]
            container_name = first_container.get("name", "Unknown")
            packages = first_container.get("packages", [])

            lines.append(f'    subgraph Code["{container_name} - Code Level"]')

            for i, pkg in enumerate(packages[:5]):  # Limit to 5
                pkg_name = pkg.get("name", "Unknown")
                pkg_id = f"pkg_{i}"
                lines.append(f'        {pkg_id}["📦 {pkg_name}"]')

            lines.append("    end")

        return "\n".join(lines)

    def generate_plantuml(self, level: str = "container") -> str:
        """
        Generate PlantUML C4 diagram from ADF.

        Args:
            level: 'system', 'container', 'component', or 'code'

        Returns:
            PlantUML diagram code

        Raises:
            ValueError: If level is invalid
        """
        valid_levels = ["system", "container", "component", "code"]
        if level not in valid_levels:
            raise ValueError(f"Invalid level: {level}. Must be one of {valid_levels}")

        lines = ["@startuml", "!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Context.puml"]

        if level == "system":
            lines.extend(self._generate_plantuml_system())
        elif level == "container":
            lines.extend(self._generate_plantuml_container())
        elif level == "component":
            lines.extend(self._generate_plantuml_component())
        else:  # code
            lines.extend(self._generate_plantuml_code())

        lines.append("@enduml")
        return "\n".join(lines)

    def _generate_plantuml_system(self) -> List[str]:
        """Generate PlantUML system context diagram."""
        lines = [f"title {self.name} - System Context"]
        lines.append(f"System(system, \"{self.name}\", \"{self.description}\")")

        for i, container in enumerate(self.containers[:3]):
            container_name = container.get("name", "Unknown")
            lines.append(f"System(ext_{i}, \"{container_name}\", \"External System\")")

        return lines

    def _generate_plantuml_container(self) -> List[str]:
        """Generate PlantUML container diagram."""
        lines = [f"title {self.name} - Container Diagram"]
        lines.append(f"System_Boundary(system, \"{self.name}\") {{")

        for container in self.containers:
            container_id = container.get("id", "").replace("-", "_")
            container_name = container.get("name", "Unknown")
            container_type = container.get("type", "service")
            lines.append(f"    Container({container_id}, \"{container_name}\", \"{container_type}\")")

        lines.append("}")
        return lines

    def _generate_plantuml_component(self) -> List[str]:
        """Generate PlantUML component diagram."""
        lines = [f"title {self.name} - Component Diagram"]

        if self.containers:
            first_container = self.containers[0]
            container_name = first_container.get("name", "Unknown")
            lines.append(f"Container_Boundary(container, \"{container_name}\") {{")

            dependencies = first_container.get("dependencies", [])
            for i, dep in enumerate(dependencies[:5]):
                lines.append(f"    Component(comp_{i}, \"{dep}\", \"Component\")")

            lines.append("}")

        return lines

    def _generate_plantuml_code(self) -> List[str]:
        """Generate PlantUML code level diagram."""
        lines = [f"title {self.name} - Code Level"]

        if self.containers:
            first_container = self.containers[0]
            container_name = first_container.get("name", "Unknown")
            packages = first_container.get("packages", [])

            lines.append(f"Container_Boundary(code, \"{container_name} - Code\") {{")

            for i, pkg in enumerate(packages[:5]):
                pkg_name = pkg.get("name", "Unknown")
                lines.append(f"    Component(pkg_{i}, \"{pkg_name}\", \"Package\")")

            lines.append("}")

        return lines

    def generate_graphml(self, include_metrics: bool = True) -> str:
        """
        Generate GraphML for graph visualization tools.

        Args:
            include_metrics: Include health metrics in nodes

        Returns:
            GraphML XML string
        """
        root = ET.Element("graphml")
        root.set("xmlns", "http://graphml.graphdrawing.org/xmlns")
        root.set("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance")

        graph = ET.SubElement(root, "graph")
        graph.set("id", "architecture")
        graph.set("edgedefault", "directed")

        # Add nodes for containers
        for container in self.containers:
            node = ET.SubElement(graph, "node")
            node.set("id", container.get("id", ""))

            data = ET.SubElement(node, "data")
            data.set("key", "label")
            data.text = container.get("name", "")

            if include_metrics:
                metrics = container.get("metrics", {})
                health_score = metrics.get("healthScore", 0)
                data = ET.SubElement(node, "data")
                data.set("key", "healthScore")
                data.text = str(health_score)

        # Add edges for relationships
        for i, rel in enumerate(self.relationships):
            edge = ET.SubElement(graph, "edge")
            edge.set("id", f"edge_{i}")
            edge.set("source", rel.get("from", ""))
            edge.set("target", rel.get("to", ""))

            data = ET.SubElement(edge, "data")
            data.set("key", "label")
            data.text = rel.get("type", "")

        # Pretty print XML
        xml_str = minidom.parseString(ET.tostring(root)).toprettyxml(indent="  ")
        return xml_str

    def generate_json_graph(self) -> Dict:
        """
        Generate JSON graph representation for web visualization.

        Returns:
            Dictionary with nodes and edges
        """
        nodes = []
        edges = []

        # Create nodes from containers
        for container in self.containers:
            node = {
                "id": container.get("id", ""),
                "label": container.get("name", ""),
                "type": container.get("type", "service"),
                "description": container.get("description", ""),
                "metrics": container.get("metrics", {})
            }
            nodes.append(node)

        # Create edges from relationships
        for rel in self.relationships:
            edge = {
                "source": rel.get("from", ""),
                "target": rel.get("to", ""),
                "type": rel.get("type", "depends_on"),
                "label": rel.get("description", "")
            }
            edges.append(edge)

        return {
            "nodes": nodes,
            "edges": edges,
            "metadata": {
                "name": self.name,
                "description": self.description,
                "level": self.c4_model.get("level", "container")
            }
        }

