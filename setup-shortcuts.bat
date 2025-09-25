@echo off
REM Quick Start Script for Desktop
title WinTradesGo - Quick Start
color 0A

REM Create desktop shortcuts if they don't exist
set DESKTOP=%USERPROFILE%\Desktop
set PROJECT_DIR=C:\xampp\htdocs\wintradesgo

echo ==========================================
echo    WinTradesGo Quick Setup
echo ==========================================
echo.

REM Create desktop shortcut for batch launcher
echo Creating desktop shortcuts...

REM Batch file shortcut
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\shortcut.vbs"
echo sLinkFile = "%DESKTOP%\Start WinTradesGo.lnk" >> "%TEMP%\shortcut.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%TEMP%\shortcut.vbs"
echo oLink.TargetPath = "%PROJECT_DIR%\start-server.bat" >> "%TEMP%\shortcut.vbs"
echo oLink.WorkingDirectory = "%PROJECT_DIR%" >> "%TEMP%\shortcut.vbs"
echo oLink.Description = "Start WinTradesGo Trading Platform" >> "%TEMP%\shortcut.vbs"
echo oLink.IconLocation = "shell32.dll,25" >> "%TEMP%\shortcut.vbs"
echo oLink.Save >> "%TEMP%\shortcut.vbs"
cscript /nologo "%TEMP%\shortcut.vbs"
del "%TEMP%\shortcut.vbs"

REM PowerShell manager shortcut
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\shortcut2.vbs"
echo sLinkFile = "%DESKTOP%\WinTradesGo Manager.lnk" >> "%TEMP%\shortcut2.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%TEMP%\shortcut2.vbs"
echo oLink.TargetPath = "powershell.exe" >> "%TEMP%\shortcut2.vbs"
echo oLink.Arguments = "-ExecutionPolicy Bypass -File ""%PROJECT_DIR%\server-manager.ps1""" >> "%TEMP%\shortcut2.vbs"
echo oLink.WorkingDirectory = "%PROJECT_DIR%" >> "%TEMP%\shortcut2.vbs"
echo oLink.Description = "WinTradesGo Server Manager (Advanced)" >> "%TEMP%\shortcut2.vbs"
echo oLink.IconLocation = "shell32.dll,16" >> "%TEMP%\shortcut2.vbs"
echo oLink.Save >> "%TEMP%\shortcut2.vbs"
cscript /nologo "%TEMP%\shortcut2.vbs"
del "%TEMP%\shortcut2.vbs"

echo ✅ Desktop shortcuts created:
echo    - "Start WinTradesGo" (Simple launcher)
echo    - "WinTradesGo Manager" (Advanced manager)
echo.

REM Ask if user wants to start the server now
set /p START_NOW="Start the server now? (y/N): "
if /i "%START_NOW%"=="y" (
    echo.
    echo Starting server...
    call "%PROJECT_DIR%\start-server.bat"
) else (
    echo.
    echo You can start the server later by:
    echo 1. Double-clicking "Start WinTradesGo" on desktop
    echo 2. Double-clicking "WinTradesGo Manager" for advanced options
    echo 3. Running this batch file again
    echo.
    pause
)