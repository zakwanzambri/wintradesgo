/**
 * Frontend Integration Test for WinTrades AI Backend
 * Tests all major backend endpoints and functionality
 */

class BackendIntegrationTest {
    constructor() {
        this.baseUrl = 'http://localhost:8081';
        this.results = [];
    }

    async runAllTests() {
        console.log('🚀 Starting WinTrades AI Backend Integration Tests...\n');
        
        const tests = [
            { name: 'System Status', method: this.testSystemStatus },
            { name: 'AI Signals', method: this.testAISignals },
            { name: 'Market Data', method: this.testMarketData },
            { name: 'Technical Analysis', method: this.testTechnicalAnalysis },
            { name: 'Pattern Recognition', method: this.testPatternRecognition },
            { name: 'Portfolio Analysis', method: this.testPortfolioAnalysis },
            { name: 'Sentiment Analysis', method: this.testSentimentAnalysis },
            { name: 'Risk Analysis', method: this.testRiskAnalysis },
            { name: 'AI Performance', method: this.testAIPerformance }
        ];

        for (const test of tests) {
            try {
                console.log(`⏳ Testing ${test.name}...`);
                const result = await test.method.call(this);
                this.results.push({ name: test.name, status: 'PASS', data: result });
                console.log(`✅ ${test.name} - PASSED\n`);
            } catch (error) {
                this.results.push({ name: test.name, status: 'FAIL', error: error.message });
                console.log(`❌ ${test.name} - FAILED: ${error.message}\n`);
            }
        }

        this.printSummary();
    }

    async testSystemStatus() {
        const response = await fetch(`${this.baseUrl}/`);
        const data = await response.json();
        
        if (data.status !== 'operational') {
            throw new Error('System status is not operational');
        }

        console.log(`   📊 Version: ${data.version}`);
        console.log(`   🕒 Uptime: ${data.uptime}`);
        console.log(`   🔧 Components: ${Object.keys(data.components).length} active`);
        
        return data;
    }

    async testAISignals() {
        const symbols = ['BTC', 'ETH', 'ADA'];
        
        for (const symbol of symbols) {
            const response = await fetch(`${this.baseUrl}/signals?symbol=${symbol}`);
            const data = await response.json();
            
            if (data.status !== 'success') {
                throw new Error(`AI signal generation failed for ${symbol}`);
            }

            console.log(`   💡 ${symbol}: ${data.ai_signal?.signal_type || 'N/A'} (${data.ai_signal?.confidence || 0}% confidence)`);
        }

        return symbols.length;
    }

    async testMarketData() {
        const response = await fetch(`${this.baseUrl}/market-data?symbols=bitcoin,ethereum,cardano`);
        const data = await response.json();
        
        if (data.status !== 'success' || !data.data || data.data.length === 0) {
            throw new Error('Market data fetch failed');
        }

        console.log(`   📈 Retrieved ${data.data.length} market data points`);
        data.data.forEach(item => {
            console.log(`      ${item.symbol}: $${item.price} (${item.change_24h > 0 ? '+' : ''}${item.change_24h?.toFixed(2)}%)`);
        });

        return data.data;
    }

    async testTechnicalAnalysis() {
        const response = await fetch(`${this.baseUrl}/technical-analysis?symbol=BTC`);
        const data = await response.json();
        
        if (!data.rsi || !data.macd) {
            throw new Error('Technical analysis incomplete');
        }

        console.log(`   📊 RSI: ${data.rsi}`);
        console.log(`   📈 MACD: ${JSON.stringify(data.macd)}`);
        console.log(`   📉 Bollinger Bands: ${JSON.stringify(data.bollinger_bands)}`);

        return data;
    }

    async testPatternRecognition() {
        const response = await fetch(`${this.baseUrl}/pattern-recognition?symbol=BTC`);
        const data = await response.json();
        
        if (data.status !== 'success' || !data.patterns) {
            throw new Error('Pattern recognition failed');
        }

        console.log(`   🔍 Patterns detected: ${Object.keys(data.patterns).length}`);
        Object.entries(data.patterns).forEach(([pattern, status]) => {
            console.log(`      ${pattern}: ${status}`);
        });

        return data.patterns;
    }

    async testPortfolioAnalysis() {
        const response = await fetch(`${this.baseUrl}/portfolio-analysis`);
        const data = await response.json();
        
        if (data.status !== 'success') {
            throw new Error('Portfolio analysis failed');
        }

        console.log(`   💰 Total Value: $${data.total_value?.toLocaleString() || 'N/A'}`);
        console.log(`   📈 Daily P&L: $${data.daily_pnl || 'N/A'}`);
        console.log(`   ⚖️ Portfolio Holdings: ${Object.keys(data.portfolio || {}).length} assets`);

        return data;
    }

    async testSentimentAnalysis() {
        const response = await fetch(`${this.baseUrl}/sentiment?symbol=BTC`);
        const data = await response.json();
        
        if (data.status !== 'success' || !data.sentiment) {
            throw new Error('Sentiment analysis failed');
        }

        console.log(`   😊 Overall Sentiment: ${data.sentiment.overall_sentiment || 'N/A'}`);
        console.log(`   📰 News Sentiment: ${data.sentiment.news_sentiment || 'N/A'}`);
        console.log(`   😰 Fear/Greed Index: ${data.sentiment.fear_greed_index || 'N/A'}`);

        return data.sentiment;
    }

    async testRiskAnalysis() {
        const response = await fetch(`${this.baseUrl}/risk-analysis`);
        const data = await response.json();
        
        if (data.status !== 'success' || !data.risk_analysis) {
            throw new Error('Risk analysis failed');
        }

        console.log(`   ⚠️ Risk Level: ${data.risk_analysis.overall_risk || 'N/A'}`);
        console.log(`   📊 VaR (95%): ${data.risk_analysis.var_95 || 'N/A'}%`);
        console.log(`   📉 Max Drawdown: ${data.risk_analysis.max_drawdown || 'N/A'}%`);

        return data.risk_analysis;
    }

    async testAIPerformance() {
        const response = await fetch(`${this.baseUrl}/ai-performance`);
        const data = await response.json();
        
        if (data.status !== 'success' || !data.performance_metrics) {
            throw new Error('AI performance data unavailable');
        }

        console.log(`   🤖 AI Models: ${data.performance_metrics.length}`);
        data.performance_metrics.forEach(model => {
            console.log(`      ${model.model_type}: ${model.accuracy_7d || 'N/A'}% accuracy`);
        });

        return data.performance_metrics;
    }

    printSummary() {
        console.log('\n' + '='.repeat(60));
        console.log('🏁 TEST SUMMARY');
        console.log('='.repeat(60));
        
        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;
        
        console.log(`\n✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📊 Total:  ${this.results.length}`);
        
        if (failed > 0) {
            console.log('\n🚨 FAILED TESTS:');
            this.results.filter(r => r.status === 'FAIL').forEach(test => {
                console.log(`   ❌ ${test.name}: ${test.error}`);
            });
        }
        
        console.log(`\n🎯 Success Rate: ${Math.round((passed / this.results.length) * 100)}%`);
        
        if (passed === this.results.length) {
            console.log('\n🎉 ALL TESTS PASSED! The WinTrades AI Backend is fully operational.');
        } else {
            console.log('\n⚠️  Some tests failed. Please check the backend configuration.');
        }
        
        console.log('\n' + '='.repeat(60));
    }
}

// Auto-run tests when loaded in browser
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', async () => {
        const tester = new BackendIntegrationTest();
        await tester.runAllTests();
    });
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BackendIntegrationTest;
}

// Frontend Dashboard Integration
class WinTradesAIClient {
    constructor(baseUrl = 'http://localhost:8081') {
        this.baseUrl = baseUrl;
        this.cache = new Map();
        this.cacheTimeout = 30000; // 30 seconds
    }

    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const cacheKey = `${url}_${JSON.stringify(options)}`;
        
        // Check cache
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Cache successful responses
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });

            return data;
        } catch (error) {
            console.error(`API Request failed for ${endpoint}:`, error);
            throw error;
        }
    }

    // AI Signal Methods
    async getAISignal(symbol = 'BTC') {
        return await this.makeRequest(`/signals?symbol=${symbol}`);
    }

    async getMultipleSignals(symbols = ['BTC', 'ETH', 'ADA']) {
        const promises = symbols.map(symbol => this.getAISignal(symbol));
        return await Promise.all(promises);
    }

    // Market Data Methods
    async getMarketData(symbols = ['bitcoin', 'ethereum', 'cardano']) {
        const symbolsParam = Array.isArray(symbols) ? symbols.join(',') : symbols;
        return await this.makeRequest(`/market-data?symbols=${symbolsParam}`);
    }

    async getTechnicalAnalysis(symbol = 'BTC') {
        return await this.makeRequest(`/technical-analysis?symbol=${symbol}`);
    }

    async getPatternAnalysis(symbol = 'BTC') {
        return await this.makeRequest(`/pattern-recognition?symbol=${symbol}`);
    }

    // Portfolio Methods
    async getPortfolioAnalysis() {
        return await this.makeRequest('/portfolio-analysis');
    }

    async optimizePortfolio(portfolioData) {
        return await this.makeRequest('/optimize-portfolio', {
            method: 'POST',
            body: JSON.stringify(portfolioData)
        });
    }

    // Analytics Methods
    async getSentimentAnalysis(symbol = 'BTC') {
        return await this.makeRequest(`/sentiment?symbol=${symbol}`);
    }

    async getRiskAnalysis() {
        return await this.makeRequest('/risk-analysis');
    }

    async getAIPerformance() {
        return await this.makeRequest('/ai-performance');
    }

    // System Methods
    async getSystemStatus() {
        return await this.makeRequest('/');
    }

    // Real-time Data (WebSocket)
    connectWebSocket(callbacks = {}) {
        const ws = new WebSocket('ws://localhost:8080');
        
        ws.onopen = () => {
            console.log('🔌 WebSocket connected to WinTrades AI Backend');
            if (callbacks.onOpen) callbacks.onOpen();
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('📡 Received:', data.type);
                
                switch (data.type) {
                    case 'market_update':
                        if (callbacks.onMarketUpdate) callbacks.onMarketUpdate(data.data);
                        break;
                    case 'ai_signal_update':
                        if (callbacks.onSignalUpdate) callbacks.onSignalUpdate(data);
                        break;
                    case 'welcome':
                        if (callbacks.onWelcome) callbacks.onWelcome(data);
                        break;
                    default:
                        if (callbacks.onMessage) callbacks.onMessage(data);
                }
            } catch (error) {
                console.error('WebSocket message parse error:', error);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            if (callbacks.onError) callbacks.onError(error);
        };

        ws.onclose = () => {
            console.log('🔌 WebSocket disconnected');
            if (callbacks.onClose) callbacks.onClose();
        };

        return ws;
    }

    // Subscribe to real-time updates
    subscribeToMarketData(ws, symbols = ['BTC', 'ETH']) {
        const message = {
            type: 'subscribe',
            stream: 'market_data',
            symbols: symbols
        };
        ws.send(JSON.stringify(message));
    }

    subscribeToAISignals(ws, symbols = ['BTC']) {
        const message = {
            type: 'subscribe',
            stream: 'ai_signals',
            symbols: symbols
        };
        ws.send(JSON.stringify(message));
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
    }
}

// Make client available globally
if (typeof window !== 'undefined') {
    window.WinTradesAI = new WinTradesAIClient();
    
    // Add test functions to global scope for easy debugging
    window.testBackend = async () => {
        const tester = new BackendIntegrationTest();
        await tester.runAllTests();
    };
}