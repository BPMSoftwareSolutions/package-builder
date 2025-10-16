# Setup script for repo-dashboard
# This script helps set up the GitHub token environment variable

Write-Host "repo-dashboard Setup" -ForegroundColor Green
Write-Host "===================" -ForegroundColor Green
Write-Host ""

# Check if GITHUB_TOKEN is already set
if ($env:GITHUB_TOKEN) {
    Write-Host "✓ GITHUB_TOKEN is already set" -ForegroundColor Green
    Write-Host "  Token: $($env:GITHUB_TOKEN.Substring(0, 10))..." -ForegroundColor Gray
    Write-Host ""
    exit 0
}

# Check if GH_TOKEN is set
if ($env:GH_TOKEN) {
    Write-Host "✓ GH_TOKEN is already set" -ForegroundColor Green
    Write-Host "  Token: $($env:GH_TOKEN.Substring(0, 10))..." -ForegroundColor Gray
    Write-Host ""
    exit 0
}

Write-Host "No GitHub token found. Please set one of the following:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 1: Set for current session only" -ForegroundColor Cyan
Write-Host '  $env:GITHUB_TOKEN = "your_token_here"' -ForegroundColor Gray
Write-Host ""
Write-Host "Option 2: Set permanently (requires admin)" -ForegroundColor Cyan
Write-Host '  [Environment]::SetEnvironmentVariable("GITHUB_TOKEN", "your_token_here", "User")' -ForegroundColor Gray
Write-Host ""
Write-Host "To create a token, visit:" -ForegroundColor Cyan
Write-Host "  https://github.com/settings/tokens/new?scopes=repo,workflow" -ForegroundColor Gray
Write-Host ""
Write-Host "Required scopes:" -ForegroundColor Cyan
Write-Host "  - repo: Full control of private repositories" -ForegroundColor Gray
Write-Host "  - workflow: Full control of GitHub Actions workflows" -ForegroundColor Gray
Write-Host ""

