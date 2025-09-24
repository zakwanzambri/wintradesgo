import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Settings, 
  Upload, 
  Download, 
  BarChart3, 
  Shield, 
  Bell, 
  TrendingUp,
  Zap,
  RefreshCw 
} from 'lucide-react';

const ModelManagementPage = () => {
  const [activeTab, setActiveTab] = useState('models');
  const [models, setModels] = useState([]);
  const [features, setFeatures] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadModels();
    loadFeatures();
  }, []);

  const loadModels = async () => {
    setLoading(true);
    try {
      // In production, this would call your model manager API
      const mockModels = [
        {
          type: 'lstm',
          symbol: 'BTC-USD',
          version: '2.1.0',
          performance: { accuracy: 0.78, sharpe: 1.45 },
          last_updated: '2025-09-20 14:30:00',
          status: 'active'
        },
        {
          type: 'lstm', 
          symbol: 'ETH-USD',
          version: '1.9.3',
          performance: { accuracy: 0.72, sharpe: 1.28 },
          last_updated: '2025-09-18 09:15:00',
          status: 'active'
        },
        {
          type: 'sentiment',
          symbol: 'BTC-USD',
          version: '3.0.1',
          performance: { accuracy: 0.85, precision: 0.82 },
          last_updated: '2025-09-22 16:45:00',
          status: 'active'
        }
      ];
      setModels(mockModels);
    } catch (error) {
      console.error('Failed to load models:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFeatures = async () => {
    try {
      // Mock feature data - in production, call advanced_features.php
      const mockFeatures = {
        basic_predictions: { enabled: true, usage: 'high' },
        advanced_sentiment: { enabled: true, usage: 'medium' },
        portfolio_optimization: { enabled: true, usage: 'low' },
        risk_management: { enabled: true, usage: 'high' },
        smart_alerts: { enabled: false, usage: 'none' },
        backtesting_pro: { enabled: true, usage: 'medium' },
        real_time_streaming: { enabled: false, usage: 'none' },
        auto_trading: { enabled: false, usage: 'none' }
      };
      setFeatures(mockFeatures);
    } catch (error) {
      console.error('Failed to load features:', error);
    }
  };

  const ModelCard = ({ model }) => (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {model.type.toUpperCase()} - {model.symbol}
          </h3>
          <p className="text-sm text-gray-600">Version {model.version}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          model.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {model.status}
        </span>
      </div>
      
      <div className="space-y-2 mb-4">
        {model.performance.accuracy && (
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Accuracy:</span>
            <span className="text-sm font-medium">{(model.performance.accuracy * 100).toFixed(1)}%</span>
          </div>
        )}
        {model.performance.sharpe && (
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Sharpe Ratio:</span>
            <span className="text-sm font-medium">{model.performance.sharpe}</span>
          </div>
        )}
        {model.performance.precision && (
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Precision:</span>
            <span className="text-sm font-medium">{(model.performance.precision * 100).toFixed(1)}%</span>
          </div>
        )}
      </div>
      
      <div className="text-xs text-gray-500 mb-4">
        Last updated: {model.last_updated}
      </div>
      
      <div className="flex space-x-2">
        <button className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
          <Download className="h-4 w-4 inline mr-1" />
          Export
        </button>
        <button className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700">
          <RefreshCw className="h-4 w-4 inline mr-1" />
          Retrain
        </button>
      </div>
    </div>
  );

  const FeatureToggle = ({ featureKey, featureData, onToggle }) => {
    const featureNames = {
      basic_predictions: 'Basic ML Predictions',
      advanced_sentiment: 'Advanced Sentiment Analysis',
      portfolio_optimization: 'Portfolio Optimization',
      risk_management: 'Risk Management',
      smart_alerts: 'Smart Alerts',
      backtesting_pro: 'Professional Backtesting',
      real_time_streaming: 'Real-time Streaming',
      auto_trading: 'Automated Trading'
    };

    const getUsageColor = (usage) => {
      switch (usage) {
        case 'high': return 'text-green-600';
        case 'medium': return 'text-yellow-600';
        case 'low': return 'text-blue-600';
        default: return 'text-gray-600';
      }
    };

    return (
      <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200">
        <div>
          <h4 className="font-medium text-gray-900">{featureNames[featureKey]}</h4>
          <p className={`text-sm ${getUsageColor(featureData.usage)}`}>
            Usage: {featureData.usage}
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={featureData.enabled}
            onChange={() => onToggle(featureKey, !featureData.enabled)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
    );
  };

  const toggleFeature = async (featureKey, enabled) => {
    setFeatures(prev => ({
      ...prev,
      [featureKey]: { ...prev[featureKey], enabled }
    }));
    
    // In production, call API to save feature settings
    console.log(`${featureKey} ${enabled ? 'enabled' : 'disabled'}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Model & Feature Management</h1>
        <p className="text-gray-600">Manage your trained ML models and advanced trading features</p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('models')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'models'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Brain className="h-4 w-4 inline mr-2" />
            ML Models
          </button>
          <button
            onClick={() => setActiveTab('features')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'features'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Settings className="h-4 w-4 inline mr-2" />
            Features
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'upload'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Upload className="h-4 w-4 inline mr-2" />
            Upload Models
          </button>
        </nav>
      </div>

      {/* Models Tab */}
      {activeTab === 'models' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your ML Models</h2>
            <button 
              onClick={loadModels}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading models...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {models.map((model, index) => (
                <ModelCard key={index} model={model} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Features Tab */}
      {activeTab === 'features' && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Advanced Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(features).map(([key, data]) => (
              <FeatureToggle
                key={key}
                featureKey={key}
                featureData={data}
                onToggle={toggleFeature}
              />
            ))}
          </div>
          
          <div className="mt-8 p-6 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Feature Usage Guide</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p><strong>Portfolio Optimization:</strong> Use ML predictions to optimize asset allocation</p>
              <p><strong>Risk Management:</strong> Advanced VaR calculations and position sizing</p>
              <p><strong>Smart Alerts:</strong> ML-triggered notifications based on market conditions</p>
              <p><strong>Auto Trading:</strong> Fully automated trading based on ML signals (Beta)</p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Trained Models</h2>
          <div className="max-w-2xl">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">Upload your trained models</p>
              <p className="text-gray-600 mb-4">Support for TensorFlow, PyTorch, and Scikit-learn models</p>
              <button className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Choose Files
              </button>
            </div>
            
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">Supported Formats:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• TensorFlow: .h5, .pb, SavedModel</li>
                <li>• PyTorch: .pt, .pth</li>
                <li>• Scikit-learn: .pkl, .joblib</li>
                <li>• ONNX: .onnx</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelManagementPage;