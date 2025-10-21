@echo off
REM FFmpeg Installation Script for Windows (Batch version)

setlocal enabledelayedexpansion

echo ========================================
echo FFmpeg Installation Helper
echo ========================================
echo.

REM Check if FFmpeg is already installed
ffmpeg -version >nul 2>&1
if not errorlevel 1 (
    echo FFmpeg is already installed and in PATH!
    ffmpeg -version | findstr "ffmpeg version"
    echo.
    set /p "REINSTALL=Do you want to reinstall anyway? (y/n): "
    if /i not "!REINSTALL!"=="y" (
        echo Installation cancelled.
        pause
        exit /b 0
    )
)

echo.
echo This script will help you install FFmpeg.
echo.
echo Option 1: Automatic installation (PowerShell - Recommended)
echo Option 2: Manual installation instructions
echo.
set /p "CHOICE=Choose option (1 or 2): "

if "!CHOICE!"=="1" (
    echo.
    echo Running PowerShell installation script...
    echo This may require Administrator privileges.
    echo.
    pause
    
    REM Run PowerShell script
    powershell -ExecutionPolicy Bypass -File "scripts\install_ffmpeg.ps1"
    
    if errorlevel 1 (
        echo.
        echo PowerShell installation failed. Showing manual instructions...
        goto :manual
    ) else (
        echo.
        echo Installation completed! You may need to restart your command prompt.
        pause
        exit /b 0
    )
) else if "!CHOICE!"=="2" (
    goto :manual
) else (
    echo Invalid choice. Please run the script again.
    pause
    exit /b 1
)

:manual
echo.
echo ========================================
echo Manual FFmpeg Installation Instructions
echo ========================================
echo.
echo 1. Go to: https://github.com/BtbN/FFmpeg-Builds/releases
echo 2. Download: ffmpeg-master-latest-win64-gpl.zip
echo 3. Extract the zip file to C:\ffmpeg
echo 4. Add C:\ffmpeg\bin to your system PATH:
echo    - Press Win + R, type "sysdm.cpl", press Enter
echo    - Click "Environment Variables"
echo    - Under "System Variables", find and select "Path"
echo    - Click "Edit", then "New"
echo    - Add: C:\ffmpeg\bin
echo    - Click OK on all dialogs
echo 5. Restart your command prompt
echo.
echo Alternative: Use package managers
echo - Chocolatey: choco install ffmpeg
echo - Scoop: scoop install ffmpeg
echo - winget: winget install FFmpeg
echo.
echo After installation, test with: ffmpeg -version
echo.
pause
