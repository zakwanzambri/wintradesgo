<?php
/**
 * Simple Polling API for Real-time Data Alternative
 * No WebSocket or SSE dependencies
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'ai/MarketDataAPI.php';
require_once 'ai/EnhancedAITradingEngine.php';

class PollingAPI {
    
    private $marketDataAPI;
    private $aiEngine;
    
    public function __construct() {
        $this->marketDataAPI = new MarketDataAPI();
        $this->aiEngine = new EnhancedAITradingEngine();
    }
    
    /**
     * Get live updates for polling
     */
    public function getLiveUpdates() {
        $response = [
            'status' => 'success',
            'timestamp' => date('Y-m-d H:i:s'),
            'type' => 'polling_update',
            'data' => []
        ];
        
        try {
            // Get market data
            $marketData = $this->getMarketData();
            $response['data']['market'] = $marketData;
            
            // Get AI signals
            $aiSignals = $this->getAISignals();
            $response['data']['ai_signals'] = $aiSignals;
            
            // Add system status
            $response['data']['system'] = [
                'uptime' => time() - $_SERVER['REQUEST_TIME'],
                'memory_usage' => memory_get_usage(true),
                'status' => 'operational'
            ];
            
        } catch (Exception $e) {
            $response['status'] = 'error';
            $response['message'] = $e->getMessage();
        }
        
        return $response;
    }
    
    /**
     * Get current market data
     */
    private function getMarketData() {
        $symbols = ['bitcoin', 'ethereum', 'cardano'];
        $marketData = [];
        
        foreach ($symbols as $symbol) {
            try {
                $data = $this->marketDataAPI->getCurrentPrice($symbol);
                if ($data) {
                    $symbolCode = strtoupper(str_replace(
                        ['bitcoin', 'ethereum', 'cardano'], 
                        ['BTC', 'ETH', 'ADA'], 
                        $symbol
                    ));
                    
                    $marketData[] = [
                        'symbol' => $symbolCode,
                        'price' => $data['price'] ?? 0,
                        'change_24h' => $data['change_24h'] ?? 0,
                        'volume' => $data['volume'] ?? 0,
                        'last_update' => date('H:i:s')
                    ];
                }
            } catch (Exception $e) {
                // Continue with other symbols if one fails
                continue;
            }
        }
        
        return $marketData;
    }
    
    /**
     * Get AI signals
     */
    private function getAISignals() {
        $symbols = ['BTC', 'ETH'];
        $aiSignals = [];
        
        foreach ($symbols as $symbol) {
            try {
                $signalData = $this->aiEngine->generateAdvancedSignal($symbol);
                
                if ($signalData) {
                    $aiSignals[] = [
                        'symbol' => $symbol,
                        'signal_type' => $signalData['signal_type'] ?? 'HOLD',
                        'confidence' => $signalData['confidence'] ?? 50,
                        'lstm_confidence' => ($signalData['lstm_prediction']['confidence'] ?? 0) * 100,
                        'last_update' => date('H:i:s'),
                        'reasons' => $signalData['ai_signal']['reasons'] ?? []
                    ];
                }
            } catch (Exception $e) {
                // Continue with other symbols if one fails
                continue;
            }
        }
        
        return $aiSignals;
    }
    
    /**
     * Get connection test
     */
    public function getConnectionTest() {
        return [
            'status' => 'success',
            'type' => 'polling_api',
            'timestamp' => date('Y-m-d H:i:s'),
            'endpoints' => [
                'live_updates' => '?action=updates',
                'market_only' => '?action=market',
                'signals_only' => '?action=signals',
                'test' => '?action=test'
            ],
            'message' => 'WinTrades Polling API Active'
        ];
    }
}

// Handle requests
$action = $_GET['action'] ?? 'updates';
$pollingAPI = new PollingAPI();

switch ($action) {
    case 'updates':
        echo json_encode($pollingAPI->getLiveUpdates());
        break;
        
    case 'market':
        $updates = $pollingAPI->getLiveUpdates();
        echo json_encode([
            'status' => $updates['status'],
            'timestamp' => $updates['timestamp'],
            'data' => $updates['data']['market'] ?? []
        ]);
        break;
        
    case 'signals':
        $updates = $pollingAPI->getLiveUpdates();
        echo json_encode([
            'status' => $updates['status'],
            'timestamp' => $updates['timestamp'],
            'data' => $updates['data']['ai_signals'] ?? []
        ]);
        break;
        
    case 'test':
        echo json_encode($pollingAPI->getConnectionTest());
        break;
        
    default:
        http_response_code(400);
        echo json_encode([
            'error' => 'Invalid action',
            'valid_actions' => ['updates', 'market', 'signals', 'test']
        ]);
}

?>