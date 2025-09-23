/**
 * ENHANCED AI TRADING SIGNALS ENGINE V2.0
 * Advanced multi-indicator analysis with machine learning principles
 */

import EnhancedTechnicalAnalysis from './EnhancedTechnicalAnalysis.js';

export class EnhancedAITradingSignals {
  constructor() {
    this.technicalAnalysis = new EnhancedTechnicalAnalysis();
    this.signalHistory = [];
    this.maxHistoryLength = 100;
    
    // Enhanced signal weights
    this.weights = {
      rsi: 0.15,           // RSI importance
      macd: 0.15,          // MACD importance  
      bollinger: 0.20,     // Bollinger Bands (high weight for volatility)
      stochastic: 0.10,    // Stochastic oscillator
      williamsR: 0.05,     // Williams %R
      cci: 0.05,           // Commodity Channel Index
      maCrossover: 0.15,   // Moving average crossover
      sentiment: 0.10,     // Market sentiment
      atr: 0.05           // Average True Range (volatility)
    };

    // Risk management parameters
    this.riskParams = {
      maxRiskPerTrade: 0.02,     // 2% max risk per trade
      stopLossMultiplier: 2,      // 2x ATR for stop loss
      takeProfitRatio: 2,         // 2:1 reward:risk ratio
      maxDrawdown: 0.10,          // 10% max portfolio drawdown
      positionSizeMethod: 'kelly'  // Kelly criterion for position sizing
    };
  }

  // Main analysis function with live Binance data
  async generateEnhancedSignal(symbol = 'BTCUSDT', interval = '1h', limit = 100) {
    try {
      console.log(`🧠 Enhanced AI analyzing ${symbol}...`);
      
      // Fetch live data from Binance
      const marketData = await this.fetchBinanceData(symbol, interval, limit);
      if (!marketData) {
        throw new Error('Failed to fetch market data');
      }

      // Get current price
      const currentPrice = await this.getCurrentPrice(symbol);
      
      // Perform comprehensive technical analysis
      const analysis = this.technicalAnalysis.analyzeMarket(
        marketData.highs,
        marketData.lows, 
        marketData.closes,
        marketData.volumes
      );

      if (!analysis) {
        throw new Error('Technical analysis failed');
      }

      // Generate enhanced signal
      const signal = this.calculateEnhancedSignal(analysis);
      
      // Calculate position sizing and risk management
      const riskManagement = this.calculateRiskManagement(analysis, currentPrice);
      
      // Calculate confidence score
      const confidence = this.calculateAdvancedConfidence(analysis, signal);
      
      // Generate trading recommendation
      const recommendation = this.generateTradingRecommendation(signal, analysis, riskManagement);

      const result = {
        symbol: symbol.replace('USDT', ''),
        timestamp: new Date().toISOString(),
        currentPrice: currentPrice,
        signal: signal.action,
        confidence: Math.round(confidence),
        strength: signal.strength,
        
        // Technical indicators
        indicators: {
          rsi: analysis.rsi?.current || null,
          macd: analysis.macd?.current || null,
          bollinger: analysis.bollinger ? {
            position: this.getBollingerPosition(analysis.bollinger),
            squeeze: analysis.bollinger[analysis.bollinger.length - 1]?.squeeze || false
          } : null,
          stochastic: analysis.stochastic?.current || null,
          sentiment: analysis.sentiment?.overall || 'NEUTRAL'
        },
        
        // Risk management
        riskManagement: riskManagement,
        
        // Trading recommendation
        recommendation: recommendation,
        
        // Analysis details
        analysis: {
          bullishFactors: signal.bullishFactors,
          bearishFactors: signal.bearishFactors,
          neutralFactors: signal.neutralFactors,
          marketCondition: this.assessMarketCondition(analysis)
        }
      };

      // Store in history for learning
      this.addToHistory(result);
      
      console.log(`✅ Enhanced AI Signal: ${signal.action} (${confidence}% confidence)`);
      return result;

    } catch (error) {
      console.error('❌ Enhanced AI Error:', error);
      return this.generateErrorResponse(symbol, error.message);
    }
  }

  // Fetch live data from Binance API
  async fetchBinanceData(symbol, interval, limit) {
    try {
      // Fetch klines data
      const response = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      const highs = data.map(kline => parseFloat(kline[2]));
      const lows = data.map(kline => parseFloat(kline[3]));
      const closes = data.map(kline => parseFloat(kline[4]));
      const volumes = data.map(kline => parseFloat(kline[5]));
      
      return { highs, lows, closes, volumes };
      
    } catch (error) {
      console.error('Error fetching Binance data:', error);
      return null;
    }
  }

  // Get current price
  async getCurrentPrice(symbol) {
    try {
      const response = await fetch(
        `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`
      );
      const data = await response.json();
      return parseFloat(data.price);
    } catch (error) {
      console.error('Error fetching current price:', error);
      return null;
    }
  }

  // Calculate enhanced signal using multiple indicators
  calculateEnhancedSignal(analysis) {
    let bullishScore = 0;
    let bearishScore = 0;
    let bullishFactors = [];
    let bearishFactors = [];
    let neutralFactors = [];

    // RSI Analysis
    if (analysis.rsi) {
      const rsi = analysis.rsi.current;
      if (rsi < 30) {
        bullishScore += this.weights.rsi * 100;
        bullishFactors.push(`RSI Oversold (${rsi.toFixed(1)})`);
      } else if (rsi > 70) {
        bearishScore += this.weights.rsi * 100;
        bearishFactors.push(`RSI Overbought (${rsi.toFixed(1)})`);
      } else {
        neutralFactors.push(`RSI Neutral (${rsi.toFixed(1)})`);
      }
    }

    // MACD Analysis
    if (analysis.macd) {
      const macd = analysis.macd.current;
      if (macd.histogram > 0 && macd.macd > macd.signal) {
        bullishScore += this.weights.macd * 100;
        bullishFactors.push('MACD Bullish Crossover');
      } else if (macd.histogram < 0 && macd.macd < macd.signal) {
        bearishScore += this.weights.macd * 100;
        bearishFactors.push('MACD Bearish Crossover');
      } else {
        neutralFactors.push('MACD Neutral');
      }
    }

    // Bollinger Bands Analysis
    if (analysis.bollinger) {
      const latest = analysis.bollinger[analysis.bollinger.length - 1];
      if (latest.price < latest.lower) {
        bullishScore += this.weights.bollinger * 100;
        bullishFactors.push('Price Below Lower Bollinger Band');
      } else if (latest.price > latest.upper) {
        bearishScore += this.weights.bollinger * 100;
        bearishFactors.push('Price Above Upper Bollinger Band');
      } else {
        neutralFactors.push('Price Within Bollinger Bands');
      }
      
      if (latest.squeeze) {
        neutralFactors.push('Bollinger Squeeze (Low Volatility)');
      }
    }

    // Stochastic Analysis
    if (analysis.stochastic) {
      const stoch = analysis.stochastic.current;
      if (stoch.k < 20 && stoch.d < 20) {
        bullishScore += this.weights.stochastic * 100;
        bullishFactors.push(`Stochastic Oversold (${stoch.k.toFixed(1)})`);
      } else if (stoch.k > 80 && stoch.d > 80) {
        bearishScore += this.weights.stochastic * 100;
        bearishFactors.push(`Stochastic Overbought (${stoch.k.toFixed(1)})`);
      } else {
        neutralFactors.push(`Stochastic Neutral (${stoch.k.toFixed(1)})`);
      }
    }

    // Moving Average Crossover
    if (analysis.maCrossover) {
      const crossover = analysis.maCrossover.current;
      if (crossover.signal === 'BUY') {
        bullishScore += this.weights.maCrossover * 100;
        bullishFactors.push('Golden Cross (MA Bullish)');
      } else if (crossover.signal === 'SELL') {
        bearishScore += this.weights.maCrossover * 100;
        bearishFactors.push('Death Cross (MA Bearish)');
      } else {
        neutralFactors.push('Moving Averages Neutral');
      }
    }

    // Market Sentiment
    if (analysis.sentiment) {
      if (analysis.sentiment.overall === 'BULLISH') {
        bullishScore += this.weights.sentiment * 100;
        bullishFactors.push(`Market Sentiment Bullish (${analysis.sentiment.bullish.toFixed(1)}%)`);
      } else if (analysis.sentiment.overall === 'BEARISH') {
        bearishScore += this.weights.sentiment * 100;
        bearishFactors.push(`Market Sentiment Bearish (${analysis.sentiment.bearish.toFixed(1)}%)`);
      } else {
        neutralFactors.push('Market Sentiment Neutral');
      }
    }

    // Determine final signal
    const scoreDifference = Math.abs(bullishScore - bearishScore);
    const threshold = 15; // Minimum score difference for strong signal
    
    let action = 'HOLD';
    let strength = 'WEAK';
    
    if (bullishScore > bearishScore && scoreDifference > threshold) {
      action = 'BUY';
      strength = scoreDifference > 30 ? 'STRONG' : 'MODERATE';
    } else if (bearishScore > bullishScore && scoreDifference > threshold) {
      action = 'SELL';
      strength = scoreDifference > 30 ? 'STRONG' : 'MODERATE';
    }

    return {
      action,
      strength,
      bullishScore: Math.round(bullishScore),
      bearishScore: Math.round(bearishScore),
      bullishFactors,
      bearishFactors,
      neutralFactors
    };
  }

  // Calculate advanced confidence score
  calculateAdvancedConfidence(analysis, signal) {
    let confidence = 50; // Base confidence
    
    // Factor 1: Signal strength
    if (signal.strength === 'STRONG') confidence += 25;
    else if (signal.strength === 'MODERATE') confidence += 15;
    
    // Factor 2: Number of confirming indicators
    const totalFactors = signal.bullishFactors.length + signal.bearishFactors.length;
    if (totalFactors >= 4) confidence += 10;
    else if (totalFactors >= 2) confidence += 5;
    
    // Factor 3: Signal consensus
    const consensusScore = Math.abs(signal.bullishScore - signal.bearishScore);
    confidence += Math.min(15, consensusScore / 5);
    
    // Factor 4: Market volatility (ATR based)
    if (analysis.atr) {
      const atrValues = analysis.atr;
      const latestATR = atrValues[atrValues.length - 1];
      const avgATR = atrValues.slice(-10).reduce((a, b) => a + b, 0) / 10;
      
      if (latestATR > avgATR * 1.5) {
        confidence -= 10; // High volatility reduces confidence
      } else if (latestATR < avgATR * 0.5) {
        confidence += 5; // Low volatility increases confidence
      }
    }
    
    return Math.max(0, Math.min(100, confidence));
  }

  // Calculate risk management parameters
  calculateRiskManagement(analysis, currentPrice) {
    const atr = analysis.atr ? analysis.atr[analysis.atr.length - 1] : currentPrice * 0.02;
    
    return {
      stopLoss: {
        buy: currentPrice - (atr * this.riskParams.stopLossMultiplier),
        sell: currentPrice + (atr * this.riskParams.stopLossMultiplier)
      },
      takeProfit: {
        buy: currentPrice + (atr * this.riskParams.stopLossMultiplier * this.riskParams.takeProfitRatio),
        sell: currentPrice - (atr * this.riskParams.stopLossMultiplier * this.riskParams.takeProfitRatio)
      },
      positionSize: this.calculatePositionSize(atr, currentPrice),
      riskRewardRatio: this.riskParams.takeProfitRatio,
      maxRisk: this.riskParams.maxRiskPerTrade * 100 + '%'
    };
  }

  // Calculate position size using Kelly Criterion
  calculatePositionSize(atr, currentPrice) {
    const riskAmount = currentPrice * this.riskParams.maxRiskPerTrade;
    const stopLossDistance = atr * this.riskParams.stopLossMultiplier;
    
    // Kelly fraction simplified (assuming 60% win rate, 2:1 reward:risk)
    const winRate = 0.60;
    const avgWin = stopLossDistance * this.riskParams.takeProfitRatio;
    const avgLoss = stopLossDistance;
    const kellyFraction = (winRate * avgWin - (1 - winRate) * avgLoss) / avgWin;
    
    return {
      recommended: Math.max(0.01, Math.min(0.05, kellyFraction)),
      conservative: 0.01,
      aggressive: 0.03,
      explanation: `Based on Kelly Criterion with ${winRate * 100}% estimated win rate`
    };
  }

  // Generate trading recommendation
  generateTradingRecommendation(signal, analysis, riskManagement) {
    const recommendations = [];
    
    if (signal.action === 'BUY') {
      recommendations.push('🟢 BUY Signal Generated');
      recommendations.push(`Entry: ${riskManagement.stopLoss.buy > 0 ? 'Near current price' : 'Wait for dip'}`);
      recommendations.push(`Stop Loss: $${riskManagement.stopLoss.buy.toFixed(2)}`);
      recommendations.push(`Take Profit: $${riskManagement.takeProfit.buy.toFixed(2)}`);
    } else if (signal.action === 'SELL') {
      recommendations.push('🔴 SELL Signal Generated');
      recommendations.push(`Entry: ${riskManagement.stopLoss.sell > 0 ? 'Near current price' : 'Wait for bounce'}`);
      recommendations.push(`Stop Loss: $${riskManagement.stopLoss.sell.toFixed(2)}`);
      recommendations.push(`Take Profit: $${riskManagement.takeProfit.sell.toFixed(2)}`);
    } else {
      recommendations.push('🟡 HOLD - Wait for clearer signal');
      recommendations.push('Monitor key support/resistance levels');
    }
    
    recommendations.push(`Position Size: ${(riskManagement.positionSize.recommended * 100).toFixed(1)}% of portfolio`);
    recommendations.push(`Max Risk: ${riskManagement.maxRisk}`);
    
    return recommendations;
  }

  // Helper functions
  getBollingerPosition(bollinger) {
    const latest = bollinger[bollinger.length - 1];
    const bandPosition = (latest.price - latest.lower) / (latest.upper - latest.lower);
    
    if (bandPosition < 0.2) return 'LOWER';
    if (bandPosition > 0.8) return 'UPPER';
    return 'MIDDLE';
  }

  assessMarketCondition(analysis) {
    let volatility = 'NORMAL';
    let trend = 'SIDEWAYS';
    
    // Assess volatility using Bollinger Bands
    if (analysis.bollinger) {
      const latest = analysis.bollinger[analysis.bollinger.length - 1];
      const bandWidth = (latest.upper - latest.lower) / latest.middle;
      
      if (bandWidth > 0.04) volatility = 'HIGH';
      else if (bandWidth < 0.02) volatility = 'LOW';
    }
    
    // Assess trend using moving averages
    if (analysis.maCrossover) {
      const latest = analysis.maCrossover.current;
      if (latest.fast > latest.slow * 1.02) trend = 'UPTREND';
      else if (latest.fast < latest.slow * 0.98) trend = 'DOWNTREND';
    }
    
    return { volatility, trend };
  }

  addToHistory(signal) {
    this.signalHistory.push({
      timestamp: signal.timestamp,
      signal: signal.signal,
      confidence: signal.confidence,
      price: signal.currentPrice
    });
    
    if (this.signalHistory.length > this.maxHistoryLength) {
      this.signalHistory.shift();
    }
  }

  generateErrorResponse(symbol, error) {
    return {
      symbol: symbol.replace('USDT', ''),
      timestamp: new Date().toISOString(),
      signal: 'ERROR',
      confidence: 0,
      error: error,
      recommendation: ['❌ Unable to generate signal', 'Please try again later']
    };
  }
}

export default EnhancedAITradingSignals;