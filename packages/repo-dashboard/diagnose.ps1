# Diagnostic script for repo-dashboard GitHub token issues

Write-Host "repo-dashboard Token Diagnostic" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green
Write-Host ""

# Check for tokens
Write-Host "Checking for GitHub tokens..." -ForegroundColor Cyan
$tokens = @{
    "GITHUB_TOKEN" = $env:GITHUB_TOKEN
    "GH_TOKEN" = $env:GH_TOKEN
    "GH_PAT" = $env:GH_PAT
    "GitHubToken" = $env:GitHubToken
}

$foundToken = $false
foreach ($name in $tokens.Keys) {
    if ($tokens[$name]) {
        Write-Host "[OK] $name is set" -ForegroundColor Green
        Write-Host "  Value: $($tokens[$name].Substring(0, 20))..." -ForegroundColor Gray
        $foundToken = $true
    }
}

if (-not $foundToken) {
    Write-Host "[ERROR] No GitHub tokens found" -ForegroundColor Red
    Write-Host ""
    Write-Host "To create a token, visit:" -ForegroundColor Yellow
    Write-Host "  https://github.com/settings/tokens/new?scopes=repo,workflow" -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "Testing token validity..." -ForegroundColor Cyan

# Test with the first available token
$testToken = $null
foreach ($name in $tokens.Keys) {
    if ($tokens[$name]) {
        $testToken = $tokens[$name]
        Write-Host "Testing with: $name" -ForegroundColor Gray
        break
    }
}

try {
    $headers = @{
        "Authorization" = "token $testToken"
        "Accept" = "application/vnd.github.v3+json"
    }

    $response = Invoke-WebRequest -Uri "https://api.github.com/user" -Headers $headers -ErrorAction Stop
    $user = $response.Content | ConvertFrom-Json

    Write-Host "[OK] Token is valid!" -ForegroundColor Green
    Write-Host "  Authenticated as: $($user.login)" -ForegroundColor Gray
    Write-Host "  Name: $($user.name)" -ForegroundColor Gray

    Write-Host ""
    Write-Host "Checking token scopes..." -ForegroundColor Cyan
    $scopes = $response.Headers["X-OAuth-Scopes"]
    if ($scopes) {
        Write-Host "  Scopes: $scopes" -ForegroundColor Gray
        if ($scopes -match "repo" -and $scopes -match "workflow") {
            Write-Host "[OK] Token has required scopes (repo, workflow)" -ForegroundColor Green
        } else {
            Write-Host "[WARNING] Token missing required scopes" -ForegroundColor Yellow
            Write-Host "  Required: repo, workflow" -ForegroundColor Gray
            Write-Host "  Create a new token at: https://github.com/settings/tokens/new?scopes=repo,workflow" -ForegroundColor Gray
        }
    }

} catch {
    Write-Host "[ERROR] Token is invalid or expired" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "To create a new token, visit:" -ForegroundColor Yellow
    Write-Host "  https://github.com/settings/tokens/new?scopes=repo,workflow" -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "[OK] All checks passed! You can now use repo-dashboard." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Try running: node packages/repo-dashboard/dist/bin/cli.js issues --repo BPMSoftwareSolutions/package-builder" -ForegroundColor Gray
Write-Host "  2. Or use the library API in your code" -ForegroundColor Gray

