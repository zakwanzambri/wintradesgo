@echo off
title WinTradesGo Server Launcher
color 0A
echo.
echo ==========================================
echo    WinTradesGo Trading Platform Launcher
echo ==========================================
echo.

REM Set the project directory
set PROJECT_DIR=C:\xampp\htdocs\wintradesgo

REM Check if directory exists
if not exist "%PROJECT_DIR%" (
    echo ERROR: Project directory not found!
    echo Expected: %PROJECT_DIR%
    echo Please update PROJECT_DIR in this script.
    pause
    exit /b 1
)

echo [1/4] Checking system requirements...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
) else (
    echo ✅ Node.js found
)

REM Check if XAMPP Apache is running
netstat -an | findstr ":80" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  XAMPP Apache not detected on port 80
    echo Please start XAMPP Apache server manually
) else (
    echo ✅ XAMPP Apache running on port 80
)

echo.
echo [2/4] Cleaning up any existing Node processes...

REM Kill any existing node processes
taskkill /F /IM node.exe >nul 2>&1
if not errorlevel 1 (
    echo ✅ Cleaned up existing Node processes
) else (
    echo ℹ️  No existing Node processes found
)

echo.
echo [3/4] Navigating to project directory...
cd /d "%PROJECT_DIR%"

if not exist "package.json" (
    echo ERROR: package.json not found in project directory
    echo Please ensure you're in the correct project folder
    pause
    exit /b 1
)

echo ✅ Project directory confirmed

echo.
echo [4/4] Starting Vite development server...
echo.
echo ==========================================
echo    Server will start on http://localhost:5173
echo    Press Ctrl+C to stop the server
echo ==========================================
echo.

REM Start the development server
npm run dev

REM If we reach here, the server has stopped
echo.
echo ==========================================
echo    Server has stopped
echo ==========================================
pause