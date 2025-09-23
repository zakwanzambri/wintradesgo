import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import EnhancedAITradingSignals from '../utils/EnhancedAITradingSignals.js';

const EnhancedDashboard = () => {
  const [aiSignal, setAiSignal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds

  const enhancedAI = new EnhancedAITradingSignals();

  // Available trading pairs
  const tradingPairs = [
    { symbol: 'BTCUSDT', name: 'Bitcoin', color: 'text-orange-400' },
    { symbol: 'ETHUSDT', name: 'Ethereum', color: 'text-blue-400' },
    { symbol: 'ADAUSDT', name: 'Cardano', color: 'text-green-400' },
    { symbol: 'SOLUSDT', name: 'Solana', color: 'text-purple-400' },
    { symbol: 'DOGEUSDT', name: 'Dogecoin', color: 'text-yellow-400' }
  ];

  // Generate enhanced AI signal
  const generateSignal = async (symbol = selectedSymbol) => {
    setLoading(true);
    try {
      const signal = await enhancedAI.generateEnhancedSignal(symbol, '1h', 100);
      setAiSignal(signal);
    } catch (error) {
      console.error('Error generating signal:', error);
      setAiSignal({
        error: 'Failed to generate signal',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    generateSignal();
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        generateSignal();
      }, refreshInterval * 1000);
      
      return () => clearInterval(interval);
    }
  }, [selectedSymbol, autoRefresh, refreshInterval]);

  // Signal color based on action
  const getSignalColor = (signal) => {
    if (!signal) return 'text-gray-400';
    switch (signal) {
      case 'BUY': return 'text-green-400';
      case 'SELL': return 'text-red-400';
      case 'HOLD': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  // Confidence color
  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'text-green-400';
    if (confidence >= 60) return 'text-yellow-400';
    if (confidence >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  // Strength badge color
  const getStrengthColor = (strength) => {
    switch (strength) {
      case 'STRONG': return 'bg-green-600';
      case 'MODERATE': return 'bg-yellow-600';
      case 'WEAK': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl font-bold text-white mb-4">
            🧠 Enhanced AI Trading Dashboard
          </h1>
          <p className="text-xl text-gray-300">
            Advanced Multi-Indicator Analysis with Risk Management
          </p>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 mb-8"
        >
          <div className="flex flex-wrap justify-between items-center gap-4">
            {/* Symbol Selector */}
            <div className="flex items-center gap-4">
              <label className="text-white font-semibold">Trading Pair:</label>
              <select
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {tradingPairs.map(pair => (
                  <option key={pair.symbol} value={pair.symbol}>
                    {pair.name} ({pair.symbol})
                  </option>
                ))}
              </select>
            </div>

            {/* Auto Refresh Controls */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-white">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                Auto Refresh
              </label>
              
              {autoRefresh && (
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-600"
                >
                  <option value={15}>15s</option>
                  <option value={30}>30s</option>
                  <option value={60}>1m</option>
                  <option value={300}>5m</option>
                </select>
              )}
              
              <button
                onClick={() => generateSignal()}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '🔄 Analyzing...' : '🔍 Analyze Now'}
              </button>
            </div>
          </div>
        </motion.div>

        {loading && !aiSignal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">🧠</div>
            <h2 className="text-2xl text-white mb-2">Enhanced AI Analyzing Market...</h2>
            <p className="text-gray-400">Processing multiple indicators and live data</p>
          </motion.div>
        )}

        {aiSignal && !aiSignal.error && (
          <div className="grid lg:grid-cols-2 gap-8">
            
            {/* Main Signal Display */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8"
            >
              <h2 className="text-2xl font-bold text-white mb-6">🎯 AI Trading Signal</h2>
              
              <div className="text-center mb-6">
                <div className={`text-6xl font-bold mb-2 ${getSignalColor(aiSignal.signal)}`}>
                  {aiSignal.signal}
                </div>
                <div className="flex justify-center items-center gap-4 mb-4">
                  <span className={`text-2xl font-bold ${getConfidenceColor(aiSignal.confidence)}`}>
                    {aiSignal.confidence}% Confidence
                  </span>
                  <span className={`px-3 py-1 rounded-full text-white text-sm ${getStrengthColor(aiSignal.strength)}`}>
                    {aiSignal.strength}
                  </span>
                </div>
                
                <div className="text-gray-300">
                  <p className="text-lg mb-2">Current Price: <span className="text-white font-bold">${aiSignal.currentPrice?.toLocaleString()}</span></p>
                  <p className="text-sm">Updated: {new Date(aiSignal.timestamp).toLocaleString()}</p>
                </div>
              </div>

              {/* Signal Factors */}
              <div className="space-y-4">
                {aiSignal.analysis?.bullishFactors?.length > 0 && (
                  <div>
                    <h4 className="text-green-400 font-semibold mb-2">🟢 Bullish Factors:</h4>
                    <ul className="space-y-1">
                      {aiSignal.analysis.bullishFactors.map((factor, index) => (
                        <li key={index} className="text-green-300 text-sm">• {factor}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {aiSignal.analysis?.bearishFactors?.length > 0 && (
                  <div>
                    <h4 className="text-red-400 font-semibold mb-2">🔴 Bearish Factors:</h4>
                    <ul className="space-y-1">
                      {aiSignal.analysis.bearishFactors.map((factor, index) => (
                        <li key={index} className="text-red-300 text-sm">• {factor}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {aiSignal.analysis?.neutralFactors?.length > 0 && (
                  <div>
                    <h4 className="text-yellow-400 font-semibold mb-2">🟡 Neutral Factors:</h4>
                    <ul className="space-y-1">
                      {aiSignal.analysis.neutralFactors.map((factor, index) => (
                        <li key={index} className="text-yellow-300 text-sm">• {factor}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Technical Indicators */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8"
            >
              <h2 className="text-2xl font-bold text-white mb-6">📊 Technical Indicators</h2>
              
              <div className="space-y-4">
                {aiSignal.indicators?.rsi && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">RSI (14):</span>
                    <span className={`font-bold ${aiSignal.indicators.rsi < 30 ? 'text-green-400' : aiSignal.indicators.rsi > 70 ? 'text-red-400' : 'text-yellow-400'}`}>
                      {aiSignal.indicators.rsi.toFixed(1)}
                    </span>
                  </div>
                )}
                
                {aiSignal.indicators?.macd && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">MACD:</span>
                    <span className={`font-bold ${aiSignal.indicators.macd.histogram > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {aiSignal.indicators.macd.macd > aiSignal.indicators.macd.signal ? 'Bullish' : 'Bearish'}
                    </span>
                  </div>
                )}
                
                {aiSignal.indicators?.bollinger && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Bollinger Position:</span>
                    <span className={`font-bold ${
                      aiSignal.indicators.bollinger.position === 'LOWER' ? 'text-green-400' :
                      aiSignal.indicators.bollinger.position === 'UPPER' ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {aiSignal.indicators.bollinger.position}
                      {aiSignal.indicators.bollinger.squeeze && ' (Squeeze)'}
                    </span>
                  </div>
                )}
                
                {aiSignal.indicators?.stochastic && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Stochastic:</span>
                    <span className={`font-bold ${
                      aiSignal.indicators.stochastic.k < 20 ? 'text-green-400' :
                      aiSignal.indicators.stochastic.k > 80 ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {aiSignal.indicators.stochastic.k.toFixed(1)} / {aiSignal.indicators.stochastic.d.toFixed(1)}
                    </span>
                  </div>
                )}
                
                {aiSignal.indicators?.sentiment && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Market Sentiment:</span>
                    <span className={`font-bold ${
                      aiSignal.indicators.sentiment === 'BULLISH' ? 'text-green-400' :
                      aiSignal.indicators.sentiment === 'BEARISH' ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {aiSignal.indicators.sentiment}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Risk Management */}
            {aiSignal.riskManagement && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8"
              >
                <h2 className="text-2xl font-bold text-white mb-6">⚠️ Risk Management</h2>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-red-400 font-semibold mb-2">Stop Loss</h4>
                      <p className="text-red-300">
                        Buy: ${aiSignal.riskManagement.stopLoss?.buy?.toFixed(2)}
                      </p>
                      <p className="text-red-300">
                        Sell: ${aiSignal.riskManagement.stopLoss?.sell?.toFixed(2)}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-green-400 font-semibold mb-2">Take Profit</h4>
                      <p className="text-green-300">
                        Buy: ${aiSignal.riskManagement.takeProfit?.buy?.toFixed(2)}
                      </p>
                      <p className="text-green-300">
                        Sell: ${aiSignal.riskManagement.takeProfit?.sell?.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-blue-400 font-semibold mb-2">Position Sizing</h4>
                    <p className="text-blue-300">
                      Recommended: {(aiSignal.riskManagement.positionSize?.recommended * 100).toFixed(1)}%
                    </p>
                    <p className="text-blue-300">
                      Conservative: {(aiSignal.riskManagement.positionSize?.conservative * 100).toFixed(1)}%
                    </p>
                    <p className="text-blue-300">
                      Aggressive: {(aiSignal.riskManagement.positionSize?.aggressive * 100).toFixed(1)}%
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-purple-400 font-semibold mb-2">Risk Parameters</h4>
                    <p className="text-purple-300">Max Risk: {aiSignal.riskManagement.maxRisk}</p>
                    <p className="text-purple-300">R:R Ratio: 1:{aiSignal.riskManagement.riskRewardRatio}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Trading Recommendations */}
            {aiSignal.recommendation && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8"
              >
                <h2 className="text-2xl font-bold text-white mb-6">💡 Trading Recommendations</h2>
                
                <div className="space-y-3">
                  {aiSignal.recommendation.map((rec, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="text-blue-400 mt-1">•</div>
                      <p className="text-gray-300">{rec}</p>
                    </div>
                  ))}
                </div>
                
                {aiSignal.analysis?.marketCondition && (
                  <div className="mt-6 pt-6 border-t border-gray-700">
                    <h4 className="text-white font-semibold mb-2">Market Condition</h4>
                    <div className="flex gap-4">
                      <span className="text-gray-300">
                        Trend: <span className="text-white">{aiSignal.analysis.marketCondition.trend}</span>
                      </span>
                      <span className="text-gray-300">
                        Volatility: <span className="text-white">{aiSignal.analysis.marketCondition.volatility}</span>
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        )}

        {aiSignal?.error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl text-red-400 mb-2">Error Loading AI Signal</h2>
            <p className="text-gray-400">{aiSignal.error}</p>
            <button
              onClick={() => generateSignal()}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Try Again
            </button>
          </motion.div>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-12 text-gray-400"
        >
          <p>Enhanced AI Trading Dashboard • Live Market Analysis • Risk Management Included</p>
          <p className="text-sm mt-2">
            ⚠️ This is for educational purposes only. Always do your own research before trading.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;