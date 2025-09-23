<?php
/**
 * WebSocket Server for Real-time Trading Data
 * Provides live market data, AI signals, and trading updates
 */

require_once 'ai/MarketDataAPI.php';
require_once 'ai/EnhancedAITradingEngine.php';

class WebSocketTradingServer {
    
    private $server;
    private $clients = [];
    private $marketDataAPI;
    private $aiEngine;
    private $subscriptions = [];
    private $lastUpdate = 0;
    private $updateInterval = 5; // seconds
    
    public function __construct($host = '127.0.0.1', $port = 8080) {
        $this->marketDataAPI = new MarketDataAPI();
        $this->aiEngine = new EnhancedAITradingEngine();
        
        // Create socket server
        $this->server = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
        socket_set_option($this->server, SOL_SOCKET, SO_REUSEADDR, 1);
        socket_bind($this->server, $host, $port);
        socket_listen($this->server, 5);
        socket_set_nonblock($this->server);
        
        echo "WebSocket Trading Server started on {$host}:{$port}\n";
    }
    
    /**
     * Start the WebSocket server
     */
    public function start() {
        while (true) {
            // Accept new connections
            $newClient = @socket_accept($this->server);
            if ($newClient !== false) {
                $this->handleNewConnection($newClient);
            }
            
            // Handle existing clients
            $this->handleClientMessages();
            
            // Send periodic updates
            $this->sendPeriodicUpdates();
            
            // Clean up disconnected clients
            $this->cleanupClients();
            
            usleep(100000); // 100ms
        }
    }
    
    /**
     * Handle new WebSocket connection
     */
    private function handleNewConnection($client) {
        $request = socket_read($client, 1024);
        $response = $this->createWebSocketHandshake($request);
        socket_write($client, $response, strlen($response));
        
        $clientId = uniqid();
        $this->clients[$clientId] = [
            'socket' => $client,
            'handshaked' => true,
            'subscriptions' => [],
            'last_ping' => time(),
            'connected_at' => time()
        ];
        
        echo "New client connected: {$clientId}\n";
        
        // Send welcome message
        $welcomeData = [
            'type' => 'welcome',
            'client_id' => $clientId,
            'server_time' => date('Y-m-d H:i:s'),
            'available_streams' => [
                'market_data' => 'Real-time market prices',
                'ai_signals' => 'AI trading signals',
                'portfolio_updates' => 'Portfolio changes',
                'alerts' => 'Price and signal alerts'
            ]
        ];
        
        $this->sendToClient($clientId, $welcomeData);
    }
    
    /**
     * Handle client messages
     */
    private function handleClientMessages() {
        foreach ($this->clients as $clientId => $client) {
            if (!$client['socket']) continue;
            
            $message = @socket_read($client['socket'], 1024, PHP_NORMAL_READ);
            if ($message === false || $message === '') continue;
            
            $data = $this->decodeWebSocketFrame($message);
            if (!$data) continue;
            
            $this->processClientMessage($clientId, $data);
        }
    }
    
    /**
     * Process incoming client message
     */
    private function processClientMessage($clientId, $message) {
        $data = json_decode($message, true);
        if (!$data || !isset($data['type'])) return;
        
        switch ($data['type']) {
            case 'subscribe':
                $this->handleSubscription($clientId, $data);
                break;
                
            case 'unsubscribe':
                $this->handleUnsubscription($clientId, $data);
                break;
                
            case 'get_signal':
                $this->handleSignalRequest($clientId, $data);
                break;
                
            case 'ping':
                $this->handlePing($clientId);
                break;
                
            case 'get_market_data':
                $this->handleMarketDataRequest($clientId, $data);
                break;
                
            default:
                $this->sendError($clientId, 'Unknown message type: ' . $data['type']);
        }
    }
    
    /**
     * Handle subscription requests
     */
    private function handleSubscription($clientId, $data) {
        $stream = $data['stream'] ?? '';
        $symbols = $data['symbols'] ?? ['BTC', 'ETH'];
        
        if (!isset($this->clients[$clientId])) return;
        
        $this->clients[$clientId]['subscriptions'][$stream] = $symbols;
        
        $response = [
            'type' => 'subscription_confirmed',
            'stream' => $stream,
            'symbols' => $symbols,
            'timestamp' => date('Y-m-d H:i:s')
        ];
        
        $this->sendToClient($clientId, $response);
        
        echo "Client {$clientId} subscribed to {$stream} for symbols: " . implode(', ', $symbols) . "\n";
    }
    
    /**
     * Handle AI signal requests
     */
    private function handleSignalRequest($clientId, $data) {
        $symbol = $data['symbol'] ?? 'BTC';
        
        try {
            $signal = $this->aiEngine->generateAdvancedSignal($symbol);
            
            $response = [
                'type' => 'ai_signal',
                'symbol' => $symbol,
                'signal' => $signal,
                'timestamp' => date('Y-m-d H:i:s')
            ];
            
            $this->sendToClient($clientId, $response);
            
        } catch (Exception $e) {
            $this->sendError($clientId, 'Failed to generate signal: ' . $e->getMessage());
        }
    }
    
    /**
     * Handle market data requests
     */
    private function handleMarketDataRequest($clientId, $data) {
        $symbols = $data['symbols'] ?? ['bitcoin', 'ethereum'];
        
        try {
            $marketData = $this->marketDataAPI->getCurrentPrices($symbols);
            
            $response = [
                'type' => 'market_data',
                'data' => $marketData,
                'timestamp' => date('Y-m-d H:i:s')
            ];
            
            $this->sendToClient($clientId, $response);
            
        } catch (Exception $e) {
            $this->sendError($clientId, 'Failed to get market data: ' . $e->getMessage());
        }
    }
    
    /**
     * Handle ping requests
     */
    private function handlePing($clientId) {
        if (isset($this->clients[$clientId])) {
            $this->clients[$clientId]['last_ping'] = time();
            
            $response = [
                'type' => 'pong',
                'timestamp' => date('Y-m-d H:i:s')
            ];
            
            $this->sendToClient($clientId, $response);
        }
    }
    
    /**
     * Send periodic updates to subscribed clients
     */
    private function sendPeriodicUpdates() {
        $now = time();
        if ($now - $this->lastUpdate < $this->updateInterval) return;
        
        $this->lastUpdate = $now;
        
        // Get fresh market data
        $symbols = ['bitcoin', 'ethereum', 'cardano', 'solana'];
        $marketData = $this->marketDataAPI->getCurrentPrices($symbols);
        
        foreach ($this->clients as $clientId => $client) {
            $subscriptions = $client['subscriptions'] ?? [];
            
            // Send market data updates
            if (isset($subscriptions['market_data'])) {
                $subscribedSymbols = $subscriptions['market_data'];
                $filteredData = array_filter($marketData, function($item) use ($subscribedSymbols) {
                    return in_array($item['symbol'], $subscribedSymbols);
                });
                
                if (!empty($filteredData)) {
                    $update = [
                        'type' => 'market_update',
                        'data' => array_values($filteredData),
                        'timestamp' => date('Y-m-d H:i:s')
                    ];
                    
                    $this->sendToClient($clientId, $update);
                }
            }
            
            // Send AI signal updates
            if (isset($subscriptions['ai_signals'])) {
                $subscribedSymbols = $subscriptions['ai_signals'];
                
                foreach ($subscribedSymbols as $symbol) {
                    // Generate signals less frequently (every 30 seconds)
                    if ($now % 30 === 0) {
                        try {
                            $signal = $this->aiEngine->generateAdvancedSignal($symbol);
                            
                            $update = [
                                'type' => 'ai_signal_update',
                                'symbol' => $symbol,
                                'signal' => $signal,
                                'timestamp' => date('Y-m-d H:i:s')
                            ];
                            
                            $this->sendToClient($clientId, $update);
                            
                        } catch (Exception $e) {
                            // Log error but don't disconnect client
                            error_log("AI signal generation failed for {$symbol}: " . $e->getMessage());
                        }
                    }
                }
            }
        }
    }
    
    /**
     * Send message to specific client
     */
    private function sendToClient($clientId, $data) {
        if (!isset($this->clients[$clientId]) || !$this->clients[$clientId]['socket']) {
            return false;
        }
        
        $message = json_encode($data);
        $frame = $this->encodeWebSocketFrame($message);
        
        $result = @socket_write($this->clients[$clientId]['socket'], $frame, strlen($frame));
        
        if ($result === false) {
            echo "Failed to send message to client {$clientId}\n";
            $this->disconnectClient($clientId);
            return false;
        }
        
        return true;
    }
    
    /**
     * Send error message to client
     */
    private function sendError($clientId, $error) {
        $errorData = [
            'type' => 'error',
            'message' => $error,
            'timestamp' => date('Y-m-d H:i:s')
        ];
        
        $this->sendToClient($clientId, $errorData);
    }
    
    /**
     * Broadcast message to all clients
     */
    private function broadcast($data) {
        foreach ($this->clients as $clientId => $client) {
            $this->sendToClient($clientId, $data);
        }
    }
    
    /**
     * Clean up disconnected clients
     */
    private function cleanupClients() {
        $now = time();
        $timeout = 60; // 60 seconds timeout
        
        foreach ($this->clients as $clientId => $client) {
            // Check for timeout
            if ($now - $client['last_ping'] > $timeout) {
                echo "Client {$clientId} timed out\n";
                $this->disconnectClient($clientId);
                continue;
            }
            
            // Check if socket is still valid
            if (!$client['socket'] || !is_resource($client['socket'])) {
                echo "Client {$clientId} socket invalid\n";
                unset($this->clients[$clientId]);
            }
        }
    }
    
    /**
     * Disconnect a client
     */
    private function disconnectClient($clientId) {
        if (isset($this->clients[$clientId])) {
            if ($this->clients[$clientId]['socket']) {
                @socket_close($this->clients[$clientId]['socket']);
            }
            unset($this->clients[$clientId]);
            echo "Client {$clientId} disconnected\n";
        }
    }
    
    /**
     * Create WebSocket handshake response
     */
    private function createWebSocketHandshake($request) {
        $headers = [];
        $lines = preg_split("/\r\n/", $request);
        
        foreach ($lines as $line) {
            $line = chop($line);
            if (preg_match('/\A(\S+): (.*)\z/', $line, $matches)) {
                $headers[$matches[1]] = $matches[2];
            }
        }
        
        $secKey = $headers['Sec-WebSocket-Key'];
        $secAccept = base64_encode(pack('H*', sha1($secKey . '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')));
        
        $response = "HTTP/1.1 101 Switching Protocols\r\n" .
                   "Upgrade: websocket\r\n" .
                   "Connection: Upgrade\r\n" .
                   "Sec-WebSocket-Accept: {$secAccept}\r\n\r\n";
        
        return $response;
    }
    
    /**
     * Encode WebSocket frame
     */
    private function encodeWebSocketFrame($message) {
        $length = strlen($message);
        
        if ($length <= 125) {
            return pack('CC', 0x81, $length) . $message;
        } elseif ($length <= 65535) {
            return pack('CCn', 0x81, 126, $length) . $message;
        } else {
            return pack('CCNN', 0x81, 127, 0, $length) . $message;
        }
    }
    
    /**
     * Decode WebSocket frame
     */
    private function decodeWebSocketFrame($frame) {
        if (strlen($frame) < 2) return false;
        
        $firstByte = ord($frame[0]);
        $secondByte = ord($frame[1]);
        
        $opcode = $firstByte & 0x0F;
        $masked = ($secondByte & 0x80) === 0x80;
        $payloadLength = $secondByte & 0x7F;
        
        if ($opcode !== 0x01) return false; // Only handle text frames
        
        $offset = 2;
        
        if ($payloadLength === 126) {
            $payloadLength = unpack('n', substr($frame, $offset, 2))[1];
            $offset += 2;
        } elseif ($payloadLength === 127) {
            $payloadLength = unpack('J', substr($frame, $offset, 8))[1];
            $offset += 8;
        }
        
        if ($masked) {
            $maskKey = substr($frame, $offset, 4);
            $offset += 4;
            $payload = substr($frame, $offset, $payloadLength);
            
            for ($i = 0; $i < $payloadLength; $i++) {
                $payload[$i] = $payload[$i] ^ $maskKey[$i % 4];
            }
        } else {
            $payload = substr($frame, $offset, $payloadLength);
        }
        
        return $payload;
    }
    
    /**
     * Get server statistics
     */
    public function getStats() {
        return [
            'total_clients' => count($this->clients),
            'uptime' => time() - $this->lastUpdate,
            'last_update' => date('Y-m-d H:i:s', $this->lastUpdate),
            'clients' => array_map(function($client) {
                return [
                    'connected_at' => date('Y-m-d H:i:s', $client['connected_at']),
                    'last_ping' => date('Y-m-d H:i:s', $client['last_ping']),
                    'subscriptions' => array_keys($client['subscriptions'])
                ];
            }, $this->clients)
        ];
    }
    
    /**
     * Graceful shutdown
     */
    public function shutdown() {
        echo "Shutting down WebSocket server...\n";
        
        // Notify all clients
        $shutdownMessage = [
            'type' => 'server_shutdown',
            'message' => 'Server is shutting down',
            'timestamp' => date('Y-m-d H:i:s')
        ];
        
        $this->broadcast($shutdownMessage);
        
        // Close all client connections
        foreach ($this->clients as $clientId => $client) {
            $this->disconnectClient($clientId);
        }
        
        // Close server socket
        socket_close($this->server);
        
        echo "WebSocket server stopped\n";
    }
}

// CLI usage
if (php_sapi_name() === 'cli') {
    $host = $argv[1] ?? '127.0.0.1';
    $port = $argv[2] ?? 8080;
    
    $server = new WebSocketTradingServer($host, $port);
    
    // Handle shutdown signals
    pcntl_signal(SIGTERM, function() use ($server) {
        $server->shutdown();
        exit(0);
    });
    
    pcntl_signal(SIGINT, function() use ($server) {
        $server->shutdown();
        exit(0);
    });
    
    try {
        $server->start();
    } catch (Exception $e) {
        echo "Server error: " . $e->getMessage() . "\n";
        $server->shutdown();
    }
}
?>