/**
 * Real-time AI Signal Dashboard Component
 * Displays live trading signals with confidence levels and pattern recognition
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAISignals, usePatternRecognition, useSignalGeneration } from '../../hooks/useAPI';

// Signal confidence color mapping
const getConfidenceColor = (confidence) => {
  if (confidence >= 90) return 'bg-green-500';
  if (confidence >= 75) return 'bg-blue-500';
  if (confidence >= 60) return 'bg-yellow-500';
  return 'bg-gray-500';
};

const getSignalTypeColor = (signalType) => {
  switch (signalType?.toLowerCase()) {
    case 'buy': return 'text-green-600 bg-green-50';
    case 'sell': return 'text-red-600 bg-red-50';
    case 'hold': return 'text-gray-600 bg-gray-50';
    default: return 'text-gray-600 bg-gray-50';
  }
};

const SignalCard = ({ signal, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300"
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full">
              <span className="font-bold text-gray-700">{signal.symbol}</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{signal.symbol} Signal</h3>
              <p className="text-sm text-gray-500">
                {new Date(signal.created_at || Date.now()).toLocaleTimeString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSignalTypeColor(signal.signal_type)}`}>
              {signal.signal_type?.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Confidence and Price */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-sm text-gray-500">Confidence</span>
              <div className={`w-2 h-2 rounded-full ${getConfidenceColor(signal.confidence)}`}></div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{signal.confidence}%</div>
          </div>
          
          <div>
            <div className="text-sm text-gray-500 mb-1">Current Price</div>
            <div className="text-2xl font-bold text-gray-900">
              ${signal.current_price?.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Confidence Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Confidence Level</span>
            <span>{signal.confidence}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${signal.confidence}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`h-2 rounded-full ${getConfidenceColor(signal.confidence)}`}
            />
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-xs text-gray-500">Target</div>
            <div className="font-semibold text-green-600">
              ${signal.target_price?.toLocaleString() || 'N/A'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Stop Loss</div>
            <div className="font-semibold text-red-600">
              ${signal.stop_loss?.toLocaleString() || 'N/A'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Timeframe</div>
            <div className="font-semibold text-gray-700">
              {signal.timeframe || 'N/A'}
            </div>
          </div>
        </div>

        {/* Expand/Collapse Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center space-x-2 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          <span>{isExpanded ? 'Less Details' : 'More Details'}</span>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </button>

        {/* Expanded Details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-gray-200 pt-4 mt-4"
            >
              <div className="space-y-3">
                {/* Reason */}
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Analysis Reason</div>
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    {signal.reason || 'No detailed reason available'}
                  </div>
                </div>

                {/* Technical Analysis */}
                {signal.technical_analysis && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Technical Analysis</div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>Signal: {signal.technical_analysis.signal_type}</div>
                      <div>Confidence: {signal.technical_analysis.confidence}%</div>
                      {signal.technical_analysis.reasons && (
                        <div>Indicators: {signal.technical_analysis.reasons}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Sentiment Analysis */}
                {signal.sentiment_analysis && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Sentiment Analysis</div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>Sentiment: {signal.sentiment_analysis.sentiment_signal}</div>
                      <div>Confidence: {signal.sentiment_analysis.confidence}%</div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const LoadingSignalCard = () => (
  <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 animate-pulse">
    <div className="flex items-center space-x-3 mb-3">
      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
        <div className="h-3 bg-gray-200 rounded w-16"></div>
      </div>
    </div>
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-2 bg-gray-200 rounded w-full"></div>
    </div>
  </div>
);

const AISignalDashboard = () => {
  const { data: signals, loading, error, lastUpdate, refresh } = useAISignals();
  const { data: patterns } = usePatternRecognition();
  const { generateSignals, generating } = useSignalGeneration();
  
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('confidence');

  // Filter and sort signals
  const processedSignals = React.useMemo(() => {
    if (!signals?.signals) return [];

    let filtered = signals.signals;

    // Apply filter
    if (filter !== 'all') {
      filtered = filtered.filter(signal => 
        signal.signal_type?.toLowerCase() === filter.toLowerCase()
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'confidence':
          return b.confidence - a.confidence;
        case 'symbol':
          return a.symbol.localeCompare(b.symbol);
        case 'time':
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [signals, filter, sortBy]);

  const handleGenerateSignals = async () => {
    try {
      await generateSignals();
      refresh(); // Refresh the signals after generation
    } catch (error) {
      console.error('Failed to generate signals:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Trading Signals</h1>
          <p className="text-gray-600">
            Real-time AI-generated trading signals with confidence scoring
            {lastUpdate && (
              <span className="ml-2 text-sm">
                • Last updated: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={refresh}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          
          <button
            onClick={handleGenerateSignals}
            disabled={generating}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {generating ? 'Generating...' : 'Generate New'}
          </button>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Filter:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Signals</option>
            <option value="buy">Buy Signals</option>
            <option value="sell">Sell Signals</option>
            <option value="hold">Hold Signals</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="confidence">Confidence</option>
            <option value="symbol">Symbol</option>
            <option value="time">Time</option>
          </select>
        </div>

        <div className="flex items-center space-x-2 ml-auto">
          <div className="text-sm text-gray-600">
            {processedSignals.length} signal{processedSignals.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-700 font-medium">Error loading signals</span>
          </div>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Signals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="wait">
          {loading ? (
            // Loading state
            Array.from({ length: 6 }).map((_, index) => (
              <LoadingSignalCard key={`loading-${index}`} />
            ))
          ) : processedSignals.length > 0 ? (
            // Signals
            processedSignals.map((signal, index) => (
              <SignalCard
                key={`${signal.symbol}-${signal.created_at || index}`}
                signal={signal}
                index={index}
              />
            ))
          ) : (
            // Empty state
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full text-center py-12"
            >
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No signals available</h3>
              <p className="text-gray-600 mb-4">Generate new AI signals to get started</p>
              <button
                onClick={handleGenerateSignals}
                disabled={generating}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {generating ? 'Generating...' : 'Generate Signals'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AISignalDashboard;