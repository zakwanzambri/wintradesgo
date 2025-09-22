/**
 * API Service for WinTrades AI Backend Integration
 * Connects React frontend with PHP AI backend endpoints
 */

// API Configuration
const API_CONFIG = {
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? '/wintradesgo/api' 
    : 'http://localhost/wintradesgo/api',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
};

// API Response Types
class APIResponse {
  constructor(data, success = true, message = '', error = null) {
    this.data = data;
    this.success = success;
    this.message = message;
    this.error = error;
    this.timestamp = new Date().toISOString();
  }
}

// Error Handling
class APIError extends Error {
  constructor(message, statusCode, endpoint) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.endpoint = endpoint;
  }
}

/**
 * Core API Service Class
 */
class WinTradesAPI {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.cache = new Map();
    this.cacheTimeout = 30000; // 30 seconds
  }

  /**
   * Generic HTTP request handler with retry logic
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: API_CONFIG.TIMEOUT
    };

    const requestOptions = { ...defaultOptions, ...options };
    
    for (let attempt = 1; attempt <= API_CONFIG.RETRY_ATTEMPTS; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), requestOptions.timeout);
        
        const response = await fetch(url, {
          ...requestOptions,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new APIError(
            `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            endpoint
          );
        }
        
        const data = await response.json();
        return new APIResponse(data, true, 'Request successful');
        
      } catch (error) {
        console.error(`API Request failed (attempt ${attempt}/${API_CONFIG.RETRY_ATTEMPTS}):`, error);
        
        if (attempt === API_CONFIG.RETRY_ATTEMPTS) {
          throw new APIError(
            error.message || 'Network request failed',
            error.statusCode || 500,
            endpoint
          );
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY * attempt));
      }
    }
  }

  /**
   * Cache management
   */
  getCached(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // ===========================================
  // AI SIGNAL ENDPOINTS
  // ===========================================

  /**
   * Get current AI trading signals
   */
  async getAISignals(useCache = true) {
    const cacheKey = 'ai_signals';
    
    if (useCache) {
      const cached = this.getCached(cacheKey);
      if (cached) return new APIResponse(cached);
    }

    try {
      const response = await this.request('/trading/production.php?action=get_signals');
      this.setCache(cacheKey, response.data);
      return response;
    } catch (error) {
      throw new APIError('Failed to fetch AI signals', error.statusCode, '/trading/production.php');
    }
  }

  /**
   * Generate new AI signals manually
   */
  async generateAISignals() {
    try {
      const response = await this.request('/ai/generate-signals.php', {
        method: 'POST'
      });
      
      // Clear cache after generating new signals
      this.cache.delete('ai_signals');
      
      return response;
    } catch (error) {
      throw new APIError('Failed to generate AI signals', error.statusCode, '/ai/generate-signals.php');
    }
  }

  /**
   * Get enhanced AI signals with ML models
   */
  async getEnhancedSignals() {
    try {
      const response = await this.request('/ai/enhanced-signals.php');
      return response;
    } catch (error) {
      throw new APIError('Failed to fetch enhanced signals', error.statusCode, '/ai/enhanced-signals.php');
    }
  }

  // ===========================================
  // PATTERN RECOGNITION ENDPOINTS
  // ===========================================

  /**
   * Get chart pattern recognition data
   */
  async getPatternRecognition(useCache = true) {
    const cacheKey = 'pattern_recognition';
    
    if (useCache) {
      const cached = this.getCached(cacheKey);
      if (cached) return new APIResponse(cached);
    }

    try {
      const response = await this.request('/trading/production.php?action=pattern_recognition');
      this.setCache(cacheKey, response.data);
      return response;
    } catch (error) {
      throw new APIError('Failed to fetch pattern recognition', error.statusCode, '/trading/production.php');
    }
  }

  // ===========================================
  // PORTFOLIO ENDPOINTS
  // ===========================================

  /**
   * Get portfolio summary and performance
   */
  async getPortfolioSummary() {
    try {
      const response = await this.request('/trading/production.php?action=portfolio_summary');
      return response;
    } catch (error) {
      throw new APIError('Failed to fetch portfolio summary', error.statusCode, '/trading/production.php');
    }
  }

  /**
   * Get mobile portfolio summary
   */
  async getMobilePortfolioSummary() {
    try {
      const response = await this.request('/trading/production.php?action=mobile_portfolio_summary');
      return response;
    } catch (error) {
      throw new APIError('Failed to fetch mobile portfolio', error.statusCode, '/trading/production.php');
    }
  }

  /**
   * Get current portfolio positions
   */
  async getPositions() {
    try {
      const response = await this.request('/trading/production.php?action=get_positions');
      return response;
    } catch (error) {
      throw new APIError('Failed to fetch positions', error.statusCode, '/trading/production.php');
    }
  }

  /**
   * Get portfolio performance metrics
   */
  async getPortfolioPerformance() {
    try {
      const response = await this.request('/trading/production.php?action=portfolio_performance');
      return response;
    } catch (error) {
      throw new APIError('Failed to fetch portfolio performance', error.statusCode, '/trading/production.php');
    }
  }

  /**
   * Get recent trading activity
   */
  async getRecentTrades() {
    try {
      const response = await this.request('/trading/production.php?action=recent_trades');
      return response;
    } catch (error) {
      throw new APIError('Failed to fetch recent trades', error.statusCode, '/trading/production.php');
    }
  }

  // ===========================================
  // PATTERN RECOGNITION ENDPOINTS
  // ===========================================

  /**
   * Get chart pattern recognition data
   */
  async getPatternRecognition(symbol = 'BTC', timeframe = '1h') {
    try {
      const params = new URLSearchParams({
        action: 'pattern_recognition',
        symbol: symbol,
        timeframe: timeframe
      });
      const response = await this.request(`/trading/production.php?${params}`);
      return response;
    } catch (error) {
      throw new APIError('Failed to fetch pattern recognition', error.statusCode, '/trading/production.php');
    }
  }

  /**
   * Get chart data for visualization
   */
  async getChartData(symbol = 'BTC', timeframe = '1h') {
    try {
      const params = new URLSearchParams({
        action: 'chart_data',
        symbol: symbol,
        timeframe: timeframe
      });
      const response = await this.request(`/trading/production.php?${params}`);
      return response;
    } catch (error) {
      throw new APIError('Failed to fetch chart data', error.statusCode, '/trading/production.php');
    }
  }

  // ===========================================
  // RISK ASSESSMENT ENDPOINTS
  // ===========================================

  /**
   * Get portfolio risk assessment
   */
  async getRiskAssessment() {
    try {
      const response = await this.request('/trading/production.php?action=mobile_risk_assessment');
      return response;
    } catch (error) {
      throw new APIError('Failed to fetch risk assessment', error.statusCode, '/trading/production.php');
    }
  }

  // ===========================================
  // ML ANALYTICS ENDPOINTS
  // ===========================================

  /**
   * Get ML model analytics
   */
  async getMLAnalytics() {
    try {
      const response = await this.request('/trading/production.php?action=ml_analytics');
      return response;
    } catch (error) {
      throw new APIError('Failed to fetch ML analytics', error.statusCode, '/trading/production.php');
    }
  }

  /**
   * Get model performance metrics
   */
  async getModelPerformance() {
    try {
      const response = await this.request('/trading/production.php?action=model_performance');
      return response;
    } catch (error) {
      throw new APIError('Failed to fetch model performance', error.statusCode, '/trading/production.php');
    }
  }

  /**
   * Get LSTM predictions
   */
  async getLSTMPredictions() {
    try {
      const response = await this.request('/trading/production.php?action=lstm_predictions');
      return response;
    } catch (error) {
      throw new APIError('Failed to fetch LSTM predictions', error.statusCode, '/trading/production.php');
    }
  }

  // ===========================================
  // MARKET DATA ENDPOINTS
  // ===========================================

  /**
   * Get real-time market data
   */
  async getMarketData(symbols = ['BTC', 'ETH', 'ADA', 'SOL']) {
    try {
      const symbolsParam = symbols.join(',');
      const response = await this.request(`/trading/production.php?action=market_data&symbols=${symbolsParam}`);
      return response;
    } catch (error) {
      throw new APIError('Failed to fetch market data', error.statusCode, '/trading/production.php');
    }
  }

  // ===========================================
  // NOTIFICATION ENDPOINTS
  // ===========================================

  /**
   * Register push notification subscription
   */
  async registerPushSubscription(subscription) {
    try {
      const response = await this.request('/trading/production.php?action=register_push_subscription', {
        method: 'POST',
        body: JSON.stringify({ subscription })
      });
      return response;
    } catch (error) {
      throw new APIError('Failed to register push subscription', error.statusCode, '/trading/production.php');
    }
  }

  /**
   * Send push notification
   */
  async sendPushNotification(message, title = 'WinTrades Alert') {
    try {
      const response = await this.request('/trading/production.php?action=send_push_notification', {
        method: 'POST',
        body: JSON.stringify({ message, title })
      });
      return response;
    } catch (error) {
      throw new APIError('Failed to send push notification', error.statusCode, '/trading/production.php');
    }
  }

  // ===========================================
  // UTILITY METHODS
  // ===========================================

  /**
   * Health check for API endpoints
   */
  async healthCheck() {
    try {
      const response = await this.request('/trading/production.php?action=health_check');
      return response;
    } catch (error) {
      throw new APIError('API health check failed', error.statusCode, '/trading/production.php');
    }
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      timeout: this.cacheTimeout
    };
  }
}

// Create singleton instance
const apiService = new WinTradesAPI();

// Export the service and related classes
export { apiService as default, WinTradesAPI, APIResponse, APIError, API_CONFIG };