import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity, 
  AlertCircle,
  Target,
  Brain,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import API from '../utils/api'

const Dashboard = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h')
  const [marketData, setMarketData] = useState([])
  const [sentimentData, setSentimentData] = useState([])
  const [portfolio, setPortfolio] = useState(null)
  const [aiSignals, setAiSignals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load real data from API
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)
        
        // Load portfolio data
        const portfolioResult = await API.portfolio.getPortfolio()
        if (portfolioResult.success) {
          setPortfolio(portfolioResult.data)
        }
        
        // Load AI signals  
        const signalsResult = await fetch('http://localhost:8000/api/signals/get.php')
        const signalsData = await signalsResult.json()
        if (signalsData.success) {
          setAiSignals(signalsData.data.signals || [])
        }
        
        setError(null)
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    
    loadDashboardData()
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  // Generate mock chart data
  useEffect(() => {
    const generateMarketData = () => {
      const data = []
      const now = new Date()
      for (let i = 23; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60 * 60 * 1000)
        data.push({
          time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          bitcoin: 43000 + Math.random() * 2000 - 1000,
          ethereum: 2600 + Math.random() * 200 - 100,
          volume: Math.random() * 1000000000
        })
      }
      setMarketData(data)
    }

    const generateSentimentData = () => {
      setSentimentData([
        { name: 'Bullish', value: 65, color: '#10b981' },
        { name: 'Neutral', value: 20, color: '#6b7280' },
        { name: 'Bearish', value: 15, color: '#ef4444' }
      ])
    }

    generateMarketData()
    generateSentimentData()
    
    const interval = setInterval(generateMarketData, 30000)
    return () => clearInterval(interval)
  }, [selectedTimeframe])

  const cryptoAssets = [
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      price: 43250.67,
      change: 2.45,
      volume: '2.1B',
      marketCap: '847.2B',
      color: '#f7931a'
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      price: 2634.89,
      change: -1.23,
      volume: '1.2B',
      marketCap: '316.8B',
      color: '#627eea'
    },
    {
      symbol: 'ADA',
      name: 'Cardano',
      price: 0.523,
      change: 4.67,
      volume: '324M',
      marketCap: '18.5B',
      color: '#0033ad'
    },
    {
      symbol: 'SOL',
      name: 'Solana',
      price: 98.45,
      change: -2.11,
      volume: '456M',
      marketCap: '42.1B',
      color: '#9945ff'
    }
  ]

  // Use real AI signals data (loaded from API)
  // Mock signals are replaced by real data from aiSignals state

  const portfolioStats = [
    {
      label: 'Total Value',
      value: '$127,543.21',
      change: '+$3,247.89',
      percentage: '+2.45%',
      icon: DollarSign,
      positive: true
    },
    {
      label: '24h P&L',
      value: '+$1,847.32',
      change: 'vs yesterday',
      percentage: '+1.47%',
      icon: TrendingUp,
      positive: true
    },
    {
      label: 'Win Rate',
      value: '87.3%',
      change: 'Last 30 trades',
      percentage: '+2.1%',
      icon: Target,
      positive: true
    },
    {
      label: 'Active Positions',
      value: '12',
      change: '8 profitable',
      percentage: '66.7%',
      icon: Activity,
      positive: true
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Trading Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Real-time market insights and AI-powered analytics
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-4">
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="bg-white dark:bg-dark-100 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="1h">1 Hour</option>
                <option value="24h">24 Hours</option>
                <option value="7d">7 Days</option>
                <option value="30d">30 Days</option>
              </select>
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Clock className="h-4 w-4" />
                <span>Live</span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Portfolio Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {portfolioStats.map((stat, _index) => (
            <div key={stat.label} className="card">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${stat.positive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                  <stat.icon className={`h-5 w-5 ${stat.positive ? 'text-green-600' : 'text-red-600'}`} />
                </div>
                <div className={`flex items-center text-sm ${stat.positive ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.positive ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
                  {stat.percentage}
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {stat.change}
              </div>
            </div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Market Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="card mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Market Overview
                </h2>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">BTC/USD</span>
                  <div className="flex items-center text-green-600">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">+2.45%</span>
                  </div>
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={marketData}>
                    <defs>
                      <linearGradient id="colorBitcoin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="time" 
                      className="text-xs text-gray-600 dark:text-gray-400"
                    />
                    <YAxis 
                      className="text-xs text-gray-600 dark:text-gray-400"
                      domain={['dataMin - 500', 'dataMax + 500']}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.5rem',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="bitcoin"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorBitcoin)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Crypto Assets */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Top Cryptocurrencies
              </h3>
              <div className="space-y-4">
                {cryptoAssets.map((asset) => (
                  <div key={asset.symbol} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-dark-200 rounded-lg transition-colors">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: asset.color }}
                      >
                        {asset.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {asset.name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {asset.symbol}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900 dark:text-white">
                        ${asset.price.toLocaleString()}
                      </div>
                      <div className={`text-sm flex items-center ${
                        asset.change > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {asset.change > 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                        {Math.abs(asset.change)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* AI Signals */}
            <div className="card">
              <div className="flex items-center space-x-2 mb-4">
                <Brain className="h-5 w-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  AI Signals
                </h3>
              </div>
              <div className="space-y-3">
                {(aiSignals.length > 0 ? aiSignals : []).map((signal, index) => (
                  <div key={signal.id || index} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          signal.signal_type === 'BUY' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          signal.signal_type === 'SELL' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {signal.signal_type}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {signal.symbol}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {signal.confidence}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      {signal.reason}
                    </div>
                    <div className="text-xs text-gray-500">
                      {signal.timeframe} • {signal.minutes_ago < 60 ? `${signal.minutes_ago} mins ago` : `${Math.floor(signal.minutes_ago / 60)} hours ago`}
                    </div>
                  </div>
                ))}
                {aiSignals.length === 0 && !loading && (
                  <div className="text-center text-gray-500 py-4">
                    No AI signals available
                  </div>
                )}
              </div>
            </div>

            {/* Market Sentiment */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Market Sentiment
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sentimentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {sentimentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {sentimentData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full btn-primary">
                  Execute Trade
                </button>
                <button className="w-full btn-outline">
                  Set Alert
                </button>
                <button className="w-full btn-outline">
                  Analyze Portfolio
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard