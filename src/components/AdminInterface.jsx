import React, { useState, useEffect } from 'react';
import { Switch } from '@headlessui/react';

const AdminInterface = () => {
  const [features, setFeatures] = useState({});
  const [systemStats, setSystemStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Feature definitions with descriptions
  const featureDefinitions = {
    basic_predictions: {
      name: 'Basic ML Predictions',
      description: 'Core machine learning predictions for trading signals',
      category: 'Core'
    },
    advanced_sentiment: {
      name: 'Advanced Sentiment Analysis',
      description: 'AI-powered market sentiment analysis from news and social media',
      category: 'Analysis'
    },
    portfolio_optimization: {
      name: 'Portfolio Optimization',
      description: 'Intelligent portfolio allocation and optimization algorithms',
      category: 'Portfolio'
    },
    risk_management: {
      name: 'Risk Management',
      description: 'Advanced risk assessment and management tools',
      category: 'Risk'
    },
    smart_alerts: {
      name: 'Smart Alerts',
      description: 'Intelligent notifications and alerts system',
      category: 'Notifications'
    },
    backtesting_pro: {
      name: 'Professional Backtesting',
      description: 'Advanced backtesting engine with detailed analytics',
      category: 'Testing'
    },
    real_time_streaming: {
      name: 'Real-time Data Streaming',
      description: 'Live market data streaming and processing',
      category: 'Data'
    },
    auto_trading: {
      name: 'Automated Trading',
      description: 'Automated trading execution and management',
      category: 'Trading'
    }
  };

  // Fetch current feature states
  const fetchFeatures = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost/wintradesgo/model-api.php?action=get_features');
      const data = await response.json();
      
      if (data.success) {
        setFeatures(data.features || {});
        setSystemStats(data.system_stats || {});
        setLastUpdated(new Date().toLocaleString());
      } else {
        throw new Error(data.error || 'Failed to fetch features');
      }
    } catch (err) {
      setError(err.message);
      console.error('Admin Interface Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle individual feature
  const toggleFeature = async (featureKey, enabled) => {
    try {
      const response = await fetch(
        `http://localhost/wintradesgo/model-api.php?action=toggle_feature&feature=${featureKey}&enabled=${enabled}`
      );
      const data = await response.json();
      
      if (data.success) {
        // Update local state
        setFeatures(prev => ({
          ...prev,
          [featureKey]: {
            ...prev[featureKey],
            enabled: enabled
          }
        }));
        setLastUpdated(new Date().toLocaleString());
      } else {
        throw new Error(data.error || 'Failed to toggle feature');
      }
    } catch (err) {
      setError(err.message);
      console.error('Toggle Error:', err);
      // Revert the change
      fetchFeatures();
    }
  };

  // Enable all features
  const enableAllFeatures = async () => {
    const featureKeys = Object.keys(featureDefinitions);
    for (const key of featureKeys) {
      await toggleFeature(key, true);
    }
  };

  // Disable all features
  const disableAllFeatures = async () => {
    const featureKeys = Object.keys(featureDefinitions);
    for (const key of featureKeys) {
      await toggleFeature(key, false);
    }
  };

  useEffect(() => {
    fetchFeatures();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchFeatures, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-center mt-4 text-gray-600">Loading admin interface...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h3 className="font-bold">Admin Interface Error</h3>
          <p>{error}</p>
          <button 
            onClick={fetchFeatures}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Group features by category
  const groupedFeatures = Object.entries(featureDefinitions).reduce((acc, [key, def]) => {
    if (!acc[def.category]) acc[def.category] = [];
    acc[def.category].push({ key, ...def, ...features[key] });
    return acc;
  }, {});

  const enabledCount = Object.values(features).filter(f => f?.enabled).length;
  const totalCount = Object.keys(featureDefinitions).length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Feature Management</h2>
        <p className="text-gray-600">Control and monitor all trading system features</p>
        
        {/* Status Overview */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-800">System Status</h3>
              <p className="text-blue-600">
                {enabledCount} of {totalCount} features enabled
                {lastUpdated && <span className="ml-4 text-sm">Last updated: {lastUpdated}</span>}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={enableAllFeatures}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
              >
                Enable All
              </button>
              <button
                onClick={disableAllFeatures}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              >
                Disable All
              </button>
              <button
                onClick={fetchFeatures}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-3">
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(enabledCount / totalCount) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Dashboard */}
      {systemStats.total_features && (
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Usage</p>
                <p className="text-2xl font-bold text-gray-900">{systemStats.total_usage_count}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Active Features</p>
                <p className="text-2xl font-bold text-gray-900">{systemStats.enabled_features}/{systemStats.total_features}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Most Used</p>
                <p className="text-lg font-bold text-gray-900 capitalize">
                  {systemStats.most_used_feature?.replace(/_/g, ' ')}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">System Uptime</p>
                <p className="text-lg font-bold text-gray-900">{systemStats.system_uptime}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature Categories */}
      <div className="space-y-6">
        {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => (
          <div key={category} className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800">{category} Features</h3>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoryFeatures.map(feature => {
                  const isEnabled = feature.enabled || false;
                  return (
                    <div
                      key={feature.key}
                      className={`border rounded-lg p-4 transition-all duration-200 ${
                        isEnabled 
                          ? 'border-green-200 bg-green-50' 
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium text-gray-800">{feature.name}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              isEnabled 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {isEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{feature.description}</p>
                          
                          {/* Usage analytics */}
                          <div className="space-y-1">
                            {feature.usage && (
                              <p className="text-xs text-gray-500">
                                Usage Level: <span className="capitalize font-medium">{feature.usage}</span>
                              </p>
                            )}
                            {feature.usage_count !== undefined && (
                              <p className="text-xs text-gray-500">
                                Total Calls: <span className="font-medium">{feature.usage_count}</span>
                              </p>
                            )}
                            {feature.last_used && (
                              <p className="text-xs text-gray-500">
                                Last Used: <span className="font-medium">{new Date(feature.last_used).toLocaleString()}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <Switch
                          checked={isEnabled}
                          onChange={(enabled) => toggleFeature(feature.key, enabled)}
                          className={`${
                            isEnabled ? 'bg-green-600' : 'bg-gray-300'
                          } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2`}
                        >
                          <span
                            className={`${
                              isEnabled ? 'translate-x-6' : 'translate-x-1'
                            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                          />
                        </Switch>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminInterface;