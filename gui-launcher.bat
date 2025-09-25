@echo off
title WinTradesGo GUI Launcher
echo Starting WinTradesGo Visual Interface...
echo.

REM Set project directory
set PROJECT_DIR=%~dp0

REM Check if PowerShell is available
powershell -Command "Get-Host" >nul 2>&1
if errorlevel 1 (
    echo ERROR: PowerShell not found!
    echo Please install PowerShell or use the basic launcher instead.
    pause
    exit /b 1
)

REM Check if GUI script exists
if not exist "%PROJECT_DIR%gui-launcher-clean.ps1" (
    echo ERROR: GUI launcher script not found!
    echo Expected: %PROJECT_DIR%gui-launcher-clean.ps1
    pause
    exit /b 1
)

echo ✅ PowerShell found
echo ✅ GUI script found
echo.
echo 🖼️ Opening visual interface...

REM Launch PowerShell GUI with proper execution policy (clean version)
powershell -ExecutionPolicy Bypass -WindowStyle Normal -File "%PROJECT_DIR%gui-launcher-clean.ps1"

REM Handle any errors
if errorlevel 1 (
    echo.
    echo ❌ Error launching GUI interface!
    echo.
    echo Possible solutions:
    echo 1. Run as Administrator
    echo 2. Check Windows security settings
    echo 3. Use the basic launcher instead: start-server.bat
    echo.
    pause
)