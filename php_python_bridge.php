<?php
/**
 * WinTrades PHP-Python Bridge
 * Connects PHP backend with real TensorFlow LSTM model
 * 
 * This bridge allows PHP to call Python ML models and get real predictions
 */

class PythonMLBridge {
    private $pythonPath;
    private $scriptsPath;
    private $modelsPath;
    private $logFile;
    
    public function __init() {
        // Configure paths
        $this->pythonPath = 'C:/Python313/python.exe';
        $this->scriptsPath = __DIR__;
        $this->modelsPath = __DIR__ . '/models';
        $this->logFile = __DIR__ . '/logs/ml_bridge.log';
        
        // Ensure directories exist
        if (!is_dir($this->modelsPath)) {
            mkdir($this->modelsPath, 0755, true);
        }
        
        if (!is_dir(dirname($this->logFile))) {
            mkdir(dirname($this->logFile), 0755, true);
        }
        
        $this->log("PHP-Python Bridge initialized");
    }
    
    /**
     * Get real LSTM prediction for a symbol
     */
    public function getLSTMPrediction($symbol = 'BTCUSDT') {
        try {
            $this->log("Getting LSTM prediction for $symbol");
            
            // Prepare Python command
            $pythonScript = $this->scriptsPath . '/ai_real_lstm_clean.py';
            $command = sprintf(
                '"%s" -c "
import sys
sys.path.append(\'%s\')
from ai_real_lstm_clean import RealLSTMModel
import json

# Create model and get prediction
model = RealLSTMModel(\'%s\')
if not model.load_model():
    print(json.dumps({\'error\': \'Model not trained yet\'}))
else:
    prediction = model.predict()
    print(json.dumps(prediction))
"',
                $this->pythonPath,
                str_replace('\\', '\\\\', $this->scriptsPath),
                $symbol
            );
            
            // Execute Python script
            $output = shell_exec($command . ' 2>&1');
            
            if (empty($output)) {
                throw new Exception("No output from Python script");
            }
            
            // Parse JSON response
            $lines = explode("\n", trim($output));
            $jsonLine = end($lines); // Get last line (should be JSON)
            
            $result = json_decode($jsonLine, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception("Invalid JSON response: " . $jsonLine);
            }
            
            $this->log("LSTM prediction successful: " . $jsonLine);
            
            return [
                'success' => true,
                'data' => $result,
                'timestamp' => date('Y-m-d H:i:s'),
                'model_type' => 'Real TensorFlow LSTM'
            ];
            
        } catch (Exception $e) {
            $this->log("LSTM prediction error: " . $e->getMessage());
            
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'timestamp' => date('Y-m-d H:i:s'),
                'fallback' => $this->getFallbackPrediction($symbol)
            ];
        }
    }
    
    /**
     * Train or retrain LSTM model
     */
    public function trainLSTMModel($symbol = 'BTCUSDT', $async = true) {
        try {
            $this->log("Starting LSTM training for $symbol");
            
            $pythonScript = $this->scriptsPath . '/ai_real_lstm_clean.py';
            $command = sprintf(
                '"%s" -c "
import sys
sys.path.append(\'%s\')
from ai_real_lstm_clean import RealLSTMModel
import json

# Create and train model
model = RealLSTMModel(\'%s\')
history, stats = model.train()

# Return training statistics
result = {
    \'success\': True,
    \'stats\': stats,
    \'message\': \'Training completed successfully\'
}
print(json.dumps(result))
"',
                $this->pythonPath,
                str_replace('\\', '\\\\', $this->scriptsPath),
                $symbol
            );
            
            if ($async) {
                // Run in background for long training
                if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
                    pclose(popen('start /B ' . $command, 'r'));
                } else {
                    exec($command . ' > /dev/null 2>&1 &');
                }
                
                return [
                    'success' => true,
                    'message' => 'Training started in background',
                    'async' => true,
                    'timestamp' => date('Y-m-d H:i:s')
                ];
            } else {
                // Synchronous training
                $output = shell_exec($command . ' 2>&1');
                $lines = explode("\n", trim($output));
                $jsonLine = end($lines);
                
                $result = json_decode($jsonLine, true);
                
                if (json_last_error() === JSON_ERROR_NONE) {
                    $this->log("LSTM training completed: " . $jsonLine);
                    return $result;
                } else {
                    throw new Exception("Training failed: " . $output);
                }
            }
            
        } catch (Exception $e) {
            $this->log("LSTM training error: " . $e->getMessage());
            
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'timestamp' => date('Y-m-d H:i:s')
            ];
        }
    }
    
    /**
     * Check if model exists and get model info
     */
    public function getModelInfo($symbol = 'BTCUSDT') {
        $modelFile = $this->modelsPath . "/lstm_{$symbol}.h5";
        $scalerFile = $this->modelsPath . "/scaler_{$symbol}.pkl";
        $featureScalerFile = $this->modelsPath . "/feature_scaler_{$symbol}.pkl";
        $statsFile = $this->modelsPath . "/training_stats_{$symbol}.json";
        
        $info = [
            'symbol' => $symbol,
            'model_exists' => file_exists($modelFile),
            'scalers_exist' => file_exists($scalerFile) && file_exists($featureScalerFile),
            'stats_available' => file_exists($statsFile),
            'model_size' => file_exists($modelFile) ? filesize($modelFile) : 0,
            'last_modified' => file_exists($modelFile) ? date('Y-m-d H:i:s', filemtime($modelFile)) : null
        ];
        
        // Load training stats if available
        if ($info['stats_available']) {
            $stats = json_decode(file_get_contents($statsFile), true);
            $info['training_stats'] = $stats;
        }
        
        return $info;
    }
    
    /**
     * Get ensemble prediction combining LSTM + Technical Analysis
     */
    public function getEnsemblePrediction($symbol = 'BTCUSDT') {
        try {
            // Get LSTM prediction
            $lstmResult = $this->getLSTMPrediction($symbol);
            
            // Get technical analysis (existing implementation)
            $technicalResult = $this->getTechnicalAnalysis($symbol);
            
            if ($lstmResult['success'] && isset($technicalResult['data'])) {
                // Combine predictions with weighted average
                $lstmSignal = $this->signalToScore($lstmResult['data']['signal']);
                $techSignal = $this->signalToScore($technicalResult['data']['overall_signal']);
                
                // Weight: 60% LSTM, 40% Technical
                $combinedScore = ($lstmSignal * 0.6) + ($techSignal * 0.4);
                $combinedSignal = $this->scoreToSignal($combinedScore);
                
                // Calculate confidence
                $lstmConfidence = $lstmResult['data']['confidence'] ?? 0.5;
                $techConfidence = $technicalResult['data']['confidence'] ?? 0.5;
                $combinedConfidence = ($lstmConfidence * 0.6) + ($techConfidence * 0.4);
                
                return [
                    'success' => true,
                    'data' => [
                        'symbol' => $symbol,
                        'ensemble_signal' => $combinedSignal,
                        'ensemble_confidence' => $combinedConfidence,
                        'ensemble_score' => $combinedScore,
                        'components' => [
                            'lstm' => $lstmResult['data'],
                            'technical' => $technicalResult['data']
                        ],
                        'weights' => ['lstm' => 0.6, 'technical' => 0.4],
                        'model_type' => 'Ensemble LSTM + Technical Analysis'
                    ],
                    'timestamp' => date('Y-m-d H:i:s')
                ];
            } else {
                // Fallback to technical analysis only
                return $technicalResult;
            }
            
        } catch (Exception $e) {
            $this->log("Ensemble prediction error: " . $e->getMessage());
            
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'fallback' => $this->getFallbackPrediction($symbol)
            ];
        }
    }
    
    /**
     * Get technical analysis from existing backend
     */
    private function getTechnicalAnalysis($symbol) {
        // Use existing technical analysis module
        require_once __DIR__ . '/ai/TechnicalAnalysis.php';
        
        $ta = new TechnicalAnalysis();
        return $ta->analyze($symbol);
    }
    
    /**
     * Convert signal to numerical score
     */
    private function signalToScore($signal) {
        switch (strtoupper($signal)) {
            case 'BUY': return 1.0;
            case 'SELL': return 0.0;
            case 'HOLD': 
            default: return 0.5;
        }
    }
    
    /**
     * Convert numerical score to signal
     */
    private function scoreToSignal($score) {
        if ($score > 0.6) return 'BUY';
        if ($score < 0.4) return 'SELL';
        return 'HOLD';
    }
    
    /**
     * Fallback prediction using existing methods
     */
    private function getFallbackPrediction($symbol) {
        return [
            'symbol' => $symbol,
            'signal' => 'HOLD',
            'confidence' => 0.5,
            'model_type' => 'Fallback Technical Analysis',
            'note' => 'LSTM model unavailable'
        ];
    }
    
    /**
     * Log bridge activities
     */
    private function log($message) {
        $timestamp = date('Y-m-d H:i:s');
        $logEntry = "[$timestamp] $message" . PHP_EOL;
        file_put_contents($this->logFile, $logEntry, FILE_APPEND | LOCK_EX);
    }
    
    /**
     * Get bridge health status
     */
    public function getHealthStatus() {
        return [
            'python_available' => $this->checkPythonAvailable(),
            'models_directory' => is_dir($this->modelsPath),
            'logs_directory' => is_dir(dirname($this->logFile)),
            'python_path' => $this->pythonPath,
            'scripts_path' => $this->scriptsPath,
            'models_path' => $this->modelsPath,
            'tensorflow_installed' => $this->checkTensorFlowInstalled(),
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
    
    /**
     * Check if Python is available
     */
    private function checkPythonAvailable() {
        $output = shell_exec($this->pythonPath . ' --version 2>&1');
        return strpos($output, 'Python') !== false;
    }
    
    /**
     * Check if TensorFlow is installed
     */
    private function checkTensorFlowInstalled() {
        $command = $this->pythonPath . ' -c "import tensorflow; print(tensorflow.__version__)" 2>&1';
        $output = shell_exec($command);
        return !empty($output) && !strpos($output, 'Error') && !strpos($output, 'ModuleNotFoundError');
    }
}

// Initialize bridge
$mlBridge = new PythonMLBridge();
$mlBridge->__init();

/**
 * API Endpoints for ML Bridge
 */

// Handle requests
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';
    $symbol = $_GET['symbol'] ?? 'BTCUSDT';
    
    switch ($action) {
        case 'lstm_prediction':
            header('Content-Type: application/json');
            echo json_encode($mlBridge->getLSTMPrediction($symbol));
            break;
            
        case 'ensemble_prediction':
            header('Content-Type: application/json');
            echo json_encode($mlBridge->getEnsemblePrediction($symbol));
            break;
            
        case 'model_info':
            header('Content-Type: application/json');
            echo json_encode($mlBridge->getModelInfo($symbol));
            break;
            
        case 'health':
            header('Content-Type: application/json');
            echo json_encode($mlBridge->getHealthStatus());
            break;
            
        case 'train':
            $async = isset($_GET['async']) ? (bool)$_GET['async'] : true;
            header('Content-Type: application/json');
            echo json_encode($mlBridge->trainLSTMModel($symbol, $async));
            break;
            
        default:
            header('Content-Type: application/json');
            echo json_encode([
                'error' => 'Invalid action',
                'available_actions' => [
                    'lstm_prediction',
                    'ensemble_prediction', 
                    'model_info',
                    'health',
                    'train'
                ]
            ]);
    }
} else {
    header('Content-Type: application/json');
    echo json_encode([
        'error' => 'Only GET requests supported',
        'bridge_status' => 'Active',
        'endpoints' => [
            'GET /?action=lstm_prediction&symbol=BTCUSDT',
            'GET /?action=ensemble_prediction&symbol=BTCUSDT',
            'GET /?action=model_info&symbol=BTCUSDT',
            'GET /?action=health',
            'GET /?action=train&symbol=BTCUSDT&async=true'
        ]
    ]);
}
?>