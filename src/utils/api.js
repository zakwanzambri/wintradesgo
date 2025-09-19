/**
 * API Helper Functions for WinTrades Frontend
 * Handles communication between React app and PHP backend
 */

const API_BASE_URL = 'http://localhost/wintradesgo/api';

// Authentication token management
class AuthManager {
  static getToken() {
    return localStorage.getItem('wintradesgo_token');
  }

  static setToken(token) {
    localStorage.setItem('wintradesgo_token', token);
  }

  static removeToken() {
    localStorage.removeItem('wintradesgo_token');
    localStorage.removeItem('wintradesgo_user');
  }

  static getUser() {
    const userStr = localStorage.getItem('wintradesgo_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  static setUser(user) {
    localStorage.setItem('wintradesgo_user', JSON.stringify(user));
  }

  static isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token));
      return payload.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  }
}

// API request wrapper
class ApiClient {
  static async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = AuthManager.getToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (token && AuthManager.isAuthenticated()) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      
      // Handle authentication errors
      if (error.message?.includes('Unauthorized') || error.message?.includes('401')) {
        AuthManager.removeToken();
        window.location.href = '/login';
      }
      
      throw error;
    }
  }

  static async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return this.request(url, {
      method: 'GET',
    });
  }

  static async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }
}

// Authentication API
export const authAPI = {
  async login(email, password) {
    try {
      const response = await ApiClient.post('/auth/login.php', {
        email,
        password,
      });

      if (response.success) {
        AuthManager.setToken(response.data.token);
        AuthManager.setUser(response.data.user);
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  async register(userData) {
    try {
      const response = await ApiClient.post('/auth/register.php', userData);

      if (response.success) {
        AuthManager.setToken(response.data.token);
        AuthManager.setUser(response.data.user);
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  logout() {
    AuthManager.removeToken();
    window.location.href = '/';
  },

  getCurrentUser() {
    return AuthManager.getUser();
  },

  isAuthenticated() {
    return AuthManager.isAuthenticated();
  }
};

// Portfolio API
export const portfolioAPI = {
  async getPortfolio() {
    try {
      const response = await ApiClient.get('/portfolio/get.php');
      return response.data;
    } catch (error) {
      console.warn('Failed to fetch real portfolio data, using mock data');
      // Fallback to mock data if API fails
      return getMockPortfolioData();
    }
  },

  async addTrade(tradeData) {
    return ApiClient.post('/portfolio/add-trade.php', tradeData);
  },

  async updateHolding(holdingId, updateData) {
    return ApiClient.put(`/portfolio/update-holding.php?id=${holdingId}`, updateData);
  },

  async deleteHolding(holdingId) {
    return ApiClient.delete(`/portfolio/delete-holding.php?id=${holdingId}`);
  }
};

// Market Data API
export const marketAPI = {
  async getMarketData(symbols = []) {
    try {
      const response = await ApiClient.get('/market/data.php', { symbols: symbols.join(',') });
      return response.data;
    } catch (error) {
      console.warn('Failed to fetch real market data, using mock data');
      return getMockMarketData();
    }
  },

  async getAISignals() {
    try {
      const response = await ApiClient.get('/signals/get.php');
      return response.data;
    } catch (error) {
      console.warn('Failed to fetch AI signals, using mock data');
      return getMockSignalsData();
    }
  }
};

// Mock data fallbacks (your existing mock data)
function getMockPortfolioData() {
  return {
    summary: {
      total_value: 127543.21,
      total_profit_loss: 3247.89,
      total_profit_loss_percentage: 2.45,
      total_holdings: 4,
      profitable_positions: 3,
      win_rate: 75.0
    },
    holdings: [
      { symbol: 'BTC', name: 'Bitcoin', amount: 1.2534, current_price: 43250.67, total_value: 54238.67, change_percentage: 2.45 },
      { symbol: 'ETH', name: 'Ethereum', amount: 16.789, current_price: 2634.89, total_value: 44234.89, change_percentage: -1.23 },
      { symbol: 'ADA', name: 'Cardano', amount: 25432.1, current_price: 0.523, total_value: 13301.65, change_percentage: 4.67 },
      { symbol: 'SOL', name: 'Solana', amount: 89.45, current_price: 98.45, total_value: 8807.23, change_percentage: -2.11 }
    ],
    allocation: [
      { name: 'Bitcoin', value: 45, color: '#f7931a' },
      { name: 'Ethereum', value: 30, color: '#627eea' },
      { name: 'Cardano', value: 15, color: '#0033ad' },
      { name: 'Solana', value: 10, color: '#9945ff' }
    ]
  };
}

function getMockMarketData() {
  return [
    { symbol: 'BTC', price: 43250.67, change: 2.45, volume: '2.1B' },
    { symbol: 'ETH', price: 2634.89, change: -1.23, volume: '1.2B' },
    { symbol: 'ADA', price: 0.523, change: 4.67, volume: '324M' },
    { symbol: 'SOL', price: 98.45, change: -2.11, volume: '456M' }
  ];
}

function getMockSignalsData() {
  return [
    { symbol: 'BTC', type: 'BUY', confidence: 87, reason: 'Bullish divergence detected', timeframe: '4h' },
    { symbol: 'ETH', type: 'SELL', confidence: 72, reason: 'Resistance level reached', timeframe: '1h' },
    { symbol: 'ADA', type: 'HOLD', confidence: 65, reason: 'Consolidation phase', timeframe: '1d' }
  ];
}

// Database connection test
export const testAPI = {
  async testConnection() {
    try {
      const response = await ApiClient.get('/test-connection.php');
      return response;
    } catch (error) {
      throw error;
    }
  }
};

// Export AuthManager for use in components
export { AuthManager };

// Default export
export default {
  auth: authAPI,
  portfolio: portfolioAPI,
  market: marketAPI,
  test: testAPI
};