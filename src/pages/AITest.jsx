import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const AITest = () => {
  const [frontendAI, setFrontendAI] = useState({
    rsi: null,
    macd: null,
    signal: 'Loading...',
    confidence: 0,
    loading: true
  });

  const [backendAI, setBackendAI] = useState({
    signal: 'Not tested yet',
    confidence: 0,
    lstm: null,
    loading: false
  });

  const [btcPrice, setBtcPrice] = useState(null);

  // Test Frontend AI - Real-time calculations
  useEffect(() => {
    const testFrontendAI = async () => {
      try {
        // Fetch real BTC data from Binance
        const response = await fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=50');
        const data = await response.json();
        
        // Extract closing prices
        const closes = data.map(kline => parseFloat(kline[4]));
        
        // Get current price
        const priceResponse = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
        const priceData = await priceResponse.json();
        setBtcPrice(parseFloat(priceData.price));
        
        // Calculate RSI (Frontend AI)
        const calculateRSI = (prices, period = 14) => {
          if (prices.length < period + 1) return 50;
          
          let gains = [];
          let losses = [];
          
          for (let i = 1; i < prices.length; i++) {
            const change = prices[i] - prices[i-1];
            gains.push(change > 0 ? change : 0);
            losses.push(change < 0 ? Math.abs(change) : 0);
          }
          
          const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
          const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
          
          if (avgLoss === 0) return 100;
          
          const rs = avgGain / avgLoss;
          const rsi = 100 - (100 / (1 + rs));
          return Math.round(rsi * 100) / 100;
        };

        // Calculate MACD (Frontend AI)
        const calculateEMA = (prices, period) => {
          const multiplier = 2 / (period + 1);
          let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
          
          for (let i = period; i < prices.length; i++) {
            ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
          }
          
          return ema;
        };

        const ema12 = calculateEMA(closes, 12);
        const ema26 = calculateEMA(closes, 26);
        const macd = ema12 - ema26;

        const rsi = calculateRSI(closes);
        
        // Generate AI Signal
        let signal = 'HOLD';
        let confidence = 50;
        
        if (rsi > 70 && macd < 0) {
          signal = 'SELL';
          confidence = Math.min(95, 60 + (rsi - 70));
        } else if (rsi < 30 && macd > 0) {
          signal = 'BUY';
          confidence = Math.min(95, 60 + (30 - rsi));
        } else if (rsi > 70) {
          signal = 'SELL';
          confidence = 70;
        } else if (rsi < 30) {
          signal = 'BUY';
          confidence = 70;
        }

        setFrontendAI({
          rsi: rsi,
          macd: Math.round(macd * 10000) / 10000,
          signal: signal,
          confidence: Math.round(confidence),
          loading: false
        });

      } catch (error) {
        console.error('Frontend AI Error:', error);
        setFrontendAI({
          rsi: 'Error',
          macd: 'Error',
          signal: 'Error fetching data',
          confidence: 0,
          loading: false
        });
      }
    };

    testFrontendAI();
  }, []);

  // Test Backend AI
  const testBackendAI = async () => {
    setBackendAI(prev => ({ ...prev, loading: true }));
    
    try {
      // Test PHP AI Backend API
      const response = await fetch('http://localhost:8081');
      const data = await response.json();
      
      if (data.status === 'success') {
        setBackendAI({
          signal: data.ai_signal.signal_type,
          confidence: data.ai_signal.confidence,
          lstm: `LSTM Prediction: ${data.lstm_prediction.prediction.toFixed(4)}`,
          rsi: data.technical_analysis.rsi,
          macd: data.technical_analysis.macd.macd,
          patterns: data.pattern_recognition,
          performance: data.ai_performance,
          loading: false
        });
      } else {
        throw new Error('Backend AI not available');
      }
    } catch (error) {
      console.error('Backend AI Error:', error);
      setBackendAI({
        signal: 'Backend not available',
        confidence: 0,
        lstm: 'LSTM offline - Start PHP server',
        rsi: 'N/A',
        macd: 'N/A',
        patterns: {},
        performance: {},
        loading: false
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            🧠 AI Systems Comparison Test
          </h1>
          <p className="text-xl text-gray-300">
            Live comparison between Frontend AI vs Backend AI
          </p>
          {btcPrice && (
            <div className="text-2xl text-yellow-400 mt-4">
              BTC Price: ${btcPrice.toLocaleString()}
            </div>
          )}
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Frontend AI */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
          >
            <h2 className="text-2xl font-bold text-green-400 mb-4 flex items-center">
              ⚡ JavaScript Frontend AI
              {frontendAI.loading && <div className="ml-2 animate-spin">🔄</div>}
            </h2>
            
            <div className="space-y-4">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-2">Technical Indicators</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-300">RSI:</span>
                    <span className={`ml-2 font-bold ${
                      frontendAI.rsi > 70 ? 'text-red-400' : 
                      frontendAI.rsi < 30 ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {frontendAI.rsi}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-300">MACD:</span>
                    <span className={`ml-2 font-bold ${
                      frontendAI.macd > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {frontendAI.macd}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-2">AI Signal</h3>
                <div className={`text-xl font-bold ${
                  frontendAI.signal === 'BUY' ? 'text-green-400' :
                  frontendAI.signal === 'SELL' ? 'text-red-400' : 'text-yellow-400'
                }`}>
                  {frontendAI.signal}
                </div>
                <div className="text-gray-300 mt-1">
                  Confidence: {frontendAI.confidence}%
                </div>
              </div>

              <div className="text-sm text-gray-400">
                ✅ Real-time Binance API<br/>
                ✅ Live RSI/MACD calculation<br/>
                ✅ Browser-based processing
              </div>
            </div>
          </motion.div>

          {/* Backend AI */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
          >
            <h2 className="text-2xl font-bold text-blue-400 mb-4 flex items-center">
              🧠 PHP Backend AI
              {backendAI.loading && <div className="ml-2 animate-spin">🔄</div>}
            </h2>
            
            <div className="space-y-4">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-2">Neural Network</h3>
                <div className="text-purple-400 font-semibold">
                  {backendAI.lstm || 'LSTM Neural Network'}
                </div>
                <div className="text-gray-300 text-sm mt-1">
                  50 hidden units, 60-day lookback
                </div>
                {backendAI.rsi && (
                  <div className="text-gray-300 text-sm mt-2">
                    RSI: {backendAI.rsi} | MACD: {backendAI.macd}
                  </div>
                )}
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-2">AI Signal</h3>
                <div className={`text-xl font-bold ${
                  backendAI.signal === 'BUY' ? 'text-green-400' :
                  backendAI.signal === 'SELL' ? 'text-red-400' : 'text-yellow-400'
                }`}>
                  {backendAI.signal}
                </div>
                <div className="text-gray-300 mt-1">
                  Confidence: {backendAI.confidence}%
                </div>
                {backendAI.patterns && Object.keys(backendAI.patterns).length > 0 && (
                  <div className="text-sm text-gray-400 mt-2">
                    Patterns: {Object.entries(backendAI.patterns).map(([pattern, status]) => 
                      status === 'DETECTED' ? pattern.replace('_', ' ') : null
                    ).filter(Boolean).join(', ') || 'None detected'}
                  </div>
                )}
              </div>

              <button
                onClick={testBackendAI}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                disabled={backendAI.loading}
              >
                {backendAI.loading ? 'Testing...' : 'Test Backend AI'}
              </button>

              <div className="text-sm text-gray-400">
                ✅ LSTM Neural Network<br/>
                ✅ Pattern Recognition Engine<br/>
                ✅ Sentiment Analysis<br/>
                ✅ Database storage<br/>
                {backendAI.performance && backendAI.performance.accuracy_7d && (
                  <>
                    📊 7d Accuracy: {backendAI.performance.accuracy_7d}<br/>
                    💰 Profitable: {backendAI.performance.profitable_signals}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
        >
          <h3 className="text-xl font-bold text-white mb-4">🔬 Analysis Results</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-green-400 mb-2">Frontend AI Strengths:</h4>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Real-time calculations</li>
                <li>• Live data from Binance WebSocket</li>
                <li>• Instant response</li>
                <li>• Browser-based processing</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-blue-400 mb-2">Backend AI Strengths:</h4>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• LSTM Neural Networks</li>
                <li>• Advanced pattern recognition</li>
                <li>• Sentiment analysis integration</li>
                <li>• Scalable server processing</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AITest;