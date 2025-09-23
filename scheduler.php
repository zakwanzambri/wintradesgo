<?php
/**
 * Model Retraining Scheduler
 * ===========================
 * 
 * PHP scheduler for automated LSTM model retraining pipeline
 * Features:
 * - Scheduled execution based on frequency settings
 * - Status monitoring and logging
 * - Email notifications for failures
 * - Web interface for manual triggers
 */

class ModelRetrainingScheduler {
    private $config;
    private $logFile;
    private $statusFile;
    private $lockFile;
    
    public function __construct($configFile = 'scheduler_config.json') {
        $this->loadConfig($configFile);
        $this->logFile = __DIR__ . '/logs/scheduler.log';
        $this->statusFile = __DIR__ . '/logs/scheduler_status.json';
        $this->lockFile = __DIR__ . '/logs/scheduler.lock';
        
        // Ensure log directory exists
        if (!is_dir(dirname($this->logFile))) {
            mkdir(dirname($this->logFile), 0755, true);
        }
    }
    
    private function loadConfig($configFile) {
        $defaultConfig = [
            'retraining_frequency_hours' => 24,
            'python_executable' => 'python',
            'pipeline_script' => 'model_retraining_pipeline.py',
            'max_execution_time' => 3600, // 1 hour
            'email_notifications' => false,
            'admin_email' => 'admin@example.com',
            'timezone' => 'UTC',
            'auto_start' => true,
            'symbols' => ['BTC-USD', 'ETH-USD', 'AAPL', 'GOOGL']
        ];
        
        if (file_exists($configFile)) {
            $config = json_decode(file_get_contents($configFile), true);
            $this->config = array_merge($defaultConfig, $config);
        } else {
            $this->config = $defaultConfig;
            $this->saveConfig($configFile);
        }
    }
    
    private function saveConfig($configFile) {
        file_put_contents($configFile, json_encode($this->config, JSON_PRETTY_PRINT));
    }
    
    private function log($message, $level = 'INFO') {
        $timestamp = date('Y-m-d H:i:s');
        $logEntry = "[$timestamp] [$level] $message" . PHP_EOL;
        file_put_contents($this->logFile, $logEntry, FILE_APPEND | LOCK_EX);
        
        if ($level === 'DEBUG' || $level === 'INFO') {
            echo $logEntry;
        }
    }
    
    private function updateStatus($status, $data = []) {
        $statusData = [
            'status' => $status,
            'timestamp' => date('c'),
            'data' => $data
        ];
        file_put_contents($this->statusFile, json_encode($statusData, JSON_PRETTY_PRINT));
    }
    
    public function isRunning() {
        if (!file_exists($this->lockFile)) {
            return false;
        }
        
        $lockContent = file_get_contents($this->lockFile);
        $lockData = json_decode($lockContent, true);
        
        if (!$lockData || !isset($lockData['pid'])) {
            return false;
        }
        
        // Check if process is still running (Unix-like systems)
        if (function_exists('posix_kill')) {
            return posix_kill($lockData['pid'], 0);
        }
        
        // For Windows, check if the lock is recent
        $lockTime = strtotime($lockData['timestamp']);
        $maxAge = $this->config['max_execution_time'];
        
        return (time() - $lockTime) < $maxAge;
    }
    
    private function createLock() {
        $lockData = [
            'pid' => getmypid(),
            'timestamp' => date('c'),
            'command' => 'model_retraining'
        ];
        file_put_contents($this->lockFile, json_encode($lockData, JSON_PRETTY_PRINT));
    }
    
    private function removeLock() {
        if (file_exists($this->lockFile)) {
            unlink($this->lockFile);
        }
    }
    
    public function shouldRetrain() {
        // Check if we have a recent status file
        if (!file_exists($this->statusFile)) {
            return true;
        }
        
        $statusContent = file_get_contents($this->statusFile);
        $status = json_decode($statusContent, true);
        
        if (!$status || !isset($status['timestamp'])) {
            return true;
        }
        
        $lastRun = strtotime($status['timestamp']);
        $frequencySeconds = $this->config['retraining_frequency_hours'] * 3600;
        
        return (time() - $lastRun) >= $frequencySeconds;
    }
    
    public function runRetraining($force = false) {
        if (!$force && $this->isRunning()) {
            $this->log("Retraining already in progress", 'WARNING');
            return false;
        }
        
        if (!$force && !$this->shouldRetrain()) {
            $this->log("Retraining not due yet", 'INFO');
            return false;
        }
        
        $this->log("Starting model retraining pipeline", 'INFO');
        $this->createLock();
        $this->updateStatus('running', ['started_at' => date('c')]);
        
        try {
            $startTime = microtime(true);
            
            // Build command
            $pythonExe = $this->config['python_executable'];
            $script = $this->config['pipeline_script'];
            $command = "$pythonExe $script 2>&1";
            
            $this->log("Executing: $command", 'DEBUG');
            
            // Execute pipeline
            $output = [];
            $returnCode = 0;
            exec($command, $output, $returnCode);
            
            $executionTime = microtime(true) - $startTime;
            $outputText = implode("\n", $output);
            
            if ($returnCode === 0) {
                $this->log("Retraining completed successfully in " . round($executionTime, 2) . "s", 'INFO');
                $this->updateStatus('success', [
                    'execution_time' => $executionTime,
                    'return_code' => $returnCode,
                    'output_lines' => count($output)
                ]);
                $success = true;
            } else {
                $this->log("Retraining failed with return code: $returnCode", 'ERROR');
                $this->log("Output: $outputText", 'ERROR');
                $this->updateStatus('failed', [
                    'execution_time' => $executionTime,
                    'return_code' => $returnCode,
                    'error_output' => $outputText
                ]);
                $success = false;
                
                // Send notification on failure
                if ($this->config['email_notifications']) {
                    $this->sendFailureNotification($returnCode, $outputText);
                }
            }
            
        } catch (Exception $e) {
            $this->log("Exception during retraining: " . $e->getMessage(), 'ERROR');
            $this->updateStatus('error', ['exception' => $e->getMessage()]);
            $success = false;
        } finally {
            $this->removeLock();
        }
        
        return $success;
    }
    
    private function sendFailureNotification($returnCode, $output) {
        $subject = "Model Retraining Failed - " . date('Y-m-d H:i:s');
        $message = "Model retraining pipeline failed with return code: $returnCode\n\n";
        $message .= "Output:\n" . $output;
        
        $headers = "From: no-reply@wintradesgo.com\r\n";
        $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
        
        mail($this->config['admin_email'], $subject, $message, $headers);
        $this->log("Failure notification sent to " . $this->config['admin_email'], 'INFO');
    }
    
    public function getStatus() {
        if (!file_exists($this->statusFile)) {
            return null;
        }
        
        return json_decode(file_get_contents($this->statusFile), true);
    }
    
    public function getLastLogs($lines = 50) {
        if (!file_exists($this->logFile)) {
            return [];
        }
        
        $logLines = file($this->logFile, FILE_IGNORE_NEW_LINES);
        return array_slice($logLines, -$lines);
    }
    
    public function cleanupOldLogs($daysToKeep = 30) {
        $logDir = dirname($this->logFile);
        $cutoffTime = time() - ($daysToKeep * 24 * 3600);
        
        $files = glob($logDir . '/*.log');
        foreach ($files as $file) {
            if (filemtime($file) < $cutoffTime) {
                unlink($file);
                $this->log("Removed old log file: " . basename($file), 'INFO');
            }
        }
    }
    
    public function generateReport() {
        $status = $this->getStatus();
        $logs = $this->getLastLogs(20);
        $isRunning = $this->isRunning();
        
        $report = [
            'scheduler_status' => $isRunning ? 'running' : 'idle',
            'last_execution' => $status,
            'next_scheduled' => null,
            'recent_logs' => $logs,
            'configuration' => $this->config
        ];
        
        if ($status && isset($status['timestamp'])) {
            $lastRun = strtotime($status['timestamp']);
            $nextRun = $lastRun + ($this->config['retraining_frequency_hours'] * 3600);
            $report['next_scheduled'] = date('c', $nextRun);
        }
        
        return $report;
    }
}

// Web interface for manual control
if (isset($_REQUEST['action'])) {
    header('Content-Type: application/json');
    
    $scheduler = new ModelRetrainingScheduler();
    $response = ['success' => false, 'message' => ''];
    
    switch ($_REQUEST['action']) {
        case 'status':
            $response = [
                'success' => true,
                'data' => $scheduler->generateReport()
            ];
            break;
            
        case 'trigger':
            $force = isset($_REQUEST['force']) && $_REQUEST['force'] === 'true';
            $success = $scheduler->runRetraining($force);
            $response = [
                'success' => $success,
                'message' => $success ? 'Retraining started' : 'Retraining failed to start'
            ];
            break;
            
        case 'logs':
            $lines = isset($_REQUEST['lines']) ? (int)$_REQUEST['lines'] : 50;
            $response = [
                'success' => true,
                'data' => $scheduler->getLastLogs($lines)
            ];
            break;
            
        default:
            $response['message'] = 'Unknown action';
    }
    
    echo json_encode($response, JSON_PRETTY_PRINT);
    exit;
}

// CLI interface
if (php_sapi_name() === 'cli') {
    echo "🔄 Model Retraining Scheduler\n";
    echo "============================\n\n";
    
    $scheduler = new ModelRetrainingScheduler();
    
    if (isset($argv[1])) {
        switch ($argv[1]) {
            case 'run':
                $force = isset($argv[2]) && $argv[2] === '--force';
                $success = $scheduler->runRetraining($force);
                exit($success ? 0 : 1);
                
            case 'status':
                $report = $scheduler->generateReport();
                echo "📊 Status Report:\n";
                echo "   Scheduler: " . $report['scheduler_status'] . "\n";
                echo "   Last execution: " . ($report['last_execution']['timestamp'] ?? 'Never') . "\n";
                echo "   Next scheduled: " . ($report['next_scheduled'] ?? 'Unknown') . "\n";
                break;
                
            case 'logs':
                $lines = isset($argv[2]) ? (int)$argv[2] : 20;
                $logs = $scheduler->getLastLogs($lines);
                echo "📝 Recent Logs ($lines lines):\n";
                foreach ($logs as $log) {
                    echo "   $log\n";
                }
                break;
                
            default:
                echo "Usage: php " . basename(__FILE__) . " [run|status|logs] [options]\n";
                echo "  run [--force]  : Run retraining pipeline\n";
                echo "  status         : Show scheduler status\n";
                echo "  logs [lines]   : Show recent log lines\n";
        }
    } else {
        // Auto-run mode
        $scheduler->runRetraining();
    }
} else {
    // Web interface
    ?>
    <!DOCTYPE html>
    <html>
    <head>
        <title>Model Retraining Scheduler</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .container { max-width: 1200px; margin: 0 auto; }
            .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
            .success { background-color: #d4edda; color: #155724; }
            .warning { background-color: #fff3cd; color: #856404; }
            .error { background-color: #f8d7da; color: #721c24; }
            .info { background-color: #d1ecf1; color: #0c5460; }
            button { padding: 10px 15px; margin: 5px; border: none; border-radius: 3px; cursor: pointer; }
            .btn-primary { background-color: #007bff; color: white; }
            .btn-danger { background-color: #dc3545; color: white; }
            .logs { background-color: #f8f9fa; padding: 15px; border-radius: 5px; font-family: monospace; white-space: pre-wrap; max-height: 400px; overflow-y: auto; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🔄 Model Retraining Scheduler</h1>
            
            <div id="status-display">Loading...</div>
            
            <div>
                <button class="btn-primary" onclick="triggerRetraining(false)">Run Retraining</button>
                <button class="btn-danger" onclick="triggerRetraining(true)">Force Run</button>
                <button class="btn-primary" onclick="refreshStatus()">Refresh Status</button>
                <button class="btn-primary" onclick="showLogs()">Show Logs</button>
            </div>
            
            <div id="logs-display"></div>
        </div>
        
        <script>
            function refreshStatus() {
                fetch('?action=status')
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            displayStatus(data.data);
                        }
                    });
            }
            
            function displayStatus(report) {
                const statusHtml = `
                    <div class="status info">
                        <h3>📊 Current Status</h3>
                        <p><strong>Scheduler:</strong> ${report.scheduler_status}</p>
                        <p><strong>Last Execution:</strong> ${report.last_execution ? report.last_execution.timestamp : 'Never'}</p>
                        <p><strong>Last Status:</strong> ${report.last_execution ? report.last_execution.status : 'Unknown'}</p>
                        <p><strong>Next Scheduled:</strong> ${report.next_scheduled || 'Unknown'}</p>
                        <p><strong>Frequency:</strong> Every ${report.configuration.retraining_frequency_hours} hours</p>
                        <p><strong>Symbols:</strong> ${report.configuration.symbols.join(', ')}</p>
                    </div>
                `;
                document.getElementById('status-display').innerHTML = statusHtml;
            }
            
            function triggerRetraining(force) {
                const url = force ? '?action=trigger&force=true' : '?action=trigger';
                fetch(url)
                    .then(response => response.json())
                    .then(data => {
                        const className = data.success ? 'success' : 'error';
                        const message = `<div class="status ${className}">${data.message}</div>`;
                        document.getElementById('status-display').innerHTML = message + document.getElementById('status-display').innerHTML;
                        
                        if (data.success) {
                            setTimeout(refreshStatus, 2000);
                        }
                    });
            }
            
            function showLogs() {
                fetch('?action=logs&lines=50')
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            const logsHtml = `
                                <h3>📝 Recent Logs</h3>
                                <div class="logs">${data.data.join('\n')}</div>
                            `;
                            document.getElementById('logs-display').innerHTML = logsHtml;
                        }
                    });
            }
            
            // Auto-refresh status every 30 seconds
            setInterval(refreshStatus, 30000);
            refreshStatus();
        </script>
    </body>
    </html>
    <?php
}
?>