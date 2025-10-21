# FFmpeg Installation Script for Windows
# This script downloads and installs FFmpeg automatically

param(
    [string]$InstallPath = "C:\ffmpeg",
    [switch]$AddToPath = $true
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FFmpeg Installation Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin -and $AddToPath) {
    Write-Host "Warning: Not running as Administrator." -ForegroundColor Yellow
    Write-Host "To add FFmpeg to system PATH, please run this script as Administrator." -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Continue with user-level installation? (y/n)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        exit 1
    }
}

# Function to download file with progress
function Download-FileWithProgress {
    param(
        [string]$Url,
        [string]$OutputPath
    )
    
    try {
        Write-Host "Downloading from: $Url" -ForegroundColor Yellow
        Invoke-WebRequest -Uri $Url -OutFile $OutputPath -UseBasicParsing
        Write-Host "✓ Download completed" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "✗ Download failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Check if FFmpeg is already installed
try {
    $ffmpegVersion = ffmpeg -version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ FFmpeg is already installed and in PATH" -ForegroundColor Green
        Write-Host "Version information:" -ForegroundColor Cyan
        ffmpeg -version | Select-Object -First 1
        Write-Host ""
        $reinstall = Read-Host "Do you want to reinstall anyway? (y/n)"
        if ($reinstall -ne "y" -and $reinstall -ne "Y") {
            Write-Host "Installation cancelled." -ForegroundColor Yellow
            exit 0
        }
    }
}
catch {
    Write-Host "FFmpeg not found in PATH. Proceeding with installation..." -ForegroundColor Yellow
}

# Create installation directory
Write-Host "Creating installation directory: $InstallPath" -ForegroundColor Yellow
if (Test-Path $InstallPath) {
    Write-Host "Directory already exists. Cleaning up..." -ForegroundColor Yellow
    Remove-Item -Path $InstallPath -Recurse -Force -ErrorAction SilentlyContinue
}

New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null

# Download FFmpeg
$tempDir = [System.IO.Path]::GetTempPath()
$zipFile = Join-Path $tempDir "ffmpeg.zip"

# FFmpeg download URL (latest stable build)
$ffmpegUrl = "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip"

Write-Host "Downloading FFmpeg..." -ForegroundColor Yellow
if (-not (Download-FileWithProgress -Url $ffmpegUrl -OutputPath $zipFile)) {
    Write-Host "Failed to download FFmpeg. Please check your internet connection." -ForegroundColor Red
    exit 1
}

# Extract FFmpeg
Write-Host "Extracting FFmpeg..." -ForegroundColor Yellow
try {
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::ExtractToDirectory($zipFile, $tempDir)
    
    # Find the extracted folder (it has a version-specific name)
    $extractedFolder = Get-ChildItem -Path $tempDir -Directory | Where-Object { $_.Name -like "ffmpeg-*" } | Select-Object -First 1
    
    if ($extractedFolder) {
        # Copy contents to installation directory
        Copy-Item -Path "$($extractedFolder.FullName)\*" -Destination $InstallPath -Recurse -Force
        Write-Host "✓ FFmpeg extracted successfully" -ForegroundColor Green
        
        # Clean up extracted folder
        Remove-Item -Path $extractedFolder.FullName -Recurse -Force -ErrorAction SilentlyContinue
    }
    else {
        throw "Could not find extracted FFmpeg folder"
    }
}
catch {
    Write-Host "✗ Failed to extract FFmpeg: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
finally {
    # Clean up zip file
    Remove-Item -Path $zipFile -Force -ErrorAction SilentlyContinue
}

# Add to PATH if requested
if ($AddToPath) {
    $binPath = Join-Path $InstallPath "bin"
    
    Write-Host "Adding FFmpeg to PATH..." -ForegroundColor Yellow
    
    try {
        if ($isAdmin) {
            # Add to system PATH
            $currentPath = [Environment]::GetEnvironmentVariable("PATH", "Machine")
            if ($currentPath -notlike "*$binPath*") {
                $newPath = $currentPath + ";" + $binPath
                [Environment]::SetEnvironmentVariable("PATH", $newPath, "Machine")
                Write-Host "✓ Added to system PATH" -ForegroundColor Green
            }
            else {
                Write-Host "✓ Already in system PATH" -ForegroundColor Green
            }
        }
        else {
            # Add to user PATH
            $currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
            if ($currentPath -notlike "*$binPath*") {
                $newPath = if ($currentPath) { $currentPath + ";" + $binPath } else { $binPath }
                [Environment]::SetEnvironmentVariable("PATH", $newPath, "User")
                Write-Host "✓ Added to user PATH" -ForegroundColor Green
            }
            else {
                Write-Host "✓ Already in user PATH" -ForegroundColor Green
            }
        }
        
        # Update current session PATH
        $env:PATH += ";$binPath"
        
    }
    catch {
        Write-Host "✗ Failed to add to PATH: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "You can manually add this path to your system PATH: $binPath" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "FFmpeg Installation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Installation path: $InstallPath" -ForegroundColor White
Write-Host "Binary path: $(Join-Path $InstallPath 'bin')" -ForegroundColor White
Write-Host ""

# Test installation
Write-Host "Testing FFmpeg installation..." -ForegroundColor Yellow
try {
    $testResult = & "$(Join-Path $InstallPath 'bin\ffmpeg.exe')" -version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ FFmpeg is working correctly!" -ForegroundColor Green
        Write-Host ""
        Write-Host "You may need to restart your command prompt/PowerShell" -ForegroundColor Yellow
        Write-Host "for the PATH changes to take effect." -ForegroundColor Yellow
    }
    else {
        Write-Host "✗ FFmpeg test failed" -ForegroundColor Red
    }
}
catch {
    Write-Host "✗ Could not test FFmpeg: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Now you can run the SVG to MP4 converter!" -ForegroundColor Cyan
