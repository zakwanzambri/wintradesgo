# WinTradesGo Server Manager
# PowerShell script for advanced server management

param(
    [switch]$Monitor,
    [switch]$Restart,
    [switch]$Status,
    [switch]$Stop
)

# Configuration
$ProjectDir = "C:\xampp\htdocs\wintradesgo"
$VitePort = 5173
$ApachePort = 80

# Colors for output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    } else {
        $input | Write-Output
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Show-Header {
    Clear-Host
    Write-ColorOutput Yellow @"
╔══════════════════════════════════════════════════════════════╗
║                 WinTradesGo Server Manager                   ║
║                      PowerShell Edition                      ║
╚══════════════════════════════════════════════════════════════╝
"@
    Write-Output ""
}

function Test-ServerStatus {
    Write-ColorOutput Cyan "🔍 Checking server status..."
    
    # Check Vite server
    $viteProcess = Get-Process -Name node -ErrorAction SilentlyContinue
    $vitePort = netstat -ano | Select-String ":$VitePort" | Select-Object -First 1
    
    # Check Apache server
    $apacheProcess = Get-Process -Name httpd -ErrorAction SilentlyContinue
    $apachePort = netstat -ano | Select-String ":$ApachePort" | Select-Object -First 1
    
    Write-Output ""
    Write-Output "📊 System Status Report:"
    Write-Output "========================"
    
    # Vite Status
    if ($viteProcess -and $vitePort) {
        Write-ColorOutput Green "✅ Frontend (Vite): Running on port $VitePort"
        Write-Output "   Process ID: $($viteProcess.Id)"
    } elseif ($viteProcess) {
        Write-ColorOutput Yellow "⚠️  Frontend (Vite): Process running but port $VitePort not bound"
    } else {
        Write-ColorOutput Red "❌ Frontend (Vite): Not running"
    }
    
    # Apache Status
    if ($apacheProcess -and $apachePort) {
        Write-ColorOutput Green "✅ Backend (Apache): Running on port $ApachePort"
    } elseif ($apachePort) {
        Write-ColorOutput Yellow "⚠️  Backend (Apache): Port $ApachePort in use (check XAMPP)"
    } else {
        Write-ColorOutput Red "❌ Backend (Apache): Not running"
    }
    
    # API Test
    try {
        $response = Invoke-WebRequest -Uri "http://localhost/wintradesgo/model-api.php?action=get_features" -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-ColorOutput Green "✅ API Endpoints: Responding correctly"
        }
    } catch {
        Write-ColorOutput Red "❌ API Endpoints: Not responding"
    }
    
    Write-Output ""
    return @{
        ViteRunning = ($viteProcess -and $vitePort)
        ApacheRunning = ($apacheProcess -and $apachePort)
    }
}

function Start-WinTradesServer {
    Show-Header
    Write-ColorOutput Cyan "🚀 Starting WinTradesGo Server..."
    Write-Output ""
    
    # Check if project directory exists
    if (-not (Test-Path $ProjectDir)) {
        Write-ColorOutput Red "❌ Error: Project directory not found!"
        Write-Output "   Expected: $ProjectDir"
        Write-Output "   Please update the `$ProjectDir variable in this script."
        Read-Host "Press Enter to exit"
        return
    }
    
    # Change to project directory
    Set-Location $ProjectDir
    
    # Kill existing Node processes
    Write-ColorOutput Yellow "🧹 Cleaning up existing processes..."
    Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep 2
    
    # Check system status first
    $status = Test-ServerStatus
    
    if (-not $status.ApacheRunning) {
        Write-ColorOutput Yellow "⚠️  XAMPP Apache is not running!"
        Write-Output "   Please start XAMPP Control Panel and start Apache service."
        $continue = Read-Host "Continue anyway? (y/N)"
        if ($continue -ne 'y' -and $continue -ne 'Y') {
            return
        }
    }
    
    Write-Output ""
    Write-ColorOutput Green "🚀 Starting Vite development server..."
    Write-Output "   URL: http://localhost:$VitePort"
    Write-Output "   Admin: http://localhost:$VitePort (Admin tab)"
    Write-Output ""
    Write-ColorOutput Yellow "💡 Press Ctrl+C to stop the server"
    Write-Output ""
    
    # Start the server
    npm run dev
}

function Stop-WinTradesServer {
    Write-ColorOutput Yellow "🛑 Stopping WinTradesGo servers..."
    
    # Stop Node processes
    $nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        $nodeProcesses | Stop-Process -Force
        Write-ColorOutput Green "✅ Stopped Vite development server"
    } else {
        Write-Output "ℹ️  No Node.js processes found"
    }
    
    Write-Output ""
    Write-Output "Note: XAMPP Apache server left running (manual control via XAMPP)"
}

function Start-ServerMonitor {
    Show-Header
    Write-ColorOutput Cyan "👁️  Starting Server Monitor..."
    Write-Output "Press Ctrl+C to stop monitoring"
    Write-Output ""
    
    $lastStatus = $null
    while ($true) {
        $status = Test-ServerStatus
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        
        # Auto-restart Vite if it goes down
        if (-not $status.ViteRunning) {
            Write-ColorOutput Red "[$timestamp] 🚨 Vite server down - Auto-restarting..."
            Set-Location $ProjectDir
            
            # Start Vite in background
            $job = Start-Job -ScriptBlock { 
                Set-Location $using:ProjectDir
                npm run dev 
            }
            
            Start-Sleep 5
            Write-ColorOutput Green "[$timestamp] 🔄 Restart initiated"
        }
        
        if ($status -ne $lastStatus) {
            Write-ColorOutput Green "[$timestamp] 📊 Status updated"
            $lastStatus = $status
        }
        
        Start-Sleep 30
    }
}

# Main script logic
if ($args.Count -eq 0) {
    # Interactive mode
    do {
        Show-Header
        Write-Output "Select an option:"
        Write-Output "1. Start Server"
        Write-Output "2. Restart Server"
        Write-Output "3. Check Status"
        Write-Output "4. Stop Server"
        Write-Output "5. Start Monitor Mode"
        Write-Output "6. Exit"
        Write-Output ""
        
        $choice = Read-Host "Enter your choice (1-6)"
        
        switch ($choice) {
            "1" { Start-WinTradesServer }
            "2" { Stop-WinTradesServer; Start-Sleep 2; Start-WinTradesServer }
            "3" { Show-Header; Test-ServerStatus; Read-Host "Press Enter to continue" }
            "4" { Stop-WinTradesServer; Read-Host "Press Enter to continue" }
            "5" { Start-ServerMonitor }
            "6" { exit }
            default { Write-ColorOutput Red "Invalid choice. Please try again."; Start-Sleep 2 }
        }
    } while ($choice -ne "6")
} else {
    # Command line mode
    if ($Status) { Test-ServerStatus }
    if ($Stop) { Stop-WinTradesServer }
    if ($Restart) { Stop-WinTradesServer; Start-Sleep 2; Start-WinTradesServer }
    if ($Monitor) { Start-ServerMonitor }
    if (-not ($Status -or $Stop -or $Restart -or $Monitor)) { Start-WinTradesServer }
}