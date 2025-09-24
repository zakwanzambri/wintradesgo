# System Health Monitor for WinTradesGo

## 🔍 **Crash Analysis & Prevention**

### **What Happened:**
The Vite development server stopped running. This is normal during development and can happen due to:

1. **Memory usage** - Node.js process exceeded memory limits
2. **File changes** - Hot module replacement issues
3. **Dependency optimization** - Vite rebuilding optimized dependencies
4. **Port conflicts** - Another process trying to use port 5173
5. **Manual termination** - Accidentally closed terminal or stopped process

### **Current Status:** ✅ RECOVERED
- **Frontend (Vite):** ✅ Running on port 5173
- **Backend (XAMPP):** ✅ Running on port 80
- **API Endpoints:** ✅ Responding correctly
- **Dependencies:** ✅ @headlessui/react optimized

## 🛡️ **Prevention Measures:**

### **1. Process Monitoring Script**
```powershell
# monitor.ps1 - Run this to monitor system health
while ($true) {
    $vite = Get-Process -Name node -ErrorAction SilentlyContinue
    $apache = Get-Process -Name httpd -ErrorAction SilentlyContinue
    
    Write-Host "$(Get-Date) - Health Check:"
    
    if ($vite) {
        Write-Host "  ✅ Vite Server: Running" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Vite Server: Down - Restarting..." -ForegroundColor Red
        Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory "C:\xampp\htdocs\wintradesgo"
    }
    
    if ($apache) {
        Write-Host "  ✅ Apache: Running" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Apache: Down" -ForegroundColor Red
    }
    
    Start-Sleep 30  # Check every 30 seconds
}
```

### **2. Quick Restart Commands**
```bash
# Frontend restart
npm run dev

# Full system restart
taskkill /F /IM node.exe 2>nul ; npm run dev

# Check system status
Get-Process node,httpd -ErrorAction SilentlyContinue
netstat -ano | findstr ":5173|:80"
```

### **3. Troubleshooting Steps**
```
1. Check if processes are running:
   Get-Process node,httpd -ErrorAction SilentlyContinue

2. Check if ports are available:
   netstat -ano | findstr ":5173|:80"

3. Test API connectivity:
   curl "http://localhost/wintradesgo/model-api.php?action=get_features"

4. Restart frontend if needed:
   npm run dev

5. Open dashboard:
   http://localhost:5173
```

## 🚨 **Common Issues & Solutions:**

### **Issue 1: Port 5173 in use**
```powershell
# Solution:
netstat -ano | findstr :5173
taskkill /F /PID [PID_NUMBER]
npm run dev
```

### **Issue 2: Node.js memory issues**
```powershell
# Solution:
$env:NODE_OPTIONS="--max-old-space-size=4096"
npm run dev
```

### **Issue 3: XAMPP Apache down**
```
# Solution:
1. Open XAMPP Control Panel
2. Start Apache service
3. Or restart XAMPP completely
```

### **Issue 4: API returning errors**
```powershell
# Check PHP errors:
curl "http://localhost/wintradesgo/model-api.php?action=get_features"

# Check file permissions:
ls -la config/feature_settings.json
```

## 📊 **System Requirements:**
- **Node.js:** v18+ (for Vite compatibility)
- **PHP:** v7.4+ (for XAMPP/Apache)
- **Memory:** 4GB+ RAM recommended
- **Ports:** 5173 (Vite), 80 (Apache)

## 🎯 **Best Practices:**
1. **Keep terminals open** - Don't close Vite terminal
2. **Monitor memory usage** - Restart if Node.js uses >1GB
3. **Regular health checks** - Test API endpoints periodically
4. **Clean restarts** - Use proper shutdown commands
5. **Backup configs** - Keep feature_settings.json backed up