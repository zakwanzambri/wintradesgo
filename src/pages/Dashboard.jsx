import React, { useState } from 'react';
import { motion } from 'framer-motion';
import AISignalDashboard from '../components/dashboard/AISignalDashboard';
import PortfolioTracker from '../components/dashboard/PortfolioTracker';
import PatternVisualization from '../components/dashboard/PatternVisualization';
import RealTimeStatus from '../components/RealTimeStatus';
import LivePriceTicker from '../components/LivePriceTicker';
import { useDashboardData, useConnectionStatus } from '../hooks/useAPI';
import { useRealTimeData, useRealTimePortfolio, useRealTimeSignals } from '../hooks/useRealTime';

const Dashboard = () => {
  const [viewMode, setViewMode] = useState('overview');
  
  // Original API hooks for fallback
  const {
    signals,
    portfolio,
    loading,
    error,
    lastUpdate,
    refresh
  } = useDashboardData();

  // Real-time data hooks
  const { data: realTimeData, isConnected: isRealTimeConnected } = useRealTimeData();
  const { portfolio: realTimePortfolio, changes: portfolioChanges } = useRealTimePortfolio();
  const { signals: realTimeSignals, newSignals } = useRealTimeSignals();

  // Use real-time data when available, fallback to regular API data
  const currentPortfolio = realTimePortfolio || portfolio;
  const currentSignals = realTimeSignals || signals;
  const isConnected = isRealTimeConnected;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'signals', label: 'AI Signals' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'patterns', label: 'Patterns' },
    { id: 'apitest', label: 'API Test' }
  ];

  if (viewMode === 'signals') {
    return <AISignalDashboard />;
  }

  if (viewMode === 'portfolio') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold">Portfolio Tracker</h1>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <PortfolioTracker />
        </div>
      </div>
    );
  }

  if (viewMode === 'patterns') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold">Pattern Recognition</h1>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <PatternVisualization />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Trading Dashboard</h1>
          <div className="mt-4 flex space-x-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id)}
                className={`px-4 py-2 rounded ${viewMode === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Real-time Status Bar */}
        <div className="mb-6">
          <RealTimeStatus />
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column - Key Metrics */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border p-6">
              <p className="text-sm text-gray-600">Portfolio Value</p>
              <div className="flex items-center space-x-2">
                <p className="text-2xl font-bold">
                  ${currentPortfolio?.portfolio_value?.toLocaleString() || currentPortfolio?.total_value?.toLocaleString() || '100,000'}
                </p>
                {portfolioChanges?.amount && (
                  <motion.span
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`text-sm font-medium ${
                      portfolioChanges.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {portfolioChanges.amount > 0 ? '+' : ''}${portfolioChanges.amount.toFixed(2)}
                  </motion.span>
                )}
              </div>
            </div>
            
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">Active Signals</p>
                {newSignals.length > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                  >
                    {newSignals.length}
                  </motion.div>
                )}
              </div>
              <p className="text-2xl font-bold">
                {currentSignals?.current_signals?.length || currentSignals?.signals?.length || '3'}
              </p>
            </div>
            
            <div className="bg-white rounded-lg border p-6">
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold">87%</p>
            </div>
            
            <div className="bg-white rounded-lg border p-6">
              <p className="text-sm text-gray-600">Risk Level</p>
              <p className="text-2xl font-bold">Medium</p>
            </div>
          </div>

          {/* Right Column - Live Prices */}
          <div className="lg:col-span-1">
            <LivePriceTicker />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent AI Signals */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Recent AI Signals</h2>
              {isConnected && (
                <motion.div
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="flex items-center space-x-1 text-green-600 text-sm"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Live</span>
                </motion.div>
              )}
            </div>
            {currentSignals?.current_signals?.length > 0 || currentSignals?.signals?.length > 0 ? (
              <div className="space-y-4">
                {(currentSignals.current_signals || currentSignals.signals || []).slice(0, 3).map((signal, index) => (
                  <motion.div
                    key={`${signal.symbol}-${signal.generated_at || index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex justify-between items-center p-4 bg-gray-50 rounded"
                  >
                    <div>
                      <div className="font-medium">{signal.symbol} {signal.signal_type}</div>
                      <div className="text-sm text-gray-600">
                        Confidence: {signal.confidence}%
                      </div>
                      {signal.generated_at && (
                        <div className="text-xs text-gray-500">
                          {new Date(signal.generated_at).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                    <div className={`px-3 py-1 rounded text-sm ${
                      signal.signal_type?.toLowerCase() === 'buy' ? 'bg-green-100 text-green-800' :
                      signal.signal_type?.toLowerCase() === 'sell' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {signal.signal_type?.toUpperCase()}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No signals available</p>
            )}
          </div>

          {/* Market Sentiment */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-bold mb-6">Market Sentiment</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Overall Sentiment</span>
                <span className={`font-medium ${
                  currentSignals?.market_sentiment === 'BULLISH' ? 'text-green-600' : 
                  currentSignals?.market_sentiment === 'BEARISH' ? 'text-red-600' : 
                  'text-gray-600'
                }`}>
                  {currentSignals?.market_sentiment || 'NEUTRAL'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Confidence Score</span>
                <span className="font-medium">
                  {currentSignals?.confidence_score || '85'}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Signal Strength</span>
                <span className="font-medium">
                  {currentSignals?.signal_strength || 'STRONG'}
                </span>
              </div>
            </div>
          </div>
        </div>
          </div>
          
          <div className="bg-white rounded-lg border p-6">
            <p className="text-sm text-gray-600">Success Rate</p>
            <p className="text-2xl font-bold">87%</p>
          </div>
          
          <div className="bg-white rounded-lg border p-6">
            <p className="text-sm text-gray-600">Risk Level</p>
            <p className="text-2xl font-bold">Medium</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-bold mb-6">Recent AI Signals</h2>
          {signals?.signals?.length > 0 ? (
            <div className="space-y-4">
              {signals.signals.slice(0, 3).map((signal, index) => (
                <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">{signal.symbol} {signal.signal_type}</div>
                    <div className="text-sm text-gray-600">
                      Confidence: {signal.confidence}%
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded text-sm ${
                    signal.signal_type?.toLowerCase() === 'buy' ? 'bg-green-100 text-green-800' :
                    signal.signal_type?.toLowerCase() === 'sell' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {signal.signal_type?.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No signals available</p>
          )}
        </div>

        {/* Market Sentiment */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-bold mb-6">Market Sentiment</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Overall Sentiment</span>
              <span className={`font-medium ${
                currentSignals?.market_sentiment === 'BULLISH' ? 'text-green-600' : 
                currentSignals?.market_sentiment === 'BEARISH' ? 'text-red-600' : 
                'text-gray-600'
              }`}>
                {currentSignals?.market_sentiment || 'NEUTRAL'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Confidence Score</span>
              <span className="font-medium">
                {currentSignals?.confidence_score || '85'}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Signal Strength</span>
              <span className="font-medium">
                {currentSignals?.signal_strength || 'STRONG'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
