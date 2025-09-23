/**
 * STRATEGY BUILDER V1.0
 * Visual strategy creation and optimization system
 */

export class StrategyBuilder {
  constructor() {
    this.strategies = [];
    this.components = {};
    this.loadData();
    
    // Strategy building configuration
    this.config = {
      maxRules: 10,
      maxConditions: 5,
      defaultRiskLevel: 'medium',
      backtestPeriod: 30,
      minConfidence: 0.6
    };
    
    // Pre-built strategy templates
    this.templates = this.initializeTemplates();
    
    // Rule components
    this.ruleComponents = this.initializeRuleComponents();
  }

  // Load saved data
  loadData() {
    try {
      const saved = localStorage.getItem('strategyBuilderData');
      if (saved) {
        const data = JSON.parse(saved);
        this.strategies = data.strategies || [];
        this.components = data.components || {};
      }
    } catch (error) {
      console.error('Error loading strategy builder data:', error);
    }
  }

  // Save data
  saveData() {
    try {
      const data = {
        strategies: this.strategies,
        components: this.components,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('strategyBuilderData', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving strategy builder data:', error);
    }
  }

  // Initialize strategy templates
  initializeTemplates() {
    return {
      momentum: {
        name: 'Momentum Trading',
        description: 'Buy strong uptrends, sell strong downtrends',
        rules: [
          {
            type: 'entry',
            condition: 'RSI > 70 AND MACD > 0',
            action: 'BUY',
            weight: 1.0
          },
          {
            type: 'exit',
            condition: 'RSI < 30 OR Stop Loss -3%',
            action: 'SELL',
            weight: 1.0
          }
        ],
        riskLevel: 'high',
        timeframe: '1h'
      },
      
      meanReversion: {
        name: 'Mean Reversion',
        description: 'Buy oversold, sell overbought conditions',
        rules: [
          {
            type: 'entry',
            condition: 'RSI < 30 AND Bollinger Lower Band Touch',
            action: 'BUY',
            weight: 1.0
          },
          {
            type: 'exit',
            condition: 'RSI > 70 OR Bollinger Upper Band Touch',
            action: 'SELL',
            weight: 1.0
          }
        ],
        riskLevel: 'medium',
        timeframe: '4h'
      },
      
      breakout: {
        name: 'Breakout Strategy',
        description: 'Trade significant price breakouts with volume',
        rules: [
          {
            type: 'entry',
            condition: 'Price > Resistance AND Volume > 2x Average',
            action: 'BUY',
            weight: 1.0
          },
          {
            type: 'exit',
            condition: 'Price < Support OR Stop Loss -5%',
            action: 'SELL',
            weight: 1.0
          }
        ],
        riskLevel: 'medium',
        timeframe: '1h'
      },
      
      scalping: {
        name: 'Scalping Strategy',
        description: 'Quick small profits from short-term movements',
        rules: [
          {
            type: 'entry',
            condition: 'MACD Signal Cross AND Volume Spike',
            action: 'BUY',
            weight: 1.0
          },
          {
            type: 'exit',
            condition: 'Take Profit 0.5% OR Stop Loss -0.3%',
            action: 'SELL',
            weight: 1.0
          }
        ],
        riskLevel: 'low',
        timeframe: '5m'
      },
      
      gridTrading: {
        name: 'Grid Trading',
        description: 'Buy/sell at predetermined price levels',
        rules: [
          {
            type: 'entry',
            condition: 'Price at Grid Level AND Trend Neutral',
            action: 'BUY/SELL',
            weight: 1.0
          },
          {
            type: 'exit',
            condition: 'Next Grid Level Reached',
            action: 'CLOSE',
            weight: 1.0
          }
        ],
        riskLevel: 'low',
        timeframe: '1h'
      }
    };
  }

  // Initialize rule components
  initializeRuleComponents() {
    return {
      indicators: {
        RSI: {
          name: 'RSI',
          type: 'oscillator',
          parameters: ['period'],
          conditions: ['>', '<', '>=', '<=', 'crossover', 'crossunder'],
          description: 'Relative Strength Index (0-100)'
        },
        MACD: {
          name: 'MACD',
          type: 'momentum',
          parameters: ['fast', 'slow', 'signal'],
          conditions: ['>', '<', 'signal_cross', 'zero_cross'],
          description: 'Moving Average Convergence Divergence'
        },
        BollingerBands: {
          name: 'Bollinger Bands',
          type: 'volatility',
          parameters: ['period', 'deviation'],
          conditions: ['touch_upper', 'touch_lower', 'squeeze', 'expansion'],
          description: 'Bollinger Bands volatility indicator'
        },
        SMA: {
          name: 'Simple Moving Average',
          type: 'trend',
          parameters: ['period'],
          conditions: ['>', '<', 'crossover', 'crossunder'],
          description: 'Simple Moving Average'
        },
        EMA: {
          name: 'Exponential Moving Average',
          type: 'trend',
          parameters: ['period'],
          conditions: ['>', '<', 'crossover', 'crossunder'],
          description: 'Exponential Moving Average'
        },
        Stochastic: {
          name: 'Stochastic',
          type: 'oscillator',
          parameters: ['k_period', 'd_period'],
          conditions: ['>', '<', 'k_cross_d', 'oversold', 'overbought'],
          description: 'Stochastic Oscillator'
        },
        Volume: {
          name: 'Volume',
          type: 'volume',
          parameters: ['period'],
          conditions: ['>', '<', 'spike', 'average'],
          description: 'Trading Volume Analysis'
        }
      },
      
      patterns: {
        candlestick: {
          name: 'Candlestick Patterns',
          options: ['doji', 'hammer', 'shooting_star', 'engulfing'],
          description: 'Japanese candlestick patterns'
        },
        chart: {
          name: 'Chart Patterns',
          options: ['double_top', 'double_bottom', 'head_shoulders', 'triangle'],
          description: 'Technical chart patterns'
        }
      },
      
      price: {
        current: {
          name: 'Current Price',
          conditions: ['>', '<', '>=', '<='],
          description: 'Current market price'
        },
        support: {
          name: 'Support Level',
          conditions: ['touch', 'break', 'hold'],
          description: 'Support resistance levels'
        },
        resistance: {
          name: 'Resistance Level',
          conditions: ['touch', 'break', 'hold'],
          description: 'Resistance levels'
        }
      },
      
      risk: {
        stopLoss: {
          name: 'Stop Loss',
          parameters: ['percentage', 'absolute'],
          description: 'Risk management stop loss'
        },
        takeProfit: {
          name: 'Take Profit',
          parameters: ['percentage', 'absolute'],
          description: 'Profit taking level'
        },
        positionSize: {
          name: 'Position Size',
          parameters: ['percentage', 'fixed'],
          description: 'Trade position sizing'
        }
      }
    };
  }

  // Create new strategy
  createStrategy(name, description) {
    const strategy = {
      id: this.generateId(),
      name: name,
      description: description,
      rules: [],
      riskManagement: {
        stopLoss: 5, // percentage
        takeProfit: 10, // percentage
        maxPositionSize: 10, // percentage of portfolio
        riskLevel: 'medium'
      },
      settings: {
        timeframe: '1h',
        minConfidence: 0.6,
        active: false
      },
      performance: {
        backtestResults: null,
        liveResults: null,
        winRate: 0,
        profitFactor: 0
      },
      created: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    
    this.strategies.push(strategy);
    this.saveData();
    
    console.log(`✅ Created strategy: ${name}`);
    return strategy;
  }

  // Create strategy from template
  createFromTemplate(templateName, customName) {
    const template = this.templates[templateName];
    if (!template) {
      throw new Error(`Template ${templateName} not found`);
    }
    
    const strategy = this.createStrategy(
      customName || template.name,
      template.description
    );
    
    strategy.rules = JSON.parse(JSON.stringify(template.rules));
    strategy.riskManagement.riskLevel = template.riskLevel;
    strategy.settings.timeframe = template.timeframe;
    
    this.saveData();
    
    console.log(`✅ Created strategy from template: ${templateName}`);
    return strategy;
  }

  // Add rule to strategy
  addRule(strategyId, rule) {
    const strategy = this.findStrategy(strategyId);
    if (!strategy) {
      throw new Error('Strategy not found');
    }
    
    if (strategy.rules.length >= this.config.maxRules) {
      throw new Error(`Maximum ${this.config.maxRules} rules allowed`);
    }
    
    const newRule = {
      id: this.generateId(),
      type: rule.type || 'entry', // entry, exit, filter
      conditions: rule.conditions || [],
      action: rule.action || 'BUY',
      weight: rule.weight || 1.0,
      enabled: true,
      created: new Date().toISOString()
    };
    
    strategy.rules.push(newRule);
    strategy.lastModified = new Date().toISOString();
    
    this.saveData();
    
    console.log(`✅ Added rule to strategy: ${strategy.name}`);
    return newRule;
  }

  // Update rule
  updateRule(strategyId, ruleId, updates) {
    const strategy = this.findStrategy(strategyId);
    if (!strategy) {
      throw new Error('Strategy not found');
    }
    
    const rule = strategy.rules.find(r => r.id === ruleId);
    if (!rule) {
      throw new Error('Rule not found');
    }
    
    Object.assign(rule, updates);
    strategy.lastModified = new Date().toISOString();
    
    this.saveData();
    
    console.log(`✅ Updated rule in strategy: ${strategy.name}`);
    return rule;
  }

  // Remove rule
  removeRule(strategyId, ruleId) {
    const strategy = this.findStrategy(strategyId);
    if (!strategy) {
      throw new Error('Strategy not found');
    }
    
    const ruleIndex = strategy.rules.findIndex(r => r.id === ruleId);
    if (ruleIndex === -1) {
      throw new Error('Rule not found');
    }
    
    strategy.rules.splice(ruleIndex, 1);
    strategy.lastModified = new Date().toISOString();
    
    this.saveData();
    
    console.log(`✅ Removed rule from strategy: ${strategy.name}`);
    return true;
  }

  // Build complex condition
  buildCondition(components) {
    /*
    Example components:
    {
      indicator: 'RSI',
      period: 14,
      condition: '>',
      value: 70,
      logicalOperator: 'AND' // AND, OR
    }
    */
    
    const condition = {
      id: this.generateId(),
      components: components,
      expression: this.generateConditionExpression(components),
      created: new Date().toISOString()
    };
    
    return condition;
  }

  // Generate condition expression
  generateConditionExpression(components) {
    if (!Array.isArray(components) || components.length === 0) {
      return '';
    }
    
    let expression = '';
    
    components.forEach((comp, index) => {
      if (index > 0 && comp.logicalOperator) {
        expression += ` ${comp.logicalOperator} `;
      }
      
      if (comp.indicator) {
        expression += `${comp.indicator}(${comp.period || ''}) ${comp.condition} ${comp.value}`;
      } else if (comp.pattern) {
        expression += `Pattern: ${comp.pattern}`;
      } else if (comp.price) {
        expression += `Price ${comp.condition} ${comp.value}`;
      }
    });
    
    return expression;
  }

  // Test strategy against historical data
  async backtestStrategy(strategyId, historicalData, options = {}) {
    const strategy = this.findStrategy(strategyId);
    if (!strategy) {
      throw new Error('Strategy not found');
    }
    
    console.log(`🔄 Backtesting strategy: ${strategy.name}`);
    
    const backtest = {
      startDate: options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: options.endDate || new Date(),
      initialCapital: options.initialCapital || 10000,
      trades: [],
      metrics: {}
    };
    
    let capital = backtest.initialCapital;
    let position = null;
    let tradeCount = 0;
    
    // Simulate trading through historical data
    for (let i = 1; i < historicalData.length; i++) {
      const currentData = historicalData[i];
      const signals = await this.evaluateStrategy(strategy, currentData);
      
      // Process signals
      if (signals.action === 'BUY' && !position && signals.confidence >= strategy.settings.minConfidence) {
        // Enter long position
        const entryPrice = currentData.close;
        const quantity = (capital * (strategy.riskManagement.maxPositionSize / 100)) / entryPrice;
        
        position = {
          type: 'LONG',
          entryPrice: entryPrice,
          quantity: quantity,
          entryTime: currentData.timestamp,
          stopLoss: entryPrice * (1 - strategy.riskManagement.stopLoss / 100),
          takeProfit: entryPrice * (1 + strategy.riskManagement.takeProfit / 100)
        };
        
        tradeCount++;
        
      } else if (signals.action === 'SELL' && position) {
        // Exit position
        const exitPrice = currentData.close;
        const pnl = (exitPrice - position.entryPrice) * position.quantity;
        capital += pnl;
        
        const trade = {
          id: tradeCount,
          type: position.type,
          entryPrice: position.entryPrice,
          exitPrice: exitPrice,
          quantity: position.quantity,
          pnl: pnl,
          pnlPercent: (pnl / (position.entryPrice * position.quantity)) * 100,
          entryTime: position.entryTime,
          exitTime: currentData.timestamp,
          duration: currentData.timestamp - position.entryTime,
          reason: signals.reason || 'Strategy signal'
        };
        
        backtest.trades.push(trade);
        position = null;
      }
      
      // Check stop loss / take profit
      if (position) {
        const currentPrice = currentData.close;
        
        if (currentPrice <= position.stopLoss || currentPrice >= position.takeProfit) {
          const exitPrice = currentPrice <= position.stopLoss ? position.stopLoss : position.takeProfit;
          const pnl = (exitPrice - position.entryPrice) * position.quantity;
          capital += pnl;
          
          const trade = {
            id: tradeCount,
            type: position.type,
            entryPrice: position.entryPrice,
            exitPrice: exitPrice,
            quantity: position.quantity,
            pnl: pnl,
            pnlPercent: (pnl / (position.entryPrice * position.quantity)) * 100,
            entryTime: position.entryTime,
            exitTime: currentData.timestamp,
            duration: currentData.timestamp - position.entryTime,
            reason: currentPrice <= position.stopLoss ? 'Stop Loss' : 'Take Profit'
          };
          
          backtest.trades.push(trade);
          position = null;
        }
      }
    }
    
    // Calculate backtest metrics
    backtest.metrics = this.calculateBacktestMetrics(backtest, capital);
    
    // Save backtest results to strategy
    strategy.performance.backtestResults = backtest;
    strategy.performance.winRate = backtest.metrics.winRate;
    strategy.performance.profitFactor = backtest.metrics.profitFactor;
    
    this.saveData();
    
    console.log(`✅ Backtest completed: ${backtest.trades.length} trades, ${backtest.metrics.winRate.toFixed(1)}% win rate`);
    return backtest;
  }

  // Evaluate strategy against current market data
  async evaluateStrategy(strategy, marketData) {
    try {
      const signals = {
        action: 'HOLD',
        confidence: 0,
        reasons: [],
        rules: []
      };
      
      let totalWeight = 0;
      let actionScore = 0; // Positive for BUY, negative for SELL
      
      // Evaluate each rule
      for (const rule of strategy.rules) {
        if (!rule.enabled) continue;
        
        const ruleResult = await this.evaluateRule(rule, marketData);
        
        if (ruleResult.triggered) {
          totalWeight += rule.weight;
          
          if (rule.action === 'BUY') {
            actionScore += rule.weight * ruleResult.confidence;
          } else if (rule.action === 'SELL') {
            actionScore -= rule.weight * ruleResult.confidence;
          }
          
          signals.reasons.push(ruleResult.reason);
          signals.rules.push({
            rule: rule,
            result: ruleResult
          });
        }
      }
      
      // Calculate overall confidence and action
      if (totalWeight > 0) {
        signals.confidence = Math.abs(actionScore) / totalWeight;
        
        if (actionScore > 0 && signals.confidence >= strategy.settings.minConfidence) {
          signals.action = 'BUY';
        } else if (actionScore < 0 && signals.confidence >= strategy.settings.minConfidence) {
          signals.action = 'SELL';
        }
      }
      
      return signals;
      
    } catch (error) {
      console.error('Error evaluating strategy:', error);
      return {
        action: 'HOLD',
        confidence: 0,
        error: error.message
      };
    }
  }

  // Evaluate individual rule
  async evaluateRule(rule, marketData) {
    const result = {
      triggered: false,
      confidence: 0,
      reason: ''
    };
    
    try {
      // Simplified rule evaluation
      // In a real implementation, this would parse and evaluate complex conditions
      
      if (rule.conditions && rule.conditions.length > 0) {
        let conditionsMet = 0;
        const totalConditions = rule.conditions.length;
        
        for (const condition of rule.conditions) {
          if (await this.evaluateCondition(condition, marketData)) {
            conditionsMet++;
          }
        }
        
        if (conditionsMet === totalConditions) {
          result.triggered = true;
          result.confidence = 0.8; // Base confidence
          result.reason = `Rule triggered: ${rule.type} conditions met`;
        }
      }
      
    } catch (error) {
      console.error('Error evaluating rule:', error);
    }
    
    return result;
  }

  // Evaluate individual condition
  async evaluateCondition(condition, marketData) {
    // Simplified condition evaluation
    // This would need to be expanded for complex indicator calculations
    
    try {
      if (condition.indicator === 'RSI') {
        // Mock RSI evaluation
        const rsi = 50; // Would calculate actual RSI
        return this.evaluateComparison(rsi, condition.condition, condition.value);
      }
      
      if (condition.indicator === 'MACD') {
        // Mock MACD evaluation
        const macd = 0; // Would calculate actual MACD
        return this.evaluateComparison(macd, condition.condition, condition.value);
      }
      
      if (condition.price) {
        return this.evaluateComparison(marketData.close, condition.condition, condition.value);
      }
      
      return false;
      
    } catch (error) {
      console.error('Error evaluating condition:', error);
      return false;
    }
  }

  // Evaluate comparison
  evaluateComparison(value1, operator, value2) {
    switch (operator) {
      case '>': return value1 > value2;
      case '<': return value1 < value2;
      case '>=': return value1 >= value2;
      case '<=': return value1 <= value2;
      case '==': return value1 === value2;
      case '!=': return value1 !== value2;
      default: return false;
    }
  }

  // Calculate backtest metrics
  calculateBacktestMetrics(backtest, finalCapital) {
    const trades = backtest.trades;
    
    if (trades.length === 0) {
      return {
        totalTrades: 0,
        winRate: 0,
        profitFactor: 0,
        totalReturn: 0,
        maxDrawdown: 0,
        sharpeRatio: 0
      };
    }
    
    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl < 0);
    
    const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
    const grossProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
    
    return {
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: (winningTrades.length / trades.length) * 100,
      profitFactor: grossLoss > 0 ? grossProfit / grossLoss : 0,
      totalReturn: ((finalCapital - backtest.initialCapital) / backtest.initialCapital) * 100,
      grossProfit: grossProfit,
      grossLoss: grossLoss,
      averageWin: winningTrades.length > 0 ? grossProfit / winningTrades.length : 0,
      averageLoss: losingTrades.length > 0 ? grossLoss / losingTrades.length : 0,
      maxDrawdown: this.calculateMaxDrawdown(trades),
      sharpeRatio: this.calculateSharpeRatio(trades)
    };
  }

  calculateMaxDrawdown(trades) {
    let peak = 0;
    let maxDrawdown = 0;
    let runningPnl = 0;
    
    for (const trade of trades) {
      runningPnl += trade.pnl;
      
      if (runningPnl > peak) {
        peak = runningPnl;
      }
      
      const drawdown = peak - runningPnl;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
    
    return maxDrawdown;
  }

  calculateSharpeRatio(trades) {
    if (trades.length < 2) return 0;
    
    const returns = trades.map(t => t.pnlPercent);
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    return stdDev > 0 ? mean / stdDev : 0;
  }

  // Strategy management
  findStrategy(strategyId) {
    return this.strategies.find(s => s.id === strategyId);
  }

  getAllStrategies() {
    return this.strategies;
  }

  getActiveStrategies() {
    return this.strategies.filter(s => s.settings.active);
  }

  activateStrategy(strategyId) {
    const strategy = this.findStrategy(strategyId);
    if (strategy) {
      strategy.settings.active = true;
      strategy.lastModified = new Date().toISOString();
      this.saveData();
      console.log(`✅ Activated strategy: ${strategy.name}`);
    }
  }

  deactivateStrategy(strategyId) {
    const strategy = this.findStrategy(strategyId);
    if (strategy) {
      strategy.settings.active = false;
      strategy.lastModified = new Date().toISOString();
      this.saveData();
      console.log(`✅ Deactivated strategy: ${strategy.name}`);
    }
  }

  deleteStrategy(strategyId) {
    const index = this.strategies.findIndex(s => s.id === strategyId);
    if (index !== -1) {
      const strategy = this.strategies[index];
      this.strategies.splice(index, 1);
      this.saveData();
      console.log(`✅ Deleted strategy: ${strategy.name}`);
      return true;
    }
    return false;
  }

  // Export/Import strategies
  exportStrategy(strategyId) {
    const strategy = this.findStrategy(strategyId);
    if (!strategy) {
      throw new Error('Strategy not found');
    }
    
    const exportData = {
      ...strategy,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  importStrategy(strategyData) {
    try {
      const strategy = typeof strategyData === 'string' ? JSON.parse(strategyData) : strategyData;
      
      // Generate new ID and update timestamps
      strategy.id = this.generateId();
      strategy.created = new Date().toISOString();
      strategy.lastModified = new Date().toISOString();
      strategy.settings.active = false; // Start inactive
      
      this.strategies.push(strategy);
      this.saveData();
      
      console.log(`✅ Imported strategy: ${strategy.name}`);
      return strategy;
      
    } catch (error) {
      throw new Error('Invalid strategy data: ' + error.message);
    }
  }

  // Utility functions
  generateId() {
    return 'STRAT_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  }

  // Get strategy performance summary
  getPerformanceSummary() {
    const summary = {
      totalStrategies: this.strategies.length,
      activeStrategies: this.getActiveStrategies().length,
      backtested: this.strategies.filter(s => s.performance.backtestResults).length,
      avgWinRate: 0,
      avgProfitFactor: 0,
      bestStrategy: null,
      worstStrategy: null
    };
    
    const backtested = this.strategies.filter(s => s.performance.backtestResults);
    
    if (backtested.length > 0) {
      summary.avgWinRate = backtested.reduce((sum, s) => sum + s.performance.winRate, 0) / backtested.length;
      summary.avgProfitFactor = backtested.reduce((sum, s) => sum + s.performance.profitFactor, 0) / backtested.length;
      
      summary.bestStrategy = backtested.reduce((best, current) => 
        current.performance.profitFactor > (best?.performance.profitFactor || 0) ? current : best, null);
      
      summary.worstStrategy = backtested.reduce((worst, current) => 
        current.performance.profitFactor < (worst?.performance.profitFactor || Infinity) ? current : worst, null);
    }
    
    return summary;
  }

  // Get available templates
  getTemplates() {
    return Object.entries(this.templates).map(([key, template]) => ({
      id: key,
      ...template
    }));
  }

  // Get rule components
  getRuleComponents() {
    return this.ruleComponents;
  }
}

export default StrategyBuilder;