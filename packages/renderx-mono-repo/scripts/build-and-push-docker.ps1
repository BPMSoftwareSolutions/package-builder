# Build and push Docker image to GitHub Container Registry (GHCR)
# Usage: .\scripts\build-and-push-docker.ps1 -Version 1.0.0 -Registry ghcr.io

param(
    [string]$Version = "1.0.0",
    [string]$Registry = "ghcr.io"
)

$ErrorActionPreference = "Stop"

# Configuration
$Owner = "BPMSoftwareSolutions"
$ImageName = "renderx-mono-repo"
$FullImageName = "${Registry}/${Owner}/${ImageName}"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "RenderX Mono-Repo Docker Build & Push" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Image: $FullImageName"
Write-Host "Version: $Version"
Write-Host "Registry: $Registry"
Write-Host ""

# Check if Docker is running
try {
    docker info > $null 2>&1
} catch {
    Write-Host "ERROR: Docker daemon is not running" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again"
    exit 1
}

# Build the image
Write-Host "Step 1: Building Docker image..." -ForegroundColor Yellow
docker build `
    -t "${FullImageName}:latest" `
    -t "${FullImageName}:${Version}" `
    -t "${ImageName}:latest" `
    -t "${ImageName}:${Version}" `
    .

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Docker image built successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Docker build failed" -ForegroundColor Red
    exit 1
}

# Display image info
Write-Host ""
Write-Host "Step 2: Image information:" -ForegroundColor Yellow
docker images | Select-String $ImageName | Select-Object -First 2

# Check if user wants to push to registry
Write-Host ""
$response = Read-Host "Push to ${Registry}? (y/n)"
if ($response -eq "y" -or $response -eq "Y") {
    # Login to GHCR if needed
    if ($Registry -eq "ghcr.io") {
        Write-Host ""
        Write-Host "Step 3: Authenticating with GitHub Container Registry..." -ForegroundColor Yellow
        Write-Host "Note: You need a GitHub Personal Access Token (PAT) with 'write:packages' scope"
        Write-Host "Visit: https://github.com/settings/tokens/new"
        Write-Host ""
        
        $GitHubUser = Read-Host "GitHub username"
        $GitHubPAT = Read-Host "GitHub PAT" -AsSecureString
        $GitHubPATPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToCoTaskMemUnicode($GitHubPAT))
        
        $GitHubPATPlain | docker login ghcr.io -u $GitHubUser --password-stdin
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "✗ Authentication failed" -ForegroundColor Red
            exit 1
        }
        Write-Host "✓ Authenticated with GHCR" -ForegroundColor Green
    }
    
    # Push the image
    Write-Host ""
    Write-Host "Step 4: Pushing image to registry..." -ForegroundColor Yellow
    docker push "${FullImageName}:${Version}"
    docker push "${FullImageName}:latest"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Image pushed successfully" -ForegroundColor Green
        Write-Host ""
        Write-Host "Image available at:" -ForegroundColor Green
        Write-Host "  ${FullImageName}:${Version}"
        Write-Host "  ${FullImageName}:latest"
    } else {
        Write-Host "✗ Push failed" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Skipping push to registry"
    Write-Host ""
    Write-Host "To push later, run:" -ForegroundColor Yellow
    Write-Host "  docker push ${FullImageName}:${Version}"
    Write-Host "  docker push ${FullImageName}:latest"
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Build and push completed!" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

