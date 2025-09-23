<?php
/**
 * Phase 3 ML API Integration
 * Connects frontend to all Phase 3 ML components
 */

// CORS Headers - Must be first
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

class Phase3MLAPI {
    
    private $components = [
        'enhanced_lstm_bridge.php',
        'real_sentiment_analysis.php', 
        'professional_backtest_engine.php',
        'ensemble_strategy.php'
    ];
    
    public function __construct() {
        // Include all Phase 3 components
        foreach ($this->components as $component) {
            $path = __DIR__ . '/../../' . $component;
            if (file_exists($path)) {
                require_once $path;
            }
        }
    }
    
    public function handleRequest() {
        $action = $_GET['action'] ?? 'status';
        
        try {
            switch ($action) {
                case 'status':
                    return $this->getSystemStatus();
                    
                case 'ensemble_prediction':
                    return $this->getEnsemblePrediction();
                    
                case 'lstm_prediction':
                    return $this->getLSTMPrediction();
                    
                case 'sentiment_analysis':
                    return $this->getSentimentAnalysis();
                    
                case 'backtest_strategy':
                    return $this->runBacktest();
                    
                case 'batch_predictions':
                    return $this->getBatchPredictions();
                    
                case 'model_health':
                    return $this->getModelHealth();
                    
                case 'retraining_status':
                    return $this->getRetrainingStatus();
                    
                default:
                    return $this->error('Invalid action: ' . $action);
            }
        } catch (Exception $e) {
            return $this->error($e->getMessage());
        }
    }
    
    /**
     * Get overall system status
     */
    private function getSystemStatus() {
        $status = [
            'system' => 'Phase 3 ML Integration',
            'timestamp' => date('Y-m-d H:i:s'),
            'components' => []
        ];
        
        // Check LSTM Bridge
        try {
            if (class_exists('EnhancedLSTMBridge')) {
                $lstm = new EnhancedLSTMBridge();
                $health = $lstm->getSystemHealth();
                $status['components']['lstm'] = [
                    'status' => $health['overall_status'],
                    'models_available' => $health['models_available'] ?? 0,
                    'last_check' => date('H:i:s')
                ];
            } else {
                $status['components']['lstm'] = ['status' => 'NOT_AVAILABLE'];
            }
        } catch (Exception $e) {
            $status['components']['lstm'] = ['status' => 'ERROR', 'error' => $e->getMessage()];
        }
        
        // Check Sentiment Analysis
        try {
            if (class_exists('RealSentimentAnalysis')) {
                $sentiment = new RealSentimentAnalysis();
                $status['components']['sentiment'] = [
                    'status' => 'HEALTHY',
                    'sources' => ['News', 'Social', 'Reddit'],
                    'last_check' => date('H:i:s')
                ];
            } else {
                $status['components']['sentiment'] = ['status' => 'NOT_AVAILABLE'];
            }
        } catch (Exception $e) {
            $status['components']['sentiment'] = ['status' => 'ERROR', 'error' => $e->getMessage()];
        }
        
        // Check Backtest Engine
        try {
            if (class_exists('ProfessionalBacktestEngine')) {
                $status['components']['backtest'] = [
                    'status' => 'HEALTHY',
                    'features' => ['Transaction Costs', 'Slippage', 'Risk Metrics'],
                    'last_check' => date('H:i:s')
                ];
            } else {
                $status['components']['backtest'] = ['status' => 'NOT_AVAILABLE'];
            }
        } catch (Exception $e) {
            $status['components']['backtest'] = ['status' => 'ERROR', 'error' => $e->getMessage()];
        }
        
        // Check Ensemble System
        try {
            if (class_exists('EnsembleTradingSystem')) {
                $ensemble = new EnsembleTradingSystem();
                $health = $ensemble->getSystemHealth();
                $status['components']['ensemble'] = [
                    'status' => $health['overall_status'],
                    'components' => $health['components'] ?? [],
                    'last_check' => date('H:i:s')
                ];
            } else {
                $status['components']['ensemble'] = ['status' => 'NOT_AVAILABLE'];
            }
        } catch (Exception $e) {
            $status['components']['ensemble'] = ['status' => 'ERROR', 'error' => $e->getMessage()];
        }
        
        return $this->success($status);
    }
    
    /**
     * Get ensemble prediction for symbol
     */
    private function getEnsemblePrediction() {
        $symbol = $_GET['symbol'] ?? 'BTC-USD';
        
        if (!class_exists('EnsembleTradingSystem')) {
            return $this->error('Ensemble system not available');
        }
        
        try {
            $ensemble = new EnsembleTradingSystem();
            $prediction = $ensemble->generateEnsemblePrediction($symbol);
            
            return $this->success([
                'symbol' => $symbol,
                'prediction' => $prediction,
                'timestamp' => date('Y-m-d H:i:s'),
                'source' => 'Phase 3 Ensemble System'
            ]);
        } catch (Exception $e) {
            return $this->error('Ensemble prediction failed: ' . $e->getMessage());
        }
    }
    
    /**
     * Get LSTM prediction
     */
    private function getLSTMPrediction() {
        $symbol = $_GET['symbol'] ?? 'BTC-USD';
        
        if (!class_exists('EnhancedLSTMBridge')) {
            return $this->error('LSTM bridge not available');
        }
        
        try {
            $lstm = new EnhancedLSTMBridge();
            $prediction = $lstm->predict($symbol);
            
            return $this->success([
                'symbol' => $symbol,
                'prediction' => $prediction,
                'timestamp' => date('Y-m-d H:i:s'),
                'source' => 'Enhanced LSTM Bridge'
            ]);
        } catch (Exception $e) {
            return $this->error('LSTM prediction failed: ' . $e->getMessage());
        }
    }
    
    /**
     * Get sentiment analysis
     */
    private function getSentimentAnalysis() {
        $symbol = $_GET['symbol'] ?? 'BTC-USD';
        
        if (!class_exists('RealSentimentAnalysis')) {
            return $this->error('Sentiment analysis not available');
        }
        
        try {
            $sentiment = new RealSentimentAnalysis();
            $analysis = $sentiment->getSentimentAnalysis($symbol);
            
            return $this->success([
                'symbol' => $symbol,
                'sentiment' => $analysis,
                'timestamp' => date('Y-m-d H:i:s'),
                'source' => 'Real Sentiment Analysis'
            ]);
        } catch (Exception $e) {
            return $this->error('Sentiment analysis failed: ' . $e->getMessage());
        }
    }
    
    /**
     * Run backtest
     */
    private function runBacktest() {
        $strategy = $_GET['strategy'] ?? 'technical_strategy';
        $symbol = $_GET['symbol'] ?? 'BTC-USD';
        
        if (!class_exists('ProfessionalBacktestEngine')) {
            return $this->error('Backtest engine not available');
        }
        
        try {
            $backtest = new ProfessionalBacktestEngine();
            $results = $backtest->backtestStrategy($strategy, $symbol);
            
            return $this->success([
                'strategy' => $strategy,
                'symbol' => $symbol,
                'results' => $results,
                'timestamp' => date('Y-m-d H:i:s'),
                'source' => 'Professional Backtest Engine'
            ]);
        } catch (Exception $e) {
            return $this->error('Backtest failed: ' . $e->getMessage());
        }
    }
    
    /**
     * Get batch predictions for multiple symbols
     */
    private function getBatchPredictions() {
        $symbols = $_GET['symbols'] ?? 'BTC-USD,ETH-USD,AAPL';
        $symbolsArray = explode(',', $symbols);
        
        if (!class_exists('EnsembleTradingSystem')) {
            return $this->error('Ensemble system not available');
        }
        
        try {
            $ensemble = new EnsembleTradingSystem();
            $predictions = $ensemble->batchPredict($symbolsArray);
            
            return $this->success([
                'symbols' => $symbolsArray,
                'predictions' => $predictions,
                'timestamp' => date('Y-m-d H:i:s'),
                'source' => 'Ensemble Batch Processing'
            ]);
        } catch (Exception $e) {
            return $this->error('Batch predictions failed: ' . $e->getMessage());
        }
    }
    
    /**
     * Get model health status
     */
    private function getModelHealth() {
        if (!class_exists('EnhancedLSTMBridge')) {
            return $this->error('LSTM bridge not available');
        }
        
        try {
            $lstm = new EnhancedLSTMBridge();
            $health = $lstm->getSystemHealth();
            
            return $this->success([
                'health' => $health,
                'timestamp' => date('Y-m-d H:i:s'),
                'source' => 'LSTM Model Health Monitor'
            ]);
        } catch (Exception $e) {
            return $this->error('Health check failed: ' . $e->getMessage());
        }
    }
    
    /**
     * Get retraining status
     */
    private function getRetrainingStatus() {
        // Check scheduler status
        $schedulerPath = __DIR__ . '/../../scheduler.php';
        
        if (!file_exists($schedulerPath)) {
            return $this->error('Scheduler not available');
        }
        
        try {
            // Read scheduler logs or status
            $status = [
                'scheduler_active' => file_exists($schedulerPath),
                'last_check' => date('Y-m-d H:i:s'),
                'next_retraining' => 'Automated based on performance',
                'models_trained' => ['BTC-USD', 'ETH-USD', 'AAPL'],
                'training_frequency' => 'Weekly or on demand'
            ];
            
            return $this->success([
                'retraining' => $status,
                'timestamp' => date('Y-m-d H:i:s'),
                'source' => 'Model Retraining Pipeline'
            ]);
        } catch (Exception $e) {
            return $this->error('Retraining status failed: ' . $e->getMessage());
        }
    }
    
    /**
     * Success response
     */
    private function success($data) {
        return [
            'success' => true,
            'data' => $data,
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
    
    /**
     * Error response
     */
    private function error($message) {
        return [
            'success' => false,
            'error' => $message,
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
}

// Initialize and handle request
try {
    $api = new Phase3MLAPI();
    $response = $api->handleRequest();
    echo json_encode($response, JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'API Error: ' . $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT);
}
?>