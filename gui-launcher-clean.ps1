# WinTradesGo GUI Launcher (Clean Version - No Emojis)
# Visual interface for managing the WinTradesGo ML trading platform

param(
    [switch]$Admin
)

# Check if running as administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Add Windows Forms assembly
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Set working directory to script location
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Main form
$form = New-Object System.Windows.Forms.Form
$form.Text = "WinTradesGo Server Manager"
$form.Size = New-Object System.Drawing.Size(600, 500)
$form.StartPosition = "CenterScreen"
$form.MaximizeBox = $false
$form.MinimizeBox = $true
$form.FormBorderStyle = "FixedSingle"

# Title label
$titleLabel = New-Object System.Windows.Forms.Label
$titleLabel.Text = "WinTradesGo ML Trading Platform"
$titleLabel.Size = New-Object System.Drawing.Size(560, 30)
$titleLabel.Location = New-Object System.Drawing.Point(20, 20)
$titleLabel.Font = New-Object System.Drawing.Font("Arial", 14, [System.Drawing.FontStyle]::Bold)
$titleLabel.TextAlign = "MiddleCenter"
$titleLabel.BackColor = [System.Drawing.Color]::LightGray
$form.Controls.Add($titleLabel)

# Status label
$statusLabel = New-Object System.Windows.Forms.Label
$statusLabel.Text = "Status: Checking..."
$statusLabel.Size = New-Object System.Drawing.Size(560, 25)
$statusLabel.Location = New-Object System.Drawing.Point(20, 60)
$statusLabel.Font = New-Object System.Drawing.Font("Arial", 10)
$statusLabel.BackColor = [System.Drawing.Color]::White
$statusLabel.BorderStyle = "FixedSingle"
$form.Controls.Add($statusLabel)

# Create button panel
$buttonPanel = New-Object System.Windows.Forms.Panel
$buttonPanel.Size = New-Object System.Drawing.Size(560, 100)
$buttonPanel.Location = New-Object System.Drawing.Point(20, 100)
$buttonPanel.BorderStyle = "FixedSingle"
$form.Controls.Add($buttonPanel)

# Start Server Button
$startButton = New-Object System.Windows.Forms.Button
$startButton.Text = "Start Server"
$startButton.Size = New-Object System.Drawing.Size(120, 35)
$startButton.Location = New-Object System.Drawing.Point(10, 10)
$startButton.BackColor = [System.Drawing.Color]::LightGreen
$startButton.Font = New-Object System.Drawing.Font("Arial", 9, [System.Drawing.FontStyle]::Bold)
$startButton.Add_Click({
    Add-Log "Starting WinTradesGo server..."
    $statusLabel.Text = "Status: Starting server..."
    $statusLabel.BackColor = [System.Drawing.Color]::Yellow
    $form.Refresh()
    
    try {
        # Kill any existing Node processes first
        Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
        Start-Sleep 2
        
        # Start the server
        Start-Process -FilePath "cmd.exe" -ArgumentList "/c start-server.bat" -WorkingDirectory $scriptPath -WindowStyle Hidden
        Start-Sleep 3
        Update-Status
        Add-Log "Server startup initiated"
    } catch {
        Add-Log "ERROR: Failed to start server - $($_.Exception.Message)"
        $statusLabel.Text = "Status: Failed to start"
        $statusLabel.BackColor = [System.Drawing.Color]::LightCoral
    }
})
$buttonPanel.Controls.Add($startButton)

# Stop Server Button
$stopButton = New-Object System.Windows.Forms.Button
$stopButton.Text = "Stop Server"
$stopButton.Size = New-Object System.Drawing.Size(120, 35)
$stopButton.Location = New-Object System.Drawing.Point(140, 10)
$stopButton.BackColor = [System.Drawing.Color]::LightCoral
$stopButton.Font = New-Object System.Drawing.Font("Arial", 9, [System.Drawing.FontStyle]::Bold)
$stopButton.Add_Click({
    Add-Log "Stopping server..."
    $statusLabel.Text = "Status: Stopping server..."
    $statusLabel.BackColor = [System.Drawing.Color]::Orange
    $form.Refresh()
    
    try {
        Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
        Start-Sleep 2
        Update-Status
        Add-Log "Server stopped"
    } catch {
        Add-Log "ERROR: Failed to stop server - $($_.Exception.Message)"
    }
})
$buttonPanel.Controls.Add($stopButton)

# Restart Server Button
$restartButton = New-Object System.Windows.Forms.Button
$restartButton.Text = "Restart Server"
$restartButton.Size = New-Object System.Drawing.Size(120, 35)
$restartButton.Location = New-Object System.Drawing.Point(270, 10)
$restartButton.BackColor = [System.Drawing.Color]::Orange
$restartButton.Font = New-Object System.Drawing.Font("Arial", 9, [System.Drawing.FontStyle]::Bold)
$restartButton.Add_Click({
    Add-Log "Restarting server..."
    $statusLabel.Text = "Status: Restarting server..."
    $statusLabel.BackColor = [System.Drawing.Color]::Yellow
    $form.Refresh()
    
    try {
        # Stop server
        Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
        Start-Sleep 3
        
        # Start server  
        Start-Process -FilePath "cmd.exe" -ArgumentList "/c start-server.bat" -WorkingDirectory $scriptPath -WindowStyle Hidden
        Start-Sleep 3
        Update-Status
        Add-Log "Server restarted"
    } catch {
        Add-Log "ERROR: Failed to restart server - $($_.Exception.Message)"
    }
})
$buttonPanel.Controls.Add($restartButton)

# Emergency Recovery Button
$recoveryButton = New-Object System.Windows.Forms.Button
$recoveryButton.Text = "Emergency Recovery"
$recoveryButton.Size = New-Object System.Drawing.Size(120, 35)
$recoveryButton.Location = New-Object System.Drawing.Point(400, 10)
$recoveryButton.BackColor = [System.Drawing.Color]::Gold
$recoveryButton.Font = New-Object System.Drawing.Font("Arial", 9, [System.Drawing.FontStyle]::Bold)
$recoveryButton.Add_Click({
    Add-Log "Running emergency recovery..."
    $statusLabel.Text = "Status: Emergency recovery..."
    $statusLabel.BackColor = [System.Drawing.Color]::Red
    $form.Refresh()
    
    try {
        Start-Process -FilePath "cmd.exe" -ArgumentList "/c crash-recovery.bat" -WorkingDirectory $scriptPath -Wait
        Start-Sleep 2
        Update-Status
        Add-Log "Emergency recovery completed"
    } catch {
        Add-Log "ERROR: Recovery failed - $($_.Exception.Message)"
    }
})
$buttonPanel.Controls.Add($recoveryButton)

# Quick Actions Panel
$quickPanel = New-Object System.Windows.Forms.Panel
$quickPanel.Size = New-Object System.Drawing.Size(560, 50)
$quickPanel.Location = New-Object System.Drawing.Point(20, 210)
$quickPanel.BorderStyle = "FixedSingle"
$form.Controls.Add($quickPanel)

# Check Status Button
$statusButton = New-Object System.Windows.Forms.Button
$statusButton.Text = "Check Status"
$statusButton.Size = New-Object System.Drawing.Size(100, 30)
$statusButton.Location = New-Object System.Drawing.Point(10, 10)
$statusButton.BackColor = [System.Drawing.Color]::LightBlue
$statusButton.Add_Click({
    Update-Status
    Add-Log "Status updated"
})
$quickPanel.Controls.Add($statusButton)

# Open Dashboard Button
$openButton = New-Object System.Windows.Forms.Button
$openButton.Text = "Open Dashboard"
$openButton.Size = New-Object System.Drawing.Size(120, 30)
$openButton.Location = New-Object System.Drawing.Point(120, 10)
$openButton.BackColor = [System.Drawing.Color]::LightSkyBlue
$openButton.Add_Click({
    Add-Log "Opening dashboard..."
    try {
        Start-Process "http://localhost:5173"
        Add-Log "Dashboard opened in browser"
    } catch {
        Add-Log "ERROR: Could not open dashboard - $($_.Exception.Message)"
    }
})
$quickPanel.Controls.Add($openButton)

# Test API Button
$testButton = New-Object System.Windows.Forms.Button
$testButton.Text = "Test API"
$testButton.Size = New-Object System.Drawing.Size(80, 30)
$testButton.Location = New-Object System.Drawing.Point(250, 10)
$testButton.BackColor = [System.Drawing.Color]::LightYellow
$testButton.Add_Click({
    Add-Log "Testing API connection..."
    try {
        $response = Invoke-WebRequest -Uri "http://localhost/wintradesgo/model-api.php?action=get_features" -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Add-Log "API test successful"
            [System.Windows.Forms.MessageBox]::Show("API is working correctly!", "Success", "OK", "Information")
        }
    } catch {
        Add-Log "API test failed: $($_.Exception.Message)"
        [System.Windows.Forms.MessageBox]::Show("API test failed. Check if XAMPP Apache is running.", "Error", "OK", "Error")
    }
})
$quickPanel.Controls.Add($testButton)

# Auto Refresh Toggle
$autoRefreshCheckBox = New-Object System.Windows.Forms.CheckBox
$autoRefreshCheckBox.Text = "Auto-refresh"
$autoRefreshCheckBox.Size = New-Object System.Drawing.Size(100, 30)
$autoRefreshCheckBox.Location = New-Object System.Drawing.Point(340, 10)
$autoRefreshCheckBox.Checked = $true
$quickPanel.Controls.Add($autoRefreshCheckBox)

# Activity Log
$logLabel = New-Object System.Windows.Forms.Label
$logLabel.Text = "Activity Log:"
$logLabel.Size = New-Object System.Drawing.Size(100, 20)
$logLabel.Location = New-Object System.Drawing.Point(20, 270)
$logLabel.Font = New-Object System.Drawing.Font("Arial", 9, [System.Drawing.FontStyle]::Bold)
$form.Controls.Add($logLabel)

$logTextBox = New-Object System.Windows.Forms.TextBox
$logTextBox.Multiline = $true
$logTextBox.ScrollBars = "Vertical"
$logTextBox.ReadOnly = $true
$logTextBox.Size = New-Object System.Drawing.Size(560, 120)
$logTextBox.Location = New-Object System.Drawing.Point(20, 295)
$logTextBox.Font = New-Object System.Drawing.Font("Consolas", 8)
$logTextBox.BackColor = [System.Drawing.Color]::Black
$logTextBox.ForeColor = [System.Drawing.Color]::Lime
$form.Controls.Add($logTextBox)

# Exit Button
$exitButton = New-Object System.Windows.Forms.Button
$exitButton.Text = "Exit"
$exitButton.Size = New-Object System.Drawing.Size(80, 30)
$exitButton.Location = New-Object System.Drawing.Point(500, 425)
$exitButton.BackColor = [System.Drawing.Color]::LightGray
$exitButton.Add_Click({
    $form.Close()
})
$form.Controls.Add($exitButton)

# Functions
function Add-Log($message) {
    $timestamp = Get-Date -Format "HH:mm:ss"
    $logEntry = "[$timestamp] $message"
    $logTextBox.AppendText("$logEntry`r`n")
    $logTextBox.SelectionStart = $logTextBox.Text.Length
    $logTextBox.ScrollToCaret()
}

function Update-Status() {
    try {
        # Check if Vite server is running
        $viteProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*node*" }
        
        if ($viteProcess) {
            $statusLabel.Text = "Status: Server is running (Vite Dev Server)"
            $statusLabel.BackColor = [System.Drawing.Color]::LightGreen
        } else {
            $statusLabel.Text = "Status: Server is not running"
            $statusLabel.BackColor = [System.Drawing.Color]::LightCoral
        }
        
        # Test connection
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 3 -ErrorAction Stop
            $statusLabel.Text += " - Connected"
        } catch {
            $statusLabel.Text += " - Connection failed"
        }
        
    } catch {
        $statusLabel.Text = "Status: Error checking server"
        $statusLabel.BackColor = [System.Drawing.Color]::Yellow
    }
}

# Timer for auto-refresh
$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 5000  # 5 seconds
$timer.Add_Tick({
    if ($autoRefreshCheckBox.Checked) {
        Update-Status
    }
})
$timer.Start()

# Form closing event
$form.Add_FormClosed({
    $timer.Stop()
})

# Initialize
Add-Log "WinTradesGo GUI Manager started"
Add-Log "Project directory: $scriptPath"
if (Test-Administrator) {
    Add-Log "Running with administrator privileges"
} else {
    Add-Log "Running with standard user privileges"
}

# Initial status check
Update-Status

# Show the form
$form.ShowDialog()