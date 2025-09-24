<?php
/**
 * ML Status Proxy - CORS-free endpoint for React
 * Returns system status without CORS issues
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    // Direct call to Phase 3 ML API class
    require_once __DIR__ . '/../../enhanced_lstm_bridge.php';
    require_once __DIR__ . '/../../real_sentiment_analysis.php';
    require_once __DIR__ . '/../../professional_backtest_engine.php';
    require_once __DIR__ . '/../../ensemble_strategy.php';
    
    // Create API instance
    class Phase3MLAPI {
        public function getSystemStatus() {
            $status = [
                'system' => 'Phase 3 ML Integration',
                'timestamp' => date('Y-m-d H:i:s'),
                'components' => []
            ];
            
            // Check LSTM
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
            
            // Check Sentiment
            try {
                if (class_exists('RealSentimentAnalysis')) {
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
            
            // Check Backtest
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
            
            // Check Ensemble
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
            
            return [
                'success' => true,
                'data' => $status,
                'timestamp' => date('Y-m-d H:i:s')
            ];
        }
    }
    
    $api = new Phase3MLAPI();
    $response = $api->getSystemStatus();
    echo json_encode($response, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Proxy error: ' . $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>