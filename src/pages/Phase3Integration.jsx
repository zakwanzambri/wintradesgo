import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  BarChart3, 
  Settings, 
  Rocket, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Activity
} from 'lucide-react';

const Phase3Integration = () => {
  const [systemStatus, setSystemStatus] = useState(null);
  const [predictions, setPredictions] = useState({});
  const [sentiment, setSentiment] = useState(null);
  const [backtest, setBacktest] = useState(null);
  const [loading, setLoading] = useState({});
  const [error, setError] = useState({});

  // API base URL
  const API_BASE = 'http://localhost/wintradesgo/api/ml/phase3.php';

  useEffect(() => {
    getSystemStatus();
  }, []);

  const callAPI = async (action, params = {}) => {
    // Use proxy endpoints to avoid CORS issues
    const proxyMap = {
      'status': '/api/proxy/ml-status.php',
      'ensemble_prediction': '/api/proxy/ml-prediction.php',
      'sentiment_analysis': '/api/proxy/ml-sentiment.php'
    };
    
    let url = proxyMap[action] || `/api/proxy/ml-${action}.php`;
    
    // Add parameters as query string
    const queryParams = new URLSearchParams(params).toString();
    if (queryParams) {
      url += '?' + queryParams;
    }

    console.log('Calling proxy API:', url);

    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'API call failed');
    }
    
    return data.data;
  };

  const getSystemStatus = async () => {
    setLoading(prev => ({ ...prev, status: true }));
    setError(prev => ({ ...prev, status: null }));
    
    try {
      const data = await callAPI('status');
      setSystemStatus(data);
    } catch (err) {
      setError(prev => ({ ...prev, status: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, status: false }));
    }
  };

  const getEnsemblePrediction = async (symbol = 'BTC-USD') => {
    setLoading(prev => ({ ...prev, ensemble: true }));
    setError(prev => ({ ...prev, ensemble: null }));
    
    try {
      const data = await callAPI('ensemble_prediction', { symbol });
      setPredictions(prev => ({ ...prev, ensemble: data }));
    } catch (err) {
      setError(prev => ({ ...prev, ensemble: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, ensemble: false }));
    }
  };

  const getLSTMPrediction = async (symbol = 'BTC-USD') => {
    setLoading(prev => ({ ...prev, lstm: true }));
    setError(prev => ({ ...prev, lstm: null }));
    
    try {
      const data = await callAPI('lstm_prediction', { symbol });
      setPredictions(prev => ({ ...prev, lstm: data }));
    } catch (err) {
      setError(prev => ({ ...prev, lstm: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, lstm: false }));
    }
  };

  const getSentimentAnalysis = async (symbol = 'BTC-USD') => {
    setLoading(prev => ({ ...prev, sentiment: true }));
    setError(prev => ({ ...prev, sentiment: null }));
    
    try {
      const data = await callAPI('sentiment_analysis', { symbol });
      setSentiment(data);
    } catch (err) {
      setError(prev => ({ ...prev, sentiment: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, sentiment: false }));
    }
  };

  const runBacktest = async (strategy = 'technical_strategy', symbol = 'BTC-USD') => {
    setLoading(prev => ({ ...prev, backtest: true }));
    setError(prev => ({ ...prev, backtest: null }));
    
    try {
      const data = await callAPI('backtest_strategy', { strategy, symbol });
      setBacktest(data);
    } catch (err) {
      setError(prev => ({ ...prev, backtest: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, backtest: false }));
    }
  };

  const getBatchPredictions = async () => {
    setLoading(prev => ({ ...prev, batch: true }));
    setError(prev => ({ ...prev, batch: null }));
    
    try {
      const data = await callAPI('batch_predictions', { symbols: 'BTC-USD,ETH-USD,AAPL' });
      setPredictions(prev => ({ ...prev, batch: data }));
    } catch (err) {
      setError(prev => ({ ...prev, batch: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, batch: false }));
    }
  };

  const StatusIcon = ({ status }) => {
    switch (status) {
      case 'HEALTHY':
      case 'WARNING':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'ERROR':
      case 'NOT_AVAILABLE':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Activity className="w-5 h-5 text-yellow-400" />;
    }
  };

  const ComponentCard = ({ title, icon: Icon, status, details, onTest, loading, error, children }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Icon className="w-6 h-6 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <StatusIcon status={status} />
          <span className={`text-sm ${
            status === 'HEALTHY' || status === 'WARNING' ? 'text-green-400' : 
            status === 'ERROR' || status === 'NOT_AVAILABLE' ? 'text-red-400' : 
            'text-yellow-400'
          }`}>
            {status}
          </span>
        </div>
      </div>

      {details && (
        <div className="text-sm text-gray-300 mb-4">
          {Object.entries(details).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="capitalize">{key.replace('_', ' ')}:</span>
              <span>{Array.isArray(value) ? value.join(', ') : value}</span>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {children}

      <button
        onClick={onTest}
        disabled={loading}
        className="w-full mt-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <TrendingUp className="w-4 h-4" />
        )}
        {loading ? 'Testing...' : 'Test Component'}
      </button>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            🔌 Phase 3 ML Integration
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Real-time integration testing between frontend and Phase 3 ML components
          </p>
          
          <button
            onClick={getSystemStatus}
            disabled={loading.status}
            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center gap-2 mx-auto"
          >
            {loading.status ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh System Status
          </button>
        </motion.div>

        {/* System Status Overview */}
        {systemStatus && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-8"
          >
            <h2 className="text-2xl font-bold mb-4">System Status Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Object.entries(systemStatus.components).map(([component, data]) => (
                <div key={component} className="text-center">
                  <div className="capitalize font-semibold">{component}</div>
                  <div className={`text-sm ${
                    data.status === 'HEALTHY' || data.status === 'WARNING' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {data.status}
                  </div>
                  {data.models_available && (
                    <div className="text-xs text-gray-400">
                      {data.models_available} models
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Component Tests */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Ensemble Trading System */}
          <ComponentCard
            title="Ensemble Trading System"
            icon={Rocket}
            status={systemStatus?.components?.ensemble?.status}
            details={systemStatus?.components?.ensemble}
            onTest={() => getEnsemblePrediction()}
            loading={loading.ensemble}
            error={error.ensemble}
          >
            {predictions.ensemble && (
              <div className="bg-blue-500/20 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Latest Prediction:</h4>
                <div className="text-sm space-y-1">
                  <div>Symbol: {predictions.ensemble.symbol}</div>
                  <div>Action: {predictions.ensemble.prediction?.action}</div>
                  <div>Confidence: {predictions.ensemble.prediction?.confidence_score}%</div>
                </div>
              </div>
            )}
          </ComponentCard>

          {/* LSTM Bridge */}
          <ComponentCard
            title="Enhanced LSTM Bridge"
            icon={Brain}
            status={systemStatus?.components?.lstm?.status}
            details={systemStatus?.components?.lstm}
            onTest={() => getLSTMPrediction()}
            loading={loading.lstm}
            error={error.lstm}
          >
            {predictions.lstm && (
              <div className="bg-purple-500/20 rounded-lg p-4">
                <h4 className="font-semibold mb-2">LSTM Prediction:</h4>
                <div className="text-sm space-y-1">
                  <div>Symbol: {predictions.lstm.symbol}</div>
                  <div>Prediction: {predictions.lstm.prediction?.prediction}</div>
                  <div>Confidence: {predictions.lstm.prediction?.confidence}%</div>
                </div>
              </div>
            )}
          </ComponentCard>

          {/* Sentiment Analysis */}
          <ComponentCard
            title="Real Sentiment Analysis"
            icon={BarChart3}
            status={systemStatus?.components?.sentiment?.status}
            details={systemStatus?.components?.sentiment}
            onTest={() => getSentimentAnalysis()}
            loading={loading.sentiment}
            error={error.sentiment}
          >
            {sentiment && (
              <div className="bg-green-500/20 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Sentiment Analysis:</h4>
                <div className="text-sm space-y-1">
                  <div>Symbol: {sentiment.symbol}</div>
                  <div>Score: {sentiment.sentiment?.overall_sentiment?.score}</div>
                  <div>Label: {sentiment.sentiment?.overall_sentiment?.label}</div>
                </div>
              </div>
            )}
          </ComponentCard>

          {/* Backtest Engine */}
          <ComponentCard
            title="Professional Backtest Engine"
            icon={Settings}
            status={systemStatus?.components?.backtest?.status}
            details={systemStatus?.components?.backtest}
            onTest={() => runBacktest()}
            loading={loading.backtest}
            error={error.backtest}
          >
            {backtest && (
              <div className="bg-yellow-500/20 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Backtest Results:</h4>
                <div className="text-sm space-y-1">
                  <div>Strategy: {backtest.strategy}</div>
                  <div>Return: {backtest.results?.metrics?.total_return}%</div>
                  <div>Sharpe: {backtest.results?.metrics?.sharpe_ratio}</div>
                </div>
              </div>
            )}
          </ComponentCard>
        </div>

        {/* Batch Testing */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
        >
          <h3 className="text-xl font-semibold mb-4">Batch Testing</h3>
          <div className="flex gap-4 mb-4">
            <button
              onClick={getBatchPredictions}
              disabled={loading.batch}
              className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
            >
              {loading.batch ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Rocket className="w-4 h-4" />
              )}
              Test All Symbols
            </button>
          </div>

          {error.batch && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4">
              <p className="text-red-300 text-sm">{error.batch}</p>
            </div>
          )}

          {predictions.batch && (
            <div className="bg-indigo-500/20 rounded-lg p-4">
              <h4 className="font-semibold mb-2">Batch Predictions:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {predictions.batch.symbols?.map((symbol, index) => (
                  <div key={symbol} className="bg-white/10 rounded p-3">
                    <div className="font-medium">{symbol}</div>
                    <div>Action: {predictions.batch.predictions?.[symbol]?.action || 'N/A'}</div>
                    <div>Confidence: {predictions.batch.predictions?.[symbol]?.confidence_score || 'N/A'}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Phase3Integration;