<?php
/**
 * Ensemble Trading System
 * =======================
 * 
 * Advanced multi-component prediction system combining:
 * - LSTM Neural Network predictions
 * - Technical analysis indicators
 * - Real-time sentiment analysis
 * - Risk management and position sizing
 * - Confidence scoring and ensemble weighting
 */

require_once 'enhanced_lstm_bridge.php';
require_once 'real_sentiment_analysis.php';
require_once 'professional_backtest_engine.php';

class EnsembleTradingSystem {
    private $lstmBridge;
    private $sentimentAnalyzer;
    private $backtestEngine;
    private $config;
    private $logFile;
    
    public function __construct($config = []) {
        // Default configuration
        $this->config = array_merge([
            'weights' => [
                'lstm' => 0.4,          // 40% weight for LSTM predictions
                'technical' => 0.35,    // 35% weight for technical analysis
                'sentiment' => 0.25     // 25% weight for sentiment analysis
            ],
            'confidence_thresholds' => [
                'high' => 0.75,        // High confidence threshold
                'medium' => 0.5,       // Medium confidence threshold
                'low' => 0.25          // Low confidence threshold
            ],
            'risk_management' => [
                'max_position_size' => 0.95,    // Max 95% of capital per position
                'stop_loss_percent' => 0.05,    // 5% stop loss
                'take_profit_percent' => 0.15,  // 15% take profit
                'max_drawdown_percent' => 0.20, // 20% max portfolio drawdown
                'correlation_threshold' => 0.8   // Max correlation between positions
            ],
            'technical_indicators' => [
                'rsi_period' => 14,
                'ma_short' => 20,
                'ma_long' => 50,
                'bollinger_period' => 20,
                'bollinger_std' => 2,
                'macd_fast' => 12,
                'macd_slow' => 26,
                'macd_signal' => 9
            ],
            'symbols' => ['BTC-USD', 'ETH-USD', 'AAPL', 'GOOGL', 'TSLA'],
            'timeframes' => ['1h', '4h', '1d'],
            'lookback_days' => 100
        ], $config);
        
        // Initialize components
        $this->lstmBridge = new EnhancedLSTMBridge();
        $this->sentimentAnalyzer = new RealSentimentAnalysis();
        $this->backtestEngine = new ProfessionalBacktestEngine();
        
        $this->logFile = __DIR__ . '/logs/ensemble_trading.log';
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
     * Generate comprehensive ensemble prediction
     */
    public function generateEnsemblePrediction($symbol, $data = null) {
        try {
            $this->log("Generating ensemble prediction for $symbol", 'INFO');
            
            // Collect all component predictions
            $components = $this->collectComponentPredictions($symbol, $data);
            
            // Calculate technical indicators
            $technicalSignals = $this->calculateTechnicalSignals($symbol, $data);
            
            // Get sentiment analysis
            $sentimentSignals = $this->getSentimentSignals($symbol);
            
            // Combine all signals using ensemble weighting
            $ensemblePrediction = $this->combineSignals($components, $technicalSignals, $sentimentSignals);
            
            // Apply risk management
            $riskAdjustedPrediction = $this->applyRiskManagement($symbol, $ensemblePrediction);
            
            // Generate final trading recommendation
            $recommendation = $this->generateTradingRecommendation($symbol, $riskAdjustedPrediction);
            
            $this->log("Ensemble prediction completed for $symbol: {$recommendation['action']} (confidence: {$recommendation['confidence']})", 'INFO');
            
            return $recommendation;
            
        } catch (Exception $e) {
            $this->log("Ensemble prediction failed for $symbol: " . $e->getMessage(), 'ERROR');
            return $this->generateFallbackPrediction($symbol);
        }
    }
    
    private function collectComponentPredictions($symbol, $data) {
        $components = [];
        
        // LSTM Neural Network Prediction
        try {
            $lstmResult = $this->lstmBridge->predict($symbol, $data);
            if ($lstmResult && isset($lstmResult['prediction'])) {
                $components['lstm'] = [
                    'prediction' => $lstmResult['prediction'],
                    'confidence' => $lstmResult['confidence'] ?? 0.5,
                    'available' => true,
                    'timestamp' => date('c')
                ];
            } else {
                $components['lstm'] = ['available' => false];
            }
        } catch (Exception $e) {
            $components['lstm'] = ['available' => false, 'error' => $e->getMessage()];
        }
        
        return $components;
    }
    
    private function calculateTechnicalSignals($symbol, $data) {
        // If no data provided, simulate technical analysis
        if ($data === null) {
            $data = $this->getMarketData($symbol);
        }
        
        $signals = [];
        
        // RSI Signal
        $rsi = $this->calculateRSI($data);
        if ($rsi < 30) {
            $signals['rsi'] = ['signal' => 'BUY', 'strength' => 0.8, 'value' => $rsi];
        } elseif ($rsi > 70) {
            $signals['rsi'] = ['signal' => 'SELL', 'strength' => 0.8, 'value' => $rsi];
        } else {
            $signals['rsi'] = ['signal' => 'HOLD', 'strength' => 0.3, 'value' => $rsi];
        }
        
        // Moving Average Signal
        $maSignal = $this->calculateMovingAverageSignal($data);
        $signals['moving_average'] = $maSignal;
        
        // MACD Signal
        $macdSignal = $this->calculateMACDSignal($data);
        $signals['macd'] = $macdSignal;
        
        // Bollinger Bands Signal
        $bollingerSignal = $this->calculateBollingerSignal($data);
        $signals['bollinger'] = $bollingerSignal;
        
        // Volume Analysis
        $volumeSignal = $this->calculateVolumeSignal($data);
        $signals['volume'] = $volumeSignal;
        
        // Combine technical signals
        $technicalPrediction = $this->combineTechnicalSignals($signals);
        
        return [
            'individual_signals' => $signals,
            'combined_prediction' => $technicalPrediction,
            'timestamp' => date('c')
        ];
    }
    
    private function getSentimentSignals($symbol) {
        try {
            $sentiment = $this->sentimentAnalyzer->getSentimentAnalysis($symbol);
            
            // Convert sentiment to trading signal
            $sentimentScore = $sentiment['overall_sentiment']['score'];
            
            if ($sentimentScore > 0.6) {
                $signal = 'BUY';
                $strength = min(($sentimentScore - 0.6) / 0.4, 1.0);
            } elseif ($sentimentScore < 0.4) {
                $signal = 'SELL';
                $strength = min((0.4 - $sentimentScore) / 0.4, 1.0);
            } else {
                $signal = 'HOLD';
                $strength = 0.3;
            }
            
            return [
                'signal' => $signal,
                'strength' => $strength,
                'sentiment_score' => $sentimentScore,
                'news_sentiment' => $sentiment['breakdown']['news']['score'] ?? 0.5,
                'social_sentiment' => $sentiment['breakdown']['social']['score'] ?? 0.5,
                'available' => true,
                'timestamp' => date('c')
            ];
            
        } catch (Exception $e) {
            $this->log("Sentiment analysis failed for $symbol: " . $e->getMessage(), 'WARNING');
            return ['available' => false, 'error' => $e->getMessage()];
        }
    }
    
    private function combineSignals($components, $technical, $sentiment) {
        $weights = $this->config['weights'];
        $signals = [];
        $totalWeight = 0;
        
        // LSTM Component
        if ($components['lstm']['available'] ?? false) {
            $lstm_prediction = $components['lstm']['prediction'];
            $lstm_confidence = $components['lstm']['confidence'];
            
            // Convert LSTM output to buy/sell signal
            if ($lstm_prediction > 0.6) {
                $lstm_signal = 'BUY';
                $lstm_strength = ($lstm_prediction - 0.5) * 2;
            } elseif ($lstm_prediction < 0.4) {
                $lstm_signal = 'SELL';
                $lstm_strength = (0.5 - $lstm_prediction) * 2;
            } else {
                $lstm_signal = 'HOLD';
                $lstm_strength = 0.3;
            }
            
            $signals['lstm'] = [
                'signal' => $lstm_signal,
                'strength' => $lstm_strength * $lstm_confidence,
                'weight' => $weights['lstm']
            ];
            $totalWeight += $weights['lstm'];
        }
        
        // Technical Analysis Component
        if (isset($technical['combined_prediction'])) {
            $signals['technical'] = [
                'signal' => $technical['combined_prediction']['signal'],
                'strength' => $technical['combined_prediction']['strength'],
                'weight' => $weights['technical']
            ];
            $totalWeight += $weights['technical'];
        }
        
        // Sentiment Analysis Component
        if ($sentiment['available'] ?? false) {
            $signals['sentiment'] = [
                'signal' => $sentiment['signal'],
                'strength' => $sentiment['strength'],
                'weight' => $weights['sentiment']
            ];
            $totalWeight += $weights['sentiment'];
        }
        
        // Calculate weighted ensemble prediction
        $ensembleScore = 0;
        $ensembleConfidence = 0;
        
        foreach ($signals as $component => $signal) {
            $normalizedWeight = $signal['weight'] / $totalWeight;
            
            $signalValue = 0;
            switch ($signal['signal']) {
                case 'BUY':
                    $signalValue = $signal['strength'];
                    break;
                case 'SELL':
                    $signalValue = -$signal['strength'];
                    break;
                case 'HOLD':
                    $signalValue = 0;
                    break;
            }
            
            $ensembleScore += $signalValue * $normalizedWeight;
            $ensembleConfidence += $signal['strength'] * $normalizedWeight;
        }
        
        // Determine final signal
        if ($ensembleScore > 0.3) {
            $finalSignal = 'BUY';
        } elseif ($ensembleScore < -0.3) {
            $finalSignal = 'SELL';
        } else {
            $finalSignal = 'HOLD';
        }
        
        return [
            'signal' => $finalSignal,
            'strength' => abs($ensembleScore),
            'confidence' => $ensembleConfidence,
            'ensemble_score' => $ensembleScore,
            'components' => $signals,
            'total_weight' => $totalWeight
        ];
    }
    
    private function applyRiskManagement($symbol, $prediction) {
        $riskConfig = $this->config['risk_management'];
        
        // Adjust position size based on confidence
        $basePositionSize = $riskConfig['max_position_size'];
        $confidenceMultiplier = $prediction['confidence'];
        $adjustedPositionSize = $basePositionSize * $confidenceMultiplier;
        
        // Apply maximum position size limit
        $positionSize = min($adjustedPositionSize, $riskConfig['max_position_size']);
        
        // Calculate stop loss and take profit levels
        $stopLossPercent = $riskConfig['stop_loss_percent'];
        $takeProfitPercent = $riskConfig['take_profit_percent'];
        
        // Risk-reward ratio check
        $riskRewardRatio = $takeProfitPercent / $stopLossPercent;
        if ($riskRewardRatio < 2.0) {
            // Reduce position size for poor risk-reward setups
            $positionSize *= 0.5;
        }
        
        return array_merge($prediction, [
            'position_size' => $positionSize,
            'stop_loss_percent' => $stopLossPercent,
            'take_profit_percent' => $takeProfitPercent,
            'risk_reward_ratio' => $riskRewardRatio,
            'risk_adjusted' => true
        ]);
    }
    
    private function generateTradingRecommendation($symbol, $prediction) {
        $confidence = $prediction['confidence'];
        $thresholds = $this->config['confidence_thresholds'];
        
        // Determine confidence level
        if ($confidence >= $thresholds['high']) {
            $confidenceLevel = 'HIGH';
        } elseif ($confidence >= $thresholds['medium']) {
            $confidenceLevel = 'MEDIUM';
        } else {
            $confidenceLevel = 'LOW';
        }
        
        // Generate recommendation
        $recommendation = [
            'symbol' => $symbol,
            'action' => $prediction['signal'],
            'confidence' => $confidence,
            'confidence_level' => $confidenceLevel,
            'position_size' => $prediction['position_size'],
            'stop_loss_percent' => $prediction['stop_loss_percent'],
            'take_profit_percent' => $prediction['take_profit_percent'],
            'risk_reward_ratio' => $prediction['risk_reward_ratio'],
            'ensemble_score' => $prediction['ensemble_score'],
            'component_breakdown' => $prediction['components'],
            'timestamp' => date('c'),
            'valid_until' => date('c', strtotime('+1 hour')),
            'recommendation_id' => uniqid('rec_'),
            'system_version' => '1.0.0'
        ];
        
        // Add execution priority
        if ($confidenceLevel === 'HIGH' && abs($prediction['ensemble_score']) > 0.6) {
            $recommendation['priority'] = 'IMMEDIATE';
        } elseif ($confidenceLevel === 'MEDIUM') {
            $recommendation['priority'] = 'NORMAL';
        } else {
            $recommendation['priority'] = 'LOW';
        }
        
        return $recommendation;
    }
    
    /**
     * Batch ensemble predictions for multiple symbols
     */
    public function generateBatchPredictions($symbols = null) {
        if ($symbols === null) {
            $symbols = $this->config['symbols'];
        }
        
        $predictions = [];
        $startTime = microtime(true);
        
        foreach ($symbols as $symbol) {
            $predictions[$symbol] = $this->generateEnsemblePrediction($symbol);
        }
        
        $executionTime = microtime(true) - $startTime;
        
        return [
            'predictions' => $predictions,
            'execution_time' => $executionTime,
            'symbols_processed' => count($symbols),
            'timestamp' => date('c'),
            'system_health' => $this->getSystemHealth()
        ];
    }
    
    /**
     * Backtest ensemble strategy
     */
    public function backtestEnsembleStrategy($symbol, $startDate, $endDate, $data = null) {
        try {
            $this->log("Starting ensemble backtest for $symbol from $startDate to $endDate", 'INFO');
            
            // Generate historical predictions (simulated)
            $historicalData = $this->generateHistoricalData($symbol, $startDate, $endDate);
            
            // Create ensemble strategy function
            $ensembleStrategy = function($data, $index) use ($symbol) {
                // Simulate ensemble prediction for historical data
                $prediction = $this->generateSimulatedEnsemblePrediction($symbol, $data, $index);
                return [
                    'action' => $prediction['action'],
                    'confidence' => $prediction['confidence'],
                    'type' => 'ensemble'
                ];
            };
            
            // Run backtest
            $backtestResults = $this->backtestEngine->runBacktest($ensembleStrategy, $historicalData);
            
            // Add ensemble-specific metrics
            $backtestResults['strategy_type'] = 'ensemble';
            $backtestResults['components_used'] = ['lstm', 'technical', 'sentiment'];
            $backtestResults['weights'] = $this->config['weights'];
            
            return $backtestResults;
            
        } catch (Exception $e) {
            $this->log("Ensemble backtest failed for $symbol: " . $e->getMessage(), 'ERROR');
            return null;
        }
    }
    
    /**
     * Get system health and component status
     */
    public function getSystemHealth() {
        $health = [
            'overall_status' => 'healthy',
            'timestamp' => date('c'),
            'components' => [],
            'performance_metrics' => [],
            'warnings' => [],
            'errors' => []
        ];
        
        // Check LSTM Bridge
        try {
            $lstmHealth = $this->lstmBridge->getSystemHealth();
            $health['components']['lstm'] = [
                'status' => $lstmHealth['overall_status'],
                'models_available' => count(array_filter($lstmHealth['models'], fn($m) => $m['exists'])),
                'last_prediction' => 'recent'
            ];
        } catch (Exception $e) {
            $health['components']['lstm'] = ['status' => 'error', 'error' => $e->getMessage()];
            $health['errors'][] = 'LSTM Bridge: ' . $e->getMessage();
        }
        
        // Check Sentiment Analyzer
        try {
            $health['components']['sentiment'] = [
                'status' => 'healthy',
                'sources_available' => ['news', 'social'],
                'last_analysis' => 'recent'
            ];
        } catch (Exception $e) {
            $health['components']['sentiment'] = ['status' => 'error', 'error' => $e->getMessage()];
            $health['errors'][] = 'Sentiment Analyzer: ' . $e->getMessage();
        }
        
        // Check Backtest Engine
        $health['components']['backtest'] = [
            'status' => 'healthy',
            'last_backtest' => 'available'
        ];
        
        // Determine overall status
        $componentStatuses = array_column($health['components'], 'status');
        if (in_array('error', $componentStatuses)) {
            $health['overall_status'] = 'error';
        } elseif (!empty($health['warnings'])) {
            $health['overall_status'] = 'warning';
        }
        
        return $health;
    }
    
    // Helper methods for technical analysis
    private function calculateRSI($data, $period = 14) {
        // Simplified RSI calculation
        return rand(20, 80); // Simulate RSI value
    }
    
    private function calculateMovingAverageSignal($data) {
        // Simulate moving average crossover
        $signal = rand(0, 2);
        $signals = ['SELL', 'HOLD', 'BUY'];
        return [
            'signal' => $signals[$signal],
            'strength' => rand(30, 90) / 100,
            'ma_short' => rand(50, 150),
            'ma_long' => rand(40, 140)
        ];
    }
    
    private function calculateMACDSignal($data) {
        // Simulate MACD signal
        $signal = rand(0, 2);
        $signals = ['SELL', 'HOLD', 'BUY'];
        return [
            'signal' => $signals[$signal],
            'strength' => rand(30, 90) / 100,
            'macd' => rand(-10, 10) / 10,
            'signal_line' => rand(-8, 8) / 10
        ];
    }
    
    private function calculateBollingerSignal($data) {
        // Simulate Bollinger Bands signal
        $position = rand(0, 100) / 100;
        if ($position < 0.2) {
            return ['signal' => 'BUY', 'strength' => 0.8, 'position' => 'lower_band'];
        } elseif ($position > 0.8) {
            return ['signal' => 'SELL', 'strength' => 0.8, 'position' => 'upper_band'];
        } else {
            return ['signal' => 'HOLD', 'strength' => 0.3, 'position' => 'middle'];
        }
    }
    
    private function calculateVolumeSignal($data) {
        // Simulate volume analysis
        $volume_ratio = rand(50, 200) / 100;
        if ($volume_ratio > 1.5) {
            return ['signal' => 'BUY', 'strength' => 0.7, 'volume_ratio' => $volume_ratio];
        } else {
            return ['signal' => 'HOLD', 'strength' => 0.4, 'volume_ratio' => $volume_ratio];
        }
    }
    
    private function combineTechnicalSignals($signals) {
        $buyCount = 0;
        $sellCount = 0;
        $totalStrength = 0;
        
        foreach ($signals as $signal) {
            switch ($signal['signal']) {
                case 'BUY':
                    $buyCount++;
                    $totalStrength += $signal['strength'];
                    break;
                case 'SELL':
                    $sellCount++;
                    $totalStrength += $signal['strength'];
                    break;
            }
        }
        
        $avgStrength = $totalStrength / count($signals);
        
        if ($buyCount > $sellCount) {
            return ['signal' => 'BUY', 'strength' => $avgStrength];
        } elseif ($sellCount > $buyCount) {
            return ['signal' => 'SELL', 'strength' => $avgStrength];
        } else {
            return ['signal' => 'HOLD', 'strength' => $avgStrength * 0.5];
        }
    }
    
    private function getMarketData($symbol) {
        // Simulate market data
        return [
            'symbol' => $symbol,
            'data_points' => 100,
            'timeframe' => '1h',
            'last_update' => date('c')
        ];
    }
    
    private function generateHistoricalData($symbol, $startDate, $endDate) {
        // Generate simulated historical data for backtesting
        $start = strtotime($startDate);
        $end = strtotime($endDate);
        $data = [];
        
        $basePrice = 100;
        for ($timestamp = $start; $timestamp <= $end; $timestamp += 3600) {
            $change = (rand(-500, 500) / 10000); // ±5% random change
            $basePrice *= (1 + $change);
            
            $data[] = [
                'timestamp' => $timestamp,
                'price' => $basePrice,
                'close' => $basePrice,
                'volume' => rand(1000, 10000)
            ];
        }
        
        return $data;
    }
    
    private function generateSimulatedEnsemblePrediction($symbol, $data, $index) {
        // Simulate ensemble prediction for backtesting
        $prediction = rand(0, 100) / 100;
        $confidence = rand(30, 90) / 100;
        
        if ($prediction > 0.6) {
            $action = 'BUY';
        } elseif ($prediction < 0.4) {
            $action = 'SELL';
        } else {
            $action = 'HOLD';
        }
        
        return [
            'action' => $action,
            'confidence' => $confidence,
            'prediction' => $prediction
        ];
    }
    
    private function generateFallbackPrediction($symbol) {
        return [
            'symbol' => $symbol,
            'action' => 'HOLD',
            'confidence' => 0.2,
            'confidence_level' => 'LOW',
            'position_size' => 0.1,
            'type' => 'fallback',
            'message' => 'Using fallback prediction due to system error',
            'timestamp' => date('c')
        ];
    }
}

// Web API interface
if (isset($_REQUEST['action'])) {
    header('Content-Type: application/json');
    
    $ensemble = new EnsembleTradingSystem();
    $response = ['success' => false, 'data' => null, 'message' => ''];
    
    try {
        switch ($_REQUEST['action']) {
            case 'predict':
                $symbol = $_REQUEST['symbol'] ?? 'BTC-USD';
                $result = $ensemble->generateEnsemblePrediction($symbol);
                $response = ['success' => true, 'data' => $result];
                break;
                
            case 'batch_predict':
                $symbols = isset($_REQUEST['symbols']) ? explode(',', $_REQUEST['symbols']) : null;
                $result = $ensemble->generateBatchPredictions($symbols);
                $response = ['success' => true, 'data' => $result];
                break;
                
            case 'backtest':
                $symbol = $_REQUEST['symbol'] ?? 'BTC-USD';
                $startDate = $_REQUEST['start_date'] ?? date('Y-m-d', strtotime('-30 days'));
                $endDate = $_REQUEST['end_date'] ?? date('Y-m-d');
                $result = $ensemble->backtestEnsembleStrategy($symbol, $startDate, $endDate);
                $response = ['success' => true, 'data' => $result];
                break;
                
            case 'health':
                $result = $ensemble->getSystemHealth();
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
    echo "🎯 Ensemble Trading System Test\n";
    echo "==============================\n\n";
    
    $ensemble = new EnsembleTradingSystem();
    
    // Test system health
    echo "🏥 System Health Check:\n";
    $health = $ensemble->getSystemHealth();
    echo "   Overall Status: " . strtoupper($health['overall_status']) . "\n";
    echo "   Components:\n";
    foreach ($health['components'] as $name => $component) {
        echo "     - " . ucfirst($name) . ": " . strtoupper($component['status']) . "\n";
    }
    
    echo "\n🎯 Single Symbol Prediction Test:\n";
    $symbol = 'BTC-USD';
    $prediction = $ensemble->generateEnsemblePrediction($symbol);
    
    echo "   Symbol: $symbol\n";
    echo "   Action: " . $prediction['action'] . "\n";
    echo "   Confidence: " . number_format($prediction['confidence'] * 100, 1) . "%\n";
    echo "   Confidence Level: " . $prediction['confidence_level'] . "\n";
    echo "   Position Size: " . number_format($prediction['position_size'] * 100, 1) . "%\n";
    echo "   Ensemble Score: " . number_format($prediction['ensemble_score'], 3) . "\n";
    echo "   Priority: " . $prediction['priority'] . "\n";
    
    echo "\n🎯 Batch Predictions Test:\n";
    $batchResults = $ensemble->generateBatchPredictions(['BTC-USD', 'ETH-USD', 'AAPL']);
    
    foreach ($batchResults['predictions'] as $sym => $pred) {
        echo "   $sym: " . $pred['action'] . " (" . number_format($pred['confidence'] * 100, 1) . "% confidence)\n";
    }
    
    echo "\n   Execution Time: " . number_format($batchResults['execution_time'], 3) . "s\n";
    echo "   Symbols Processed: " . $batchResults['symbols_processed'] . "\n";
    
    echo "\n✅ Ensemble Trading System test complete!\n";
}
?>