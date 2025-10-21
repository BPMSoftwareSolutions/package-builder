param(
  [string]$InputPath = "data/assets/images/messy_codebase_diagram.svg",
  [string]$OutputPath = "data/assets/gifs/messy_codebase_diagram.gif",
  [int]$Duration = 12,
  [int]$FPS = 20,
  [int]$Width = 1000,
  [int]$Height = 700,
  [int]$MaxColors = 128,
  [string]$Dither = "sierra2_4a",
  [int]$Loop = 0
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SVG to GIF Converter" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$ErrorActionPreference = 'Stop'

# Prefer WinGet Links for ffmpeg in this session
$links = Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Links'
if (Test-Path $links) { $env:PATH = "$links;$env:PATH" }

# Validate inputs
if (-not (Test-Path $InputPath)) { throw "Input SVG not found: $InputPath" }
$dir = Split-Path -Parent $OutputPath
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }

# Ensure Python + Playwright
$havePython = (Get-Command python -ErrorAction SilentlyContinue) -ne $null
if (-not $havePython) { throw 'Python not found in PATH' }

try {
  python - <<'PY'
import importlib, sys, subprocess
try:
    importlib.import_module('playwright')
except Exception:
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'playwright'])
    subprocess.check_call([sys.executable, '-m', 'playwright', 'install', 'chromium'])
PY
} catch { throw "Failed to ensure Playwright: $($_.Exception.Message)" }

# Ensure ffmpeg
$ff = (Get-Command ffmpeg -ErrorAction SilentlyContinue)
if (-not $ff) { throw 'FFmpeg not found in PATH. Try: winget install FFmpeg' }

Write-Host "Input:      $InputPath"
Write-Host "Output:     $OutputPath"
Write-Host "Duration:   $Duration s"
Write-Host "FPS:        $FPS"
Write-Host "Resolution: ${Width}x${Height}"
Write-Host "Colors:     $MaxColors"
Write-Host "Dither:     $Dither"

python scripts/svg_to_gif_converter.py `
  "$InputPath" "$OutputPath" `
  --duration $Duration `
  --fps $FPS `
  --width $Width `
  --height $Height `
  --max-colors $MaxColors `
  --dither $Dither `
  --loop $Loop

if ($LASTEXITCODE -ne 0) { throw "Conversion failed with exit code $LASTEXITCODE" }

Write-Host "\nDone! GIF saved to $OutputPath" -ForegroundColor Green

