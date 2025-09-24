import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, BarChart3, AlertCircle, RefreshCw } from 'lucide-react';

const MLPredictionWidget = () => {
  const [predictions, setPredictions] = useState(null);
  const [sentiment, setSentiment] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const callMLAPI = async (endpoint, params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const url = `http://localhost/wintradesgo/model-api.php?action=${endpoint}${queryParams ? '&' + queryParams : ''}`;
      
      console.log('Calling API:', url);
      const response = await fetch(url);
      const text = await response.text();
      console.log('Raw response:', text.substring(0, 200));
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Content-Type:', contentType);
        console.warn('Response preview:', text.substring(0, 300));
      }
      
      const data = JSON.parse(text);
      
      // Return data regardless of success flag for debugging
      return data;
    } catch (error) {
      console.error('ML API Error:', error);
      throw error;
    }
    
    return data.data;
  };

  const getPrediction = async (symbol = 'BTC-USD') => {
    setLoading(true);
    setError(null);
    
    try {
      // Start with just list_models to test basic connectivity
      const modelsData = await callMLAPI('list_models');
      console.log('Models data received:', modelsData);
      
      if (modelsData && modelsData.models) {
        setSystemStatus({
          status: 'active',
          models_count: modelsData.models.length,
          last_updated: new Date().toISOString()
        });
        
        // Set some mock predictions for now
        setPredictions({
          symbol: symbol,
          prediction: 'HOLD',
          confidence: 0.75,
          price_target: '$50,000',
          timeframe: '24h'
        });
        
        setSentiment({
          sentiment: 'bullish',
          confidence: 0.75,
          sources: ['news', 'social_media']
        });
      }
    } catch (err) {
      setError(err.message);
      console.error('ML Widget Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getPrediction();
  }, []);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">ML System Error: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Phase 3 ML Predictions</h3>
        </div>
        <button
          onClick={() => getPrediction()}
          disabled={loading}
          className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
          <p className="text-gray-600 mt-2">Loading ML predictions...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Ensemble Prediction */}
          {predictions && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <TrendingUp className="h-4 w-4 text-blue-600 mr-2" />
                <h4 className="font-medium text-blue-900">Ensemble Signal</h4>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-blue-700">Action:</span>
                  <span className={`text-sm font-medium ${
                    predictions.action === 'BUY' ? 'text-green-600' : 
                    predictions.action === 'SELL' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {predictions.action}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-blue-700">Confidence:</span>
                  <span className="text-sm font-medium text-blue-900">
                    {predictions.confidence?.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-blue-700">Position Size:</span>
                  <span className="text-sm font-medium text-blue-900">
                    {predictions.position_size?.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Sentiment Analysis */}
          {sentiment && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <BarChart3 className="h-4 w-4 text-green-600 mr-2" />
                <h4 className="font-medium text-green-900">Market Sentiment</h4>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-green-700">Overall:</span>
                  <span className={`text-sm font-medium ${
                    sentiment.sentiment?.overall_sentiment?.label === 'POSITIVE' ? 'text-green-600' :
                    sentiment.sentiment?.overall_sentiment?.label === 'NEGATIVE' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {sentiment.sentiment?.overall_sentiment?.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-green-700">Score:</span>
                  <span className="text-sm font-medium text-green-900">
                    {sentiment.sentiment?.overall_sentiment?.score?.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-green-700">Confidence:</span>
                  <span className="text-sm font-medium text-green-900">
                    {(sentiment.sentiment?.overall_sentiment?.confidence * 100)?.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* System Status */}
      {systemStatus && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <h4 className="text-sm font-medium text-gray-900 mb-2">ML System Status</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            {Object.entries(systemStatus.components).map(([name, status]) => (
              <div key={name} className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${
                  status.status?.toLowerCase() === 'healthy' ? 'bg-green-500' :
                  status.status?.toLowerCase() === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className="text-gray-600 capitalize">{name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MLPredictionWidget;