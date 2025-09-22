/**
 * Real-time Data Manager for WinTrades
 * Handles live data updates, notifications, and WebSocket connections
 */

// Simple EventEmitter implementation for browser
class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  off(event, listener) {
    if (!this.events[event]) return;
    const index = this.events[event].indexOf(listener);
    if (index > -1) {
      this.events[event].splice(index, 1);
    }
  }

  emit(event, ...args) {
    if (!this.events[event]) return;
    this.events[event].forEach(listener => {
      try {
        listener(...args);
      } catch (error) {
        console.error('EventEmitter error:', error);
      }
    });
  }
}

class RealTimeDataManager extends EventEmitter {
  constructor() {
    super();
    this.isActive = false;
    this.intervals = new Map();
    this.subscribers = new Set();
    this.lastData = new Map();
    this.config = {
      portfolioRefreshInterval: 10000,    // 10 seconds
      signalsRefreshInterval: 5000,       // 5 seconds
      patternsRefreshInterval: 15000,     // 15 seconds
      pricesRefreshInterval: 3000,        // 3 seconds
      maxRetries: 3,
      retryDelay: 2000
    };
  }

  /**
   * Start real-time data updates
   */
  start() {
    if (this.isActive) return;
    
    this.isActive = true;
    this.emit('status', { connected: true, timestamp: Date.now() });
    
    // Start polling intervals for different data types
    this.startPolling('portfolio', this.config.portfolioRefreshInterval);
    this.startPolling('signals', this.config.signalsRefreshInterval);
    this.startPolling('patterns', this.config.patternsRefreshInterval);
    this.startPolling('prices', this.config.pricesRefreshInterval);
    
    console.log('[RealTime] Data manager started');
  }

  /**
   * Stop real-time data updates
   */
  stop() {
    if (!this.isActive) return;
    
    this.isActive = false;
    
    // Clear all intervals
    this.intervals.forEach((intervalId) => {
      clearInterval(intervalId);
    });
    this.intervals.clear();
    
    this.emit('status', { connected: false, timestamp: Date.now() });
    console.log('[RealTime] Data manager stopped');
  }

  /**
   * Start polling for specific data type
   */
  startPolling(dataType, interval) {
    if (this.intervals.has(dataType)) {
      clearInterval(this.intervals.get(dataType));
    }

    const poll = async () => {
      if (!this.isActive) return;
      
      try {
        let data;
        const { WinTradesAPI } = await import('../services/api.js');
        const api = new WinTradesAPI();

        switch (dataType) {
          case 'portfolio':
            data = await api.getPortfolioStatus();
            break;
          case 'signals':
            data = await api.getAISignals();
            break;
          case 'patterns':
            data = await api.getPatternRecognition();
            break;
          case 'prices':
            data = await this.fetchLivePrices();
            break;
          default:
            return;
        }

        // Check for changes and emit updates
        const lastDataKey = `${dataType}_data`;
        const lastData = this.lastData.get(lastDataKey);
        
        if (!lastData || this.hasDataChanged(lastData, data)) {
          this.lastData.set(lastDataKey, data);
          this.emit('dataUpdate', { 
            type: dataType, 
            data: data,
            timestamp: Date.now(),
            changed: !!lastData
          });

          // Emit specific data type events
          this.emit(`${dataType}Update`, data);
        }

      } catch (error) {
        console.error(`[RealTime] Error polling ${dataType}:`, error);
        this.emit('error', { type: dataType, error });
      }
    };

    // Initial fetch
    poll();
    
    // Set up interval
    const intervalId = setInterval(poll, interval);
    this.intervals.set(dataType, intervalId);
  }

  /**
   * Fetch live price data
   */
  async fetchLivePrices() {
    // This would typically connect to a price feed API
    // For now, we'll simulate with the backend data
    const { WinTradesAPI } = await import('../services/api.js');
    const api = new WinTradesAPI();
    
    try {
      const signalsData = await api.getAISignals();
      return signalsData?.lstm_predictions?.predictions || {};
    } catch (error) {
      console.error('[RealTime] Failed to fetch live prices:', error);
      return {};
    }
  }

  /**
   * Check if data has meaningfully changed
   */
  hasDataChanged(oldData, newData) {
    // Simple deep comparison for key fields
    const oldStr = JSON.stringify(this.extractKeyFields(oldData));
    const newStr = JSON.stringify(this.extractKeyFields(newData));
    return oldStr !== newStr;
  }

  /**
   * Extract key fields for change detection
   */
  extractKeyFields(data) {
    if (!data) return {};
    
    return {
      portfolio_value: data.portfolio_value,
      signals_count: data.current_signals?.length || data.signals?.length,
      last_updated: data.last_updated,
      market_sentiment: data.market_sentiment,
      confidence_score: data.confidence_score
    };
  }

  /**
   * Subscribe to real-time updates
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Update polling intervals
   */
  updateConfig(newConfig) {
    Object.assign(this.config, newConfig);
    
    // Restart polling with new intervals if active
    if (this.isActive) {
      this.stop();
      setTimeout(() => this.start(), 100);
    }
  }

  /**
   * Force refresh specific data type
   */
  async forceRefresh(dataType) {
    if (this.intervals.has(dataType)) {
      clearInterval(this.intervals.get(dataType));
      this.startPolling(dataType, this.config[`${dataType}RefreshInterval`]);
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isActive: this.isActive,
      intervalCount: this.intervals.size,
      subscriberCount: this.subscribers.size,
      lastUpdate: Math.max(...Array.from(this.lastData.values()).map(d => 
        new Date(d.last_updated || 0).getTime()
      ))
    };
  }
}

// Singleton instance
const realTimeManager = new RealTimeDataManager();

export default realTimeManager;