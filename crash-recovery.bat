@echo off
title WinTradesGo - Crash Recovery
color 0C
echo.
echo ==========================================
echo    WinTradesGo Crash Recovery Tool
echo ==========================================
echo.

set PROJECT_DIR=C:\xampp\htdocs\wintradesgo

echo [RECOVERY] Analyzing crash situation...
echo.

REM Check for zombie processes
echo Checking for zombie Node.js processes...
tasklist | findstr node.exe >nul 2>&1
if not errorlevel 1 (
    echo ⚠️  Found Node.js processes - Terminating...
    taskkill /F /IM node.exe /T >nul 2>&1
    echo ✅ Terminated zombie processes
) else (
    echo ✅ No zombie processes found
)

REM Check port availability
echo.
echo Checking port availability...
netstat -ano | findstr ":5173" >nul 2>&1
if not errorlevel 1 (
    echo ⚠️  Port 5173 still in use - Finding and terminating process...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173"') do (
        echo Killing process ID: %%a
        taskkill /F /PID %%a >nul 2>&1
    )
    timeout /t 3 >nul
    echo ✅ Port 5173 freed
) else (
    echo ✅ Port 5173 is available
)

REM Check XAMPP status
echo.
echo Checking XAMPP Apache status...
netstat -ano | findstr ":80" >nul 2>&1
if errorlevel 1 (
    echo ❌ XAMPP Apache not running on port 80
    echo    Please start XAMPP Control Panel and start Apache
    echo.
    set /p XAMPP_START="Open XAMPP Control Panel? (y/N): "
    if /i "!XAMPP_START!"=="y" (
        start "" "C:\xampp\xampp-control.exe" 2>nul
        if errorlevel 1 (
            echo Could not find XAMPP Control Panel
            echo Please start it manually
        )
    )
) else (
    echo ✅ XAMPP Apache is running
)

REM Clean npm cache if needed
echo.
echo Cleaning npm cache and temporary files...
cd /d "%PROJECT_DIR%"
if exist "node_modules\.cache" (
    rmdir /S /Q "node_modules\.cache" >nul 2>&1
    echo ✅ Cleared Vite cache
)

REM Check package.json and node_modules
if not exist "package.json" (
    echo ❌ Error: package.json not found in %PROJECT_DIR%
    echo    Please ensure you're in the correct project directory
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo ⚠️  node_modules not found - Running npm install...
    npm install
)

REM Memory cleanup
echo.
echo Performing memory cleanup...
REM Force garbage collection if possible
set NODE_OPTIONS=--max-old-space-size=4096

echo.
echo ==========================================
echo    Recovery Complete - Attempting Restart
echo ==========================================
echo.

REM Try to start the server
echo Starting server with recovery settings...
echo.
npm run dev

REM If we reach here, there might still be issues
echo.
echo ==========================================
echo    Manual Troubleshooting Required
echo ==========================================
echo.
echo If the server failed to start, try:
echo.
echo 1. Restart your computer (clears all memory/port issues)
echo 2. Check if antivirus is blocking Node.js
echo 3. Run as Administrator
echo 4. Check Windows Firewall settings
echo 5. Update Node.js to latest version
echo.
echo Project directory: %PROJECT_DIR%
echo.
pause