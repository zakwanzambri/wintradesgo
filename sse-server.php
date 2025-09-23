<?php
/**
 * Server-Sent Events (SSE) Alternative to WebSocket
 * Real-time data streaming without socket dependencies
 */

require_once 'ai/MarketDataAPI.php';
require_once 'ai/EnhancedAITradingEngine.php';

// Set SSE headers
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Cache-Control');

// Disable output buffering
if (ob_get_level()) ob_end_clean();

class SSETradingServer {
    
    private $marketDataAPI;
    private $aiEngine;
    private $lastUpdate = 0;
    private $updateInterval = 5; // seconds
    
    public function __construct() {
        $this->marketDataAPI = new MarketDataAPI();
        $this->aiEngine = new EnhancedAITradingEngine();
    }
    
    /**
     * Start SSE streaming
     */
    public function stream() {
        set_time_limit(0); // No time limit
        
        // Send initial connection message
        $this->sendEvent('connection', [
            'status' => 'connected',
            'timestamp' => date('Y-m-d H:i:s'),
            'message' => 'WinTrades AI SSE Stream Connected'
        ]);
        
        $startTime = time();
        $iterationCount = 0;
        
        while (true) {
            $currentTime = time();
            
            // Send periodic updates every 5 seconds
            if ($currentTime - $this->lastUpdate >= $this->updateInterval) {
                $this->sendMarketUpdates();
                $this->sendAISignalUpdates();
                $this->lastUpdate = $currentTime;
                $iterationCount++;
            }
            
            // Send heartbeat every 30 seconds
            if ($iterationCount % 6 == 0 && $iterationCount > 0) {
                $this->sendHeartbeat();
            }
            
            // Prevent infinite running (limit to 5 minutes)
            if ($currentTime - $startTime > 300) {
                $this->sendEvent('timeout', [
                    'message' => 'Session timeout reached',
                    'duration' => 300
                ]);
                break;
            }
            
            // Flush output
            if (ob_get_level()) ob_flush();
            flush();
            
            // Small sleep to prevent CPU overload
            usleep(500000); // 0.5 seconds
            
            // Check if client disconnected
            if (connection_aborted()) {
                break;
            }
        }
    }
    
    /**
     * Send market data updates
     */
    private function sendMarketUpdates() {
        try {
            $symbols = ['bitcoin', 'ethereum', 'cardano'];
            $marketData = [];
            
            foreach ($symbols as $symbol) {
                $data = $this->marketDataAPI->getCurrentPrice($symbol);
                if ($data) {
                    $marketData[] = [
                        'symbol' => strtoupper(str_replace('bitcoin', 'BTC', str_replace('ethereum', 'ETH', str_replace('cardano', 'ADA', $symbol)))),
                        'price' => $data['price'] ?? 0,
                        'change_24h' => $data['change_24h'] ?? 0,
                        'volume' => $data['volume'] ?? 0,
                        'timestamp' => date('Y-m-d H:i:s')
                    ];
                }
            }
            
            if (!empty($marketData)) {
                $this->sendEvent('market_update', [
                    'type' => 'market_data',
                    'data' => $marketData,
                    'timestamp' => date('Y-m-d H:i:s')
                ]);
            }
            
        } catch (Exception $e) {
            $this->sendEvent('error', [
                'type' => 'market_data_error',
                'message' => $e->getMessage(),
                'timestamp' => date('Y-m-d H:i:s')
            ]);
        }
    }
    
    /**
     * Send AI signal updates
     */
    private function sendAISignalUpdates() {
        try {
            $symbols = ['BTC', 'ETH'];
            
            foreach ($symbols as $symbol) {
                $signalData = $this->aiEngine->generateAdvancedSignal($symbol);
                
                if ($signalData) {
                    $this->sendEvent('ai_signal_update', [
                        'type' => 'ai_signal',
                        'symbol' => $symbol,
                        'signal_type' => $signalData['signal_type'] ?? 'HOLD',
                        'confidence' => $signalData['confidence'] ?? 50,
                        'lstm_prediction' => $signalData['lstm_prediction'] ?? null,
                        'technical_analysis' => $signalData['technical_analysis'] ?? null,
                        'timestamp' => date('Y-m-d H:i:s')
                    ]);
                }
            }
            
        } catch (Exception $e) {
            $this->sendEvent('error', [
                'type' => 'ai_signal_error',
                'message' => $e->getMessage(),
                'timestamp' => date('Y-m-d H:i:s')
            ]);
        }
    }
    
    /**
     * Send heartbeat to keep connection alive
     */
    private function sendHeartbeat() {
        $this->sendEvent('heartbeat', [
            'timestamp' => date('Y-m-d H:i:s'),
            'uptime' => time() - $_SERVER['REQUEST_TIME'],
            'memory_usage' => memory_get_usage(true)
        ]);
    }
    
    /**
     * Send SSE event
     */
    private function sendEvent($eventType, $data) {
        echo "event: {$eventType}\n";
        echo "data: " . json_encode($data) . "\n\n";
        
        // Flush immediately
        if (ob_get_level()) ob_flush();
        flush();
    }
    
    /**
     * Handle client subscriptions
     */
    public function handleSubscription() {
        $input = file_get_contents('php://input');
        $subscription = json_decode($input, true);
        
        if ($subscription && isset($subscription['type'])) {
            switch ($subscription['type']) {
                case 'subscribe_market':
                    $this->sendEvent('subscription_confirmed', [
                        'type' => 'market_data',
                        'symbols' => $subscription['symbols'] ?? ['BTC', 'ETH', 'ADA'],
                        'interval' => $this->updateInterval
                    ]);
                    break;
                    
                case 'subscribe_signals':
                    $this->sendEvent('subscription_confirmed', [
                        'type' => 'ai_signals',
                        'symbols' => $subscription['symbols'] ?? ['BTC', 'ETH'],
                        'interval' => $this->updateInterval
                    ]);
                    break;
                    
                default:
                    $this->sendEvent('error', [
                        'message' => 'Unknown subscription type',
                        'received' => $subscription['type']
                    ]);
            }
        }
    }
}

// Handle different request types
$requestMethod = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'stream';

$sseServer = new SSETradingServer();

switch ($action) {
    case 'stream':
        // Start SSE streaming
        $sseServer->stream();
        break;
        
    case 'subscribe':
        // Handle subscription requests
        $sseServer->handleSubscription();
        break;
        
    case 'status':
        // Return server status
        header('Content-Type: application/json');
        echo json_encode([
            'status' => 'operational',
            'type' => 'sse_server',
            'endpoints' => [
                'stream' => '?action=stream',
                'subscribe' => '?action=subscribe',
                'status' => '?action=status'
            ],
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        break;
        
    default:
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode([
            'error' => 'Invalid action',
            'valid_actions' => ['stream', 'subscribe', 'status']
        ]);
}

?>