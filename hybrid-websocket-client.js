/**
 * Hybrid WebSocket Client - Combines Binance Direct Stream + Custom AI Backend
 * Best of both worlds: Real-time market data + AI insights
 */

class HybridTradingClient {
    constructor() {
        this.binanceWS = null;
        this.aiBackendWS = null;
        this.subscribers = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
    }

    /**
     * Initialize both WebSocket connections
     */
    async initialize() {
        try {
            // Connect to Binance WebSocket for real-time market data
            await this.connectToBinance();
            
            // Connect to our AI backend for signals and analytics
            await this.connectToAIBackend();
            
            console.log('✅ Hybrid WebSocket client initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize hybrid client:', error);
            return false;
        }
    }

    /**
     * Connect to Binance WebSocket directly
     */
    connectToBinance() {
        return new Promise((resolve, reject) => {
            // Use Binance public WebSocket endpoint
            this.binanceWS = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@ticker/ethusdt@ticker/adausdt@ticker');
            
            this.binanceWS.onopen = () => {
                console.log('🔗 Connected to Binance WebSocket');
                this.reconnectAttempts = 0;
                resolve();
            };

            this.binanceWS.onmessage = (event) => {
                this.handleBinanceMessage(event.data);
            };

            this.binanceWS.onclose = () => {
                console.log('🔌 Binance WebSocket disconnected');
                this.handleBinanceReconnect();
            };

            this.binanceWS.onerror = (error) => {
                console.error('💥 Binance WebSocket error:', error);
                reject(error);
            };

            // Set connection timeout
            setTimeout(() => {
                if (this.binanceWS.readyState !== WebSocket.OPEN) {
                    reject(new Error('Binance WebSocket connection timeout'));
                }
            }, 10000);
        });
    }

    /**
     * Connect to our AI backend
     */
    connectToAIBackend() {
        return new Promise((resolve, reject) => {
            // Fallback to HTTP polling if WebSocket fails
            this.setupAIPolling();
            resolve();
        });
    }

    /**
     * Setup HTTP polling for AI backend (since WebSocket has issues)
     */
    setupAIPolling() {
        // Poll AI backend every 10 seconds
        this.aiPollingInterval = setInterval(async () => {
            try {
                const response = await fetch('http://localhost:8081/polling-api.php?action=updates');
                const data = await response.json();
                
                if (data.status === 'success') {
                    this.handleAIBackendMessage({
                        type: 'ai_updates',
                        data: data
                    });
                }
            } catch (error) {
                console.warn('⚠️ AI backend polling failed:', error.message);
            }
        }, 10000);
        
        console.log('🤖 AI backend polling started');
    }

    /**
     * Handle Binance WebSocket messages
     */
    handleBinanceMessage(rawData) {
        try {
            const data = JSON.parse(rawData);
            
            // Binance ticker format
            if (data.e === '24hrTicker') {
                const marketUpdate = {
                    source: 'binance',
                    type: 'market_update',
                    symbol: data.s.toLowerCase(), // BTCUSDT -> btcusdt
                    price: parseFloat(data.c),
                    change: parseFloat(data.p),
                    changePercent: parseFloat(data.P),
                    volume: parseFloat(data.v),
                    high: parseFloat(data.h),
                    low: parseFloat(data.l),
                    timestamp: data.E
                };
                
                this.notifySubscribers('market_data', marketUpdate);
            }
        } catch (error) {
            console.error('❌ Error parsing Binance message:', error);
        }
    }

    /**
     * Handle AI backend messages
     */
    handleAIBackendMessage(message) {
        if (message.type === 'ai_updates' && message.data) {
            // AI Signals
            if (message.data.ai_signals) {
                this.notifySubscribers('ai_signals', {
                    source: 'ai_backend',
                    type: 'ai_signals',
                    signals: message.data.ai_signals,
                    timestamp: message.data.timestamp
                });
            }

            // Technical Analysis
            if (message.data.technical_analysis) {
                this.notifySubscribers('technical_analysis', {
                    source: 'ai_backend',
                    type: 'technical_analysis',
                    analysis: message.data.technical_analysis,
                    timestamp: message.data.timestamp
                });
            }

            // Portfolio Updates
            if (message.data.portfolio_updates) {
                this.notifySubscribers('portfolio', {
                    source: 'ai_backend',
                    type: 'portfolio_updates',
                    portfolio: message.data.portfolio_updates,
                    timestamp: message.data.timestamp
                });
            }
        }
    }

    /**
     * Subscribe to specific data streams
     */
    subscribe(streamType, callback) {
        if (!this.subscribers.has(streamType)) {
            this.subscribers.set(streamType, new Set());
        }
        
        this.subscribers.get(streamType).add(callback);
        
        console.log(`📡 Subscribed to ${streamType} stream`);
        
        // For Binance streams, send subscription message
        if (streamType === 'market_data' && this.binanceWS && this.binanceWS.readyState === WebSocket.OPEN) {
            // Binance subscription for additional symbols
            const subscribeMessage = {
                method: "SUBSCRIBE",
                params: [
                    "btcusdt@ticker",
                    "ethusdt@ticker", 
                    "adausdt@ticker",
                    "solusdt@ticker"
                ],
                id: Date.now()
            };
            
            this.binanceWS.send(JSON.stringify(subscribeMessage));
        }
    }

    /**
     * Unsubscribe from streams
     */
    unsubscribe(streamType, callback) {
        if (this.subscribers.has(streamType)) {
            this.subscribers.get(streamType).delete(callback);
            
            if (this.subscribers.get(streamType).size === 0) {
                this.subscribers.delete(streamType);
            }
        }
    }

    /**
     * Notify all subscribers of stream type
     */
    notifySubscribers(streamType, data) {
        if (this.subscribers.has(streamType)) {
            this.subscribers.get(streamType).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`❌ Error in subscriber callback for ${streamType}:`, error);
                }
            });
        }
    }

    /**
     * Handle Binance reconnection
     */
    handleBinanceReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            
            console.log(`🔄 Attempting to reconnect to Binance (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
            
            setTimeout(() => {
                this.connectToBinance().catch(error => {
                    console.error('❌ Binance reconnection failed:', error);
                });
            }, delay);
        } else {
            console.error('💥 Max reconnection attempts reached for Binance WebSocket');
        }
    }

    /**
     * Request AI analysis for specific symbol
     */
    async requestAIAnalysis(symbol) {
        try {
            const response = await fetch(`http://localhost:8081/backend-ai.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'get_signal',
                    symbol: symbol
                })
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                return data.signal;
            } else {
                throw new Error(data.message || 'Failed to get AI analysis');
            }
        } catch (error) {
            console.error('❌ AI analysis request failed:', error);
            throw error;
        }
    }

    /**
     * Get connection status
     */
    getStatus() {
        return {
            binance: {
                connected: this.binanceWS && this.binanceWS.readyState === WebSocket.OPEN,
                readyState: this.binanceWS ? this.binanceWS.readyState : -1,
                reconnectAttempts: this.reconnectAttempts
            },
            aiBackend: {
                polling: !!this.aiPollingInterval,
                lastUpdate: new Date().toISOString()
            },
            subscribers: Object.fromEntries(
                Array.from(this.subscribers.entries()).map(([key, value]) => [key, value.size])
            )
        };
    }

    /**
     * Disconnect and cleanup
     */
    disconnect() {
        // Close Binance WebSocket
        if (this.binanceWS) {
            this.binanceWS.close();
            this.binanceWS = null;
        }

        // Stop AI polling
        if (this.aiPollingInterval) {
            clearInterval(this.aiPollingInterval);
            this.aiPollingInterval = null;
        }

        // Clear subscribers
        this.subscribers.clear();
        
        console.log('🔌 Hybrid client disconnected');
    }
}

// Usage Example
const tradingClient = new HybridTradingClient();

// Initialize connection
tradingClient.initialize().then(success => {
    if (success) {
        // Subscribe to market data (from Binance)
        tradingClient.subscribe('market_data', (data) => {
            console.log('📈 Market Update:', data);
            // Update UI with real-time prices
        });

        // Subscribe to AI signals (from our backend)
        tradingClient.subscribe('ai_signals', (data) => {
            console.log('🤖 AI Signal:', data);
            // Display AI recommendations
        });

        // Subscribe to technical analysis
        tradingClient.subscribe('technical_analysis', (data) => {
            console.log('📊 Technical Analysis:', data);
            // Show technical indicators
        });

        // Request specific AI analysis
        tradingClient.requestAIAnalysis('BTC').then(signal => {
            console.log('🎯 BTC AI Analysis:', signal);
        });
    }
});

// Check status
setInterval(() => {
    console.log('📊 Connection Status:', tradingClient.getStatus());
}, 30000);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HybridTradingClient;
}