# 🚀 WinTradesGo Server Launchers

This folder contains multiple ways to start and manage your WinTradesGo server easily.

## 📁 Available Launchers

### 1. **setup-shortcuts.bat** - One-time Setup
- **Purpose:** Creates desktop shortcuts for easy access
- **Usage:** Double-click once to set up shortcuts
- **Creates:** 
  - "Start WinTradesGo" shortcut on desktop
  - "WinTradesGo Manager" shortcut on desktop

### 2. **start-server.bat** - Simple Launcher
- **Purpose:** Basic server startup with system checks
- **Features:**
  - ✅ Checks Node.js installation
  - ✅ Verifies XAMPP Apache status
  - ✅ Cleans up existing processes
  - ✅ Starts Vite development server
- **Usage:** Double-click to start server

### 3. **server-manager.ps1** - Advanced Manager
- **Purpose:** Full-featured server management (PowerShell)
- **Features:**
  - 🎛️ Interactive menu system
  - 📊 Real-time status monitoring
  - 🔄 Auto-restart capabilities
  - 🕵️ Server health monitoring
  - 🛠️ Advanced troubleshooting
- **Usage:** 
  ```powershell
  # Interactive mode
  .\server-manager.ps1
  
  # Command line options
  .\server-manager.ps1 -Status      # Check status
  .\server-manager.ps1 -Restart     # Restart server
  .\server-manager.ps1 -Monitor     # Monitor mode
  .\server-manager.ps1 -Stop        # Stop server
  ```

### 4. **crash-recovery.bat** - Emergency Recovery
- **Purpose:** Fixes server crashes and system issues
- **Features:**
  - 🔧 Kills zombie processes
  - 🧹 Cleans ports and cache
  - 🔍 Diagnoses common issues
  - 💾 Memory cleanup
  - ⚡ Recovery restart
- **Usage:** Run when server crashes or won't start

### 5. **gui-launcher.ps1** - GUI Manager
- **Purpose:** Windows Forms GUI for visual server management
- **Features:**
  - 🖼️ User-friendly interface
  - 🚀 Start/Stop/Restart buttons
  - 📋 Real-time status display
  - 📊 Live log monitoring
  - 🌐 One-click dashboard access
  - ⏰ Auto status updates
- **Usage:** Double-click for GUI interface

## 🎯 Quick Start Guide

### First Time Setup:
1. **Double-click `setup-shortcuts.bat`**
   - Creates desktop shortcuts
   - Asks if you want to start server immediately

### Daily Usage Options:

#### **Option A: Simple (Recommended)**
- **Double-click "Start WinTradesGo" on desktop**
- Most users should use this option

#### **Option B: Advanced**
- **Double-click "WinTradesGo Manager" on desktop**
- For advanced users who want monitoring/control

#### **Option C: GUI**
- **Run `gui-launcher.ps1`**
- For users who prefer visual interface

### When Things Go Wrong:
- **Double-click `crash-recovery.bat`**
- Fixes most common issues automatically

## 📊 Server Status Indicators

### ✅ **All Good**
- Frontend (Vite): Running on port 5173
- Backend (Apache): Running on port 80
- API: Responding correctly

### ⚠️ **Partial Issues**
- One service down but others working
- Usually means XAMPP needs to be started

### ❌ **Major Issues**
- Both services down
- Run crash recovery tool

## 🌐 Access URLs

Once server is running:
- **Main Dashboard:** http://localhost:5173
- **Admin Interface:** http://localhost:5173 (Admin tab)
- **API Endpoint:** http://localhost/wintradesgo/model-api.php

## 🔧 Troubleshooting

### Common Issues:

1. **"Port 5173 already in use"**
   - Solution: Run crash-recovery.bat

2. **"XAMPP Apache not running"**
   - Solution: Start XAMPP Control Panel → Start Apache

3. **"Node.js not found"**
   - Solution: Install Node.js from https://nodejs.org

4. **"Project directory not found"**
   - Solution: Update `PROJECT_DIR` in batch files

### Manual Commands:
```bash
# Check processes
Get-Process node,httpd

# Check ports
netstat -ano | findstr ":5173|:80"

# Kill processes
taskkill /F /IM node.exe

# Start fresh
npm run dev
```

## 💡 Pro Tips

1. **Use setup-shortcuts.bat first** - Creates convenient desktop access
2. **Keep XAMPP running** - Start Apache service before using launchers
3. **Use GUI launcher for debugging** - Visual logs help identify issues
4. **Monitor mode is useful** - Auto-restarts failed servers
5. **Crash recovery fixes 90% of issues** - Try this first when problems occur

## 📁 File Structure
```
C:\xampp\htdocs\wintradesgo\
├── setup-shortcuts.bat      # 🔧 One-time setup
├── start-server.bat         # 🚀 Simple launcher  
├── server-manager.ps1       # 🎛️ Advanced manager
├── crash-recovery.bat       # 🔧 Emergency recovery
├── gui-launcher.ps1         # 🖼️ GUI interface
└── docs/
    └── Server_Launchers.md  # 📖 This file
```

## 🎉 Success!

If you can access http://localhost:5173 and see your trading dashboard, everything is working perfectly!

**Happy Trading! 📈💰**