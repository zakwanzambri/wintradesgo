<?php
/**
 * Real-time AI Scheduler
 * Automated system to generate AI signals at regular intervals
 */

require_once __DIR__ . '/AISignalGenerator.php';
require_once __DIR__ . '/SmartAlertSystem.php';

class AIScheduler {
    
    private $aiGenerator;
    private $alertSystem;
    private $logFile;
    private $isRunning = false;
    
    public function __construct() {
        $this->aiGenerator = new AISignalGenerator();
        $this->alertSystem = new SmartAlertSystem($this->aiGenerator->getDatabase());
        $this->logFile = __DIR__ . '/logs/ai_scheduler.log';
        
        // Create logs directory if it doesn't exist
        if (!file_exists(dirname($this->logFile))) {
            mkdir(dirname($this->logFile), 0755, true);
        }
    }
    
    /**
     * Start the real-time AI signal generation scheduler
     * @param int $intervalMinutes Interval between signal generations (default 5 minutes)
     */
    public function start($intervalMinutes = 5) {
        $this->isRunning = true;
        $this->log("🚀 AI Scheduler started with {$intervalMinutes} minute intervals");
        
        // Handle graceful shutdown
        pcntl_signal(SIGTERM, [$this, 'shutdown']);
        pcntl_signal(SIGINT, [$this, 'shutdown']);
        
        while ($this->isRunning) {
            try {
                $startTime = microtime(true);
                
                $this->log("🤖 Generating AI signals...");
                $signals = $this->aiGenerator->generateAllSignals();
                
                $endTime = microtime(true);
                $executionTime = round($endTime - $startTime, 2);
                
                $this->log("✅ Generated " . count($signals) . " signals in {$executionTime}s");
                
                // Check for high-confidence signals and send alerts
                $alertResults = $this->alertSystem->checkAndSendAlerts();
                if ($alertResults['success'] && $alertResults['alerts_sent'] > 0) {
                    $this->log("🚨 Sent {$alertResults['alerts_sent']} high-confidence alerts");
                }
                
                // Log signal details
                foreach ($signals as $signal) {
                    $this->log(sprintf(
                        "  %s: %s (%.1f%%) - %s",
                        $signal['symbol'],
                        $signal['signal_type'],
                        $signal['confidence'],
                        substr($signal['reason'], 0, 50)
                    ));
                }
                
                // Check for process control signals
                pcntl_signal_dispatch();
                
                // Wait for next interval
                if ($this->isRunning) {
                    $this->log("⏰ Next run in {$intervalMinutes} minutes");
                    sleep($intervalMinutes * 60);
                }
                
            } catch (Exception $e) {
                $this->log("❌ Error in AI generation: " . $e->getMessage());
                
                // Wait a bit before retrying on error
                sleep(30);
            }
        }
        
        $this->log("🛑 AI Scheduler stopped");
    }
    
    /**
     * Stop the scheduler gracefully
     */
    public function shutdown() {
        $this->log("📤 Shutdown signal received");
        $this->isRunning = false;
    }
    
    /**
     * Run a single AI generation cycle (for testing or manual execution)
     * @return array Generated signals
     */
    public function runOnce() {
        $this->log("🎯 Running single AI generation cycle");
        
        try {
            $startTime = microtime(true);
            $signals = $this->aiGenerator->generateAllSignals();
            $endTime = microtime(true);
            
            $executionTime = round($endTime - $startTime, 2);
            $this->log("✅ Single cycle complete: " . count($signals) . " signals in {$executionTime}s");
            
            return $signals;
            
        } catch (Exception $e) {
            $this->log("❌ Error in single cycle: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Log message with timestamp
     * @param string $message Log message
     */
    private function log($message) {
        $timestamp = date('Y-m-d H:i:s');
        $logEntry = "[{$timestamp}] {$message}\n";
        
        // Write to log file
        file_put_contents($this->logFile, $logEntry, FILE_APPEND | LOCK_EX);
        
        // Also output to console if running in CLI
        if (php_sapi_name() === 'cli') {
            echo $logEntry;
        }
    }
    
    /**
     * Get scheduler status and recent logs
     * @param int $lines Number of recent log lines to return
     * @return array Scheduler status and logs
     */
    public function getStatus($lines = 20) {
        $status = [
            'is_running' => $this->isRunning,
            'log_file' => $this->logFile,
            'log_size' => file_exists($this->logFile) ? filesize($this->logFile) : 0,
            'recent_logs' => []
        ];
        
        if (file_exists($this->logFile)) {
            $logContent = file_get_contents($this->logFile);
            $logLines = explode("\n", $logContent);
            $status['recent_logs'] = array_slice(array_filter($logLines), -$lines);
        }
        
        return $status;
    }
    
    /**
     * Clean old log entries (keep last 7 days)
     */
    public function cleanLogs() {
        if (!file_exists($this->logFile)) {
            return;
        }
        
        $logContent = file_get_contents($this->logFile);
        $logLines = explode("\n", $logContent);
        $cutoffDate = date('Y-m-d', strtotime('-7 days'));
        
        $filteredLines = [];
        foreach ($logLines as $line) {
            if (preg_match('/^\[(\d{4}-\d{2}-\d{2})/', $line, $matches)) {
                if ($matches[1] >= $cutoffDate) {
                    $filteredLines[] = $line;
                }
            }
        }
        
        file_put_contents($this->logFile, implode("\n", $filteredLines));
        $this->log("🧹 Log cleanup complete - kept logs from {$cutoffDate} onwards");
    }
}

// Command line execution
if (php_sapi_name() === 'cli') {
    $scheduler = new AIScheduler();
    
    // Check command line arguments
    $command = $argv[1] ?? 'run-once';
    $interval = isset($argv[2]) ? (int)$argv[2] : 5;
    
    switch ($command) {
        case 'start':
            echo "🚀 Starting AI Scheduler with {$interval} minute intervals...\n";
            echo "Press Ctrl+C to stop\n\n";
            $scheduler->start($interval);
            break;
            
        case 'run-once':
            echo "🎯 Running single AI generation cycle...\n";
            $signals = $scheduler->runOnce();
            
            if (!empty($signals)) {
                echo "\n📊 Generated Signals:\n";
                foreach ($signals as $signal) {
                    echo sprintf(
                        "  %s: %s (%.1f%% confidence) - $%.4f\n",
                        $signal['symbol'],
                        $signal['signal_type'],
                        $signal['confidence'],
                        $signal['current_price']
                    );
                }
            }
            break;
            
        case 'status':
            $status = $scheduler->getStatus();
            echo "📈 AI Scheduler Status:\n";
            echo "  Running: " . ($status['is_running'] ? 'Yes' : 'No') . "\n";
            echo "  Log file: {$status['log_file']}\n";
            echo "  Log size: " . number_format($status['log_size']) . " bytes\n";
            echo "\n📝 Recent logs:\n";
            foreach (array_slice($status['recent_logs'], -10) as $log) {
                echo "  {$log}\n";
            }
            break;
            
        case 'clean-logs':
            $scheduler->cleanLogs();
            echo "✅ Log cleanup complete\n";
            break;
            
        default:
            echo "🤖 WinTrades AI Scheduler\n\n";
            echo "Usage: php AIScheduler.php [command] [interval]\n\n";
            echo "Commands:\n";
            echo "  start [interval]  - Start continuous AI signal generation (default: 5 min)\n";
            echo "  run-once          - Generate signals once and exit\n";
            echo "  status            - Show scheduler status and recent logs\n";
            echo "  clean-logs        - Clean old log entries\n\n";
            echo "Examples:\n";
            echo "  php AIScheduler.php start 3     # Start with 3-minute intervals\n";
            echo "  php AIScheduler.php run-once    # Generate signals once\n";
            break;
    }
}
?>