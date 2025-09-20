<?php
/**
 * Enhanced AI Scheduler with Machine Learning Integration
 * Automated system using LSTM Neural Networks, Pattern Recognition, and Ensemble Analysis
 * Generates ML-powered trading signals every 3 minutes
 */

require_once __DIR__ . '/EnhancedAISignalGenerator.php';
require_once __DIR__ . '/SmartAlertSystem.php';

class EnhancedAIScheduler {
    
    private $enhancedAI;
    private $alertSystem;
    private $pdo;
    private $logFile;
    private $isRunning = false;
    
    // Enhanced symbols list for ML monitoring
    private $symbols = ['BTC', 'ETH', 'ADA', 'DOT', 'LINK', 'SOL', 'AVAX', 'MATIC', 'ATOM', 'XRP'];
    
    public function __construct() {
        $this->enhancedAI = new EnhancedAISignalGenerator();
        
        // Database connection for alert system
        $this->pdo = new PDO(
            "mysql:host=localhost;dbname=wintradesgo",
            "root",
            "",
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
        
        $this->alertSystem = new SmartAlertSystem($this->pdo);
        $this->logFile = __DIR__ . '/logs/enhanced_ai_scheduler.log';
        
        // Create logs directory if it doesn't exist
        if (!file_exists(dirname($this->logFile))) {
            mkdir(dirname($this->logFile), 0755, true);
        }
    }
    
    /**
     * Start the Enhanced AI ML-powered scheduler
     */
    public function start($intervalMinutes = 3) {
        $this->isRunning = true;
        $this->log("🚀 Enhanced AI ML Scheduler started with {$intervalMinutes} minute intervals");
        $this->log("🧠 ML Models: LSTM Neural Network, Pattern Recognition, Ensemble Analysis");
        
        // Handle graceful shutdown (skip on Windows where PCNTL isn't available)
        if (function_exists('pcntl_signal')) {
            pcntl_signal(SIGTERM, [$this, 'shutdown']);
            pcntl_signal(SIGINT, [$this, 'shutdown']);
        }
        
        while ($this->isRunning) {
            try {
                $startTime = microtime(true);
                
                $this->log("🤖 Generating Enhanced ML Signals...");
                $mlSignals = $this->generateEnhancedMLSignals();
                
                $endTime = microtime(true);
                $executionTime = round($endTime - $startTime, 2);
                
                $this->log("✅ Generated " . count($mlSignals) . " ML signals in {$executionTime}s");
                
                // Process high-confidence ML signals for alerts
                $highConfidenceCount = $this->processMLAlerts($mlSignals);
                if ($highConfidenceCount > 0) {
                    $this->log("🚨 Sent {$highConfidenceCount} high-confidence ML alerts");
                }
                
                // Log detailed ML signal information
                $this->logMLSignalDetails($mlSignals);
                
                // Update ML performance metrics
                $this->updateMLMetrics($mlSignals, $executionTime);
                
                // Check for process control signals (if available)
                if (function_exists('pcntl_signal_dispatch')) {
                    pcntl_signal_dispatch();
                }
                
                // Wait for next interval
                if ($this->isRunning) {
                    $this->log("⏰ Next ML analysis in {$intervalMinutes} minutes");
                    sleep($intervalMinutes * 60);
                }
                
            } catch (Exception $e) {
                $this->log("❌ Error in Enhanced ML generation: " . $e->getMessage());
                sleep(30); // Wait before retrying on error
            }
        }
        
        $this->log("🛑 Enhanced AI ML Scheduler stopped");
    }
    
    /**
     * Generate enhanced ML signals for all monitored symbols
     */
    private function generateEnhancedMLSignals() {
        $mlSignals = [];
        $successCount = 0;
        $errorCount = 0;
        
        foreach ($this->symbols as $symbol) {
            try {
                $signal = $this->enhancedAI->generateEnhancedSignal($symbol);
                
                if (!isset($signal['error'])) {
                    $mlSignals[] = $signal;
                    $successCount++;
                } else {
                    $this->log("⚠️ Error generating ML signal for {$symbol}: " . $signal['message']);
                    $errorCount++;
                }
                
                // Small delay between symbols to prevent API rate limiting
                usleep(100000); // 0.1 second
                
            } catch (Exception $e) {
                $this->log("❌ Exception for {$symbol}: " . $e->getMessage());
                $errorCount++;
            }
        }
        
        $this->log("📊 ML Generation Summary: {$successCount} success, {$errorCount} errors");
        return $mlSignals;
    }
    
    /**
     * Process ML signals for high-confidence alerts
     */
    private function processMLAlerts($mlSignals) {
        $alertCount = 0;
        
        foreach ($mlSignals as $signal) {
            // Send alerts for high-confidence ML signals (>85%)
            if ($signal['confidence'] > 85) {
                try {
                    $alertData = [
                        'symbol' => $signal['symbol'],
                        'signal_type' => $signal['signal_type'],
                        'confidence' => $signal['confidence'],
                        'ai_model' => $signal['ai_model'],
                        'target_price' => $signal['target_prices']['target_1'],
                        'stop_loss' => $signal['stop_loss']['price'],
                        'risk_level' => $signal['risk_assessment']['risk_level'],
                        'ml_analysis' => $this->formatMLAnalysisForAlert($signal['ml_analyses'])
                    ];
                    
                    $alertResult = $this->alertSystem->sendEnhancedMLAlert($alertData);
                    if ($alertResult) {
                        $alertCount++;
                    }
                    
                } catch (Exception $e) {
                    $this->log("❌ Error sending ML alert for {$signal['symbol']}: " . $e->getMessage());
                }
            }
        }
        
        return $alertCount;
    }
    
    /**
     * Log detailed ML signal information
     */
    private function logMLSignalDetails($mlSignals) {
        foreach ($mlSignals as $signal) {
            $this->log(sprintf(
                "  🎯 %s: %s (%.1f%%) | Target: $%.2f | Risk: %s | Models: LSTM+Patterns+Technical+Sentiment",
                $signal['symbol'],
                $signal['signal_type'],
                $signal['confidence'],
                $signal['target_prices']['target_1'],
                $signal['risk_assessment']['risk_level']
            ));
            
            // Log individual model contributions
            $lstm = $signal['ml_analyses']['lstm_neural_network'];
            $patterns = $signal['ml_analyses']['pattern_recognition'];
            $technical = $signal['ml_analyses']['technical_indicators'];
            $sentiment = $signal['ml_analyses']['sentiment_analysis'];
            
            $this->log(sprintf(
                "    📈 LSTM: %s (%.1f%%) | Patterns: %s (%.1f%%) | Technical: %s (%.1f%%) | Sentiment: %s (%.1f%%)",
                $lstm['signal'], $lstm['confidence'],
                $patterns['signal'], $patterns['confidence'],
                $technical['signal'], $technical['confidence'],
                $sentiment['signal'], $sentiment['confidence']
            ));
        }
    }
    
    /**
     * Update ML performance metrics in database
     */
    private function updateMLMetrics($mlSignals, $executionTime) {
        try {
            // Calculate metrics
            $totalSignals = count($mlSignals);
            $avgConfidence = $totalSignals > 0 ? array_sum(array_column($mlSignals, 'confidence')) / $totalSignals : 0;
            $highConfidenceSignals = count(array_filter($mlSignals, function($s) { return $s['confidence'] > 85; }));
            
            // Store metrics
            $stmt = $this->pdo->prepare("
                INSERT INTO ml_performance_metrics (
                    timestamp, total_signals, avg_confidence, high_confidence_signals, 
                    execution_time, lstm_active, patterns_active, ensemble_active
                ) VALUES (?, ?, ?, ?, ?, 1, 1, 1)
            ");
            
            $stmt->execute([
                date('Y-m-d H:i:s'),
                $totalSignals,
                round($avgConfidence, 2),
                $highConfidenceSignals,
                $executionTime
            ]);
            
        } catch (Exception $e) {
            $this->log("⚠️ Could not update ML metrics: " . $e->getMessage());
        }
    }
    
    /**
     * Format ML analysis for alert messages
     */
    private function formatMLAnalysisForAlert($mlAnalyses) {
        $lstm = $mlAnalyses['lstm_neural_network'];
        $patterns = $mlAnalyses['pattern_recognition'];
        
        return sprintf(
            "LSTM predicts %s trend. %d chart patterns detected. Ensemble confidence optimized.",
            $lstm['trend_analysis']['trend_direction'],
            $patterns['pattern_count']
        );
    }
    
    /**
     * Run a single Enhanced ML generation cycle
     */
    public function runOnce() {
        $this->log("🎯 Running single Enhanced ML generation cycle");
        
        try {
            $startTime = microtime(true);
            $mlSignals = $this->generateEnhancedMLSignals();
            $endTime = microtime(true);
            
            $executionTime = round($endTime - $startTime, 2);
            $this->log("✅ Single ML cycle complete: " . count($mlSignals) . " signals in {$executionTime}s");
            
            return $mlSignals;
            
        } catch (Exception $e) {
            $this->log("❌ Error in single ML cycle: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Stop the Enhanced ML scheduler gracefully
     */
    public function shutdown() {
        $this->log("📤 Enhanced ML Scheduler shutdown signal received");
        $this->isRunning = false;
    }
    
    /**
     * Get Enhanced ML scheduler status
     */
    public function getStatus() {
        return [
            'running' => $this->isRunning,
            'ml_models' => [
                'lstm_neural_network' => 'ACTIVE',
                'pattern_recognition' => 'ACTIVE',
                'ensemble_analysis' => 'ACTIVE'
            ],
            'symbols_monitored' => count($this->symbols),
            'symbols' => $this->symbols,
            'last_log_entry' => $this->getLastLogEntry()
        ];
    }
    
    /**
     * Get recent ML performance stats
     */
    public function getMLPerformanceStats() {
        try {
            $stmt = $this->pdo->prepare("
                SELECT 
                    AVG(avg_confidence) as overall_avg_confidence,
                    AVG(execution_time) as avg_execution_time,
                    SUM(total_signals) as total_signals_24h,
                    SUM(high_confidence_signals) as high_confidence_24h
                FROM ml_performance_metrics 
                WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOURS)
            ");
            $stmt->execute();
            $stats = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return [
                'avg_confidence_24h' => round($stats['overall_avg_confidence'] ?? 0, 1),
                'avg_execution_time' => round($stats['avg_execution_time'] ?? 0, 2),
                'total_signals_24h' => intval($stats['total_signals_24h'] ?? 0),
                'high_confidence_signals_24h' => intval($stats['high_confidence_24h'] ?? 0),
                'ml_engine_status' => 'ACTIVE'
            ];
        } catch (Exception $e) {
            return ['error' => 'Could not fetch ML performance stats'];
        }
    }
    
    /**
     * Create ML performance metrics table if it doesn't exist
     */
    public function createMLMetricsTable() {
        try {
            $this->pdo->exec("
                CREATE TABLE IF NOT EXISTS ml_performance_metrics (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    timestamp DATETIME NOT NULL,
                    total_signals INT NOT NULL,
                    avg_confidence DECIMAL(5,2) NOT NULL,
                    high_confidence_signals INT NOT NULL,
                    execution_time DECIMAL(8,3) NOT NULL,
                    lstm_active BOOLEAN DEFAULT TRUE,
                    patterns_active BOOLEAN DEFAULT TRUE,
                    ensemble_active BOOLEAN DEFAULT TRUE,
                    INDEX idx_timestamp (timestamp)
                ) ENGINE=InnoDB
            ");
            
            $this->log("📊 ML performance metrics table created/verified");
        } catch (Exception $e) {
            $this->log("❌ Error creating ML metrics table: " . $e->getMessage());
        }
    }
    
    /**
     * Log message with timestamp
     */
    private function log($message) {
        $timestamp = date('Y-m-d H:i:s');
        $logEntry = "[{$timestamp}] {$message}" . PHP_EOL;
        
        // Write to file
        file_put_contents($this->logFile, $logEntry, FILE_APPEND | LOCK_EX);
        
        // Also output to console if running from CLI
        if (php_sapi_name() === 'cli') {
            echo $logEntry;
        }
    }
    
    /**
     * Get last log entry
     */
    private function getLastLogEntry() {
        if (file_exists($this->logFile)) {
            $lines = file($this->logFile);
            return trim(end($lines));
        }
        return 'No log entries yet';
    }
}

// Enhanced SmartAlertSystem extension for ML alerts
class SmartAlertSystem {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function sendEnhancedMLAlert($alertData) {
        // Enhanced alert formatting for ML signals
        $message = sprintf(
            "🧠 **Enhanced ML Signal Alert**\n\n" .
            "**Symbol:** %s\n" .
            "**Signal:** %s\n" .
            "**Confidence:** %.1f%%\n" .
            "**AI Model:** %s\n" .
            "**Target Price:** $%.2f\n" .
            "**Stop Loss:** $%.2f\n" .
            "**Risk Level:** %s\n" .
            "**ML Analysis:** %s\n\n" .
            "⚡ Generated by Enhanced AI with LSTM Neural Networks",
            $alertData['symbol'],
            $alertData['signal_type'],
            $alertData['confidence'],
            $alertData['ai_model'],
            $alertData['target_price'],
            $alertData['stop_loss'],
            $alertData['risk_level'],
            $alertData['ml_analysis']
        );
        
        // Send to Discord webhook if configured
        $this->sendDiscordAlert($message);
        
        return true;
    }
    
    private function sendDiscordAlert($message) {
        $webhookUrl = "https://discord.com/api/webhooks/1312156627386982470/cVYfShFNI8l3pWJu6ZN9Y1LxqpZXQSGdCR4HWgF7zCHhO3BKv8Kl8DhqcLGJdx5E8VsH";
        
        $payload = json_encode([
            'content' => $message,
            'username' => 'WinTrades Enhanced AI',
            'avatar_url' => 'https://example.com/ai-avatar.png'
        ]);
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $webhookUrl);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_exec($ch);
        curl_close($ch);
    }
}
?>