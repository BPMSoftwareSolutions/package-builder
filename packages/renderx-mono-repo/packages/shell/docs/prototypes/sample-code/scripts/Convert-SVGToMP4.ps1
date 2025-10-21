# SVG to MP4 Conversion Script for PowerShell
# This script converts an animated SVG to MP4 video format

param(
    [string]$InputPath = "data\assets\images\messy_codebase_diagram.svg",
    [string]$OutputPath = "data\assets\videos\messy_codebase_diagram.mp4",
    [int]$Duration = 15,
    [int]$FPS = 30,
    [int]$Width = 1000,
    [int]$Height = 700
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SVG to MP4 Converter" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if a command exists
function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Check if Python is available
if (-not (Test-Command "python")) {
    Write-Host "Error: Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python 3.7+ and try again" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✓ Python found" -ForegroundColor Green

# Check if the SVG file exists
if (-not (Test-Path $InputPath)) {
    Write-Host "Error: SVG file not found: $InputPath" -ForegroundColor Red
    Write-Host "Please check the file path and try again" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✓ SVG file found: $InputPath" -ForegroundColor Green

# Create output directory if it doesn't exist
$OutputDir = Split-Path $OutputPath -Parent
if (-not (Test-Path $OutputDir)) {
    Write-Host "Creating output directory: $OutputDir" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

Write-Host "✓ Output directory ready: $OutputDir" -ForegroundColor Green

# Check if required Python packages are installed
Write-Host "Checking Python dependencies..." -ForegroundColor Yellow

try {
    python -c "import playwright" 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Playwright not found"
    }
    Write-Host "✓ Playwright is installed" -ForegroundColor Green
}
catch {
    Write-Host "Installing Playwright..." -ForegroundColor Yellow
    python -m pip install playwright
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to install Playwright" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    
    Write-Host "Installing Playwright browser..." -ForegroundColor Yellow
    python -m playwright install chromium
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to install Playwright browser" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    
    Write-Host "✓ Playwright installed successfully" -ForegroundColor Green
}

# Check if FFmpeg is available
if (-not (Test-Command "ffmpeg")) {
    Write-Host ""
    Write-Host "Warning: FFmpeg is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install FFmpeg from https://ffmpeg.org/download.html" -ForegroundColor Yellow
    Write-Host "and add it to your system PATH" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✓ FFmpeg found" -ForegroundColor Green

Write-Host ""
Write-Host "Starting conversion..." -ForegroundColor Cyan
Write-Host "Input:      $InputPath" -ForegroundColor White
Write-Host "Output:     $OutputPath" -ForegroundColor White
Write-Host "Duration:   $Duration seconds" -ForegroundColor White
Write-Host "FPS:        $FPS" -ForegroundColor White
Write-Host "Resolution: ${Width}x${Height}" -ForegroundColor White
Write-Host ""

# Run the conversion
$ScriptPath = "scripts\svg_to_mp4_converter.py"
python $ScriptPath $InputPath $OutputPath --duration $Duration --fps $FPS --width $Width --height $Height

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Conversion completed successfully!" -ForegroundColor Green
    Write-Host "Output file: $OutputPath" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    
    # Ask if user wants to open the output folder
    $OpenFolder = Read-Host "Open output folder? (y/n)"
    if ($OpenFolder -eq "y" -or $OpenFolder -eq "Y") {
        Invoke-Item $OutputDir
    }
    
    # Ask if user wants to play the video
    $PlayVideo = Read-Host "Play the video? (y/n)"
    if ($PlayVideo -eq "y" -or $PlayVideo -eq "Y") {
        Invoke-Item $OutputPath
    }
}
else {
    Write-Host ""
    Write-Host "Conversion failed!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
