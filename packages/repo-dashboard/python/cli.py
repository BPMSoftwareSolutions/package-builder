"""
Enterprise CI/CD Dashboard - CLI Interface

Command-line interface for managing Architecture Definition Files (ADF),
aggregating metrics, generating C4 diagrams, and analyzing learning patterns.
"""

import click
import json
import os
from pathlib import Path
from typing import Optional
from datetime import datetime
from dotenv import load_dotenv

from adf_manager import ADFManager
from metrics_aggregator import MetricsAggregator
from c4_model_generator import C4ModelGenerator
from learning_analyzer import LearningAnalyzer
from storage import StorageManager

# Load environment variables
load_dotenv()

# Get GitHub token from environment
GITHUB_TOKEN = os.getenv('GITHUB_TOKEN', '')


@click.group()
@click.version_option(version='1.0.0')
def cli():
    """Enterprise CI/CD Dashboard - Python Scripts
    
    Manage Architecture Definition Files, aggregate metrics, generate diagrams,
    and analyze learning patterns across your organization's repositories.
    """
    pass


# ============================================================================
# ADF Commands
# ============================================================================

@cli.group()
def adf():
    """Architecture Definition File commands"""
    pass


@adf.command()
@click.option('--file', required=True, help='ADF file path')
@click.option('--verbose', is_flag=True, help='Verbose output')
def load(file: str, verbose: bool):
    """Load and validate ADF from file"""
    try:
        adf_data = ADFManager.load_adf(file)
        if verbose:
            click.echo(f"✓ Loaded ADF from {file}")
            click.echo(json.dumps(adf_data, indent=2))
        else:
            click.echo(f"✓ Successfully loaded ADF from {file}")
    except Exception as e:
        click.echo(f"✗ Error loading ADF: {str(e)}", err=True)
        raise click.Exit(1)


@adf.command()
@click.option('--file', required=True, help='ADF file path')
@click.option('--verbose', is_flag=True, help='Verbose output')
def validate(file: str, verbose: bool):
    """Validate ADF against schema"""
    try:
        adf_data = ADFManager.load_adf(file)
        is_valid, errors = ADFManager.validate_adf(adf_data)

        if is_valid:
            click.echo(f"✓ ADF is valid")
            if verbose:
                click.echo(f"  File: {file}")
                click.echo(f"  Version: {adf_data.get('version', 'N/A')}")
                click.echo(f"  Architecture: {adf_data.get('architecture', {}).get('name', 'N/A')}")
        else:
            click.echo(f"✗ ADF validation failed with {len(errors)} error(s):", err=True)
            for error in errors:
                click.echo(f"  - {error}", err=True)
            raise click.Exit(1)
    except Exception as e:
        click.echo(f"✗ Error validating ADF: {str(e)}", err=True)
        raise click.Exit(1)


@adf.command()
@click.option('--org', required=True, help='GitHub organization')
@click.option('--output', required=True, help='Output file path')
@click.option('--token', default=GITHUB_TOKEN, help='GitHub token')
def generate(org: str, output: str, token: str):
    """Generate ADF from repository metadata"""
    if not token:
        click.echo("✗ GitHub token required. Set GITHUB_TOKEN environment variable.", err=True)
        raise click.Exit(1)
    
    try:
        click.echo(f"Generating ADF for organization: {org}...")
        adf_data = ADFManager.generate_adf_from_repos(org, token)
        ADFManager.save_adf(adf_data, output)
        click.echo(f"✓ ADF generated and saved to {output}")
    except Exception as e:
        click.echo(f"✗ Error generating ADF: {str(e)}", err=True)
        raise click.Exit(1)


@adf.command()
@click.option('--file', required=True, help='ADF file path')
@click.option('--format', type=click.Choice(['json', 'yaml', 'graphml']), default='json', help='Export format')
@click.option('--output', required=True, help='Output file path')
def export(file: str, format: str, output: str):
    """Export ADF to different formats"""
    try:
        adf_data = ADFManager.load_adf(file)
        
        if format == 'json':
            content = ADFManager.export_adf(adf_data, 'json')
        elif format == 'yaml':
            content = ADFManager.export_adf(adf_data, 'yaml')
        elif format == 'graphml':
            content = ADFManager.export_adf(adf_data, 'graphml')
        
        Path(output).parent.mkdir(parents=True, exist_ok=True)
        with open(output, 'w') as f:
            f.write(content)
        
        click.echo(f"✓ ADF exported to {output} in {format.upper()} format")
    except Exception as e:
        click.echo(f"✗ Error exporting ADF: {str(e)}", err=True)
        raise click.Exit(1)


@adf.command()
@click.option('--files', multiple=True, required=True, help='ADF file paths to merge')
@click.option('--output', required=True, help='Output file path')
def merge(files: tuple, output: str):
    """Merge multiple ADF files"""
    try:
        adf_list = [ADFManager.load_adf(f) for f in files]
        merged = ADFManager.merge_adfs(adf_list)
        ADFManager.save_adf(merged, output)
        click.echo(f"✓ Merged {len(files)} ADF files into {output}")
    except Exception as e:
        click.echo(f"✗ Error merging ADFs: {str(e)}", err=True)
        raise click.Exit(1)


# ============================================================================
# Metrics Commands
# ============================================================================

@cli.group()
def metrics():
    """Metrics aggregation and analysis commands"""
    pass


@metrics.command()
@click.option('--org', required=True, help='GitHub organization')
@click.option('--output', required=True, help='Output file path')
@click.option('--token', default=GITHUB_TOKEN, help='GitHub token')
def aggregate(org: str, output: str, token: str):
    """Aggregate metrics for organization"""
    if not token:
        click.echo("✗ GitHub token required. Set GITHUB_TOKEN environment variable.", err=True)
        raise click.Exit(1)
    
    try:
        click.echo(f"Aggregating metrics for organization: {org}...")
        aggregator = MetricsAggregator(org, token)
        metrics_data = aggregator.aggregate_repository_metrics(org)
        
        Path(output).parent.mkdir(parents=True, exist_ok=True)
        with open(output, 'w') as f:
            json.dump(metrics_data, f, indent=2, default=str)
        
        click.echo(f"✓ Metrics aggregated and saved to {output}")
    except Exception as e:
        click.echo(f"✗ Error aggregating metrics: {str(e)}", err=True)
        raise click.Exit(1)


@metrics.command()
@click.option('--org', required=True, help='GitHub organization')
@click.option('--days', default=30, help='Number of days to retrieve')
@click.option('--output', required=True, help='Output file path')
@click.option('--token', default=GITHUB_TOKEN, help='GitHub token')
def history(org: str, days: int, output: str, token: str):
    """Get metrics history"""
    if not token:
        click.echo("✗ GitHub token required. Set GITHUB_TOKEN environment variable.", err=True)
        raise click.Exit(1)
    
    try:
        click.echo(f"Retrieving metrics history for {org} (last {days} days)...")
        aggregator = MetricsAggregator(org, token)
        history_data = aggregator.get_metrics_history(org, days)
        
        Path(output).parent.mkdir(parents=True, exist_ok=True)
        with open(output, 'w') as f:
            json.dump(history_data, f, indent=2, default=str)
        
        click.echo(f"✓ Metrics history saved to {output}")
    except Exception as e:
        click.echo(f"✗ Error retrieving metrics history: {str(e)}", err=True)
        raise click.Exit(1)


@metrics.command()
@click.option('--org', required=True, help='GitHub organization')
@click.option('--format', type=click.Choice(['json', 'csv']), default='json', help='Export format')
@click.option('--output', required=True, help='Output file path')
@click.option('--token', default=GITHUB_TOKEN, help='GitHub token')
def export_metrics(org: str, format: str, output: str, token: str):
    """Export metrics to different formats"""
    if not token:
        click.echo("✗ GitHub token required. Set GITHUB_TOKEN environment variable.", err=True)
        raise click.Exit(1)
    
    try:
        click.echo(f"Exporting metrics for {org}...")
        storage = StorageManager()
        
        Path(output).parent.mkdir(parents=True, exist_ok=True)
        
        if format == 'csv':
            storage.export_metrics_csv(org, output)
        else:
            aggregator = MetricsAggregator(org, token)
            metrics_data = aggregator.aggregate_repository_metrics(org)
            with open(output, 'w') as f:
                json.dump(metrics_data, f, indent=2, default=str)
        
        click.echo(f"✓ Metrics exported to {output} in {format.upper()} format")
    except Exception as e:
        click.echo(f"✗ Error exporting metrics: {str(e)}", err=True)
        raise click.Exit(1)


# ============================================================================
# C4 Diagram Commands
# ============================================================================

@cli.group()
def c4():
    """C4 Model diagram generation commands"""
    pass


@c4.command()
@click.option('--adf', required=True, help='ADF file path')
@click.option('--level', type=click.Choice(['system', 'container', 'component', 'code']), default='container', help='C4 level')
@click.option('--format', type=click.Choice(['mermaid', 'plantuml', 'graphml', 'json']), default='mermaid', help='Output format')
@click.option('--output', required=True, help='Output file path')
def generate_diagram(adf: str, level: str, format: str, output: str):
    """Generate C4 diagram from ADF"""
    try:
        click.echo(f"Generating {level} {format.upper()} diagram...")
        adf_data = ADFManager.load_adf(adf)
        generator = C4ModelGenerator(adf_data)
        
        if format == 'mermaid':
            content = generator.generate_mermaid(level)
        elif format == 'plantuml':
            content = generator.generate_plantuml(level)
        elif format == 'graphml':
            content = generator.generate_graphml()
        elif format == 'json':
            content = json.dumps(generator.generate_json_graph(), indent=2)
        
        Path(output).parent.mkdir(parents=True, exist_ok=True)
        with open(output, 'w') as f:
            f.write(content)
        
        click.echo(f"✓ Diagram generated and saved to {output}")
    except Exception as e:
        click.echo(f"✗ Error generating diagram: {str(e)}", err=True)
        raise click.Exit(1)


# ============================================================================
# Learning Commands
# ============================================================================

@cli.group()
def learning():
    """Learning analysis and insights commands"""
    pass


@learning.command()
@click.option('--org', required=True, help='GitHub organization')
@click.option('--days', default=90, help='Number of days to analyze')
@click.option('--output', required=True, help='Output file path')
@click.option('--token', default=GITHUB_TOKEN, help='GitHub token')
def analyze(org: str, days: int, output: str, token: str):
    """Analyze patterns in metrics"""
    if not token:
        click.echo("✗ GitHub token required. Set GITHUB_TOKEN environment variable.", err=True)
        raise click.Exit(1)
    
    try:
        click.echo(f"Analyzing patterns for {org} (last {days} days)...")
        aggregator = MetricsAggregator(org, token)
        history_data = aggregator.get_metrics_history(org, days)
        
        analyzer = LearningAnalyzer(history_data)
        analysis = analyzer.analyze_patterns()
        
        Path(output).parent.mkdir(parents=True, exist_ok=True)
        with open(output, 'w') as f:
            json.dump(analysis, f, indent=2, default=str)
        
        click.echo(f"✓ Analysis saved to {output}")
    except Exception as e:
        click.echo(f"✗ Error analyzing patterns: {str(e)}", err=True)
        raise click.Exit(1)


@learning.command()
@click.option('--org', required=True, help='GitHub organization')
@click.option('--days', default=90, help='Number of days to analyze')
@click.option('--output', required=True, help='Output file path')
@click.option('--token', default=GITHUB_TOKEN, help='GitHub token')
def report(org: str, days: int, output: str, token: str):
    """Generate learning report"""
    if not token:
        click.echo("✗ GitHub token required. Set GITHUB_TOKEN environment variable.", err=True)
        raise click.Exit(1)
    
    try:
        click.echo(f"Generating learning report for {org}...")
        aggregator = MetricsAggregator(org, token)
        history_data = aggregator.get_metrics_history(org, days)
        
        analyzer = LearningAnalyzer(history_data)
        report_content = analyzer.generate_report()
        
        Path(output).parent.mkdir(parents=True, exist_ok=True)
        with open(output, 'w') as f:
            f.write(report_content)
        
        click.echo(f"✓ Report generated and saved to {output}")
    except Exception as e:
        click.echo(f"✗ Error generating report: {str(e)}", err=True)
        raise click.Exit(1)


if __name__ == '__main__':
    cli()

