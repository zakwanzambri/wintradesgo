import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Filter,
  Info,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import { usePatternRecognition } from '../../hooks/useAPI';

const PatternVisualization = () => {
  const [selectedPattern, setSelectedPattern] = useState(null);
  const [showOverlays, setShowOverlays] = useState(true);
  const [timeframe, setTimeframe] = useState('1h');
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');
  const [filterStrength, setFilterStrength] = useState('all'); // 'all', 'strong', 'weak'

  const {
    patterns,
    chartData,
    loading,
    error,
    refresh
  } = usePatternRecognition(selectedSymbol, timeframe);

  // Pattern type configurations
  const patternTypes = {
    'head_and_shoulders': {
      name: 'Head and Shoulders',
      color: '#ef4444',
      icon: TrendingDown,
      reliability: 85,
      description: 'Bearish reversal pattern indicating potential price decline',
      signal: 'SELL'
    },
    'double_top': {
      name: 'Double Top',
      color: '#f97316',
      icon: TrendingDown,
      reliability: 78,
      description: 'Bearish pattern showing resistance at similar price levels',
      signal: 'SELL'
    },
    'triangle_ascending': {
      name: 'Ascending Triangle',
      color: '#10b981',
      icon: TrendingUp,
      reliability: 72,
      description: 'Bullish continuation pattern with upward breakout potential',
      signal: 'BUY'
    },
    'cup_and_handle': {
      name: 'Cup and Handle',
      color: '#3b82f6',
      icon: TrendingUp,
      reliability: 80,
      description: 'Bullish continuation pattern indicating strong upward momentum',
      signal: 'BUY'
    },
    'flag_bullish': {
      name: 'Bullish Flag',
      color: '#059669',
      icon: TrendingUp,
      reliability: 75,
      description: 'Short-term bullish continuation after strong upward move',
      signal: 'BUY'
    },
    'flag_bearish': {
      name: 'Bearish Flag',
      color: '#dc2626',
      icon: TrendingDown,
      reliability: 75,
      description: 'Short-term bearish continuation after strong downward move',
      signal: 'SELL'
    },
    'support_resistance': {
      name: 'Support/Resistance',
      color: '#6366f1',
      icon: Target,
      reliability: 65,
      description: 'Key price levels where buying or selling pressure emerges',
      signal: 'WATCH'
    }
  };

  // Filter patterns based on strength
  const filteredPatterns = patterns?.filter(pattern => {
    if (filterStrength === 'all') return true;
    if (filterStrength === 'strong') return pattern.confidence >= 75;
    if (filterStrength === 'weak') return pattern.confidence < 75;
    return true;
  }) || [];

  const PatternCard = ({ pattern, index }) => {
    const patternConfig = patternTypes[pattern.type] || {
      name: pattern.type,
      color: '#6b7280',
      icon: Target,
      reliability: pattern.confidence,
      description: 'Pattern detected by AI analysis',
      signal: 'NEUTRAL'
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        onClick={() => setSelectedPattern(pattern)}
        className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border cursor-pointer transition-all hover:shadow-xl ${
          selectedPattern?.id === pattern.id 
            ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800' 
            : 'border-gray-200 dark:border-gray-700'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${patternConfig.color}20`, color: patternConfig.color }}
            >
              <patternConfig.icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{patternConfig.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{selectedSymbol}</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              patternConfig.signal === 'BUY' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
              patternConfig.signal === 'SELL' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
            }`}>
              {patternConfig.signal}
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {patternConfig.description}
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Confidence</div>
            <div className="flex items-center mt-1">
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                <div 
                  className="h-2 rounded-full transition-all"
                  style={{ 
                    width: `${pattern.confidence}%`,
                    backgroundColor: patternConfig.color
                  }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {pattern.confidence}%
              </span>
            </div>
          </div>
          
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Time Frame</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white mt-1">
              {pattern.timeframe || timeframe}
            </div>
          </div>
        </div>

        {pattern.price_target && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">Price Target</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                ${pattern.price_target.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  const ChartOverlay = ({ pattern }) => {
    if (!pattern || !showOverlays) return null;

    const patternConfig = patternTypes[pattern.type] || { color: '#6b7280' };

    return (
      <g>
        {/* Pattern boundary area */}
        {pattern.start_point && pattern.end_point && (
          <ReferenceArea
            x1={pattern.start_point.x}
            x2={pattern.end_point.x}
            y1={pattern.start_point.y}
            y2={pattern.end_point.y}
            fill={patternConfig.color}
            fillOpacity={0.1}
            stroke={patternConfig.color}
            strokeWidth={2}
            strokeDasharray="5 5"
          />
        )}
        
        {/* Key points */}
        {pattern.key_points?.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={4}
            fill={patternConfig.color}
            stroke="white"
            strokeWidth={2}
          />
        ))}
        
        {/* Trend lines */}
        {pattern.trend_lines?.map((line, index) => (
          <line
            key={index}
            x1={line.start.x}
            y1={line.start.y}
            x2={line.end.x}
            y2={line.end.y}
            stroke={patternConfig.color}
            strokeWidth={2}
            strokeDasharray="3 3"
          />
        ))}
      </g>
    );
  };

  const PatternDetail = ({ pattern }) => {
    if (!pattern) return null;

    const patternConfig = patternTypes[pattern.type] || {
      name: pattern.type,
      color: '#6b7280',
      icon: Target,
      description: 'Pattern detected by AI analysis',
      signal: 'NEUTRAL'
    };

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${patternConfig.color}20`, color: patternConfig.color }}
            >
              <patternConfig.icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {patternConfig.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">{selectedSymbol} • {timeframe}</p>
            </div>
          </div>
          
          <button
            onClick={() => setSelectedPattern(null)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Pattern Details</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Confidence</span>
                <span className="font-medium text-gray-900 dark:text-white">{pattern.confidence}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Signal</span>
                <span className={`font-medium ${
                  patternConfig.signal === 'BUY' ? 'text-green-600' :
                  patternConfig.signal === 'SELL' ? 'text-red-600' :
                  'text-yellow-600'
                }`}>
                  {patternConfig.signal}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Reliability</span>
                <span className="font-medium text-gray-900 dark:text-white">{patternConfig.reliability}%</span>
              </div>
              {pattern.price_target && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Price Target</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ${pattern.price_target.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Description</h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              {patternConfig.description}
            </p>
            
            {pattern.formation_time && (
              <div className="mt-4">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">Formation Time</h5>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4 mr-2" />
                  {new Date(pattern.formation_time).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center"
      >
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Pattern Recognition</h2>
          <p className="text-gray-600 dark:text-gray-400">AI-detected chart patterns and technical formations</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 mt-4 lg:mt-0">
          {/* Symbol Selector */}
          <select
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="BTC">Bitcoin (BTC)</option>
            <option value="ETH">Ethereum (ETH)</option>
            <option value="ADA">Cardano (ADA)</option>
            <option value="SOL">Solana (SOL)</option>
          </select>
          
          {/* Timeframe Selector */}
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="5m">5 Minutes</option>
            <option value="15m">15 Minutes</option>
            <option value="1h">1 Hour</option>
            <option value="4h">4 Hours</option>
            <option value="1d">1 Day</option>
          </select>
          
          {/* Filter Strength */}
          <select
            value={filterStrength}
            onChange={(e) => setFilterStrength(e.target.value)}
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Patterns</option>
            <option value="strong">Strong Only (75%+)</option>
            <option value="weak">Weak Only (&lt;75%)</option>
          </select>
          
          {/* Overlay Toggle */}
          <button
            onClick={() => setShowOverlays(!showOverlays)}
            className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-lg transition-colors ${
              showOverlays 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            {showOverlays ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span>Overlays</span>
          </button>
          
          {/* Refresh Button */}
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </motion.div>

      {/* Error Banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
        >
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700 dark:text-red-300 font-medium">Pattern Recognition Error</span>
          </div>
          <p className="text-red-600 dark:text-red-400 text-sm mt-1">{error}</p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart with Pattern Overlays */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedSymbol} Chart with Patterns
              </h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {filteredPatterns.length} patterns detected
                </span>
              </div>
            </div>
            
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis dataKey="timestamp" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: 'none', 
                      borderRadius: '8px' 
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={false}
                  />
                  
                  {/* Pattern Overlays */}
                  {showOverlays && filteredPatterns.map((pattern, index) => (
                    <ChartOverlay key={pattern.id || index} pattern={pattern} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
          
          {/* Selected Pattern Detail */}
          {selectedPattern && (
            <div className="mt-6">
              <PatternDetail pattern={selectedPattern} />
            </div>
          )}
        </div>

        {/* Pattern List */}
        <div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Detected Patterns
              </h3>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {filteredPatterns.length}
                </span>
              </div>
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-32"></div>
                ))
              ) : filteredPatterns.length > 0 ? (
                filteredPatterns.map((pattern, index) => (
                  <PatternCard key={pattern.id || index} pattern={pattern} index={index} />
                ))
              ) : (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No patterns detected</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Try adjusting the timeframe or symbol
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
};

export default PatternVisualization;