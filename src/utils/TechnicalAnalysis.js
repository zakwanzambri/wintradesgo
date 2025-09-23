/**
 * REAL TECHNICAL ANALYSIS ENGINE
 * Calculates actual trading indicators: RSI, MACD, Bollinger Bands, SMA, EMA
 * Uses real market data for genuine trading signals
 */

export class TechnicalAnalysis {
  constructor() {
    this.cache = new Map();
    this.lastUpdate = null;
  }

  // Calculate Simple Moving Average
  calculateSMA(prices, period) {
    if (prices.length < period) return null;
    const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
  }

  // Calculate Exponential Moving Average
  calculateEMA(prices, period) {
    if (prices.length < period) return null;
    
    const multiplier = 2 / (period + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  }

  // Calculate RSI (Relative Strength Index)
  calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return null;

    let gains = 0;
    let losses = 0;

    // Calculate initial average gain and loss
    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) {
        gains += change;
      } else {
        losses -= change;
      }
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    // Calculate RSI for remaining periods
    for (let i = period + 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) {
        avgGain = (avgGain * (period - 1) + change) / period;
        avgLoss = (avgLoss * (period - 1)) / period;
      } else {
        avgGain = (avgGain * (period - 1)) / period;
        avgLoss = (avgLoss * (period - 1) - change) / period;
      }
    }

    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  // Calculate MACD (Moving Average Convergence Divergence)
  calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    if (prices.length < slowPeriod) return null;

    const emaFast = this.calculateEMA(prices, fastPeriod);
    const emaSlow = this.calculateEMA(prices, slowPeriod);
    
    if (!emaFast || !emaSlow) return null;

    const macdLine = emaFast - emaSlow;
    
    // Calculate signal line (EMA of MACD)
    const macdHistory = [];
    for (let i = slowPeriod - 1; i < prices.length; i++) {
      const subPrices = prices.slice(0, i + 1);
      const fast = this.calculateEMA(subPrices, fastPeriod);
      const slow = this.calculateEMA(subPrices, slowPeriod);
      if (fast && slow) {
        macdHistory.push(fast - slow);
      }
    }

    const signalLine = this.calculateEMA(macdHistory, signalPeriod);
    const histogram = macdLine - (signalLine || 0);

    return {
      macd: macdLine,
      signal: signalLine,
      histogram: histogram
    };
  }

  // Calculate Bollinger Bands
  calculateBollingerBands(prices, period = 20, standardDeviations = 2) {
    if (prices.length < period) return null;

    const sma = this.calculateSMA(prices, period);
    if (!sma) return null;

    // Calculate standard deviation
    const recentPrices = prices.slice(-period);
    const variance = recentPrices.reduce((sum, price) => {
      return sum + Math.pow(price - sma, 2);
    }, 0) / period;
    
    const stdDev = Math.sqrt(variance);

    return {
      upper: sma + (stdDev * standardDeviations),
      middle: sma,
      lower: sma - (stdDev * standardDeviations),
      bandwidth: (stdDev * standardDeviations * 2) / sma * 100
    };
  }

  // Calculate Stochastic Oscillator
  calculateStochastic(highs, lows, closes, kPeriod = 14, dPeriod = 3) {
    if (closes.length < kPeriod) return null;

    const recentHighs = highs.slice(-kPeriod);
    const recentLows = lows.slice(-kPeriod);
    const currentClose = closes[closes.length - 1];

    const highestHigh = Math.max(...recentHighs);
    const lowestLow = Math.min(...recentLows);

    const kPercent = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;

    // Calculate %D (SMA of %K)
    const kValues = [];
    for (let i = kPeriod - 1; i < closes.length; i++) {
      const periodHighs = highs.slice(i - kPeriod + 1, i + 1);
      const periodLows = lows.slice(i - kPeriod + 1, i + 1);
      const periodClose = closes[i];
      
      const maxHigh = Math.max(...periodHighs);
      const minLow = Math.min(...periodLows);
      
      kValues.push(((periodClose - minLow) / (maxHigh - minLow)) * 100);
    }

    const dPercent = this.calculateSMA(kValues, dPeriod);

    return {
      k: kPercent,
      d: dPercent
    };
  }

  // Generate trading signal based on multiple indicators
  generateSignal(indicators, currentPrice) {
    const signals = [];
    let bullishScore = 0;
    let bearishScore = 0;

    // RSI Analysis
    if (indicators.rsi) {
      if (indicators.rsi < 30) {
        signals.push({ type: 'RSI', signal: 'BUY', strength: 'STRONG', reason: 'Oversold condition' });
        bullishScore += 3;
      } else if (indicators.rsi > 70) {
        signals.push({ type: 'RSI', signal: 'SELL', strength: 'STRONG', reason: 'Overbought condition' });
        bearishScore += 3;
      } else if (indicators.rsi < 40) {
        signals.push({ type: 'RSI', signal: 'BUY', strength: 'MEDIUM', reason: 'Approaching oversold' });
        bullishScore += 1;
      } else if (indicators.rsi > 60) {
        signals.push({ type: 'RSI', signal: 'SELL', strength: 'MEDIUM', reason: 'Approaching overbought' });
        bearishScore += 1;
      }
    }

    // MACD Analysis
    if (indicators.macd) {
      if (indicators.macd.macd > indicators.macd.signal && indicators.macd.histogram > 0) {
        signals.push({ type: 'MACD', signal: 'BUY', strength: 'MEDIUM', reason: 'Bullish crossover' });
        bullishScore += 2;
      } else if (indicators.macd.macd < indicators.macd.signal && indicators.macd.histogram < 0) {
        signals.push({ type: 'MACD', signal: 'SELL', strength: 'MEDIUM', reason: 'Bearish crossover' });
        bearishScore += 2;
      }
    }

    // Bollinger Bands Analysis
    if (indicators.bollinger) {
      if (currentPrice <= indicators.bollinger.lower) {
        signals.push({ type: 'BB', signal: 'BUY', strength: 'STRONG', reason: 'Price at lower band' });
        bullishScore += 3;
      } else if (currentPrice >= indicators.bollinger.upper) {
        signals.push({ type: 'BB', signal: 'SELL', strength: 'STRONG', reason: 'Price at upper band' });
        bearishScore += 3;
      }
    }

    // Moving Average Analysis
    if (indicators.sma20 && indicators.sma50) {
      if (indicators.sma20 > indicators.sma50 && currentPrice > indicators.sma20) {
        signals.push({ type: 'SMA', signal: 'BUY', strength: 'MEDIUM', reason: 'Price above rising SMA' });
        bullishScore += 2;
      } else if (indicators.sma20 < indicators.sma50 && currentPrice < indicators.sma20) {
        signals.push({ type: 'SMA', signal: 'SELL', strength: 'MEDIUM', reason: 'Price below falling SMA' });
        bearishScore += 2;
      }
    }

    // Stochastic Analysis
    if (indicators.stochastic) {
      if (indicators.stochastic.k < 20 && indicators.stochastic.d < 20) {
        signals.push({ type: 'STOCH', signal: 'BUY', strength: 'MEDIUM', reason: 'Oversold stochastic' });
        bullishScore += 2;
      } else if (indicators.stochastic.k > 80 && indicators.stochastic.d > 80) {
        signals.push({ type: 'STOCH', signal: 'SELL', strength: 'MEDIUM', reason: 'Overbought stochastic' });
        bearishScore += 2;
      }
    }

    // Determine overall signal
    const totalScore = bullishScore + bearishScore;
    const confidence = Math.min(Math.max((Math.abs(bullishScore - bearishScore) / totalScore) * 100, 50), 95);

    let overallSignal = 'HOLD';
    let signalStrength = 'WEAK';

    if (bullishScore > bearishScore + 2) {
      overallSignal = 'BUY';
      signalStrength = bullishScore >= 6 ? 'STRONG' : 'MEDIUM';
    } else if (bearishScore > bullishScore + 2) {
      overallSignal = 'SELL';
      signalStrength = bearishScore >= 6 ? 'STRONG' : 'MEDIUM';
    }

    return {
      signal: overallSignal,
      confidence: Math.round(confidence),
      strength: signalStrength,
      bullishScore,
      bearishScore,
      indicators: signals,
      timestamp: new Date().toISOString()
    };
  }

  // Main analysis function
  async analyzeSymbol(symbol, prices, highs = null, lows = null, closes = null) {
    try {
      // Use closes as default if not provided
      if (!closes) closes = prices;
      if (!highs) highs = prices;
      if (!lows) lows = prices;

      const indicators = {
        rsi: this.calculateRSI(closes),
        macd: this.calculateMACD(closes),
        bollinger: this.calculateBollingerBands(closes),
        sma20: this.calculateSMA(closes, 20),
        sma50: this.calculateSMA(closes, 50),
        ema12: this.calculateEMA(closes, 12),
        ema26: this.calculateEMA(closes, 26),
        stochastic: this.calculateStochastic(highs, lows, closes)
      };

      const currentPrice = closes[closes.length - 1];
      const signal = this.generateSignal(indicators, currentPrice);

      return {
        symbol,
        currentPrice,
        indicators,
        signal,
        analysis: {
          trend: this.determineTrend(indicators),
          support: indicators.bollinger?.lower || indicators.sma20,
          resistance: indicators.bollinger?.upper || indicators.sma50,
          momentum: this.analyzeMomentum(indicators)
        }
      };
    } catch (error) {
      console.error(`❌ Error analyzing ${symbol}:`, error);
      return null;
    }
  }

  determineTrend(indicators) {
    if (indicators.sma20 && indicators.sma50) {
      if (indicators.sma20 > indicators.sma50) {
        return indicators.ema12 > indicators.ema26 ? 'STRONG_BULLISH' : 'BULLISH';
      } else {
        return indicators.ema12 < indicators.ema26 ? 'STRONG_BEARISH' : 'BEARISH';
      }
    }
    return 'NEUTRAL';
  }

  analyzeMomentum(indicators) {
    if (indicators.rsi && indicators.macd) {
      if (indicators.rsi > 60 && indicators.macd.histogram > 0) {
        return 'STRONG_BULLISH';
      } else if (indicators.rsi < 40 && indicators.macd.histogram < 0) {
        return 'STRONG_BEARISH';
      } else if (indicators.rsi > 50 || indicators.macd.histogram > 0) {
        return 'BULLISH';
      } else if (indicators.rsi < 50 || indicators.macd.histogram < 0) {
        return 'BEARISH';
      }
    }
    return 'NEUTRAL';
  }
}

export default TechnicalAnalysis;