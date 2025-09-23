/**
 * BACKTESTING ENGINE V1.0
 * Historical strategy validation and performance analysis
 */

import EnhancedAITradingSignals from './EnhancedAITradingSignals.js';

export class BacktestingEngine {
  constructor() {
    this.aiEngine = new EnhancedAITradingSignals();
    this.results = [];
    this.trades = [];
    this.portfolioHistory = [];
    
    // Backtesting parameters
    this.config = {
      initialCapital: 10000,     // Starting capital in USD
      commission: 0.001,         // 0.1% commission per trade
      slippage: 0.001,          // 0.1% slippage
      maxPositionSize: 0.25,     // Max 25% of portfolio per position
      stopLossATRMultiplier: 2,  // 2x ATR for stop loss
      takeProfitATRMultiplier: 4, // 4x ATR for take profit
      riskPerTrade: 0.02         // 2% risk per trade
    };
  }

  // Main backtesting function
  async runBacktest(symbol, startDate, endDate, interval = '1h') {
    console.log(`🔄 Starting backtest for ${symbol} from ${startDate} to ${endDate}`);
    
    try {
      // Fetch historical data
      const historicalData = await this.fetchHistoricalData(symbol, startDate, endDate, interval);
      if (!historicalData || historicalData.length < 100) {
        throw new Error('Insufficient historical data');
      }

      // Initialize backtest state
      this.initializeBacktest(symbol, historicalData[0]);
      
      // Process each data point
      for (let i = 100; i < historicalData.length; i++) {
        const currentData = historicalData.slice(Math.max(0, i - 100), i + 1);
        const currentCandle = historicalData[i];
        
        await this.processDataPoint(currentData, currentCandle, i);
      }

      // Calculate final results
      const results = this.calculateBacktestResults();
      console.log(`✅ Backtest completed. Final return: ${results.totalReturn.toFixed(2)}%`);
      
      return results;

    } catch (error) {
      console.error('❌ Backtest failed:', error);
      throw error;
    }
  }

  // Fetch historical data (simplified - in real implementation would use proper API)
  async fetchHistoricalData(symbol, startDate, endDate, interval) {
    try {
      // Calculate number of periods needed
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Estimate number of candles needed (rough calculation)
      let limit = 500; // Default
      if (interval === '1h') limit = Math.min(1000, diffDays * 24);
      else if (interval === '4h') limit = Math.min(1000, diffDays * 6);
      else if (interval === '1d') limit = Math.min(1000, diffDays);

      // Fetch from Binance API
      const response = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }
      
      const data = await response.json();
      
      return data.map(kline => ({
        timestamp: new Date(kline[0]),
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5])
      }));

    } catch (error) {
      console.error('Error fetching historical data:', error);
      return null;
    }
  }

  // Initialize backtest state
  initializeBacktest(symbol, firstCandle) {
    this.currentPortfolio = {
      cash: this.config.initialCapital,
      positions: {},
      totalValue: this.config.initialCapital
    };
    
    this.trades = [];
    this.portfolioHistory = [{
      timestamp: firstCandle.timestamp,
      value: this.config.initialCapital,
      cash: this.config.initialCapital,
      positions: {}
    }];
    
    this.metrics = {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      totalPnL: 0,
      maxDrawdown: 0,
      maxDrawdownPeriod: { start: null, end: null },
      sharpeRatio: 0,
      winRate: 0
    };
  }

  // Process each data point
  async processDataPoint(historicalWindow, currentCandle, index) {
    try {
      // Prepare data for AI analysis
      const closes = historicalWindow.map(d => d.close);
      const highs = historicalWindow.map(d => d.high);
      const lows = historicalWindow.map(d => d.low);
      const volumes = historicalWindow.map(d => d.volume);

      // Generate AI signal using our enhanced engine
      const analysis = this.aiEngine.technicalAnalysis.analyzeMarket(highs, lows, closes, volumes);
      if (!analysis) return;

      const signal = this.aiEngine.calculateEnhancedSignal(analysis);
      const confidence = this.aiEngine.calculateAdvancedConfidence(analysis, signal);

      // Only trade on high confidence signals (>70%)
      if (confidence < 70) {
        this.updatePortfolioValue(currentCandle);
        return;
      }

      // Check for trade exits first
      this.checkTradeExits(currentCandle);

      // Check for new trade entries
      if (signal.action === 'BUY' || signal.action === 'SELL') {
        this.evaluateTradeEntry(signal, analysis, currentCandle, confidence);
      }

      // Update portfolio value
      this.updatePortfolioValue(currentCandle);

    } catch (error) {
      console.error('Error processing data point:', error);
    }
  }

  // Evaluate trade entry
  evaluateTradeEntry(signal, analysis, candle, confidence) {
    const symbol = 'BTC'; // Simplified for now
    
    // Don't enter new position if already have one for this symbol
    if (this.currentPortfolio.positions[symbol]) return;

    // Calculate position size based on risk management
    const atr = analysis.atr ? analysis.atr[analysis.atr.length - 1] : candle.close * 0.02;
    const positionSize = this.calculatePositionSize(signal, candle.close, atr, confidence);
    
    if (positionSize <= 0) return;

    // Calculate stop loss and take profit
    const stopLoss = signal.action === 'BUY' 
      ? candle.close - (atr * this.config.stopLossATRMultiplier)
      : candle.close + (atr * this.config.stopLossATRMultiplier);
      
    const takeProfit = signal.action === 'BUY'
      ? candle.close + (atr * this.config.takeProfitATRMultiplier)
      : candle.close - (atr * this.config.takeProfitATRMultiplier);

    // Execute trade
    const trade = {
      id: this.trades.length + 1,
      symbol: symbol,
      type: signal.action,
      entryPrice: candle.close,
      entryTime: candle.timestamp,
      quantity: positionSize / candle.close,
      stopLoss: stopLoss,
      takeProfit: takeProfit,
      confidence: confidence,
      atr: atr,
      status: 'OPEN',
      pnl: 0
    };

    // Update portfolio
    const cost = positionSize + (positionSize * this.config.commission);
    if (this.currentPortfolio.cash >= cost) {
      this.currentPortfolio.cash -= cost;
      this.currentPortfolio.positions[symbol] = trade;
      this.trades.push(trade);
      this.metrics.totalTrades++;
      
      console.log(`📈 ${signal.action} ${symbol} at $${candle.close.toFixed(2)} (${confidence}% confidence)`);
    }
  }

  // Check for trade exits
  checkTradeExits(candle) {
    const symbol = 'BTC';
    const position = this.currentPortfolio.positions[symbol];
    
    if (!position || position.status !== 'OPEN') return;

    let shouldExit = false;
    let exitReason = '';

    // Check stop loss
    if (position.type === 'BUY' && candle.low <= position.stopLoss) {
      shouldExit = true;
      exitReason = 'STOP_LOSS';
    } else if (position.type === 'SELL' && candle.high >= position.stopLoss) {
      shouldExit = true;
      exitReason = 'STOP_LOSS';
    }

    // Check take profit
    if (position.type === 'BUY' && candle.high >= position.takeProfit) {
      shouldExit = true;
      exitReason = 'TAKE_PROFIT';
    } else if (position.type === 'SELL' && candle.low <= position.takeProfit) {
      shouldExit = true;
      exitReason = 'TAKE_PROFIT';
    }

    if (shouldExit) {
      this.exitTrade(position, candle, exitReason);
    }
  }

  // Exit trade
  exitTrade(position, candle, reason) {
    const exitPrice = reason === 'STOP_LOSS' 
      ? position.stopLoss 
      : reason === 'TAKE_PROFIT' 
        ? position.takeProfit 
        : candle.close;

    // Calculate P&L
    let pnl;
    if (position.type === 'BUY') {
      pnl = (exitPrice - position.entryPrice) * position.quantity;
    } else {
      pnl = (position.entryPrice - exitPrice) * position.quantity;
    }

    // Account for commission
    const commission = (position.quantity * exitPrice * this.config.commission);
    pnl -= commission;

    // Update position
    position.exitPrice = exitPrice;
    position.exitTime = candle.timestamp;
    position.status = 'CLOSED';
    position.exitReason = reason;
    position.pnl = pnl;

    // Update portfolio
    const proceeds = position.quantity * exitPrice - commission;
    this.currentPortfolio.cash += proceeds;
    delete this.currentPortfolio.positions[position.symbol];

    // Update metrics
    this.metrics.totalPnL += pnl;
    if (pnl > 0) {
      this.metrics.winningTrades++;
    } else {
      this.metrics.losingTrades++;
    }

    console.log(`📉 EXIT ${position.symbol} at $${exitPrice.toFixed(2)} (${reason}) P&L: $${pnl.toFixed(2)}`);
  }

  // Calculate position size
  calculatePositionSize(signal, price, atr, confidence) {
    const maxRisk = this.currentPortfolio.totalValue * this.config.riskPerTrade;
    const stopDistance = atr * this.config.stopLossATRMultiplier;
    const maxPositionValue = this.currentPortfolio.totalValue * this.config.maxPositionSize;
    
    // Risk-based position sizing
    const riskBasedSize = maxRisk / stopDistance;
    
    // Confidence-adjusted sizing
    const confidenceMultiplier = Math.min(1.5, confidence / 70); // Scale confidence
    const adjustedSize = riskBasedSize * confidenceMultiplier;
    
    // Apply maximum position limit
    const finalSize = Math.min(adjustedSize * price, maxPositionValue, this.currentPortfolio.cash * 0.95);
    
    return Math.max(0, finalSize);
  }

  // Update portfolio value
  updatePortfolioValue(candle) {
    let totalValue = this.currentPortfolio.cash;
    
    // Add value of open positions
    Object.values(this.currentPortfolio.positions).forEach(position => {
      if (position.status === 'OPEN') {
        const currentValue = position.quantity * candle.close;
        totalValue += currentValue;
      }
    });
    
    this.currentPortfolio.totalValue = totalValue;
    
    // Record portfolio history
    this.portfolioHistory.push({
      timestamp: candle.timestamp,
      value: totalValue,
      cash: this.currentPortfolio.cash,
      positions: { ...this.currentPortfolio.positions }
    });
    
    // Update drawdown
    this.updateDrawdown(totalValue);
  }

  // Update maximum drawdown
  updateDrawdown(currentValue) {
    const peak = Math.max(...this.portfolioHistory.map(h => h.value));
    const drawdown = (peak - currentValue) / peak;
    
    if (drawdown > this.metrics.maxDrawdown) {
      this.metrics.maxDrawdown = drawdown;
    }
  }

  // Calculate final backtest results
  calculateBacktestResults() {
    const initialValue = this.config.initialCapital;
    const finalValue = this.currentPortfolio.totalValue;
    const totalReturn = ((finalValue - initialValue) / initialValue) * 100;
    
    // Calculate Sharpe ratio (simplified)
    const returns = [];
    for (let i = 1; i < this.portfolioHistory.length; i++) {
      const dailyReturn = (this.portfolioHistory[i].value - this.portfolioHistory[i-1].value) / this.portfolioHistory[i-1].value;
      returns.push(dailyReturn);
    }
    
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const returnStd = Math.sqrt(returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / returns.length);
    const sharpeRatio = returnStd > 0 ? (avgReturn / returnStd) * Math.sqrt(252) : 0; // Annualized

    // Win rate
    const winRate = this.metrics.totalTrades > 0 
      ? (this.metrics.winningTrades / this.metrics.totalTrades) * 100 
      : 0;

    // Average trade metrics
    const completedTrades = this.trades.filter(t => t.status === 'CLOSED');
    const avgWin = completedTrades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0) / this.metrics.winningTrades || 0;
    const avgLoss = completedTrades.filter(t => t.pnl < 0).reduce((sum, t) => sum + Math.abs(t.pnl), 0) / this.metrics.losingTrades || 0;
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0;

    return {
      // Performance metrics
      initialCapital: initialValue,
      finalValue: finalValue,
      totalReturn: totalReturn,
      totalPnL: this.metrics.totalPnL,
      
      // Risk metrics
      maxDrawdown: this.metrics.maxDrawdown * 100,
      sharpeRatio: sharpeRatio,
      
      // Trading metrics
      totalTrades: this.metrics.totalTrades,
      winningTrades: this.metrics.winningTrades,
      losingTrades: this.metrics.losingTrades,
      winRate: winRate,
      avgWin: avgWin,
      avgLoss: avgLoss,
      profitFactor: profitFactor,
      
      // Trade history
      trades: this.trades,
      portfolioHistory: this.portfolioHistory,
      
      // Additional metrics
      buyAndHoldReturn: this.calculateBuyAndHoldReturn(),
      alpha: totalReturn - this.calculateBuyAndHoldReturn(), // Excess return vs buy & hold
      
      // Summary
      summary: this.generateSummary(totalReturn, winRate, this.metrics.maxDrawdown * 100)
    };
  }

  // Calculate buy and hold return for comparison
  calculateBuyAndHoldReturn() {
    if (this.portfolioHistory.length < 2) return 0;
    
    const firstPrice = this.portfolioHistory[0].value;
    const lastPrice = this.portfolioHistory[this.portfolioHistory.length - 1].value;
    
    // Simulate buying at first price and holding
    const shares = this.config.initialCapital / firstPrice;
    const finalValue = shares * lastPrice;
    
    return ((finalValue - this.config.initialCapital) / this.config.initialCapital) * 100;
  }

  // Generate performance summary
  generateSummary(totalReturn, winRate, maxDrawdown) {
    let grade = 'F';
    let description = 'Poor performance';
    
    if (totalReturn > 20 && winRate > 60 && maxDrawdown < 15) {
      grade = 'A+';
      description = 'Excellent performance with strong risk management';
    } else if (totalReturn > 10 && winRate > 55 && maxDrawdown < 20) {
      grade = 'A';
      description = 'Very good performance';
    } else if (totalReturn > 5 && winRate > 50 && maxDrawdown < 25) {
      grade = 'B';
      description = 'Good performance';
    } else if (totalReturn > 0 && winRate > 45) {
      grade = 'C';
      description = 'Average performance';
    } else if (totalReturn > -10) {
      grade = 'D';
      description = 'Below average performance';
    }
    
    return {
      grade: grade,
      description: description,
      recommendation: this.generateRecommendation(totalReturn, winRate, maxDrawdown)
    };
  }

  // Generate improvement recommendations
  generateRecommendation(totalReturn, winRate, maxDrawdown) {
    const recommendations = [];
    
    if (winRate < 50) {
      recommendations.push('Consider tightening entry criteria - win rate is below 50%');
    }
    
    if (maxDrawdown > 20) {
      recommendations.push('Implement stricter risk management - drawdown is too high');
    }
    
    if (totalReturn < 5) {
      recommendations.push('Strategy may need optimization or different market conditions');
    }
    
    if (this.metrics.totalTrades < 10) {
      recommendations.push('Insufficient trade samples - run longer backtest period');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Strategy shows good performance - consider live testing with small amounts');
    }
    
    return recommendations;
  }
}

export default BacktestingEngine;