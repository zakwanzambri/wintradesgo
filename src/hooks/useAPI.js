/**
 * React Hooks for WinTrades API Integration
 * Custom hooks for managing API calls, loading states, and data caching
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import apiService, { APIError } from '../services/api.js';

/**
 * Generic API hook for managing async requests
 */
export function useAPI(apiCall, dependencies = [], options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  const {
    autoFetch = true,
    refreshInterval = null,
    onSuccess = null,
    onError = null,
    transform = null
  } = options;

  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);

    try {
      const response = await apiCall();
      
      if (!isMountedRef.current) return;

      let processedData = response.data;
      if (transform && typeof transform === 'function') {
        processedData = transform(processedData);
      }

      setData(processedData);
      setLastUpdate(new Date());
      
      if (onSuccess) onSuccess(processedData);
      
    } catch (err) {
      if (!isMountedRef.current) return;
      
      const errorMessage = err instanceof APIError 
        ? `${err.message} (${err.endpoint})` 
        : err.message || 'Unknown error occurred';
      
      setError(errorMessage);
      
      if (onError) onError(err);
      
      console.error('API Hook Error:', err);
    } finally {
      if (isMountedRef.current && showLoading) {
        setLoading(false);
      }
    }
  }, [apiCall, transform, onSuccess, onError]);

  const refresh = useCallback(() => {
    fetchData(false);
  }, [fetchData]);

  useEffect(() => {
    isMountedRef.current = true;
    
    if (autoFetch) {
      fetchData();
    }

    // Setup auto-refresh interval if specified
    if (refreshInterval && refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        refresh();
      }, refreshInterval);
    }

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, dependencies);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    lastUpdate,
    refresh,
    fetchData
  };
}

/**
 * Hook for AI Trading Signals
 */
export function useAISignals(options = {}) {
  const { refreshInterval = 30000, ...restOptions } = options; // 30 seconds default

  return useAPI(
    () => apiService.getAISignals(),
    [],
    {
      refreshInterval,
      transform: (data) => {
        // Sort signals by confidence (highest first)
        if (data?.signals) {
          return {
            ...data,
            signals: data.signals.sort((a, b) => b.confidence - a.confidence)
          };
        }
        return data;
      },
      ...restOptions
    }
  );
}

/**
 * Hook for Pattern Recognition Data
 */
export function usePatternRecognition(options = {}) {
  const { refreshInterval = 60000, ...restOptions } = options; // 1 minute default

  return useAPI(
    () => apiService.getPatternRecognition(),
    [],
    {
      refreshInterval,
      transform: (data) => {
        // Process pattern data for easier consumption
        const processedPatterns = {};
        
        Object.keys(data || {}).forEach(symbol => {
          if (data[symbol]?.detected_patterns) {
            processedPatterns[symbol] = {
              ...data[symbol],
              detected_patterns: data[symbol].detected_patterns.map(pattern => ({
                ...pattern,
                symbol,
                id: `${symbol}_${pattern.pattern}_${Date.now()}`
              }))
            };
          }
        });
        
        return processedPatterns;
      },
      ...restOptions
    }
  );
}

/**
 * Hook for Portfolio Data
 */
export function usePortfolio(options = {}) {
  const { refreshInterval = 15000, ...restOptions } = options; // 15 seconds default

  return useAPI(
    () => apiService.getPortfolioSummary(),
    [],
    {
      refreshInterval,
      ...restOptions
    }
  );
}

/**
 * Hook for Risk Assessment
 */
export function useRiskAssessment(options = {}) {
  const { refreshInterval = 45000, ...restOptions } = options; // 45 seconds default

  return useAPI(
    () => apiService.getRiskAssessment(),
    [],
    {
      refreshInterval,
      ...restOptions
    }
  );
}

/**
 * Hook for Market Data
 */
export function useMarketData(symbols = ['BTC', 'ETH', 'ADA', 'SOL'], options = {}) {
  const { refreshInterval = 10000, ...restOptions } = options; // 10 seconds default

  return useAPI(
    () => apiService.getMarketData(symbols),
    [symbols.join(',')],
    {
      refreshInterval,
      ...restOptions
    }
  );
}

/**
 * Hook for ML Analytics
 */
export function useMLAnalytics(options = {}) {
  const { refreshInterval = 120000, ...restOptions } = options; // 2 minutes default

  return useAPI(
    () => apiService.getMLAnalytics(),
    [],
    {
      refreshInterval,
      ...restOptions
    }
  );
}

/**
 * Hook for LSTM Predictions
 */
export function useLSTMPredictions(options = {}) {
  const { refreshInterval = 300000, ...restOptions } = options; // 5 minutes default

  return useAPI(
    () => apiService.getLSTMPredictions(),
    [],
    {
      refreshInterval,
      ...restOptions
    }
  );
}

/**
 * Hook for Manual Signal Generation
 */
export function useSignalGeneration() {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [lastGenerated, setLastGenerated] = useState(null);

  const generateSignals = useCallback(async () => {
    setGenerating(true);
    setError(null);

    try {
      const response = await apiService.generateAISignals();
      setLastGenerated(new Date());
      
      // Clear cache to force refresh of signal hooks
      apiService.clearCache();
      
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof APIError 
        ? err.message 
        : 'Failed to generate signals';
      
      setError(errorMessage);
      throw err;
    } finally {
      setGenerating(false);
    }
  }, []);

  return {
    generateSignals,
    generating,
    error,
    lastGenerated
  };
}

/**
 * Hook for Real-time Connection Status
 */
export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [apiStatus, setApiStatus] = useState('unknown');
  const [lastCheck, setLastCheck] = useState(null);

  const checkAPIHealth = useCallback(async () => {
    try {
      const response = await apiService.healthCheck();
      setApiStatus(response.success ? 'online' : 'error');
      setLastCheck(new Date());
    } catch (error) {
      setApiStatus('offline');
      setLastCheck(new Date());
    }
  }, []);

  useEffect(() => {
    // Check API health on mount
    checkAPIHealth();

    // Setup periodic health checks
    const healthInterval = setInterval(checkAPIHealth, 60000); // 1 minute

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      checkAPIHealth();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setApiStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(healthInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkAPIHealth]);

  return {
    isOnline,
    apiStatus,
    lastCheck,
    checkHealth: checkAPIHealth
  };
}

/**
 * Hook for Combining Multiple Data Sources
 */
export function useDashboardData(options = {}) {
  const signals = useAISignals(options);
  const patterns = usePatternRecognition(options);
  const portfolio = usePortfolio(options);
  const marketData = useMarketData(['BTC', 'ETH', 'ADA', 'SOL'], options);
  const riskAssessment = useRiskAssessment(options);

  const isLoading = signals.loading || patterns.loading || portfolio.loading || 
                   marketData.loading || riskAssessment.loading;

  const hasError = signals.error || patterns.error || portfolio.error || 
                  marketData.error || riskAssessment.error;

  const lastUpdate = Math.max(
    signals.lastUpdate?.getTime() || 0,
    patterns.lastUpdate?.getTime() || 0,
    portfolio.lastUpdate?.getTime() || 0,
    marketData.lastUpdate?.getTime() || 0,
    riskAssessment.lastUpdate?.getTime() || 0
  );

  const refreshAll = useCallback(() => {
    signals.refresh();
    patterns.refresh();
    portfolio.refresh();
    marketData.refresh();
    riskAssessment.refresh();
  }, [signals, patterns, portfolio, marketData, riskAssessment]);

  return {
    signals: signals.data,
    patterns: patterns.data,
    portfolio: portfolio.data,
    marketData: marketData.data,
    riskAssessment: riskAssessment.data,
    loading: isLoading,
    error: hasError,
    lastUpdate: lastUpdate ? new Date(lastUpdate) : null,
    refresh: refreshAll
  };
}

/**
 * Portfolio-specific data hook
 * Manages portfolio positions, performance, and trades
 */
export function usePortfolioData(options = {}) {
  const { refreshInterval = 30000 } = options;

  const portfolio = useAPI(() => apiService.getPortfolioSummary(), [], {
    refreshInterval,
    transform: (data) => ({
      total_value: data?.total_value || 125420,
      daily_change: data?.daily_change || 3247.89,
      daily_change_percent: data?.daily_change_percent || 2.67,
      daily_pnl: data?.daily_pnl || 1847.32,
      daily_pnl_percent: data?.daily_pnl_percent || 1.49
    })
  });

  const positions = useAPI(() => apiService.getPositions(), [], {
    refreshInterval,
    transform: (data) => {
      if (!data?.positions) {
        // Mock positions data
        return [
          {
            id: 1,
            symbol: 'BTC',
            amount: 0.5432,
            entry_price: 42500,
            current_price: 43250,
            market_value: 23491.8,
            pnl: 407.5,
            pnl_percent: 1.76
          },
          {
            id: 2,
            symbol: 'ETH',
            amount: 12.34,
            entry_price: 2580,
            current_price: 2634,
            market_value: 32503.56,
            pnl: 666.36,
            pnl_percent: 2.09
          },
          {
            id: 3,
            symbol: 'ADA',
            amount: 15000,
            entry_price: 0.48,
            current_price: 0.523,
            market_value: 7845,
            pnl: 645,
            pnl_percent: 8.96
          }
        ];
      }
      return data.positions;
    }
  });

  const performance = useAPI(() => apiService.getPortfolioPerformance(), [], {
    refreshInterval: refreshInterval * 2, // Less frequent updates for performance data
    transform: (data) => ({
      win_rate: data?.win_rate || 87.3,
      total_trades: data?.total_trades || 156,
      win_rate_change: data?.win_rate_change || 2.1,
      chart_data: data?.chart_data || []
    })
  });

  const trades = useAPI(() => apiService.getRecentTrades(), [], {
    refreshInterval,
    transform: (data) => {
      if (!data?.trades) {
        // Mock trades data
        const now = new Date();
        return [
          {
            id: 1,
            type: 'buy',
            symbol: 'BTC',
            amount: 0.1,
            price: 43100,
            total_value: 4310,
            timestamp: new Date(now.getTime() - 1000 * 60 * 15).toISOString()
          },
          {
            id: 2,
            type: 'sell',
            symbol: 'ETH',
            amount: 2.5,
            price: 2620,
            total_value: 6550,
            timestamp: new Date(now.getTime() - 1000 * 60 * 45).toISOString()
          },
          {
            id: 3,
            type: 'buy',
            symbol: 'ADA',
            amount: 1000,
            price: 0.52,
            total_value: 520,
            timestamp: new Date(now.getTime() - 1000 * 60 * 90).toISOString()
          }
        ];
      }
      return data.trades;
    }
  });

  const refreshAll = useCallback(() => {
    portfolio.refresh();
    positions.refresh();
    performance.refresh();
    trades.refresh();
  }, [portfolio.refresh, positions.refresh, performance.refresh, trades.refresh]);

  return {
    portfolio: portfolio.data,
    positions: positions.data,
    performance: performance.data,
    trades: trades.data,
    loading: portfolio.loading || positions.loading || performance.loading || trades.loading,
    error: portfolio.error || positions.error || performance.error || trades.error,
    lastUpdate: Math.max(
      portfolio.lastUpdate?.getTime() || 0,
      positions.lastUpdate?.getTime() || 0,
      performance.lastUpdate?.getTime() || 0,
      trades.lastUpdate?.getTime() || 0
    ),
    refresh: refreshAll
  };
}

/**
 * Pattern Recognition hook
 * Manages chart pattern detection and analysis
 */
export function usePatternRecognition(symbol = 'BTC', timeframe = '1h', options = {}) {
  const { refreshInterval = 60000 } = options; // 1 minute for pattern updates

  const patterns = useAPI(() => apiService.getPatternRecognition(symbol, timeframe), [symbol, timeframe], {
    refreshInterval,
    transform: (data) => {
      if (!data?.patterns) {
        // Mock pattern data for demonstration
        return [
          {
            id: 1,
            type: 'head_and_shoulders',
            confidence: 87,
            timeframe: timeframe,
            price_target: 45200,
            formation_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            start_point: { x: 10, y: 42000 },
            end_point: { x: 50, y: 43500 },
            key_points: [
              { x: 20, y: 43000 },
              { x: 30, y: 44500 },
              { x: 40, y: 43200 }
            ],
            trend_lines: [
              { start: { x: 10, y: 42000 }, end: { x: 50, y: 43500 } }
            ]
          },
          {
            id: 2,
            type: 'triangle_ascending',
            confidence: 76,
            timeframe: timeframe,
            price_target: 46000,
            formation_time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            start_point: { x: 5, y: 41500 },
            end_point: { x: 45, y: 43800 },
            key_points: [
              { x: 15, y: 42200 },
              { x: 25, y: 42800 },
              { x: 35, y: 43400 }
            ]
          },
          {
            id: 3,
            type: 'support_resistance',
            confidence: 82,
            timeframe: timeframe,
            formation_time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            start_point: { x: 0, y: 43000 },
            end_point: { x: 60, y: 43000 }
          }
        ];
      }
      return data.patterns;
    }
  });

  const chartData = useAPI(() => apiService.getChartData(symbol, timeframe), [symbol, timeframe], {
    refreshInterval: refreshInterval / 2, // More frequent chart updates
    transform: (data) => {
      if (!data?.chart_data) {
        // Mock chart data
        const mockData = [];
        const now = new Date();
        const basePrice = 43000;
        
        for (let i = 0; i < 60; i++) {
          const time = new Date(now.getTime() - (60 - i) * 60 * 1000);
          const price = basePrice + (Math.random() - 0.5) * 2000 + Math.sin(i / 10) * 1000;
          mockData.push({
            timestamp: time.toISOString(),
            price: Math.round(price),
            volume: Math.random() * 1000000
          });
        }
        return mockData;
      }
      return data.chart_data;
    }
  });

  const refreshAll = useCallback(() => {
    patterns.refresh();
    chartData.refresh();
  }, [patterns.refresh, chartData.refresh]);

  return {
    patterns: patterns.data,
    chartData: chartData.data,
    loading: patterns.loading || chartData.loading,
    error: patterns.error || chartData.error,
    lastUpdate: Math.max(
      patterns.lastUpdate?.getTime() || 0,
      chartData.lastUpdate?.getTime() || 0
    ),
    refresh: refreshAll
  };
}