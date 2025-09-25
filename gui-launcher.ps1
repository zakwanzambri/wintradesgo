# WinTradesGo GUI Launcher
# Simple Windows Forms GUI for server management

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Configuration
$ProjectDir = "C:\xampp\htdocs\wintradesgo"
$global:serverProcess = $null

# Create the main form
$form = New-Object System.Windows.Forms.Form
$form.Text = "WinTradesGo Server Manager"
$form.Size = New-Object System.Drawing.Size(500, 400)
$form.StartPosition = "CenterScreen"
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false
$form.BackColor = [System.Drawing.Color]::FromArgb(240, 248, 255)

# Title Label
$titleLabel = New-Object System.Windows.Forms.Label
$titleLabel.Text = "WinTradesGo Trading Platform"
$titleLabel.Font = New-Object System.Drawing.Font("Arial", 16, [System.Drawing.FontStyle]::Bold)
$titleLabel.ForeColor = [System.Drawing.Color]::DarkBlue
$titleLabel.Size = New-Object System.Drawing.Size(460, 30)
$titleLabel.Location = New-Object System.Drawing.Point(20, 20)
$titleLabel.TextAlign = "MiddleCenter"
$form.Controls.Add($titleLabel)

# Status Label
$statusLabel = New-Object System.Windows.Forms.Label
$statusLabel.Text = "Status: Checking..."
$statusLabel.Font = New-Object System.Drawing.Font("Arial", 10)
$statusLabel.Size = New-Object System.Drawing.Size(460, 20)
$statusLabel.Location = New-Object System.Drawing.Point(20, 60)
$form.Controls.Add($statusLabel)

# Log TextBox
$logBox = New-Object System.Windows.Forms.TextBox
$logBox.Multiline = $true
$logBox.ScrollBars = "Vertical"
$logBox.ReadOnly = $true
$logBox.Font = New-Object System.Drawing.Font("Consolas", 9)
$logBox.Size = New-Object System.Drawing.Size(460, 180)
$logBox.Location = New-Object System.Drawing.Point(20, 90)
$logBox.BackColor = [System.Drawing.Color]::Black
$logBox.ForeColor = [System.Drawing.Color]::Lime
$form.Controls.Add($logBox)

# Function to add log messages
function Add-Log {
    param($message)
    $timestamp = Get-Date -Format "HH:mm:ss"
    $logMessage = "[$timestamp] $message"
    $logBox.AppendText("$logMessage`r`n")
    $logBox.SelectionStart = $logBox.Text.Length
    $logBox.ScrollToCaret()
    $form.Refresh()
}

# Function to check server status
function Update-Status {
    $viteProcess = Get-Process -Name node -ErrorAction SilentlyContinue
    $vitePort = netstat -ano 2>$null | Select-String ":5173" | Select-Object -First 1
    $apachePort = netstat -ano 2>$null | Select-String ":80" | Select-Object -First 1
    
    $status = ""
    $color = [System.Drawing.Color]::Red
    
    if ($viteProcess -and $vitePort) {
        $status += "✅ Frontend Running "
        $color = [System.Drawing.Color]::Green
    } else {
        $status += "❌ Frontend Stopped "
    }
    
    if ($apachePort) {
        $status += "✅ Backend Running"
        if ($color -ne [System.Drawing.Color]::Green) {
            $color = [System.Drawing.Color]::Orange
        }
    } else {
        $status += "❌ Backend Stopped"
    }
    
    $statusLabel.Text = "Status: $status"
    $statusLabel.ForeColor = $color
}

# Start Server Button
$startButton = New-Object System.Windows.Forms.Button
$startButton.Text = "🚀 Start Server"
$startButton.Font = New-Object System.Drawing.Font("Arial", 10, [System.Drawing.FontStyle]::Bold)
$startButton.Size = New-Object System.Drawing.Size(110, 35)
$startButton.Location = New-Object System.Drawing.Point(20, 290)
$startButton.BackColor = [System.Drawing.Color]::LightGreen
$startButton.Add_Click({
    Add-Log "Starting WinTradesGo server..."
    
    # Kill existing processes
    Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep 1
    
    # Change to project directory and start server
    if (Test-Path $ProjectDir) {
        Set-Location $ProjectDir
        Add-Log "Changed to project directory: $ProjectDir"
        
        # Start server in background
        $global:serverProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory $ProjectDir -WindowStyle Hidden -PassThru
        Add-Log "Vite server starting... (PID: $($global:serverProcess.Id))"
        
        # Wait a moment and check status
        Start-Sleep 3
        Update-Status
        Add-Log "Server should be available at http://localhost:5173"
    } else {
        Add-Log "ERROR: Project directory not found: $ProjectDir"
    }
})
$form.Controls.Add($startButton)

# Stop Server Button
$stopButton = New-Object System.Windows.Forms.Button
$stopButton.Text = "🛑 Stop Server"
$stopButton.Font = New-Object System.Drawing.Font("Arial", 10, [System.Drawing.FontStyle]::Bold)
$stopButton.Size = New-Object System.Drawing.Size(110, 35)
$stopButton.Location = New-Object System.Drawing.Point(140, 290)
$stopButton.BackColor = [System.Drawing.Color]::LightCoral
$stopButton.Add_Click({
    Add-Log "Stopping server..."
    Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    $global:serverProcess = $null
    Add-Log "Server stopped"
    Update-Status
})
$form.Controls.Add($stopButton)

# Restart Server Button
$restartButton = New-Object System.Windows.Forms.Button
$restartButton.Text = "🔄 Restart"
$restartButton.Font = New-Object System.Drawing.Font("Arial", 10, [System.Drawing.FontStyle]::Bold)
$restartButton.Size = New-Object System.Drawing.Size(110, 35)
$restartButton.Location = New-Object System.Drawing.Point(260, 290)
$restartButton.BackColor = [System.Drawing.Color]::LightBlue
$restartButton.Add_Click({
    Add-Log "Restarting server..."
    
    # Stop first
    Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep 2
    Add-Log "Old processes terminated"
    
    # Start again
    if (Test-Path $ProjectDir) {
        Set-Location $ProjectDir
        $global:serverProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory $ProjectDir -WindowStyle Hidden -PassThru
        Add-Log "Server restarted (PID: $($global:serverProcess.Id))"
        Start-Sleep 3
        Update-Status
    }
})
$form.Controls.Add($restartButton)

# Open Dashboard Button
$openButton = New-Object System.Windows.Forms.Button
$openButton.Text = "🌐 Open Dashboard"
$openButton.Font = New-Object System.Drawing.Font("Arial", 10, [System.Drawing.FontStyle]::Bold)
$openButton.Size = New-Object System.Drawing.Size(110, 35)
$openButton.Location = New-Object System.Drawing.Point(380, 290)
$openButton.BackColor = [System.Drawing.Color]::LightYellow
$openButton.Add_Click({
    Add-Log "Opening dashboard in browser..."
    Start-Process "http://localhost:5173"
})
$form.Controls.Add($openButton)

# Status Check Button
$statusButton = New-Object System.Windows.Forms.Button
$statusButton.Text = "📊 Check Status"
$statusButton.Size = New-Object System.Drawing.Size(100, 25)
$statusButton.Location = New-Object System.Drawing.Point(20, 335)
$statusButton.Add_Click({
    Update-Status
    Add-Log "Status updated"
    
    # Test API
    try {
        $response = Invoke-WebRequest -Uri "http://localhost/wintradesgo/model-api.php?action=get_features" -TimeoutSec 5 -ErrorAction Stop
        Add-Log "✅ API test successful"
    } catch {
        Add-Log "❌ API test failed - Check XAMPP"
    }
})
$form.Controls.Add($statusButton)

# XAMPP Button
$xamppButton = New-Object System.Windows.Forms.Button
$xamppButton.Text = "🔧 Open XAMPP"
$xamppButton.Size = New-Object System.Drawing.Size(100, 25)
$xamppButton.Location = New-Object System.Drawing.Point(130, 335)
$xamppButton.Add_Click({
    Add-Log "Opening XAMPP Control Panel..."
    Start-Process "C:\xampp\xampp-control.exe" -ErrorAction SilentlyContinue
})
$form.Controls.Add($xamppButton)

# Clear Log Button
$clearButton = New-Object System.Windows.Forms.Button
$clearButton.Text = "🗑️ Clear Log"
$clearButton.Size = New-Object System.Drawing.Size(100, 25)
$clearButton.Location = New-Object System.Drawing.Point(380, 335)
$clearButton.Add_Click({
    $logBox.Clear()
})
$form.Controls.Add($clearButton)

# Timer for auto status updates
$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 5000 # 5 seconds
$timer.Add_Tick({
    Update-Status
})
$timer.Start()

# Form cleanup on close
$form.Add_FormClosed({
    $timer.Stop()
    if ($global:serverProcess -and !$global:serverProcess.HasExited) {
        Add-Log "Cleaning up server process on exit..."
        Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    }
})

# Initialize
Add-Log "WinTradesGo Server Manager started"
Add-Log "Project directory: $ProjectDir"
Update-Status

# Show the form
$form.ShowDialog() | Out-Null