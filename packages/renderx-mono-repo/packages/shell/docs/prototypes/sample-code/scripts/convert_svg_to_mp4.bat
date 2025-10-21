@echo off
REM SVG to MP4 Conversion Script for Windows
REM This batch file provides an easy way to convert the animated SVG to MP4

setlocal enabledelayedexpansion

REM Set default paths
set "SVG_PATH=data\assets\images\messy_codebase_diagram.svg"
set "OUTPUT_PATH=data\assets\videos\messy_codebase_diagram.mp4"
set "SCRIPT_PATH=scripts\svg_to_mp4_converter.py"

echo ========================================
echo SVG to MP4 Converter
echo ========================================
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python 3.7+ and try again
    pause
    exit /b 1
)

REM Check if the SVG file exists
if not exist "%SVG_PATH%" (
    echo Error: SVG file not found: %SVG_PATH%
    echo Please check the file path and try again
    pause
    exit /b 1
)

REM Create output directory if it doesn't exist
for %%F in ("%OUTPUT_PATH%") do (
    if not exist "%%~dpF" (
        echo Creating output directory: %%~dpF
        mkdir "%%~dpF"
    )
)

REM Check if required Python packages are installed
echo Checking Python dependencies...
python -c "import playwright" >nul 2>&1
if errorlevel 1 (
    echo Installing required Python packages...
    pip install playwright
    if errorlevel 1 (
        echo Error: Failed to install playwright
        pause
        exit /b 1
    )
    
    echo Installing Playwright browser...
    playwright install chromium
    if errorlevel 1 (
        echo Error: Failed to install Playwright browser
        pause
        exit /b 1
    )
)

REM Check if FFmpeg is available
ffmpeg -version >nul 2>&1
if errorlevel 1 (
    echo.
    echo Warning: FFmpeg is not installed or not in PATH
    echo Please install FFmpeg from https://ffmpeg.org/download.html
    echo and add it to your system PATH
    echo.
    pause
    exit /b 1
)

echo.
echo Converting SVG to MP4...
echo Input:  %SVG_PATH%
echo Output: %OUTPUT_PATH%
echo.

REM Run the conversion
python "%SCRIPT_PATH%" "%SVG_PATH%" "%OUTPUT_PATH%" --duration 15 --fps 30

if errorlevel 1 (
    echo.
    echo Conversion failed!
    pause
    exit /b 1
) else (
    echo.
    echo ========================================
    echo Conversion completed successfully!
    echo Output file: %OUTPUT_PATH%
    echo ========================================
    echo.
    
    REM Ask if user wants to open the output folder
    set /p "OPEN_FOLDER=Open output folder? (y/n): "
    if /i "!OPEN_FOLDER!"=="y" (
        for %%F in ("%OUTPUT_PATH%") do (
            explorer "%%~dpF"
        )
    )
)

pause
