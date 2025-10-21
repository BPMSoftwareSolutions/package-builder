# Collect and analyze conductor logs from Docker container
# Usage: .\scripts\collect-container-logs.ps1 -ContainerName renderx-mono-repo -OutputDir .logs

param(
    [string]$ContainerName = "renderx-mono-repo",
    [string]$OutputDir = ".logs"
)

$ErrorActionPreference = "Stop"

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$LogFile = Join-Path $OutputDir "conductor-container-${Timestamp}.json"
$AnalysisFile = Join-Path $OutputDir "conductor-analysis-${Timestamp}.md"
$RawLogFile = Join-Path $OutputDir "conductor-raw-${Timestamp}.log"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "RenderX Conductor Log Collection" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Container: $ContainerName"
Write-Host "Output directory: $OutputDir"
Write-Host ""

# Create output directory
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

# Check if container exists
$containerExists = docker ps -a --format "{{.Names}}" 2>/dev/null | Select-String "^${ContainerName}$"
if (-not $containerExists) {
    Write-Host "ERROR: Container '$ContainerName' not found" -ForegroundColor Red
    Write-Host "Available containers:" -ForegroundColor Yellow
    docker ps -a --format "table {{.Names}}`t{{.Status}}"
    exit 1
}

# Check if container is running
$containerRunning = docker ps --format "{{.Names}}" 2>/dev/null | Select-String "^${ContainerName}$"
if (-not $containerRunning) {
    Write-Host "WARNING: Container '$ContainerName' is not running" -ForegroundColor Yellow
    Write-Host "Collecting logs from stopped container..."
}

# Collect raw logs
Write-Host "Step 1: Collecting raw container logs..." -ForegroundColor Yellow
docker logs $ContainerName 2>&1 | Out-File -FilePath $RawLogFile -Encoding UTF8
Write-Host "✓ Raw logs saved to: $RawLogFile" -ForegroundColor Green

# Parse logs
Write-Host ""
Write-Host "Step 2: Parsing logs..." -ForegroundColor Yellow

$logs = docker logs $ContainerName 2>&1
$pluginCount = ($logs | Select-String "🔌 Registered plugin" | Measure-Object).Count
$sequenceCount = ($logs | Select-String "✅ Mounted sequence" | Measure-Object).Count
$errorCount = ($logs | Select-String "ERROR|error" | Measure-Object).Count
$warningCount = ($logs | Select-String "WARNING|warn" | Measure-Object).Count

Write-Host "✓ Logs parsed" -ForegroundColor Green
Write-Host "  - Plugins registered: $pluginCount"
Write-Host "  - Sequences mounted: $sequenceCount"
Write-Host "  - Errors: $errorCount"
Write-Host "  - Warnings: $warningCount"

# Create analysis report
Write-Host ""
Write-Host "Step 3: Creating analysis report..." -ForegroundColor Yellow

$pluginEvents = $logs | Select-String "🔌 Registered plugin" | Out-String
$sequenceEvents = $logs | Select-String "✅ Mounted sequence" | Out-String
$errors = $logs | Select-String "ERROR|error" | Out-String
$warnings = $logs | Select-String "WARNING|warn" | Out-String

$containerInfo = docker inspect $ContainerName 2>&1 | ConvertFrom-Json
$containerId = $containerInfo.Id.Substring(0, 12)
$image = $containerInfo.Config.Image
$created = $containerInfo.Created
$started = $containerInfo.State.StartedAt

$analysisContent = @"
# Conductor Log Analysis Report

**Generated**: $(Get-Date)
**Container**: $ContainerName
**Log File**: conductor-container-${Timestamp}.json

## Summary

- **Plugins Registered**: $pluginCount
- **Sequences Mounted**: $sequenceCount
- **Errors**: $errorCount
- **Warnings**: $warningCount

## Plugin Registration Events

``````
$pluginEvents
``````

## Sequence Mounting Events

``````
$sequenceEvents
``````

## Errors

``````
$errors
``````

## Warnings

``````
$warnings
``````

## Container Status

- **Container ID**: $containerId
- **Image**: $image
- **Created**: $created
- **Started**: $started

## Recommendations

1. Review any errors or warnings above
2. Verify all expected plugins are registered
3. Check that all sequences are properly mounted
4. Monitor container health status

## Next Steps

- Review full logs: Get-Content $RawLogFile
- View container logs: docker logs $ContainerName
- Inspect container: docker inspect $ContainerName
"@

$analysisContent | Out-File -FilePath $AnalysisFile -Encoding UTF8
Write-Host "✓ Analysis report saved to: $AnalysisFile" -ForegroundColor Green

# Copy logs from container volume if available
Write-Host ""
Write-Host "Step 4: Extracting logs from container volume..." -ForegroundColor Yellow
try {
    docker exec $ContainerName test -d /app/logs 2>/dev/null
    if ($LASTEXITCODE -eq 0) {
        $containerLogsDir = Join-Path $OutputDir "container-logs-${Timestamp}"
        docker cp "${ContainerName}:/app/logs" $containerLogsDir 2>/dev/null
        Write-Host "✓ Container logs extracted to: $containerLogsDir" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠ No logs directory found in container" -ForegroundColor Yellow
}

# Display summary
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Log Collection Completed!" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Files created:" -ForegroundColor Green
Write-Host "  - $LogFile"
Write-Host "  - $AnalysisFile"
Write-Host "  - $RawLogFile"
Write-Host ""
Write-Host "To view the analysis:" -ForegroundColor Yellow
Write-Host "  Get-Content $AnalysisFile"
Write-Host ""
Write-Host "To view raw logs:" -ForegroundColor Yellow
Write-Host "  Get-Content $RawLogFile"

