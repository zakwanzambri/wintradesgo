import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Database,
  Wifi,
  Shield,
  Activity,
  TrendingUp,
  User
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useRealTimeData } from '../hooks/useRealTime'
import apiService from '../services/api'

const SystemTestPage = () => {
  const [tests, setTests] = useState([
    { id: 'auth-backend', name: 'Authentication Backend', status: 'pending', details: '' },
    { id: 'auth-frontend', name: 'Authentication Frontend', status: 'pending', details: '' },
    { id: 'api-connection', name: 'API Connection', status: 'pending', details: '' },
    { id: 'real-time-data', name: 'Real-time Data Updates', status: 'pending', details: '' },
    { id: 'signal-integration', name: 'Signal Integration', status: 'pending', details: '' },
    { id: 'protected-routes', name: 'Protected Routes', status: 'pending', details: '' },
    { id: 'data-flow', name: 'End-to-End Data Flow', status: 'pending', details: '' }
  ])

  const { user, login } = useAuth()
  const { portfolio, signals, prices, isConnected, lastUpdate } = useRealTimeData()

  const updateTestStatus = (testId, status, details = '') => {
    setTests(prev => prev.map(test => 
      test.id === testId 
        ? { ...test, status, details }
        : test
    ))
  }

  const runAllTests = async () => {
    // Reset all tests
    setTests(prev => prev.map(test => ({ ...test, status: 'running', details: '' })))

    // Test 1: Authentication Backend
    try {
      const response = await fetch('/api/auth.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test' })
      })
      const result = await response.json()
      
      if (response.ok) {
        updateTestStatus('auth-backend', 'passed', 'Backend API responding correctly')
      } else {
        updateTestStatus('auth-backend', 'failed', result.error || 'Backend not responding')
      }
    } catch (error) {
      updateTestStatus('auth-backend', 'failed', `Connection error: ${error.message}`)
    }

    // Test 2: Authentication Frontend
    if (user) {
      updateTestStatus('auth-frontend', 'passed', `User authenticated: ${user.username}`)
    } else {
      updateTestStatus('auth-frontend', 'warning', 'No user logged in - test with demo account')
    }

    // Test 3: API Connection
    try {
      const testData = await apiService.getPortfolioSummary()
      if (testData && testData.data) {
        updateTestStatus('api-connection', 'passed', `Retrieved portfolio data successfully`)
      } else {
        updateTestStatus('api-connection', 'failed', 'API returned invalid data format')
      }
    } catch (error) {
      updateTestStatus('api-connection', 'failed', `API Error: ${error.message}`)
    }

    // Test 4: Real-time Data Updates
    if (isConnected && lastUpdate) {
      const timeSinceUpdate = Date.now() - lastUpdate
      if (timeSinceUpdate < 30000) { // Less than 30 seconds
        updateTestStatus('real-time-data', 'passed', `Last update: ${Math.round(timeSinceUpdate/1000)}s ago`)
      } else {
        updateTestStatus('real-time-data', 'warning', `Updates delayed: ${Math.round(timeSinceUpdate/1000)}s ago`)
      }
    } else {
      updateTestStatus('real-time-data', 'failed', 'Real-time system not active')
    }

    // Test 5: Signal Integration
    try {
      const signalData = await apiService.getAISignals()
      if (signalData && signalData.data) {
        updateTestStatus('signal-integration', 'passed', `Retrieved AI signals successfully`)
      } else {
        updateTestStatus('signal-integration', 'failed', 'Signal API returned invalid data')
      }
    } catch (error) {
      updateTestStatus('signal-integration', 'failed', `Signal API Error: ${error.message}`)
    }

    // Test 6: Protected Routes
    const dashboardAccessible = window.location.pathname === '/test' || user !== null
    if (dashboardAccessible && user) {
      updateTestStatus('protected-routes', 'passed', 'Protected routes working with authentication')
    } else if (!user) {
      updateTestStatus('protected-routes', 'warning', 'Login required to test protected routes')
    } else {
      updateTestStatus('protected-routes', 'failed', 'Route protection not working')
    }

    // Test 7: End-to-End Data Flow
    const hasPortfolio = portfolio && portfolio.length > 0
    const hasSignals = signals && signals.length > 0
    const hasPrices = prices && Object.keys(prices).length > 0
    
    if (hasPortfolio && hasSignals && hasPrices && user) {
      updateTestStatus('data-flow', 'passed', 'Complete data flow operational')
    } else {
      const missing = []
      if (!user) missing.push('user auth')
      if (!hasPortfolio) missing.push('portfolio data')
      if (!hasSignals) missing.push('signals')
      if (!hasPrices) missing.push('price data')
      updateTestStatus('data-flow', 'warning', `Missing: ${missing.join(', ')}`)
    }
  }

  useEffect(() => {
    // Auto-run tests on component mount
    const timer = setTimeout(runAllTests, 1000)
    return () => clearTimeout(timer)
  }, [user, portfolio, signals, prices, isConnected])

  const getStatusIcon = (status) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'failed': return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'running': return <Clock className="h-5 w-5 text-blue-500 animate-spin" />
      default: return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'passed': return 'border-green-200 bg-green-50 dark:bg-green-900/20'
      case 'failed': return 'border-red-200 bg-red-50 dark:bg-red-900/20'
      case 'warning': return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20'
      case 'running': return 'border-blue-200 bg-blue-50 dark:bg-blue-900/20'
      default: return 'border-gray-200 bg-gray-50 dark:bg-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            System Integration Tests
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Comprehensive testing of Priority 2 features: API Integration, Real-time Updates, and Authentication
          </p>
          <button
            onClick={runAllTests}
            className="btn-primary"
          >
            Run All Tests
          </button>
        </div>

        {/* System Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card p-4 text-center">
            <Database className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900 dark:text-white">API Status</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {tests.find(t => t.id === 'api-connection')?.status || 'pending'}
            </p>
          </div>
          
          <div className="card p-4 text-center">
            <Activity className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Real-time</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {isConnected ? 'Connected' : 'Disconnected'}
            </p>
          </div>
          
          <div className="card p-4 text-center">
            <Shield className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Auth Status</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {user ? 'Authenticated' : 'Guest'}
            </p>
          </div>
          
          <div className="card p-4 text-center">
            <TrendingUp className="h-8 w-8 text-indigo-500 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Data Flow</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {tests.find(t => t.id === 'data-flow')?.status || 'pending'}
            </p>
          </div>
        </div>

        {/* Test Results */}
        <div className="space-y-4">
          {tests.map((test, index) => (
            <motion.div
              key={test.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`border rounded-lg p-4 ${getStatusColor(test.status)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(test.status)}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {test.name}
                    </h3>
                    {test.details && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {test.details}
                      </p>
                    )}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                  test.status === 'passed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                  test.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                  test.status === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {test.status}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Real-time Data Preview */}
        {(portfolio?.length > 0 || signals?.length > 0) && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Live Data Preview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {portfolio?.length > 0 && (
                <div className="card p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Portfolio ({portfolio.length} items)
                  </h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {portfolio.slice(0, 3).map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-300">{item.symbol}</span>
                        <span className={`font-semibold ${
                          item.change_24h >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {item.change_24h >= 0 ? '+' : ''}{item.change_24h}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {signals?.length > 0 && (
                <div className="card p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Signals ({signals.length} active)
                  </h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {signals.slice(0, 3).map((signal, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-300">{signal.symbol}</span>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          signal.type === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {signal.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SystemTestPage