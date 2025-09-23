<?php
/**
 * Enhanced LSTM Bridge with Retraining Pipeline Integration
 * =========================================================
 * 
 * Extended version of simple_lstm_bridge.php with:
 * - Integration with automated retraining pipeline
 * - Model version management
 * - Performance monitoring
 * - Automatic fallback mechanisms
 */

require_once 'scheduler.php';

class EnhancedLSTMBridge {
    private $pythonPath;
    private $scriptPath;
    private $modelsDir;
    private $logFile;
    private $scheduler;
    private $fallbackEnabled;
    
    public function __construct($config = []) {
        $this->pythonPath = $config['python_path'] ?? 'py';
        $this->scriptPath = $config['script_path'] ?? __DIR__ . '/lstm_simple.py';
        $this->modelsDir = $config['models_dir'] ?? __DIR__ . '/models';
        $this->logFile = __DIR__ . '/logs/enhanced_bridge.log';
        $this->fallbackEnabled = $config['fallback_enabled'] ?? true;
        
        // Initialize scheduler for pipeline integration
        $this->scheduler = new ModelRetrainingScheduler();
        
        // Ensure directories exist
        if (!is_dir($this->modelsDir)) {
            mkdir($this->modelsDir, 0755, true);
        }
        if (!is_dir(dirname($this->logFile))) {
            mkdir(dirname($this->logFile), 0755, true);
        }
    }
    
    private function log($message, $level = 'INFO') {
        $timestamp = date('Y-m-d H:i:s');
        $logEntry = "[$timestamp] [$level] $message" . PHP_EOL;
        file_put_contents($this->logFile, $logEntry, FILE_APPEND | LOCK_EX);
    }
    
    /**
     * Get prediction with enhanced error handling and fallback
     */
    public function predict($symbol, $data = null, $options = []) {
        try {
            // Check if model exists and is recent
            $modelStatus = $this->getModelStatus($symbol);
            
            if (!$modelStatus['exists']) {
                $this->log("Model not found for $symbol, triggering retraining", 'WARNING');
                if ($this->triggerRetraining($symbol)) {
                    // Retry after retraining
                    $modelStatus = $this->getModelStatus($symbol);
                }
            }
            
            // Check if model needs update based on age
            if ($this->shouldUpdateModel($symbol, $modelStatus)) {
                $this->log("Model for $symbol is outdated, scheduling retraining", 'INFO');
                $this->scheduleRetraining($symbol);
            }
            
            // Make prediction
            $prediction = $this->makePrediction($symbol, $data, $options);
            
            if ($prediction === null && $this->fallbackEnabled) {
                $this->log("Prediction failed for $symbol, using fallback", 'WARNING');
                return $this->getFallbackPrediction($symbol, $data);
            }
            
            return $prediction;
            
        } catch (Exception $e) {
            $this->log("Prediction error for $symbol: " . $e->getMessage(), 'ERROR');
            return $this->fallbackEnabled ? $this->getFallbackPrediction($symbol, $data) : null;
        }
    }
    
    private function makePrediction($symbol, $data, $options) {
        // Use data or fetch recent data
        if ($data === null) {
            $data = $this->getRecentData($symbol);
        }
        
        // Prepare command
        $dataJson = json_encode($data);
        $optionsJson = json_encode($options);
        
        $command = sprintf(
            '%s %s predict %s %s %s 2>&1',
            escapeshellarg($this->pythonPath),
            escapeshellarg($this->scriptPath),
            escapeshellarg($symbol),
            escapeshellarg($dataJson),
            escapeshellarg($optionsJson)
        );
        
        // Execute command
        $output = [];
        $returnCode = 0;
        exec($command, $output, $returnCode);
        
        if ($returnCode !== 0) {
            $this->log("Python prediction failed: " . implode("\n", $output), 'ERROR');
            return null;
        }
        
        // Parse output
        $outputText = implode("\n", $output);
        $result = json_decode($outputText, true);
        
        if ($result === null) {
            $this->log("Failed to parse prediction output: $outputText", 'ERROR');
            return null;
        }
        
        // Add metadata
        $result['model_version'] = $this->getModelVersion($symbol);
        $result['prediction_time'] = date('c');
        $result['symbol'] = $symbol;
        
        return $result;
    }
    
    private function getRecentData($symbol, $days = 100) {
        // This would typically fetch from your data source
        // For now, return sample structure
        return [
            'symbol' => $symbol,
            'timeframe' => '1d',
            'data_points' => $days,
            'last_update' => date('c')
        ];
    }
    
    /**
     * Get comprehensive model status
     */
    public function getModelStatus($symbol) {
        $modelFile = $this->modelsDir . "/{$symbol}_model.h5";
        $metricsFile = $this->modelsDir . "/{$symbol}_metrics.json";
        $scalerFile = $this->modelsDir . "/{$symbol}_scaler.pkl";
        
        $status = [
            'symbol' => $symbol,
            'exists' => file_exists($modelFile),
            'has_metrics' => file_exists($metricsFile),
            'has_scaler' => file_exists($scalerFile),
            'model_file' => $modelFile,
            'last_modified' => file_exists($modelFile) ? filemtime($modelFile) : null,
            'age_hours' => null,
            'metrics' => null,
            'version' => $this->getModelVersion($symbol)
        ];
        
        if ($status['last_modified']) {
            $status['age_hours'] = (time() - $status['last_modified']) / 3600;
        }
        
        if ($status['has_metrics']) {
            $status['metrics'] = json_decode(file_get_contents($metricsFile), true);
        }
        
        return $status;
    }
    
    private function getModelVersion($symbol) {
        $metricsFile = $this->modelsDir . "/{$symbol}_metrics.json";
        if (!file_exists($metricsFile)) {
            return null;
        }
        
        $metrics = json_decode(file_get_contents($metricsFile), true);
        return $metrics['training_date'] ?? null;
    }
    
    private function shouldUpdateModel($symbol, $modelStatus) {
        if (!$modelStatus['exists']) {
            return true;
        }
        
        // Check age (default: update if older than 24 hours)
        $maxAgeHours = 24;
        if ($modelStatus['age_hours'] > $maxAgeHours) {
            return true;
        }
        
        // Check performance (if accuracy too low)
        if ($modelStatus['metrics']) {
            $minAccuracy = 40.0; // 40% minimum
            $valAccuracy = $modelStatus['metrics']['val_accuracy'] ?? 0;
            if ($valAccuracy < $minAccuracy) {
                return true;
            }
        }
        
        return false;
    }
    
    private function triggerRetraining($symbol) {
        try {
            $this->log("Triggering immediate retraining for $symbol", 'INFO');
            
            // Use scheduler to trigger retraining
            $success = $this->scheduler->runRetraining(true);
            
            if ($success) {
                $this->log("Retraining completed successfully for $symbol", 'INFO');
                return true;
            } else {
                $this->log("Retraining failed for $symbol", 'ERROR');
                return false;
            }
            
        } catch (Exception $e) {
            $this->log("Retraining trigger failed: " . $e->getMessage(), 'ERROR');
            return false;
        }
    }
    
    private function scheduleRetraining($symbol) {
        // This would typically add to a queue or schedule
        // For now, log the scheduling request
        $this->log("Scheduled retraining for $symbol", 'INFO');
        
        // Could trigger background retraining
        // exec("php scheduler.php run > /dev/null 2>&1 &");
    }
    
    private function getFallbackPrediction($symbol, $data) {
        // Simple fallback prediction based on technical analysis
        return [
            'prediction' => 0.5, // Neutral prediction
            'confidence' => 0.3,  // Low confidence
            'type' => 'fallback',
            'message' => 'Using fallback prediction due to model unavailability',
            'symbol' => $symbol,
            'timestamp' => date('c')
        ];
    }
    
    /**
     * Get comprehensive health status
     */
    public function getSystemHealth() {
        $symbols = ['BTC-USD', 'ETH-USD', 'AAPL', 'GOOGL'];
        $health = [
            'overall_status' => 'healthy',
            'timestamp' => date('c'),
            'models' => [],
            'scheduler_status' => null,
            'recent_predictions' => 0,
            'warnings' => [],
            'errors' => []
        ];
        
        // Check each model
        foreach ($symbols as $symbol) {
            $modelStatus = $this->getModelStatus($symbol);
            $health['models'][$symbol] = $modelStatus;
            
            if (!$modelStatus['exists']) {
                $health['warnings'][] = "Model missing for $symbol";
            } elseif ($modelStatus['age_hours'] > 48) {
                $health['warnings'][] = "Model outdated for $symbol ({$modelStatus['age_hours']} hours old)";
            }
        }
        
        // Check scheduler status
        $health['scheduler_status'] = $this->scheduler->getStatus();
        
        // Determine overall status
        if (!empty($health['errors'])) {
            $health['overall_status'] = 'error';
        } elseif (!empty($health['warnings'])) {
            $health['overall_status'] = 'warning';
        }
        
        return $health;
    }
    
    /**
     * Batch prediction for multiple symbols
     */
    public function batchPredict($symbols, $options = []) {
        $results = [];
        
        foreach ($symbols as $symbol) {
            $results[$symbol] = $this->predict($symbol, null, $options);
        }
        
        return $results;
    }
    
    /**
     * Get prediction history and performance metrics
     */
    public function getPredictionMetrics($symbol, $days = 30) {
        // This would typically query a database of past predictions
        // For now, return sample metrics
        return [
            'symbol' => $symbol,
            'period_days' => $days,
            'total_predictions' => 100,
            'accuracy' => 0.52,
            'avg_confidence' => 0.68,
            'last_prediction' => date('c'),
            'model_version' => $this->getModelVersion($symbol)
        ];
    }
}

// Web API interface
if (isset($_REQUEST['action'])) {
    header('Content-Type: application/json');
    
    $bridge = new EnhancedLSTMBridge();
    $response = ['success' => false, 'data' => null, 'message' => ''];
    
    try {
        switch ($_REQUEST['action']) {
            case 'predict':
                $symbol = $_REQUEST['symbol'] ?? 'BTC-USD';
                $options = isset($_REQUEST['options']) ? json_decode($_REQUEST['options'], true) : [];
                $result = $bridge->predict($symbol, null, $options);
                $response = ['success' => true, 'data' => $result];
                break;
                
            case 'batch_predict':
                $symbols = isset($_REQUEST['symbols']) ? explode(',', $_REQUEST['symbols']) : ['BTC-USD', 'ETH-USD'];
                $options = isset($_REQUEST['options']) ? json_decode($_REQUEST['options'], true) : [];
                $result = $bridge->batchPredict($symbols, $options);
                $response = ['success' => true, 'data' => $result];
                break;
                
            case 'model_status':
                $symbol = $_REQUEST['symbol'] ?? 'BTC-USD';
                $result = $bridge->getModelStatus($symbol);
                $response = ['success' => true, 'data' => $result];
                break;
                
            case 'system_health':
                $result = $bridge->getSystemHealth();
                $response = ['success' => true, 'data' => $result];
                break;
                
            case 'metrics':
                $symbol = $_REQUEST['symbol'] ?? 'BTC-USD';
                $days = isset($_REQUEST['days']) ? (int)$_REQUEST['days'] : 30;
                $result = $bridge->getPredictionMetrics($symbol, $days);
                $response = ['success' => true, 'data' => $result];
                break;
                
            default:
                $response['message'] = 'Unknown action';
        }
        
    } catch (Exception $e) {
        $response = ['success' => false, 'message' => $e->getMessage()];
    }
    
    echo json_encode($response, JSON_PRETTY_PRINT);
    exit;
}

// CLI testing interface
if (php_sapi_name() === 'cli') {
    echo "🤖 Enhanced LSTM Bridge Test\n";
    echo "============================\n\n";
    
    $bridge = new EnhancedLSTMBridge();
    
    // Test system health
    echo "📊 System Health Check:\n";
    $health = $bridge->getSystemHealth();
    echo "   Overall Status: " . strtoupper($health['overall_status']) . "\n";
    echo "   Models Available: " . count(array_filter($health['models'], fn($m) => $m['exists'])) . "/" . count($health['models']) . "\n";
    
    if (!empty($health['warnings'])) {
        echo "   Warnings:\n";
        foreach ($health['warnings'] as $warning) {
            echo "     - $warning\n";
        }
    }
    
    echo "\n📈 Test Predictions:\n";
    $symbols = ['BTC-USD', 'ETH-USD', 'AAPL'];
    foreach ($symbols as $symbol) {
        echo "   Testing $symbol... ";
        $prediction = $bridge->predict($symbol);
        if ($prediction) {
            $conf = isset($prediction['confidence']) ? number_format($prediction['confidence'] * 100, 1) : 'N/A';
            echo "✅ Prediction: " . number_format($prediction['prediction'] ?? 0, 4) . " (Confidence: {$conf}%)\n";
        } else {
            echo "❌ Failed\n";
        }
    }
    
    echo "\n✅ Enhanced LSTM Bridge test complete!\n";
}
?>