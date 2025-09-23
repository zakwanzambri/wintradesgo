/**
 * PORTFOLIO PERFORMANCE TRACKER V1.0
 * Comprehensive portfolio monitoring and analytics
 */

export class PortfolioPerformanceTracker {
  constructor() {
    this.loadData();
    this.updateInterval = null;
    this.subscribers = [];
  }

  // Load data from localStorage
  loadData() {
    try {
      const saved = localStorage.getItem('portfolioData');
      if (saved) {
        const data = JSON.parse(saved);
        this.portfolio = data.portfolio || this.getDefaultPortfolio();
        this.trades = data.trades || [];
        this.performance = data.performance || this.getDefaultPerformance();
        this.analytics = data.analytics || this.getDefaultAnalytics();
      } else {
        this.initializeDefault();
      }
    } catch (error) {
      console.error('Error loading portfolio data:', error);
      this.initializeDefault();
    }
  }

  // Save data to localStorage
  saveData() {
    try {
      const data = {
        portfolio: this.portfolio,
        trades: this.trades,
        performance: this.performance,
        analytics: this.analytics,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('portfolioData', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving portfolio data:', error);
    }
  }

  // Initialize default values
  initializeDefault() {
    this.portfolio = this.getDefaultPortfolio();
    this.trades = [];
    this.performance = this.getDefaultPerformance();
    this.analytics = this.getDefaultAnalytics();
    this.saveData();
  }

  // Get default portfolio
  getDefaultPortfolio() {
    return {
      totalValue: 0,
      cash: 0,
      invested: 0,
      positions: {},
      allocation: {},
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
  }

  // Get default performance metrics
  getDefaultPerformance() {
    return {
      totalReturn: 0,
      totalPnL: 0,
      realizedPnL: 0,
      unrealizedPnL: 0,
      dayReturn: 0,
      weekReturn: 0,
      monthReturn: 0,
      yearReturn: 0,
      allTimeHigh: 0,
      allTimeLow: 0,
      maxDrawdown: 0,
      currentDrawdown: 0,
      volatility: 0,
      sharpeRatio: 0,
      sortinoRatio: 0,
      calmarRatio: 0,
      winRate: 0,
      profitFactor: 0,
      averageWin: 0,
      averageLoss: 0,
      largestWin: 0,
      largestLoss: 0,
      history: []
    };
  }

  // Get default analytics
  getDefaultAnalytics() {
    return {
      tradingMetrics: {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        avgHoldingPeriod: 0,
        avgTradeSize: 0,
        commission: 0,
        slippage: 0
      },
      riskMetrics: {
        valueAtRisk: 0,        // VaR at 95% confidence
        conditionalVaR: 0,     // Expected Shortfall
        beta: 0,               // Market beta
        alpha: 0,              // Excess return vs market
        tracking: 0,           // Tracking error
        informationRatio: 0    // Information ratio
      },
      diversificationMetrics: {
        concentration: 0,       // Herfindahl index
        correlation: 0,         // Average correlation
        sectorsCount: 0,        // Number of sectors
        assetsCount: 0          // Number of assets
      },
      timeAnalysis: {
        bestMonth: { month: '', return: 0 },
        worstMonth: { month: '', return: 0 },
        bestYear: { year: '', return: 0 },
        worstYear: { year: '', return: 0 },
        consecutiveWins: 0,
        consecutiveLosses: 0
      }
    };
  }

  // Add a trade to tracking
  addTrade(tradeData) {
    const trade = {
      id: this.generateTradeId(),
      ...tradeData,
      timestamp: new Date().toISOString(),
      pnl: 0,
      pnlPercent: 0,
      holdingPeriod: 0,
      status: 'OPEN'
    };

    this.trades.push(trade);
    this.updatePortfolioFromTrade(trade);
    this.calculatePerformanceMetrics();
    this.saveData();
    
    console.log(`📊 Trade added: ${trade.symbol} ${trade.side} ${trade.quantity}`);
    return trade;
  }

  // Close a trade
  closeTrade(tradeId, closeData) {
    const trade = this.trades.find(t => t.id === tradeId);
    if (!trade) {
      throw new Error('Trade not found');
    }

    if (trade.status === 'CLOSED') {
      throw new Error('Trade already closed');
    }

    // Update trade data
    trade.exitPrice = closeData.exitPrice;
    trade.exitTime = closeData.exitTime || new Date().toISOString();
    trade.status = 'CLOSED';
    trade.exitReason = closeData.exitReason || 'MANUAL';

    // Calculate P&L
    if (trade.side === 'LONG') {
      trade.pnl = (trade.exitPrice - trade.entryPrice) * trade.quantity;
    } else {
      trade.pnl = (trade.entryPrice - trade.exitPrice) * trade.quantity;
    }

    trade.pnlPercent = (trade.pnl / (trade.entryPrice * trade.quantity)) * 100;

    // Calculate holding period (in hours)
    const entryTime = new Date(trade.entryTime);
    const exitTime = new Date(trade.exitTime);
    trade.holdingPeriod = (exitTime - entryTime) / (1000 * 60 * 60);

    // Update portfolio
    this.updatePortfolioFromClosedTrade(trade);
    this.calculatePerformanceMetrics();
    this.saveData();

    console.log(`📈 Trade closed: ${trade.symbol} P&L: $${trade.pnl.toFixed(2)}`);
    return trade;
  }

  // Update portfolio from new trade
  updatePortfolioFromTrade(trade) {
    const symbol = trade.symbol;
    const value = trade.entryPrice * trade.quantity;

    // Update positions
    if (this.portfolio.positions[symbol]) {
      const existing = this.portfolio.positions[symbol];
      const totalQuantity = existing.quantity + trade.quantity;
      const totalValue = (existing.avgPrice * existing.quantity) + value;
      
      this.portfolio.positions[symbol] = {
        symbol: symbol,
        quantity: totalQuantity,
        avgPrice: totalValue / totalQuantity,
        currentPrice: trade.entryPrice,
        marketValue: totalQuantity * trade.entryPrice,
        unrealizedPnL: 0,
        allocation: 0
      };
    } else {
      this.portfolio.positions[symbol] = {
        symbol: symbol,
        quantity: trade.quantity,
        avgPrice: trade.entryPrice,
        currentPrice: trade.entryPrice,
        marketValue: value,
        unrealizedPnL: 0,
        allocation: 0
      };
    }

    // Update cash and invested amounts
    this.portfolio.invested += value;
    this.portfolio.cash -= value;
    this.portfolio.totalValue = this.portfolio.cash + this.portfolio.invested;
    this.portfolio.lastUpdated = new Date().toISOString();

    this.updateAllocation();
  }

  // Update portfolio from closed trade
  updatePortfolioFromClosedTrade(trade) {
    const symbol = trade.symbol;
    const position = this.portfolio.positions[symbol];

    if (position) {
      // Reduce position quantity
      position.quantity -= trade.quantity;
      
      if (position.quantity <= 0) {
        delete this.portfolio.positions[symbol];
      } else {
        position.marketValue = position.quantity * position.currentPrice;
      }
    }

    // Update cash with proceeds
    const proceeds = trade.exitPrice * trade.quantity;
    this.portfolio.cash += proceeds;
    this.portfolio.invested -= (trade.entryPrice * trade.quantity);

    // Update realized P&L
    this.performance.realizedPnL += trade.pnl;

    this.updateAllocation();
  }

  // Update current prices and calculate unrealized P&L
  async updateCurrentPrices() {
    try {
      for (const symbol of Object.keys(this.portfolio.positions)) {
        const position = this.portfolio.positions[symbol];
        
        // Get current price (assuming USDT pairs)
        const currentPrice = await this.getCurrentPrice(symbol + 'USDT');
        
        position.currentPrice = currentPrice;
        position.marketValue = position.quantity * currentPrice;
        position.unrealizedPnL = (currentPrice - position.avgPrice) * position.quantity;
      }

      // Calculate total unrealized P&L
      this.performance.unrealizedPnL = Object.values(this.portfolio.positions)
        .reduce((sum, pos) => sum + pos.unrealizedPnL, 0);

      // Update total portfolio value
      this.portfolio.totalValue = this.portfolio.cash + 
        Object.values(this.portfolio.positions).reduce((sum, pos) => sum + pos.marketValue, 0);

      this.updateAllocation();
      this.calculatePerformanceMetrics();
      this.saveData();

    } catch (error) {
      console.error('Error updating current prices:', error);
    }
  }

  // Get current price from API
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

  // Update portfolio allocation percentages
  updateAllocation() {
    const totalValue = this.portfolio.totalValue;
    
    if (totalValue === 0) return;

    // Update position allocations
    Object.values(this.portfolio.positions).forEach(position => {
      position.allocation = (position.marketValue / totalValue) * 100;
    });

    // Update overall allocation object
    this.portfolio.allocation = {
      cash: (this.portfolio.cash / totalValue) * 100,
      crypto: Object.values(this.portfolio.positions)
        .reduce((sum, pos) => sum + pos.allocation, 0)
    };
  }

  // Calculate comprehensive performance metrics
  calculatePerformanceMetrics() {
    const initialValue = this.getInitialValue();
    const currentValue = this.portfolio.totalValue;
    
    if (initialValue === 0) return;

    // Basic returns
    this.performance.totalReturn = ((currentValue - initialValue) / initialValue) * 100;
    this.performance.totalPnL = this.performance.realizedPnL + this.performance.unrealizedPnL;

    // Update all-time high/low
    if (currentValue > this.performance.allTimeHigh) {
      this.performance.allTimeHigh = currentValue;
    }
    if (this.performance.allTimeLow === 0 || currentValue < this.performance.allTimeLow) {
      this.performance.allTimeLow = currentValue;
    }

    // Calculate drawdown
    this.performance.currentDrawdown = this.performance.allTimeHigh > 0 
      ? ((this.performance.allTimeHigh - currentValue) / this.performance.allTimeHigh) * 100 
      : 0;
    
    if (this.performance.currentDrawdown > this.performance.maxDrawdown) {
      this.performance.maxDrawdown = this.performance.currentDrawdown;
    }

    // Calculate trading metrics
    this.calculateTradingMetrics();
    
    // Calculate risk metrics
    this.calculateRiskMetrics();
    
    // Calculate time-based returns
    this.calculateTimeBasedReturns();
    
    // Add to history
    this.addToPerformanceHistory();
  }

  // Calculate trading-specific metrics
  calculateTradingMetrics() {
    const closedTrades = this.trades.filter(t => t.status === 'CLOSED');
    
    this.analytics.tradingMetrics.totalTrades = this.trades.length;
    this.analytics.tradingMetrics.winningTrades = closedTrades.filter(t => t.pnl > 0).length;
    this.analytics.tradingMetrics.losingTrades = closedTrades.filter(t => t.pnl < 0).length;

    if (closedTrades.length > 0) {
      // Win rate
      this.performance.winRate = (this.analytics.tradingMetrics.winningTrades / closedTrades.length) * 100;

      // Average metrics
      const wins = closedTrades.filter(t => t.pnl > 0);
      const losses = closedTrades.filter(t => t.pnl < 0);

      this.performance.averageWin = wins.length > 0 
        ? wins.reduce((sum, t) => sum + t.pnl, 0) / wins.length 
        : 0;
      
      this.performance.averageLoss = losses.length > 0 
        ? Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0) / losses.length)
        : 0;

      // Profit factor
      const grossProfit = wins.reduce((sum, t) => sum + t.pnl, 0);
      const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));
      this.performance.profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0;

      // Largest win/loss
      this.performance.largestWin = Math.max(...wins.map(t => t.pnl), 0);
      this.performance.largestLoss = Math.min(...losses.map(t => t.pnl), 0);

      // Average holding period
      this.analytics.tradingMetrics.avgHoldingPeriod = 
        closedTrades.reduce((sum, t) => sum + t.holdingPeriod, 0) / closedTrades.length;

      // Average trade size
      this.analytics.tradingMetrics.avgTradeSize = 
        closedTrades.reduce((sum, t) => sum + (t.entryPrice * t.quantity), 0) / closedTrades.length;
    }
  }

  // Calculate risk metrics
  calculateRiskMetrics() {
    if (this.performance.history.length < 30) return; // Need at least 30 data points

    const returns = this.performance.history.slice(-252).map(h => h.dailyReturn || 0); // Last year of data
    
    if (returns.length < 2) return;

    // Calculate volatility (annualized)
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    this.performance.volatility = Math.sqrt(variance * 252) * 100; // Annualized

    // Sharpe Ratio (assuming 2% risk-free rate)
    const riskFreeRate = 0.02;
    const excessReturn = (this.performance.totalReturn / 100) - riskFreeRate;
    this.performance.sharpeRatio = this.performance.volatility > 0 
      ? excessReturn / (this.performance.volatility / 100) 
      : 0;

    // Sortino Ratio (using downside deviation)
    const negativeReturns = returns.filter(r => r < 0);
    if (negativeReturns.length > 0) {
      const downsideVariance = negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / negativeReturns.length;
      const downsideDeviation = Math.sqrt(downsideVariance * 252);
      this.performance.sortinoRatio = downsideDeviation > 0 
        ? excessReturn / downsideDeviation 
        : 0;
    }

    // Calmar Ratio
    this.performance.calmarRatio = this.performance.maxDrawdown > 0 
      ? (this.performance.totalReturn / 100) / (this.performance.maxDrawdown / 100)
      : 0;

    // Value at Risk (95% confidence)
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const varIndex = Math.floor(returns.length * 0.05);
    this.analytics.riskMetrics.valueAtRisk = sortedReturns[varIndex] * this.portfolio.totalValue;

    // Conditional VaR (Expected Shortfall)
    const tailReturns = sortedReturns.slice(0, varIndex);
    this.analytics.riskMetrics.conditionalVaR = tailReturns.length > 0 
      ? (tailReturns.reduce((sum, r) => sum + r, 0) / tailReturns.length) * this.portfolio.totalValue
      : 0;
  }

  // Calculate time-based returns
  calculateTimeBasedReturns() {
    const history = this.performance.history;
    if (history.length === 0) return;

    const now = new Date();
    
    // Day return
    const yesterday = history.find(h => {
      const historyDate = new Date(h.timestamp);
      const daysDiff = (now - historyDate) / (1000 * 60 * 60 * 24);
      return daysDiff >= 0.9 && daysDiff <= 1.1;
    });
    if (yesterday) {
      this.performance.dayReturn = ((this.portfolio.totalValue - yesterday.totalValue) / yesterday.totalValue) * 100;
    }

    // Week return
    const weekAgo = history.find(h => {
      const historyDate = new Date(h.timestamp);
      const daysDiff = (now - historyDate) / (1000 * 60 * 60 * 24);
      return daysDiff >= 6.5 && daysDiff <= 7.5;
    });
    if (weekAgo) {
      this.performance.weekReturn = ((this.portfolio.totalValue - weekAgo.totalValue) / weekAgo.totalValue) * 100;
    }

    // Month return
    const monthAgo = history.find(h => {
      const historyDate = new Date(h.timestamp);
      const daysDiff = (now - historyDate) / (1000 * 60 * 60 * 24);
      return daysDiff >= 29 && daysDiff <= 31;
    });
    if (monthAgo) {
      this.performance.monthReturn = ((this.portfolio.totalValue - monthAgo.totalValue) / monthAgo.totalValue) * 100;
    }

    // Year return
    const yearAgo = history.find(h => {
      const historyDate = new Date(h.timestamp);
      const daysDiff = (now - historyDate) / (1000 * 60 * 60 * 24);
      return daysDiff >= 364 && daysDiff <= 366;
    });
    if (yearAgo) {
      this.performance.yearReturn = ((this.portfolio.totalValue - yearAgo.totalValue) / yearAgo.totalValue) * 100;
    }
  }

  // Add to performance history
  addToPerformanceHistory() {
    const historyEntry = {
      timestamp: new Date().toISOString(),
      totalValue: this.portfolio.totalValue,
      totalReturn: this.performance.totalReturn,
      drawdown: this.performance.currentDrawdown,
      dailyReturn: 0 // Will be calculated next time
    };

    // Calculate daily return if we have previous data
    if (this.performance.history.length > 0) {
      const previous = this.performance.history[this.performance.history.length - 1];
      historyEntry.dailyReturn = previous.totalValue > 0 
        ? ((this.portfolio.totalValue - previous.totalValue) / previous.totalValue) * 100 
        : 0;
    }

    this.performance.history.push(historyEntry);

    // Keep only last 365 days of history
    if (this.performance.history.length > 365) {
      this.performance.history = this.performance.history.slice(-365);
    }
  }

  // Get initial portfolio value
  getInitialValue() {
    if (this.performance.history.length > 0) {
      return this.performance.history[0].totalValue;
    }
    return 10000; // Default starting value
  }

  // Start automatic tracking
  startTracking() {
    if (this.updateInterval) return;

    this.updateInterval = setInterval(async () => {
      await this.updateCurrentPrices();
      this.notifySubscribers('portfolio_updated', this.getPortfolioSummary());
    }, 60000); // Update every minute

    console.log('📊 Portfolio tracking started');
  }

  // Stop automatic tracking
  stopTracking() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    console.log('📊 Portfolio tracking stopped');
  }

  // Get comprehensive portfolio summary
  getPortfolioSummary() {
    return {
      portfolio: this.portfolio,
      performance: this.performance,
      analytics: this.analytics,
      recentTrades: this.trades.slice(-10),
      openPositions: Object.values(this.portfolio.positions),
      summary: this.generatePortfolioSummary()
    };
  }

  // Generate portfolio summary with insights
  generatePortfolioSummary() {
    const perf = this.performance;
    let grade = 'F';
    let insights = [];

    // Grade the portfolio
    if (perf.totalReturn > 20 && perf.sharpeRatio > 1.5 && perf.maxDrawdown < 15) {
      grade = 'A+';
      insights.push('Excellent performance with strong risk-adjusted returns');
    } else if (perf.totalReturn > 10 && perf.sharpeRatio > 1 && perf.maxDrawdown < 20) {
      grade = 'A';
      insights.push('Very good performance with good risk management');
    } else if (perf.totalReturn > 5 && perf.sharpeRatio > 0.5) {
      grade = 'B';
      insights.push('Good performance with moderate risk');
    } else if (perf.totalReturn > 0) {
      grade = 'C';
      insights.push('Average performance');
    } else {
      grade = 'D';
      insights.push('Below average performance - review strategy');
    }

    // Add specific insights
    if (perf.winRate > 70) insights.push('High win rate - good entry timing');
    if (perf.winRate < 40) insights.push('Low win rate - consider tightening entry criteria');
    if (perf.maxDrawdown > 25) insights.push('High drawdown - implement stricter risk management');
    if (perf.sharpeRatio > 2) insights.push('Excellent risk-adjusted returns');
    if (perf.volatility > 50) insights.push('High volatility - consider diversification');

    return {
      grade: grade,
      insights: insights,
      riskLevel: this.assessRiskLevel(),
      recommendation: this.generateRecommendation()
    };
  }

  // Assess overall risk level
  assessRiskLevel() {
    const vol = this.performance.volatility;
    const drawdown = this.performance.maxDrawdown;
    
    if (vol > 40 || drawdown > 30) return 'HIGH';
    if (vol > 25 || drawdown > 20) return 'MODERATE';
    if (vol > 15 || drawdown > 10) return 'LOW';
    return 'VERY_LOW';
  }

  // Generate recommendation
  generateRecommendation() {
    const recommendations = [];
    
    if (this.performance.winRate < 50) {
      recommendations.push('Improve trade selection criteria');
    }
    
    if (this.performance.maxDrawdown > 20) {
      recommendations.push('Implement stricter stop-loss rules');
    }
    
    if (Object.keys(this.portfolio.positions).length < 3) {
      recommendations.push('Consider diversifying across more assets');
    }
    
    if (this.performance.sharpeRatio < 0.5) {
      recommendations.push('Review risk-return profile of strategy');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Portfolio performing well - maintain current strategy');
    }
    
    return recommendations;
  }

  // Export portfolio data
  exportData() {
    const exportData = {
      portfolio: this.portfolio,
      trades: this.trades,
      performance: this.performance,
      analytics: this.analytics,
      exportedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `portfolio_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Helper functions
  generateTradeId() {
    return 'TR_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  }

  // Subscribe to updates
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
}

export default PortfolioPerformanceTracker;