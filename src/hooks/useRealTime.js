/**
 * Real-time Data Hooks for WinTrades
 * React hooks for managing real-time data updates and notifications
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import realTimeManager from '../services/realTimeManager.js';

/**
 * Hook for real-time data updates
 */
export function useRealTimeData(dataTypes = ['portfolio', 'signals', 'patterns']) {
  const [data, setData] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [errors, setErrors] = useState({});
  
  const dataRef = useRef({});

  useEffect(() => {
    // Start real-time manager
    realTimeManager.start();
    
    // Status listener
    const handleStatus = (status) => {
      setIsConnected(status.connected);
    };

    // Data update listener
    const handleDataUpdate = (update) => {
      if (dataTypes.includes(update.type)) {
        dataRef.current = {
          ...dataRef.current,
          [update.type]: update.data
        };
        setData({ ...dataRef.current });
        setLastUpdate(new Date(update.timestamp));
        
        // Clear error for this data type if update successful
        if (update.data) {
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[update.type];
            return newErrors;
          });
        }
      }
    };

    // Error listener
    const handleError = (error) => {
      if (dataTypes.includes(error.type)) {
        setErrors(prev => ({
          ...prev,
          [error.type]: error.error
        }));
      }
    };

    // Add listeners
    realTimeManager.on('status', handleStatus);
    realTimeManager.on('dataUpdate', handleDataUpdate);
    realTimeManager.on('error', handleError);

    // Cleanup
    return () => {
      realTimeManager.off('status', handleStatus);
      realTimeManager.off('dataUpdate', handleDataUpdate);
      realTimeManager.off('error', handleError);
    };
  }, [dataTypes]);

  const forceRefresh = useCallback((dataType) => {
    realTimeManager.forceRefresh(dataType);
  }, []);

  const updateConfig = useCallback((config) => {
    realTimeManager.updateConfig(config);
  }, []);

  return {
    data,
    isConnected,
    lastUpdate,
    errors,
    forceRefresh,
    updateConfig,
    status: realTimeManager.getStatus()
  };
}

/**
 * Hook for real-time portfolio updates
 */
export function useRealTimePortfolio() {
  const [portfolio, setPortfolio] = useState(null);
  const [changes, setChanges] = useState({});
  
  useEffect(() => {
    const handlePortfolioUpdate = (data) => {
      const previousValue = portfolio?.portfolio_value;
      setPortfolio(data);
      
      if (previousValue && data?.portfolio_value) {
        const change = data.portfolio_value - previousValue;
        const changePercent = (change / previousValue) * 100;
        
        setChanges({
          amount: change,
          percentage: changePercent,
          timestamp: Date.now()
        });
      }
    };

    realTimeManager.on('portfolioUpdate', handlePortfolioUpdate);
    
    return () => {
      realTimeManager.off('portfolioUpdate', handlePortfolioUpdate);
    };
  }, [portfolio]);

  return { portfolio, changes };
}

/**
 * Hook for real-time signal updates with notifications
 */
export function useRealTimeSignals() {
  const [signals, setSignals] = useState(null);
  const [newSignals, setNewSignals] = useState([]);
  const [signalHistory, setSignalHistory] = useState([]);
  
  useEffect(() => {
    const handleSignalsUpdate = (data) => {
      const currentSignals = data?.current_signals || [];
      const previousSignals = signals?.current_signals || [];
      
      // Detect new signals
      const newSignalDetected = currentSignals.filter(signal => 
        !previousSignals.some(prev => 
          prev.symbol === signal.symbol && 
          prev.signal_type === signal.signal_type &&
          prev.generated_at === signal.generated_at
        )
      );

      if (newSignalDetected.length > 0) {
        setNewSignals(newSignalDetected);
        setSignalHistory(prev => [...newSignalDetected, ...prev].slice(0, 50)); // Keep last 50
        
        // Trigger notification
        newSignalDetected.forEach(signal => {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`New ${signal.signal_type} Signal`, {
              body: `${signal.symbol} - ${signal.confidence}% confidence`,
              icon: '/vite.svg'
            });
          }
        });
      }
      
      setSignals(data);
    };

    realTimeManager.on('signalsUpdate', handleSignalsUpdate);
    
    return () => {
      realTimeManager.off('signalsUpdate', handleSignalsUpdate);
    };
  }, [signals]);

  const clearNewSignals = useCallback(() => {
    setNewSignals([]);
  }, []);

  return { 
    signals, 
    newSignals, 
    signalHistory, 
    clearNewSignals 
  };
}

/**
 * Hook for live price updates
 */
export function useLivePrices(symbols = ['BTC', 'ETH', 'ADA']) {
  const [prices, setPrices] = useState({});
  const [priceChanges, setPriceChanges] = useState({});
  
  useEffect(() => {
    const handlePricesUpdate = (data) => {
      const newPrices = {};
      const changes = {};
      
      symbols.forEach(symbol => {
        if (data[symbol]) {
          const currentPrice = data[symbol].current_price;
          const previousPrice = prices[symbol]?.current_price;
          
          newPrices[symbol] = data[symbol];
          
          if (previousPrice && currentPrice !== previousPrice) {
            changes[symbol] = {
              amount: currentPrice - previousPrice,
              percentage: ((currentPrice - previousPrice) / previousPrice) * 100,
              timestamp: Date.now()
            };
          }
        }
      });
      
      setPrices(newPrices);
      setPriceChanges(changes);
    };

    realTimeManager.on('pricesUpdate', handlePricesUpdate);
    
    return () => {
      realTimeManager.off('pricesUpdate', handlePricesUpdate);
    };
  }, [symbols, prices]);

  return { prices, priceChanges };
}

/**
 * Hook for notification management
 */
export function useNotifications() {
  const [permission, setPermission] = useState(
    'Notification' in window ? Notification.permission : 'denied'
  );

  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    }
    return 'denied';
  }, []);

  const showNotification = useCallback((title, options = {}) => {
    if (permission === 'granted') {
      return new Notification(title, {
        icon: '/vite.svg',
        ...options
      });
    }
  }, [permission]);

  return {
    permission,
    requestPermission,
    showNotification,
    isSupported: 'Notification' in window
  };
}