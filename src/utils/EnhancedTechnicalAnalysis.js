/**
 * ENHANCED TECHNICAL ANALYSIS
 * Advanced indicators for improved trading signals
 */

export class EnhancedTechnicalAnalysis {
  
  // Bollinger Bands calculation
  calculateBollingerBands(prices, period = 20, stdDevMultiplier = 2) {
    if (prices.length < period) return null;
    
    const sma = this.calculateSMA(prices, period);
    if (!sma) return null;
    
    const bands = [];
    
    for (let i = period - 1; i < prices.length; i++) {
      const slice = prices.slice(i - period + 1, i + 1);
      const mean = slice.reduce((sum, price) => sum + price, 0) / period;
      
      // Calculate standard deviation
      const variance = slice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
      const stdDev = Math.sqrt(variance);
      
      bands.push({
        upper: mean + (stdDev * stdDevMultiplier),
        middle: mean,
        lower: mean - (stdDev * stdDevMultiplier),
        price: prices[i],
        squeeze: (stdDev / mean) < 0.1 // Volatility squeeze indicator
      });
    }
    
    return bands;
  }

  // Stochastic Oscillator
  calculateStochastic(highs, lows, closes, kPeriod = 14, dPeriod = 3) {
    if (closes.length < kPeriod) return null;
    
    const stochasticValues = [];
    
    for (let i = kPeriod - 1; i < closes.length; i++) {
      const highSlice = highs.slice(i - kPeriod + 1, i + 1);
      const lowSlice = lows.slice(i - kPeriod + 1, i + 1);
      
      const highest = Math.max(...highSlice);
      const lowest = Math.min(...lowSlice);
      const currentClose = closes[i];
      
      const kPercent = ((currentClose - lowest) / (highest - lowest)) * 100;
      stochasticValues.push(kPercent);
    }
    
    // Calculate %D (3-period SMA of %K)
    const dValues = [];
    for (let i = dPeriod - 1; i < stochasticValues.length; i++) {
      const slice = stochasticValues.slice(i - dPeriod + 1, i + 1);
      const dValue = slice.reduce((sum, val) => sum + val, 0) / dPeriod;
      dValues.push(dValue);
    }
    
    return {
      k: stochasticValues,
      d: dValues,
      current: {
        k: stochasticValues[stochasticValues.length - 1],
        d: dValues[dValues.length - 1]
      }
    };
  }

  // Williams %R
  calculateWilliamsR(highs, lows, closes, period = 14) {
    if (closes.length < period) return null;
    
    const williamsR = [];
    
    for (let i = period - 1; i < closes.length; i++) {
      const highSlice = highs.slice(i - period + 1, i + 1);
      const lowSlice = lows.slice(i - period + 1, i + 1);
      
      const highest = Math.max(...highSlice);
      const lowest = Math.min(...lowSlice);
      const currentClose = closes[i];
      
      const wr = ((highest - currentClose) / (highest - lowest)) * -100;
      williamsR.push(wr);
    }
    
    return williamsR;
  }

  // Commodity Channel Index (CCI)
  calculateCCI(highs, lows, closes, period = 20) {
    if (closes.length < period) return null;
    
    const cci = [];
    const constant = 0.015;
    
    // Calculate typical prices
    const typicalPrices = [];
    for (let i = 0; i < closes.length; i++) {
      typicalPrices.push((highs[i] + lows[i] + closes[i]) / 3);
    }
    
    for (let i = period - 1; i < typicalPrices.length; i++) {
      const slice = typicalPrices.slice(i - period + 1, i + 1);
      const sma = slice.reduce((sum, val) => sum + val, 0) / period;
      
      // Mean deviation
      const meanDeviation = slice.reduce((sum, val) => sum + Math.abs(val - sma), 0) / period;
      
      const currentTypical = typicalPrices[i];
      const cciValue = (currentTypical - sma) / (constant * meanDeviation);
      
      cci.push(cciValue);
    }
    
    return cci;
  }

  // Average True Range (ATR)
  calculateATR(highs, lows, closes, period = 14) {
    if (closes.length < 2) return null;
    
    const trueRanges = [];
    
    // Calculate True Range for each period
    for (let i = 1; i < closes.length; i++) {
      const high = highs[i];
      const low = lows[i];
      const prevClose = closes[i - 1];
      
      const tr1 = high - low;
      const tr2 = Math.abs(high - prevClose);
      const tr3 = Math.abs(low - prevClose);
      
      trueRanges.push(Math.max(tr1, tr2, tr3));
    }
    
    if (trueRanges.length < period) return null;
    
    // Calculate ATR as RMA of True Range
    const atr = [];
    let sum = trueRanges.slice(0, period).reduce((a, b) => a + b, 0);
    atr.push(sum / period);
    
    for (let i = period; i < trueRanges.length; i++) {
      const prevATR = atr[atr.length - 1];
      const currentATR = (prevATR * (period - 1) + trueRanges[i]) / period;
      atr.push(currentATR);
    }
    
    return atr;
  }

  // Moving Average Convergence Divergence (Enhanced)
  calculateMACDEnhanced(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    const fastEMA = this.calculateEMA(prices, fastPeriod);
    const slowEMA = this.calculateEMA(prices, slowPeriod);
    
    if (!fastEMA || !slowEMA) return null;
    
    // Calculate MACD line
    const macdLine = [];
    const minLength = Math.min(fastEMA.length, slowEMA.length);
    
    for (let i = 0; i < minLength; i++) {
      macdLine.push(fastEMA[fastEMA.length - minLength + i] - slowEMA[slowEMA.length - minLength + i]);
    }
    
    // Calculate signal line (EMA of MACD)
    const signalLine = this.calculateEMA(macdLine, signalPeriod);
    if (!signalLine) return null;
    
    // Calculate histogram
    const histogram = [];
    const histLength = Math.min(macdLine.length, signalLine.length);
    
    for (let i = 0; i < histLength; i++) {
      histogram.push(macdLine[macdLine.length - histLength + i] - signalLine[signalLine.length - histLength + i]);
    }
    
    return {
      macd: macdLine,
      signal: signalLine,
      histogram: histogram,
      current: {
        macd: macdLine[macdLine.length - 1],
        signal: signalLine[signalLine.length - 1],
        histogram: histogram[histogram.length - 1]
      }
    };
  }

  // Relative Strength Index (Enhanced with divergence detection)
  calculateRSIEnhanced(prices, period = 14) {
    if (prices.length < period + 1) return null;
    
    let gains = [];
    let losses = [];
    
    // Calculate price changes
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    if (gains.length < period) return null;
    
    // Calculate initial averages
    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
    
    const rsiValues = [];
    
    // Calculate first RSI
    let rs = avgGain / avgLoss;
    let rsi = 100 - (100 / (1 + rs));
    rsiValues.push(rsi);
    
    // Calculate subsequent RSI values using Wilder's smoothing
    for (let i = period; i < gains.length; i++) {
      avgGain = (avgGain * (period - 1) + gains[i]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
      
      rs = avgGain / avgLoss;
      rsi = 100 - (100 / (1 + rs));
      rsiValues.push(rsi);
    }
    
    return {
      values: rsiValues,
      current: rsiValues[rsiValues.length - 1],
      overbought: rsiValues[rsiValues.length - 1] > 70,
      oversold: rsiValues[rsiValues.length - 1] < 30
    };
  }

  // Moving Average Crossover Signals
  calculateMACrossover(prices, fastPeriod = 10, slowPeriod = 20) {
    const fastMA = this.calculateSMA(prices, fastPeriod);
    const slowMA = this.calculateSMA(prices, slowPeriod);
    
    if (!fastMA || !slowMA) return null;
    
    const signals = [];
    const minLength = Math.min(fastMA.length, slowMA.length);
    
    for (let i = 1; i < minLength; i++) {
      const prevFast = fastMA[fastMA.length - minLength + i - 1];
      const prevSlow = slowMA[slowMA.length - minLength + i - 1];
      const currFast = fastMA[fastMA.length - minLength + i];
      const currSlow = slowMA[slowMA.length - minLength + i];
      
      let signal = 'HOLD';
      
      // Golden Cross (bullish)
      if (prevFast <= prevSlow && currFast > currSlow) {
        signal = 'BUY';
      }
      // Death Cross (bearish)
      else if (prevFast >= prevSlow && currFast < currSlow) {
        signal = 'SELL';
      }
      
      signals.push({
        fast: currFast,
        slow: currSlow,
        signal: signal,
        strength: Math.abs(currFast - currSlow) / currSlow * 100
      });
    }
    
    return {
      signals: signals,
      current: signals[signals.length - 1],
      fastMA: fastMA,
      slowMA: slowMA
    };
  }

  // Helper functions
  calculateSMA(prices, period) {
    if (prices.length < period) return null;
    
    const sma = [];
    for (let i = period - 1; i < prices.length; i++) {
      const slice = prices.slice(i - period + 1, i + 1);
      const average = slice.reduce((sum, price) => sum + price, 0) / period;
      sma.push(average);
    }
    return sma;
  }

  calculateEMA(prices, period) {
    if (prices.length < period) return null;
    
    const ema = [];
    const multiplier = 2 / (period + 1);
    
    // Start with SMA
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += prices[i];
    }
    ema.push(sum / period);
    
    // Calculate EMA
    for (let i = period; i < prices.length; i++) {
      const emaValue = (prices[i] * multiplier) + (ema[ema.length - 1] * (1 - multiplier));
      ema.push(emaValue);
    }
    
    return ema;
  }

  // Comprehensive analysis combining all indicators
  analyzeMarket(highs, lows, closes, volumes) {
    const analysis = {};
    
    try {
      // Basic indicators
      analysis.rsi = this.calculateRSIEnhanced(closes);
      analysis.macd = this.calculateMACDEnhanced(closes);
      analysis.bollinger = this.calculateBollingerBands(closes);
      analysis.stochastic = this.calculateStochastic(highs, lows, closes);
      analysis.williamsR = this.calculateWilliamsR(highs, lows, closes);
      analysis.cci = this.calculateCCI(highs, lows, closes);
      analysis.atr = this.calculateATR(highs, lows, closes);
      analysis.maCrossover = this.calculateMACrossover(closes);
      
      // Market sentiment
      analysis.sentiment = this.calculateMarketSentiment(analysis);
      
      // Signal strength
      analysis.signalStrength = this.calculateSignalStrength(analysis);
      
      return analysis;
      
    } catch (error) {
      console.error('Error in market analysis:', error);
      return null;
    }
  }

  calculateMarketSentiment(analysis) {
    let bullishSignals = 0;
    let bearishSignals = 0;
    let totalSignals = 0;
    
    // RSI sentiment
    if (analysis.rsi) {
      totalSignals++;
      if (analysis.rsi.current < 30) bullishSignals++;
      else if (analysis.rsi.current > 70) bearishSignals++;
    }
    
    // MACD sentiment
    if (analysis.macd) {
      totalSignals++;
      if (analysis.macd.current.histogram > 0) bullishSignals++;
      else bearishSignals++;
    }
    
    // Bollinger Bands sentiment
    if (analysis.bollinger) {
      const latest = analysis.bollinger[analysis.bollinger.length - 1];
      totalSignals++;
      if (latest.price < latest.lower) bullishSignals++;
      else if (latest.price > latest.upper) bearishSignals++;
    }
    
    // Stochastic sentiment
    if (analysis.stochastic) {
      totalSignals++;
      if (analysis.stochastic.current.k < 20) bullishSignals++;
      else if (analysis.stochastic.current.k > 80) bearishSignals++;
    }
    
    const bullishPercentage = (bullishSignals / totalSignals) * 100;
    const bearishPercentage = (bearishSignals / totalSignals) * 100;
    
    return {
      bullish: bullishPercentage,
      bearish: bearishPercentage,
      neutral: 100 - bullishPercentage - bearishPercentage,
      overall: bullishPercentage > bearishPercentage ? 'BULLISH' : 
               bearishPercentage > bullishPercentage ? 'BEARISH' : 'NEUTRAL'
    };
  }

  calculateSignalStrength(analysis) {
    let strength = 0;
    let factors = 0;
    
    // RSI strength
    if (analysis.rsi) {
      factors++;
      if (analysis.rsi.current > 70 || analysis.rsi.current < 30) {
        strength += Math.abs(analysis.rsi.current - 50) / 50 * 100;
      }
    }
    
    // MACD strength
    if (analysis.macd) {
      factors++;
      strength += Math.abs(analysis.macd.current.histogram) * 10;
    }
    
    // Bollinger Bands strength
    if (analysis.bollinger) {
      const latest = analysis.bollinger[analysis.bollinger.length - 1];
      factors++;
      const bandWidth = (latest.upper - latest.lower) / latest.middle;
      strength += (1 - bandWidth) * 100;
    }
    
    return Math.min(100, strength / factors);
  }
}

export default EnhancedTechnicalAnalysis;