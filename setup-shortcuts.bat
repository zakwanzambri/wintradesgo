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

REM PowerShell GUI launcher shortcut (with .bat wrapper)
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\shortcut2.vbs"
echo sLinkFile = "%DESKTOP%\WinTradesGo GUI.lnk" >> "%TEMP%\shortcut2.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%TEMP%\shortcut2.vbs"
echo oLink.TargetPath = "%PROJECT_DIR%\gui-launcher.bat" >> "%TEMP%\shortcut2.vbs"
echo oLink.WorkingDirectory = "%PROJECT_DIR%" >> "%TEMP%\shortcut2.vbs"
echo oLink.Description = "WinTradesGo Visual Interface (PowerShell GUI)" >> "%TEMP%\shortcut2.vbs"
echo oLink.IconLocation = "shell32.dll,16" >> "%TEMP%\shortcut2.vbs"
echo oLink.Save >> "%TEMP%\shortcut2.vbs"
cscript /nologo "%TEMP%\shortcut2.vbs"
del "%TEMP%\shortcut2.vbs"

REM Web-based GUI shortcut
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\shortcut3.vbs"
echo sLinkFile = "%DESKTOP%\WinTradesGo Web GUI.lnk" >> "%TEMP%\shortcut3.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%TEMP%\shortcut3.vbs"
echo oLink.TargetPath = "%PROJECT_DIR%\web-gui.html" >> "%TEMP%\shortcut3.vbs"
echo oLink.WorkingDirectory = "%PROJECT_DIR%" >> "%TEMP%\shortcut3.vbs"
echo oLink.Description = "WinTradesGo Web-based Control Panel" >> "%TEMP%\shortcut3.vbs"
echo oLink.IconLocation = "shell32.dll,23" >> "%TEMP%\shortcut3.vbs"
echo oLink.Save >> "%TEMP%\shortcut3.vbs"
cscript /nologo "%TEMP%\shortcut3.vbs"
del "%TEMP%\shortcut3.vbs"

REM Crash recovery shortcut
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\shortcut4.vbs"
echo sLinkFile = "%DESKTOP%\WinTradesGo Recovery.lnk" >> "%TEMP%\shortcut4.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%TEMP%\shortcut4.vbs"
echo oLink.TargetPath = "%PROJECT_DIR%\crash-recovery.bat" >> "%TEMP%\shortcut4.vbs"
echo oLink.WorkingDirectory = "%PROJECT_DIR%" >> "%TEMP%\shortcut4.vbs"
echo oLink.Description = "Emergency Recovery for WinTradesGo" >> "%TEMP%\shortcut4.vbs"
echo oLink.IconLocation = "shell32.dll,78" >> "%TEMP%\shortcut4.vbs"
echo oLink.Save >> "%TEMP%\shortcut4.vbs"
cscript /nologo "%TEMP%\shortcut4.vbs"
del "%TEMP%\shortcut4.vbs"

echo ✅ Desktop shortcuts created:
echo    - "Start WinTradesGo" (Main server launcher)
echo    - "WinTradesGo GUI" (PowerShell visual interface)  
echo    - "WinTradesGo Web GUI" (Browser-based control panel)
echo    - "WinTradesGo Recovery" (Emergency recovery tool)
echo.
echo 💡 GUI Options:
echo    - Use "WinTradesGo GUI" for Windows native interface
echo    - Use "WinTradesGo Web GUI" for browser-based interface
echo    - Both provide visual server management
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
    echo 2. Double-clicking "WinTradesGo GUI" for visual interface
    echo 3. Double-clicking "WinTradesGo Web GUI" for browser interface  
    echo 4. Running this batch file again
    echo.
    pause
)