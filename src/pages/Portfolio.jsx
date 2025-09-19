import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  BarChart,
  Bar
} from 'recharts'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Settings,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
  Download
} from 'lucide-react'

const Portfolio = () => {
  const [selectedTab, setSelectedTab] = useState('overview')
  const [timeframe, setTimeframe] = useState('7d')

  const portfolioData = [
    { name: 'Bitcoin', value: 45, amount: 1.2534, usdValue: 54238.67, change: 2.45, color: '#f7931a' },
    { name: 'Ethereum', value: 30, amount: 16.789, usdValue: 44234.89, change: -1.23, color: '#627eea' },
    { name: 'Cardano', value: 15, amount: 25432.1, usdValue: 13301.65, change: 4.67, color: '#0033ad' },
    { name: 'Solana', value: 7, amount: 89.45, usdValue: 8807.23, change: -2.11, color: '#9945ff' },
    { name: 'Others', value: 3, amount: 0, usdValue: 3617.89, change: 1.34, color: '#6b7280' }
  ]

  const performanceData = [
    { date: '2024-01-01', value: 100000 },
    { date: '2024-01-08', value: 105000 },
    { date: '2024-01-15', value: 102000 },
    { date: '2024-01-22', value: 108000 },
    { date: '2024-01-29', value: 115000 },
    { date: '2024-02-05', value: 118000 },
    { date: '2024-02-12', value: 124200 }
  ]

  const transactions = [
    {
      id: 1,
      type: 'buy',
      symbol: 'BTC',
      amount: 0.0234,
      price: 43250.67,
      total: 1012.07,
      date: '2024-02-12',
      time: '14:30'
    },
    {
      id: 2,
      type: 'sell',
      symbol: 'ETH',
      amount: 1.5,
      price: 2634.89,
      total: 3952.34,
      date: '2024-02-11',
      time: '09:15'
    },
    {
      id: 3,
      type: 'buy',
      symbol: 'ADA',
      amount: 2000,
      price: 0.523,
      total: 1046.00,
      date: '2024-02-10',
      time: '16:45'
    },
    {
      id: 4,
      type: 'sell',
      symbol: 'SOL',
      amount: 10.5,
      price: 98.45,
      total: 1033.73,
      date: '2024-02-09',
      time: '11:20'
    }
  ]

  const totalValue = portfolioData.reduce((acc, item) => acc + item.usdValue, 0)
  const totalChange = ((totalValue - 120000) / 120000) * 100

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'holdings', label: 'Holdings' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'performance', label: 'Performance' }
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Portfolio
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Track and manage your cryptocurrency investments
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-4">
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-dark-200 transition-colors">
                <Filter className="h-4 w-4" />
                <span>Filter</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-dark-200 transition-colors">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
              <button className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Asset
              </button>
            </div>
          </div>

          {/* Portfolio Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${totalValue.toLocaleString()}
                  </p>
                </div>
                <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                  <DollarSign className="h-6 w-6 text-primary-600" />
                </div>
              </div>
              <div className={`flex items-center mt-2 text-sm ${totalChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalChange >= 0 ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
                {Math.abs(totalChange).toFixed(2)}% (24h)
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">24h Change</p>
                  <p className="text-2xl font-bold text-green-600">
                    +$3,247.89
                  </p>
                </div>
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="flex items-center mt-2 text-sm text-green-600">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                +2.67% gain
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Best Performer</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ADA
                  </p>
                </div>
                <div className="p-2 bg-accent-100 dark:bg-accent-900/30 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-accent-600" />
                </div>
              </div>
              <div className="flex items-center mt-2 text-sm text-green-600">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                +4.67%
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Assets</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {portfolioData.length - 1}
                  </p>
                </div>
                <div className="p-2 bg-secondary-100 dark:bg-secondary-900/30 rounded-lg">
                  <Settings className="h-6 w-6 text-secondary-600" />
                </div>
              </div>
              <div className="flex items-center mt-2 text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="h-4 w-4 mr-1" />
                Since Jan 2024
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    selectedTab === tab.id
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={selectedTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {selectedTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Portfolio Allocation */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  Portfolio Allocation
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={portfolioData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        {portfolioData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Performance Chart */}
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Portfolio Performance
                  </h3>
                  <select
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                    className="bg-white dark:bg-dark-100 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 text-sm"
                  >
                    <option value="7d">7 Days</option>
                    <option value="30d">30 Days</option>
                    <option value="90d">90 Days</option>
                    <option value="1y">1 Year</option>
                  </select>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'holdings' && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Current Holdings
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Asset</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Amount</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Value</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">24h Change</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Allocation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolioData.slice(0, -1).map((asset) => (
                      <tr key={asset.name} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-dark-200">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                              style={{ backgroundColor: asset.color }}
                            >
                              {asset.name.slice(0, 2)}
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">{asset.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right text-gray-900 dark:text-white">
                          {asset.amount.toLocaleString()}
                        </td>
                        <td className="py-4 px-4 text-right font-medium text-gray-900 dark:text-white">
                          ${asset.usdValue.toLocaleString()}
                        </td>
                        <td className={`py-4 px-4 text-right font-medium ${asset.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {asset.change >= 0 ? '+' : ''}{asset.change}%
                        </td>
                        <td className="py-4 px-4 text-right text-gray-600 dark:text-gray-400">
                          {asset.value}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selectedTab === 'transactions' && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Recent Transactions
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Asset</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Amount</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Price</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Total</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-dark-200">
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            tx.type === 'buy' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {tx.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-medium text-gray-900 dark:text-white">
                          {tx.symbol}
                        </td>
                        <td className="py-4 px-4 text-right text-gray-900 dark:text-white">
                          {tx.amount}
                        </td>
                        <td className="py-4 px-4 text-right text-gray-900 dark:text-white">
                          ${tx.price.toLocaleString()}
                        </td>
                        <td className="py-4 px-4 text-right font-medium text-gray-900 dark:text-white">
                          ${tx.total.toLocaleString()}
                        </td>
                        <td className="py-4 px-4 text-right text-gray-600 dark:text-gray-400">
                          <div>{tx.date}</div>
                          <div className="text-xs">{tx.time}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selectedTab === 'performance' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  Monthly Performance
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  Performance Metrics
                </h3>
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Total Return</span>
                    <span className="font-medium text-green-600">+24.2%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Annualized Return</span>
                    <span className="font-medium text-green-600">+156.3%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Max Drawdown</span>
                    <span className="font-medium text-red-600">-12.4%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Sharpe Ratio</span>
                    <span className="font-medium text-gray-900 dark:text-white">2.34</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Win Rate</span>
                    <span className="font-medium text-green-600">73.5%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Best Trade</span>
                    <span className="font-medium text-green-600">+$2,847.33</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default Portfolio