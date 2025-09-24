import { useState, useEffect } from 'react';

/**
 * Custom hook to fetch and manage feature toggle states
 */
export const useFeatureToggles = () => {
  const [features, setFeatures] = useState({
    basic_predictions: { enabled: true, usage: 'high' },
    advanced_sentiment: { enabled: true, usage: 'medium' },
    portfolio_optimization: { enabled: true, usage: 'low' },
    risk_management: { enabled: true, usage: 'high' },
    smart_alerts: { enabled: false, usage: 'none' },
    backtesting_pro: { enabled: true, usage: 'medium' },
    real_time_streaming: { enabled: false, usage: 'none' },
    auto_trading: { enabled: false, usage: 'none' }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFeatures = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost/wintradesgo/model-api.php?action=get_features');
      const data = await response.json();
      
      if (data.success) {
        setFeatures(data.features);
      } else {
        console.warn('Failed to load features, using defaults:', data.error);
      }
    } catch (err) {
      console.warn('Network error loading features, using defaults:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatures();
  }, []);

  const isFeatureEnabled = (featureName) => {
    return features[featureName]?.enabled || false;
  };

  const getFeatureUsage = (featureName) => {
    return features[featureName]?.usage || 'none';
  };

  const refreshFeatures = () => {
    fetchFeatures();
  };

  return {
    features,
    loading,
    error,
    isFeatureEnabled,
    getFeatureUsage,
    refreshFeatures
  };
};