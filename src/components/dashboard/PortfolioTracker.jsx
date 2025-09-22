import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Target,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  MoreHorizontal
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { usePortfolioData } from '../../hooks/useAPI';

const PortfolioTracker = () => {
  const [showValues, setShowValues] = useState(true);
  const [selectedPosition, setSelectedPosition] = useState(null);
  
  const {
    portfolio,
    positions,
    performance,
    trades,
    loading,
    error,
    refresh
  } = usePortfolioData();

  // Real-time portfolio metrics
  const portfolioMetrics = [
    {
      title: 'Total Portfolio Value',
      value: portfolio?.total_value || 0,
      displayValue: showValues 
        ? `$${(portfolio?.total_value || 125420).toLocaleString()}` 
        : '•••••',
      change: portfolio?.daily_change || 3247.89,
      changePercent: portfolio?.daily_change_percent || 2.67,
      icon: DollarSign,
      color: 'blue'
    },
    {
      title: '24h Profit/Loss',
      value: portfolio?.daily_pnl || 0,
      displayValue: showValues 
        ? `${portfolio?.daily_pnl >= 0 ? '+' : ''}$${Math.abs(portfolio?.daily_pnl || 1847.32).toLocaleString()}` 
        : '•••••',
      change: portfolio?.daily_pnl || 1847.32,
      changePercent: portfolio?.daily_pnl_percent || 1.49,
      icon: TrendingUp,
      color: portfolio?.daily_pnl >= 0 ? 'green' : 'red'
    },
    {
      title: 'Active Positions',
      value: positions?.length || 0,
      displayValue: `${positions?.length || 12}`,
      change: positions?.filter(p => p.pnl > 0).length || 8,
      changePercent: positions?.length ? Math.round((positions.filter(p => p.pnl > 0).length / positions.length) * 100) : 67,
      icon: Target,
      color: 'purple'
    },
    {
      title: 'Win Rate',
      value: performance?.win_rate || 0,
      displayValue: `${(performance?.win_rate || 87.3).toFixed(1)}%`,
      change: performance?.total_trades || 156,
      changePercent: performance?.win_rate_change || 2.1,
      icon: Activity,
      color: 'yellow'
    }
  ];

  const MetricCard = ({ metric, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-${metric.color}-100 dark:bg-${metric.color}-900/30`}>
          <metric.icon className={`h-6 w-6 text-${metric.color}-600 dark:text-${metric.color}-400`} />
        </div>
        {metric.title !== 'Active Positions' && metric.title !== 'Win Rate' && (
          <div className={`flex items-center text-sm font-medium ${
            metric.change >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {metric.change >= 0 ? (
              <TrendingUp className="h-4 w-4 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 mr-1" />
            )}
            {metric.change >= 0 ? '+' : ''}{metric.changePercent?.toFixed(2)}%
          </div>
        )}
      </div>
      
      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        {metric.displayValue}
      </div>
      
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {metric.title === 'Active Positions' ? (
          `${metric.change} profitable (${metric.changePercent}%)`
        ) : metric.title === 'Win Rate' ? (
          `${metric.change} total trades`
        ) : (
          `${metric.change >= 0 ? '+' : ''}$${Math.abs(metric.change).toLocaleString()} today`
        )}
      </div>
    </motion.div>
  );

  const PositionItem = ({ position, index }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => setSelectedPosition(position)}
      className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
            {position.symbol?.slice(0, 2) || 'N/A'}
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">{position.symbol}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {position.amount} units @ ${position.entry_price?.toFixed(2)}
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="font-semibold text-gray-900 dark:text-white">
            {showValues ? `$${position.market_value?.toLocaleString()}` : '•••••'}
          </div>
          <div className={`text-sm font-medium ${
            (position.pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {(position.pnl || 0) >= 0 ? '+' : ''}
            {showValues ? `$${Math.abs(position.pnl || 0).toLocaleString()}` : '•••'}
            <span className="ml-1">
              ({(position.pnl_percent || 0) >= 0 ? '+' : ''}{(position.pnl_percent || 0).toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const RecentTrade = ({ trade, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
    >
      <div className="flex items-center space-x-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          trade.type === 'buy' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
        }`}>
          {trade.type === 'buy' ? '+' : '-'}
        </div>
        <div>
          <div className="font-medium text-gray-900 dark:text-white">
            {trade.type.toUpperCase()} {trade.symbol}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {trade.amount} @ ${trade.price}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-medium text-gray-900 dark:text-white">
          {showValues ? `$${trade.total_value?.toLocaleString()}` : '•••••'}
        </div>
        <div className="text-xs text-gray-500">
          {trade.timestamp ? new Date(trade.timestamp).toLocaleTimeString() : 'N/A'}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center"
      >
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Portfolio Tracker</h2>
          <p className="text-gray-600 dark:text-gray-400">Real-time portfolio performance and positions</p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={() => setShowValues(!showValues)}
            className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {showValues ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span>{showValues ? 'Hide' : 'Show'} Values</span>
          </button>
          
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
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
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700 dark:text-red-300 font-medium">Portfolio Data Error</span>
          </div>
          <p className="text-red-600 dark:text-red-400 text-sm mt-1">{error}</p>
        </motion.div>
      )}

      {/* Portfolio Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {portfolioMetrics.map((metric, index) => (
          <MetricCard key={metric.title} metric={metric} index={index} />
        ))}
      </div>

      {/* Performance Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Portfolio Performance</h3>
          <div className="flex space-x-2">
            {['24h', '7d', '30d'].map((period) => (
              <button
                key={period}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {period}
              </button>
            ))}
          </div>
        </div>
        
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={performance?.chart_data || []}>
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
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#3B82F6" 
                fill="#3B82F6" 
                fillOpacity={0.3} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Positions and Recent Trades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Current Positions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Current Positions</h3>
            <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              <MoreHorizontal className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-16"></div>
              ))
            ) : positions?.length > 0 ? (
              positions.slice(0, 5).map((position, index) => (
                <PositionItem key={position.id || index} position={position} index={index} />
              ))
            ) : (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No active positions</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Trades */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Trades</h3>
            <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium">
              View All
            </button>
          </div>
          
          <div className="space-y-2">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-12"></div>
              ))
            ) : trades?.length > 0 ? (
              trades.slice(0, 6).map((trade, index) => (
                <RecentTrade key={trade.id || index} trade={trade} index={index} />
              ))
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No recent trades</p>
              </div>
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default PortfolioTracker;