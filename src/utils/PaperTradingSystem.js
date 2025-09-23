/**
 * PAPER TRADING SYSTEM V1.0
 * Risk-free virtual trading with real market data
 */

import EnhancedAITradingSignals from './EnhancedAITradingSignals.js';

export class PaperTradingSystem {
  constructor() {
    this.aiEngine = new EnhancedAITradingSignals();
    this.isActive = false;
    this.subscribers = []; // For real-time updates
    
    // Load existing data from localStorage
    this.loadData();
    
    // Real-time data update interval
    this.updateInterval = null;
  }

  // Load paper trading data from localStorage
  loadData() {
    try {
      const saved = localStorage.getItem('paperTradingData');
      if (saved) {
        const data = JSON.parse(saved);
        this.portfolio = data.portfolio || this.getDefaultPortfolio();
        this.trades = data.trades || [];
        this.orders = data.orders || [];
        this.performance = data.performance || this.getDefaultPerformance();
      } else {
        this.initializeDefault();
      }
    } catch (error) {
      console.error('Error loading paper trading data:', error);
      this.initializeDefault();
    }
  }

  // Save data to localStorage
  saveData() {
    try {
      const data = {
        portfolio: this.portfolio,
        trades: this.trades,
        orders: this.orders,
        performance: this.performance,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('paperTradingData', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving paper trading data:', error);
    }
  }

  // Initialize default values
  initializeDefault() {
    this.portfolio = this.getDefaultPortfolio();
    this.trades = [];
    this.orders = [];
    this.performance = this.getDefaultPerformance();
    this.saveData();
  }

  // Get default portfolio
  getDefaultPortfolio() {
    return {
      cash: 10000, // $10,000 starting capital
      positions: {},
      totalValue: 10000,
      initialValue: 10000,
      createdAt: new Date().toISOString()
    };
  }

  // Get default performance metrics
  getDefaultPerformance() {
    return {
      totalReturn: 0,
      totalPnL: 0,
      dayReturn: 0,
      weekReturn: 0,
      monthReturn: 0,
      winRate: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      history: []
    };
  }

  // Start paper trading
  async startPaperTrading() {
    this.isActive = true;
    console.log('📈 Paper Trading Started');
    
    // Update portfolio value every 30 seconds
    this.updateInterval = setInterval(async () => {
      await this.updatePortfolioValue();
      this.notifySubscribers('portfolio_update', this.portfolio);
    }, 30000);
    
    return this.getPortfolioSummary();
  }

  // Stop paper trading
  stopPaperTrading() {
    this.isActive = false;
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    console.log('📉 Paper Trading Stopped');
  }

  // Reset paper trading (clear all data)
  resetPaperTrading() {
    this.stopPaperTrading();
    this.initializeDefault();
    console.log('🔄 Paper Trading Reset');
    return this.getPortfolioSummary();
  }

  // Place a paper trade order
  async placeOrder(orderData) {
    try {
      const { symbol, type, side, quantity, price, orderType = 'MARKET' } = orderData;
      
      // Validate order
      const validation = await this.validateOrder(orderData);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Get current market price
      const currentPrice = await this.getCurrentPrice(symbol);
      const executionPrice = orderType === 'MARKET' ? currentPrice : price;

      // Create order
      const order = {
        id: this.generateOrderId(),
        symbol: symbol,
        type: type, // BUY/SELL
        side: side, // LONG/SHORT
        quantity: parseFloat(quantity),
        price: parseFloat(executionPrice),
        orderType: orderType,
        status: 'FILLED', // Instant fill for paper trading
        timestamp: new Date().toISOString(),
        commission: this.calculateCommission(quantity, executionPrice)
      };

      // Execute order
      const trade = await this.executeOrder(order);
      
      // Update portfolio
      await this.updatePortfolioAfterTrade(trade);
      
      // Save data
      this.saveData();
      
      // Notify subscribers
      this.notifySubscribers('order_filled', { order, trade });
      
      console.log(`✅ Paper trade executed: ${type} ${quantity} ${symbol} at $${executionPrice}`);
      return { success: true, order, trade };

    } catch (error) {
      console.error('❌ Paper trade failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Validate order before execution
  async validateOrder(orderData) {
    const { symbol, type, quantity, price } = orderData;
    
    // Check if market is open (simplified)
    if (!this.isMarketOpen()) {
      return { valid: false, error: 'Market is closed' };
    }

    // Check sufficient funds for BUY orders
    if (type === 'BUY') {
      const currentPrice = await this.getCurrentPrice(symbol);
      const orderValue = quantity * (price || currentPrice);
      const commission = this.calculateCommission(quantity, currentPrice);
      const totalCost = orderValue + commission;
      
      if (this.portfolio.cash < totalCost) {
        return { valid: false, error: 'Insufficient funds' };
      }
    }

    // Check sufficient position for SELL orders
    if (type === 'SELL') {
      const position = this.portfolio.positions[symbol];
      if (!position || position.quantity < quantity) {
        return { valid: false, error: 'Insufficient position to sell' };
      }
    }

    // Validate quantity
    if (quantity <= 0) {
      return { valid: false, error: 'Invalid quantity' };
    }

    return { valid: true };
  }

  // Execute the order
  async executeOrder(order) {
    const trade = {
      id: this.generateTradeId(),
      orderId: order.id,
      symbol: order.symbol,
      type: order.type,
      quantity: order.quantity,
      price: order.price,
      timestamp: order.timestamp,
      commission: order.commission,
      pnl: 0,
      status: 'OPEN'
    };

    this.orders.push(order);
    this.trades.push(trade);

    return trade;
  }

  // Update portfolio after trade execution
  async updatePortfolioAfterTrade(trade) {
    const { symbol, type, quantity, price, commission } = trade;
    
    if (type === 'BUY') {
      // Deduct cash
      this.portfolio.cash -= (quantity * price + commission);
      
      // Add/update position
      if (this.portfolio.positions[symbol]) {
        // Average down/up existing position
        const existing = this.portfolio.positions[symbol];
        const totalQuantity = existing.quantity + quantity;
        const avgPrice = ((existing.avgPrice * existing.quantity) + (price * quantity)) / totalQuantity;
        
        this.portfolio.positions[symbol] = {
          symbol: symbol,
          quantity: totalQuantity,
          avgPrice: avgPrice,
          currentPrice: price,
          marketValue: totalQuantity * price,
          pnl: (price - avgPrice) * totalQuantity,
          pnlPercent: ((price - avgPrice) / avgPrice) * 100,
          lastUpdated: new Date().toISOString()
        };
      } else {
        // New position
        this.portfolio.positions[symbol] = {
          symbol: symbol,
          quantity: quantity,
          avgPrice: price,
          currentPrice: price,
          marketValue: quantity * price,
          pnl: 0,
          pnlPercent: 0,
          lastUpdated: new Date().toISOString()
        };
      }
    } else if (type === 'SELL') {
      // Add cash from sale
      this.portfolio.cash += (quantity * price - commission);
      
      // Update/remove position
      const position = this.portfolio.positions[symbol];
      if (position) {
        // Calculate realized P&L
        const realizedPnL = (price - position.avgPrice) * quantity;
        trade.pnl = realizedPnL;
        trade.status = 'CLOSED';
        
        // Update performance
        this.performance.totalPnL += realizedPnL;
        this.performance.totalTrades++;
        
        if (realizedPnL > 0) {
          this.performance.winningTrades++;
        } else {
          this.performance.losingTrades++;
        }
        
        this.performance.winRate = (this.performance.winningTrades / this.performance.totalTrades) * 100;
        
        // Update position
        position.quantity -= quantity;
        if (position.quantity <= 0) {
          delete this.portfolio.positions[symbol];
        } else {
          position.marketValue = position.quantity * price;
          position.currentPrice = price;
          position.pnl = (price - position.avgPrice) * position.quantity;
          position.pnlPercent = ((price - position.avgPrice) / position.avgPrice) * 100;
        }
      }
    }

    // Update total portfolio value
    await this.updatePortfolioValue();
  }

  // Update portfolio value with current market prices
  async updatePortfolioValue() {
    let totalValue = this.portfolio.cash;
    
    // Update positions with current prices
    for (const symbol of Object.keys(this.portfolio.positions)) {
      try {
        const currentPrice = await this.getCurrentPrice(symbol + 'USDT');
        const position = this.portfolio.positions[symbol];
        
        position.currentPrice = currentPrice;
        position.marketValue = position.quantity * currentPrice;
        position.pnl = (currentPrice - position.avgPrice) * position.quantity;
        position.pnlPercent = ((currentPrice - position.avgPrice) / position.avgPrice) * 100;
        
        totalValue += position.marketValue;
      } catch (error) {
        console.error(`Error updating price for ${symbol}:`, error);
      }
    }
    
    // Update portfolio totals
    const previousValue = this.portfolio.totalValue;
    this.portfolio.totalValue = totalValue;
    
    // Update performance metrics
    this.performance.totalReturn = ((totalValue - this.portfolio.initialValue) / this.portfolio.initialValue) * 100;
    this.performance.dayReturn = previousValue > 0 ? ((totalValue - previousValue) / previousValue) * 100 : 0;
    
    // Add to history
    this.performance.history.push({
      timestamp: new Date().toISOString(),
      totalValue: totalValue,
      totalReturn: this.performance.totalReturn
    });
    
    // Keep only last 100 history entries
    if (this.performance.history.length > 100) {
      this.performance.history = this.performance.history.slice(-100);
    }
    
    // Save updated data
    this.saveData();
  }

  // Get current price from Binance
  async getCurrentPrice(symbol) {
    try {
      const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
      const data = await response.json();
      return parseFloat(data.price);
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      return 0;
    }
  }

  // AI-suggested trades
  async getAISuggestedTrades() {
    try {
      const suggestions = [];
      const symbols = ['BTCUSDT', 'ETHUSDT', 'ADAUSDT'];
      
      for (const symbol of symbols) {
        const signal = await this.aiEngine.generateEnhancedSignal(symbol);
        
        if (signal && signal.confidence > 75 && signal.signal !== 'HOLD') {
          const currentPrice = signal.currentPrice;
          const suggestedQuantity = this.calculateSuggestedQuantity(symbol, currentPrice, signal.confidence);
          
          suggestions.push({
            symbol: symbol.replace('USDT', ''),
            action: signal.signal,
            currentPrice: currentPrice,
            confidence: signal.confidence,
            suggestedQuantity: suggestedQuantity,
            reasoning: signal.recommendation.slice(0, 3), // Top 3 reasons
            riskManagement: signal.riskManagement
          });
        }
      }
      
      return suggestions.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      return [];
    }
  }

  // Calculate suggested quantity based on risk management
  calculateSuggestedQuantity(symbol, price, confidence) {
    const maxRiskPerTrade = 0.02; // 2% of portfolio
    const riskAmount = this.portfolio.totalValue * maxRiskPerTrade;
    const confidenceMultiplier = confidence / 100;
    
    return Math.floor((riskAmount * confidenceMultiplier) / price * 100) / 100;
  }

  // Helper functions
  generateOrderId() {
    return 'PO_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  }

  generateTradeId() {
    return 'PT_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  }

  calculateCommission(quantity, price) {
    return quantity * price * 0.001; // 0.1% commission
  }

  isMarketOpen() {
    // Crypto markets are always open
    return true;
  }

  // Get portfolio summary
  getPortfolioSummary() {
    return {
      portfolio: this.portfolio,
      performance: this.performance,
      recentTrades: this.trades.slice(-10),
      openOrders: this.orders.filter(o => o.status === 'PENDING'),
      isActive: this.isActive
    };
  }

  // Subscribe to real-time updates
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  // Notify subscribers
  notifySubscribers(event, data) {
    this.subscribers.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error notifying subscriber:', error);
      }
    });
  }

  // Export trading history
  exportTradingHistory() {
    const exportData = {
      portfolio: this.portfolio,
      trades: this.trades,
      orders: this.orders,
      performance: this.performance,
      exportedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `paper_trading_history_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Import trading history
  async importTradingHistory(file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Validate data structure
      if (data.portfolio && data.trades && data.performance) {
        this.portfolio = data.portfolio;
        this.trades = data.trades;
        this.orders = data.orders || [];
        this.performance = data.performance;
        
        this.saveData();
        console.log('✅ Trading history imported successfully');
        return { success: true };
      } else {
        throw new Error('Invalid file format');
      }
    } catch (error) {
      console.error('❌ Import failed:', error);
      return { success: false, error: error.message };
    }
  }
}

export default PaperTradingSystem;