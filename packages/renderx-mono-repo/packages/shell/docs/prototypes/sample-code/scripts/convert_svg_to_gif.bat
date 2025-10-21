@echo off
REM SVG to GIF Conversion Script for Windows

setlocal enabledelayedexpansion

set "SVG_PATH=data\assets\images\messy_codebase_diagram.svg"
set "OUTPUT_PATH=data\assets\gifs\messy_codebase_diagram.gif"
set "SCRIPT_PATH=scripts\svg_to_gif_converter.py"

REM Ensure output directory exists
for %%F in ("%OUTPUT_PATH%") do (
  if not exist "%%~dpF" mkdir "%%~dpF"
)

echo ========================================
echo SVG to GIF Converter
echo ========================================
echo Input:  %SVG_PATH%
echo Output: %OUTPUT_PATH%
echo.

REM Prefer WinGet Links in PATH for ffmpeg from winget
set "PATH=%LOCALAPPDATA%\Microsoft\WinGet\Links;%PATH%"

python --version >nul 2>&1 || (
  echo Error: Python not found.
  pause & exit /b 1
)

REM Ensure Playwright is installed
python - <<PY
import importlib, sys, subprocess
try:
    importlib.import_module('playwright')
except Exception:
    print('Installing playwright...')
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'playwright'])
    subprocess.check_call([sys.executable, '-m', 'playwright', 'install', 'chromium'])
PY
if errorlevel 1 (
  echo Failed to ensure Playwright. & pause & exit /b 1
)

REM Check ffmpeg
ffmpeg -version >nul 2>&1 || (
  echo Error: FFmpeg not found. Install it or add to PATH.
  echo Try: winget install FFmpeg
  pause & exit /b 1
)

python "%SCRIPT_PATH%" "%SVG_PATH%" "%OUTPUT_PATH%" --duration 12 --fps 20 --width 1000 --height 700 --max-colors 128 --dither sierra2_4a --loop 0
if errorlevel 1 (
  echo Conversion failed. & pause & exit /b 1
)

echo.
echo Done! GIF saved to %OUTPUT_PATH%
echo.
pause
