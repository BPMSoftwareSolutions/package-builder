# Run Docker container and verify all services are working
# Usage: .\scripts\run-and-verify-container.ps1 -ImageName renderx-mono-repo:latest -ContainerName renderx-mono-repo

param(
    [string]$ImageName = "renderx-mono-repo:latest",
    [string]$ContainerName = "renderx-mono-repo"
)

$ErrorActionPreference = "Stop"

$LogDir = "./logs"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "RenderX Mono-Repo Container Verification" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Image: $ImageName"
Write-Host "Container: $ContainerName"
Write-Host ""

# Check if Docker is running
try {
    docker info > $null 2>&1
} catch {
    Write-Host "ERROR: Docker daemon is not running" -ForegroundColor Red
    exit 1
}

# Stop existing container if running
$existingContainer = docker ps -a --format "{{.Names}}" 2>/dev/null | Select-String "^${ContainerName}$"
if ($existingContainer) {
    Write-Host "Stopping existing container..."
    docker stop $ContainerName 2>/dev/null
    docker rm $ContainerName 2>/dev/null
}

# Create logs directory
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

# Run the container
Write-Host "Step 1: Starting container..." -ForegroundColor Yellow
$pwd = (Get-Location).Path
docker run -d `
    --name $ContainerName `
    -p 5173:5173 `
    -p 4173:4173 `
    -p 3000:3000 `
    -v "${pwd}/${LogDir}:/app/logs" `
    -e NODE_ENV=development `
    -e LOG_DIR=/app/logs `
    $ImageName

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Container started successfully" -ForegroundColor Green
    $ContainerId = docker ps -q -f name=$ContainerName
    Write-Host "  Container ID: $ContainerId"
} else {
    Write-Host "✗ Failed to start container" -ForegroundColor Red
    exit 1
}

# Wait for container to be ready
Write-Host ""
Write-Host "Step 2: Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check container status
Write-Host ""
Write-Host "Step 3: Checking container status:" -ForegroundColor Yellow
docker ps -f name=$ContainerName

# Check logs
Write-Host ""
Write-Host "Step 4: Container startup logs:" -ForegroundColor Yellow
docker logs $ContainerName | Select-Object -Last 50

# Verify health check
Write-Host ""
Write-Host "Step 5: Verifying health check..." -ForegroundColor Yellow
$HealthStatus = docker inspect --format='{{.State.Health.Status}}' $ContainerName 2>/dev/null
Write-Host "  Health status: $HealthStatus"

# Check if ports are accessible
Write-Host ""
Write-Host "Step 6: Checking port accessibility..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✓ Dev server (5173) is accessible" -ForegroundColor Green
    }
} catch {
    Write-Host "  ✗ Dev server (5173) is not accessible" -ForegroundColor Red
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:4173" -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✓ Preview server (4173) is accessible" -ForegroundColor Green
    }
} catch {
    Write-Host "  ✗ Preview server (4173) is not accessible" -ForegroundColor Red
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✓ Conductor service (3000) is accessible" -ForegroundColor Green
    }
} catch {
    Write-Host "  ✗ Conductor service (3000) is not accessible" -ForegroundColor Red
}

# Check for plugin loading in logs
Write-Host ""
Write-Host "Step 7: Checking for plugin loading evidence..." -ForegroundColor Yellow
$logs = docker logs $ContainerName 2>/dev/null
if ($logs | Select-String "🔌 Registered plugin") {
    Write-Host "  ✓ Plugins are being registered" -ForegroundColor Green
} else {
    Write-Host "  ⚠ No plugin registration evidence found yet" -ForegroundColor Yellow
}

if ($logs | Select-String "✅ Mounted sequence") {
    Write-Host "  ✓ Sequences are being mounted" -ForegroundColor Green
} else {
    Write-Host "  ⚠ No sequence mounting evidence found yet" -ForegroundColor Yellow
}

# Display container info
Write-Host ""
Write-Host "Step 8: Container information:" -ForegroundColor Yellow
docker inspect $ContainerName | ConvertFrom-Json | Select-Object -ExpandProperty Id, Image, State | Format-List

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Container verification completed!" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Container is running at:" -ForegroundColor Green
Write-Host "  Dev server: http://localhost:5173"
Write-Host "  Preview server: http://localhost:4173"
Write-Host "  Conductor: http://localhost:3000"
Write-Host ""
Write-Host "To view logs:" -ForegroundColor Yellow
Write-Host "  docker logs -f $ContainerName"
Write-Host ""
Write-Host "To stop container:" -ForegroundColor Yellow
Write-Host "  docker stop $ContainerName"
Write-Host ""
Write-Host "To remove container:" -ForegroundColor Yellow
Write-Host "  docker rm $ContainerName"

