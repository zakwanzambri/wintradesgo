/**
 * MACHINE LEARNING PATTERN RECOGNITION V1.0
 * Advanced pattern detection and adaptive learning for trading signals
 */

export class MLPatternRecognition {
  constructor() {
    this.patterns = [];
    this.models = {};
    this.trainingData = [];
    this.loadData();
    
    // ML Configuration
    this.config = {
      minPatternLength: 5,
      maxPatternLength: 50,
      similarityThreshold: 0.85,
      minTrainingData: 100,
      learningRate: 0.01,
      featureCount: 20
    };
    
    // Pattern templates for recognition
    this.patternTemplates = this.initializePatternTemplates();
  }

  // Load saved data
  loadData() {
    try {
      const saved = localStorage.getItem('mlPatternData');
      if (saved) {
        const data = JSON.parse(saved);
        this.patterns = data.patterns || [];
        this.trainingData = data.trainingData || [];
        this.models = data.models || {};
      }
    } catch (error) {
      console.error('Error loading ML pattern data:', error);
    }
  }

  // Save data
  saveData() {
    try {
      const data = {
        patterns: this.patterns,
        trainingData: this.trainingData,
        models: this.models,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('mlPatternData', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving ML pattern data:', error);
    }
  }

  // Initialize pattern templates
  initializePatternTemplates() {
    return {
      // Candlestick patterns
      doji: {
        name: 'Doji',
        type: 'reversal',
        features: ['small_body', 'equal_shadows'],
        confidence: 0.7
      },
      hammer: {
        name: 'Hammer',
        type: 'reversal',
        features: ['small_body', 'long_lower_shadow', 'no_upper_shadow'],
        confidence: 0.75
      },
      shootingStar: {
        name: 'Shooting Star',
        type: 'reversal',
        features: ['small_body', 'long_upper_shadow', 'no_lower_shadow'],
        confidence: 0.75
      },
      engulfing: {
        name: 'Engulfing',
        type: 'reversal',
        features: ['opposite_colors', 'larger_body', 'engulfs_previous'],
        confidence: 0.8
      },
      
      // Chart patterns
      doubleTop: {
        name: 'Double Top',
        type: 'reversal',
        features: ['two_peaks', 'similar_height', 'valley_between'],
        confidence: 0.85
      },
      doubleBottom: {
        name: 'Double Bottom',
        type: 'reversal',
        features: ['two_troughs', 'similar_depth', 'peak_between'],
        confidence: 0.85
      },
      headAndShoulders: {
        name: 'Head and Shoulders',
        type: 'reversal',
        features: ['three_peaks', 'higher_middle', 'symmetrical'],
        confidence: 0.9
      },
      triangle: {
        name: 'Triangle',
        type: 'continuation',
        features: ['converging_lines', 'decreasing_volume', 'consolidation'],
        confidence: 0.7
      },
      flag: {
        name: 'Flag',
        type: 'continuation',
        features: ['strong_move', 'consolidation', 'parallel_lines'],
        confidence: 0.75
      },
      wedge: {
        name: 'Wedge',
        type: 'reversal',
        features: ['converging_lines', 'volume_divergence', 'trendline_break'],
        confidence: 0.8
      }
    };
  }

  // Detect patterns in price data
  async detectPatterns(priceData, symbol = 'BTC') {
    try {
      const { highs, lows, opens, closes, volumes } = priceData;
      
      if (!highs || highs.length < this.config.minPatternLength) {
        return { patterns: [], confidence: 0, analysis: 'Insufficient data' };
      }

      console.log(`🔍 Detecting patterns for ${symbol}...`);
      
      const detectedPatterns = [];
      
      // Detect candlestick patterns
      const candlestickPatterns = this.detectCandlestickPatterns(opens, highs, lows, closes);
      detectedPatterns.push(...candlestickPatterns);
      
      // Detect chart patterns
      const chartPatterns = this.detectChartPatterns(highs, lows, closes);
      detectedPatterns.push(...chartPatterns);
      
      // Detect volume patterns
      const volumePatterns = this.detectVolumePatterns(closes, volumes);
      detectedPatterns.push(...volumePatterns);
      
      // Detect custom learned patterns
      const customPatterns = await this.detectCustomPatterns(priceData);
      detectedPatterns.push(...customPatterns);
      
      // Calculate overall confidence
      const overallConfidence = this.calculateOverallConfidence(detectedPatterns);
      
      // Generate trading signal based on patterns
      const signal = this.generatePatternSignal(detectedPatterns);
      
      const result = {
        symbol: symbol,
        timestamp: new Date().toISOString(),
        patterns: detectedPatterns,
        confidence: overallConfidence,
        signal: signal,
        analysis: this.generatePatternAnalysis(detectedPatterns)
      };
      
      // Store for learning
      this.addToTrainingData(priceData, result);
      
      console.log(`✅ Pattern detection complete: ${detectedPatterns.length} patterns found`);
      return result;
      
    } catch (error) {
      console.error('Error detecting patterns:', error);
      return { patterns: [], confidence: 0, error: error.message };
    }
  }

  // Detect candlestick patterns
  detectCandlestickPatterns(opens, highs, lows, closes) {
    const patterns = [];
    const length = Math.min(opens.length, highs.length, lows.length, closes.length);
    
    for (let i = 1; i < length; i++) {
      const current = {
        open: opens[i],
        high: highs[i],
        low: lows[i],
        close: closes[i],
        body: Math.abs(closes[i] - opens[i]),
        upperShadow: highs[i] - Math.max(opens[i], closes[i]),
        lowerShadow: Math.min(opens[i], closes[i]) - lows[i],
        range: highs[i] - lows[i]
      };
      
      const previous = i > 0 ? {
        open: opens[i-1],
        high: highs[i-1],
        low: lows[i-1],
        close: closes[i-1],
        body: Math.abs(closes[i-1] - opens[i-1]),
        range: highs[i-1] - lows[i-1]
      } : null;
      
      // Doji pattern
      if (this.isDoji(current)) {
        patterns.push({
          name: 'Doji',
          type: 'candlestick',
          signal: 'reversal',
          confidence: 0.7,
          position: i,
          description: 'Indecision pattern - potential reversal'
        });
      }
      
      // Hammer pattern
      if (this.isHammer(current)) {
        patterns.push({
          name: 'Hammer',
          type: 'candlestick',
          signal: 'bullish',
          confidence: 0.75,
          position: i,
          description: 'Bullish reversal pattern at support'
        });
      }
      
      // Shooting Star pattern
      if (this.isShootingStar(current)) {
        patterns.push({
          name: 'Shooting Star',
          type: 'candlestick',
          signal: 'bearish',
          confidence: 0.75,
          position: i,
          description: 'Bearish reversal pattern at resistance'
        });
      }
      
      // Engulfing pattern (requires previous candle)
      if (previous && this.isEngulfing(previous, current)) {
        const bullish = current.close > current.open && previous.close < previous.open;
        patterns.push({
          name: bullish ? 'Bullish Engulfing' : 'Bearish Engulfing',
          type: 'candlestick',
          signal: bullish ? 'bullish' : 'bearish',
          confidence: 0.8,
          position: i,
          description: `${bullish ? 'Bullish' : 'Bearish'} reversal pattern`
        });
      }
    }
    
    return patterns;
  }

  // Detect chart patterns
  detectChartPatterns(highs, lows, closes) {
    const patterns = [];
    const length = closes.length;
    
    if (length < 20) return patterns;
    
    // Look for patterns in recent data
    const lookback = Math.min(50, length);
    const recentHighs = highs.slice(-lookback);
    const recentLows = lows.slice(-lookback);
    const recentCloses = closes.slice(-lookback);
    
    // Double Top pattern
    const doubleTop = this.detectDoubleTop(recentHighs, recentCloses);
    if (doubleTop) {
      patterns.push({
        name: 'Double Top',
        type: 'chart',
        signal: 'bearish',
        confidence: doubleTop.confidence,
        position: length - lookback + doubleTop.position,
        description: 'Bearish reversal pattern with two similar peaks'
      });
    }
    
    // Double Bottom pattern
    const doubleBottom = this.detectDoubleBottom(recentLows, recentCloses);
    if (doubleBottom) {
      patterns.push({
        name: 'Double Bottom',
        type: 'chart',
        signal: 'bullish',
        confidence: doubleBottom.confidence,
        position: length - lookback + doubleBottom.position,
        description: 'Bullish reversal pattern with two similar troughs'
      });
    }
    
    // Head and Shoulders pattern
    const headShoulders = this.detectHeadAndShoulders(recentHighs, recentLows);
    if (headShoulders) {
      patterns.push({
        name: 'Head and Shoulders',
        type: 'chart',
        signal: 'bearish',
        confidence: headShoulders.confidence,
        position: length - lookback + headShoulders.position,
        description: 'Strong bearish reversal pattern'
      });
    }
    
    // Triangle pattern
    const triangle = this.detectTriangle(recentHighs, recentLows);
    if (triangle) {
      patterns.push({
        name: `${triangle.type} Triangle`,
        type: 'chart',
        signal: triangle.signal,
        confidence: triangle.confidence,
        position: length - lookback + triangle.position,
        description: `${triangle.type} triangle pattern indicating ${triangle.signal} bias`
      });
    }
    
    return patterns;
  }

  // Detect volume patterns
  detectVolumePatterns(closes, volumes) {
    const patterns = [];
    
    if (!volumes || volumes.length < 10) return patterns;
    
    const length = Math.min(closes.length, volumes.length);
    const recentData = length >= 20 ? 20 : length;
    
    // Volume spike detection
    const avgVolume = volumes.slice(-recentData).reduce((a, b) => a + b, 0) / recentData;
    const currentVolume = volumes[volumes.length - 1];
    
    if (currentVolume > avgVolume * 2) {
      const priceChange = closes[closes.length - 1] - closes[closes.length - 2];
      patterns.push({
        name: 'Volume Spike',
        type: 'volume',
        signal: priceChange > 0 ? 'bullish' : 'bearish',
        confidence: 0.6,
        position: length - 1,
        description: `High volume ${priceChange > 0 ? 'buying' : 'selling'} pressure`
      });
    }
    
    // Volume divergence
    const priceMA = this.calculateSMA(closes.slice(-10), 10);
    const volumeMA = this.calculateSMA(volumes.slice(-10), 10);
    
    if (priceMA && volumeMA) {
      const priceTrend = priceMA[priceMA.length - 1] > priceMA[0] ? 'up' : 'down';
      const volumeTrend = volumeMA[volumeMA.length - 1] > volumeMA[0] ? 'up' : 'down';
      
      if (priceTrend !== volumeTrend) {
        patterns.push({
          name: 'Volume Divergence',
          type: 'volume',
          signal: 'warning',
          confidence: 0.7,
          position: length - 1,
          description: 'Price and volume moving in opposite directions'
        });
      }
    }
    
    return patterns;
  }

  // Detect custom learned patterns
  async detectCustomPatterns(priceData) {
    const patterns = [];
    
    // This would use trained models to detect custom patterns
    // For now, implementing a simplified version
    
    try {
      const features = this.extractFeatures(priceData);
      
      // Check against known successful patterns
      for (const storedPattern of this.patterns) {
        const similarity = this.calculateSimilarity(features, storedPattern.features);
        
        if (similarity > this.config.similarityThreshold) {
          patterns.push({
            name: `Custom Pattern ${storedPattern.id}`,
            type: 'machine_learning',
            signal: storedPattern.signal,
            confidence: similarity * storedPattern.successRate,
            position: priceData.closes.length - 1,
            description: `ML detected pattern with ${(similarity * 100).toFixed(1)}% similarity`
          });
        }
      }
      
    } catch (error) {
      console.error('Error detecting custom patterns:', error);
    }
    
    return patterns;
  }

  // Pattern detection helper functions
  isDoji(candle) {
    const bodySize = candle.body / candle.range;
    return bodySize < 0.1; // Body is less than 10% of total range
  }

  isHammer(candle) {
    const bodySize = candle.body / candle.range;
    const lowerShadowRatio = candle.lowerShadow / candle.range;
    const upperShadowRatio = candle.upperShadow / candle.range;
    
    return bodySize < 0.3 && lowerShadowRatio > 0.6 && upperShadowRatio < 0.1;
  }

  isShootingStar(candle) {
    const bodySize = candle.body / candle.range;
    const upperShadowRatio = candle.upperShadow / candle.range;
    const lowerShadowRatio = candle.lowerShadow / candle.range;
    
    return bodySize < 0.3 && upperShadowRatio > 0.6 && lowerShadowRatio < 0.1;
  }

  isEngulfing(previous, current) {
    const currentBullish = current.close > current.open;
    const previousBullish = previous.close > previous.open;
    const oppositeColors = currentBullish !== previousBullish;
    const engulfs = current.body > previous.body * 1.1;
    
    return oppositeColors && engulfs;
  }

  detectDoubleTop(highs, closes) {
    if (highs.length < 20) return null;
    
    // Find two peaks that are similar in height
    const peaks = this.findPeaks(highs);
    
    if (peaks.length < 2) return null;
    
    // Check last two peaks
    const peak1 = peaks[peaks.length - 2];
    const peak2 = peaks[peaks.length - 1];
    
    const heightDiff = Math.abs(highs[peak1] - highs[peak2]) / highs[peak1];
    const hasValley = this.hasSignificantValley(highs, peak1, peak2);
    
    if (heightDiff < 0.03 && hasValley) { // Less than 3% height difference
      return {
        confidence: 0.85 - heightDiff,
        position: peak2
      };
    }
    
    return null;
  }

  detectDoubleBottom(lows, closes) {
    if (lows.length < 20) return null;
    
    // Find two troughs that are similar in depth
    const troughs = this.findTroughs(lows);
    
    if (troughs.length < 2) return null;
    
    // Check last two troughs
    const trough1 = troughs[troughs.length - 2];
    const trough2 = troughs[troughs.length - 1];
    
    const depthDiff = Math.abs(lows[trough1] - lows[trough2]) / lows[trough1];
    const hasPeak = this.hasSignificantPeak(lows, trough1, trough2);
    
    if (depthDiff < 0.03 && hasPeak) {
      return {
        confidence: 0.85 - depthDiff,
        position: trough2
      };
    }
    
    return null;
  }

  detectHeadAndShoulders(highs, lows) {
    if (highs.length < 25) return null;
    
    const peaks = this.findPeaks(highs);
    
    if (peaks.length < 3) return null;
    
    // Check last three peaks for head and shoulders pattern
    const leftShoulder = peaks[peaks.length - 3];
    const head = peaks[peaks.length - 2];
    const rightShoulder = peaks[peaks.length - 1];
    
    const leftHeight = highs[leftShoulder];
    const headHeight = highs[head];
    const rightHeight = highs[rightShoulder];
    
    // Head should be higher than both shoulders
    const isHeadHigher = headHeight > leftHeight && headHeight > rightHeight;
    
    // Shoulders should be similar height
    const shoulderDiff = Math.abs(leftHeight - rightHeight) / leftHeight;
    
    if (isHeadHigher && shoulderDiff < 0.05) {
      return {
        confidence: 0.9 - shoulderDiff,
        position: rightShoulder
      };
    }
    
    return null;
  }

  detectTriangle(highs, lows) {
    if (highs.length < 15) return null;
    
    // Calculate trendlines for highs and lows
    const highTrend = this.calculateTrendline(highs.slice(-15));
    const lowTrend = this.calculateTrendline(lows.slice(-15));
    
    if (!highTrend || !lowTrend) return null;
    
    const highSlope = highTrend.slope;
    const lowSlope = lowTrend.slope;
    
    // Ascending triangle
    if (Math.abs(highSlope) < 0.001 && lowSlope > 0.001) {
      return {
        type: 'Ascending',
        signal: 'bullish',
        confidence: 0.7,
        position: highs.length - 1
      };
    }
    
    // Descending triangle
    if (Math.abs(lowSlope) < 0.001 && highSlope < -0.001) {
      return {
        type: 'Descending',
        signal: 'bearish',
        confidence: 0.7,
        position: highs.length - 1
      };
    }
    
    // Symmetrical triangle
    if (highSlope < -0.001 && lowSlope > 0.001) {
      return {
        type: 'Symmetrical',
        signal: 'neutral',
        confidence: 0.6,
        position: highs.length - 1
      };
    }
    
    return null;
  }

  // Utility functions
  findPeaks(data, minDistance = 3) {
    const peaks = [];
    
    for (let i = minDistance; i < data.length - minDistance; i++) {
      let isPeak = true;
      
      for (let j = 1; j <= minDistance; j++) {
        if (data[i] <= data[i - j] || data[i] <= data[i + j]) {
          isPeak = false;
          break;
        }
      }
      
      if (isPeak) {
        peaks.push(i);
      }
    }
    
    return peaks;
  }

  findTroughs(data, minDistance = 3) {
    const troughs = [];
    
    for (let i = minDistance; i < data.length - minDistance; i++) {
      let isTrough = true;
      
      for (let j = 1; j <= minDistance; j++) {
        if (data[i] >= data[i - j] || data[i] >= data[i + j]) {
          isTrough = false;
          break;
        }
      }
      
      if (isTrough) {
        troughs.push(i);
      }
    }
    
    return troughs;
  }

  hasSignificantValley(data, peak1, peak2) {
    const valley = Math.min(...data.slice(peak1, peak2 + 1));
    const avgPeak = (data[peak1] + data[peak2]) / 2;
    return (avgPeak - valley) / avgPeak > 0.02; // At least 2% drop
  }

  hasSignificantPeak(data, trough1, trough2) {
    const peak = Math.max(...data.slice(trough1, trough2 + 1));
    const avgTrough = (data[trough1] + data[trough2]) / 2;
    return (peak - avgTrough) / avgTrough > 0.02; // At least 2% rise
  }

  calculateTrendline(data) {
    const n = data.length;
    const x = Array.from({length: n}, (_, i) => i);
    const y = data;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope, intercept };
  }

  calculateSMA(data, period) {
    if (data.length < period) return null;
    
    const sma = [];
    for (let i = period - 1; i < data.length; i++) {
      const slice = data.slice(i - period + 1, i + 1);
      const average = slice.reduce((sum, val) => sum + val, 0) / period;
      sma.push(average);
    }
    return sma;
  }

  // Feature extraction for ML
  extractFeatures(priceData) {
    const { highs, lows, closes, volumes } = priceData;
    const features = [];
    
    if (closes.length < 20) return features;
    
    // Price-based features
    const recentCloses = closes.slice(-20);
    features.push(this.calculateVolatility(recentCloses));
    features.push(this.calculateMomentum(recentCloses));
    features.push(this.calculateTrend(recentCloses));
    
    // Technical indicators as features
    const rsi = this.calculateRSI(closes, 14);
    if (rsi) features.push(rsi[rsi.length - 1]);
    
    const macd = this.calculateMACD(closes);
    if (macd) {
      features.push(macd.histogram[macd.histogram.length - 1]);
      features.push(macd.signal[macd.signal.length - 1]);
    }
    
    // Volume features
    if (volumes && volumes.length >= 10) {
      features.push(this.calculateVolumeRatio(volumes));
    }
    
    // Pattern features
    features.push(this.countRecentPeaks(highs));
    features.push(this.countRecentTroughs(lows));
    
    return features;
  }

  calculateVolatility(prices) {
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i-1]) / prices[i-1]);
    }
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
  }

  calculateMomentum(prices) {
    return (prices[prices.length - 1] - prices[0]) / prices[0];
  }

  calculateTrend(prices) {
    const trendline = this.calculateTrendline(prices);
    return trendline ? trendline.slope : 0;
  }

  calculateRSI(prices, period = 14) {
    // Simplified RSI calculation
    if (prices.length < period + 1) return null;
    
    const gains = [];
    const losses = [];
    
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i-1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    const rsiValues = [];
    
    for (let i = period - 1; i < gains.length; i++) {
      const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
      const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
      
      const rs = avgGain / (avgLoss || 0.0001);
      const rsi = 100 - (100 / (1 + rs));
      rsiValues.push(rsi);
    }
    
    return rsiValues;
  }

  calculateMACD(prices, fast = 12, slow = 26, signal = 9) {
    const fastEMA = this.calculateEMA(prices, fast);
    const slowEMA = this.calculateEMA(prices, slow);
    
    if (!fastEMA || !slowEMA) return null;
    
    const macdLine = [];
    const minLength = Math.min(fastEMA.length, slowEMA.length);
    
    for (let i = 0; i < minLength; i++) {
      macdLine.push(fastEMA[fastEMA.length - minLength + i] - slowEMA[slowEMA.length - minLength + i]);
    }
    
    const signalLine = this.calculateEMA(macdLine, signal);
    if (!signalLine) return null;
    
    const histogram = [];
    for (let i = 0; i < signalLine.length; i++) {
      histogram.push(macdLine[macdLine.length - signalLine.length + i] - signalLine[i]);
    }
    
    return {
      macd: macdLine,
      signal: signalLine,
      histogram: histogram
    };
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

  calculateVolumeRatio(volumes) {
    const recent = volumes.slice(-5);
    const previous = volumes.slice(-10, -5);
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const previousAvg = previous.reduce((a, b) => a + b, 0) / previous.length;
    
    return previousAvg > 0 ? recentAvg / previousAvg : 1;
  }

  countRecentPeaks(highs) {
    return this.findPeaks(highs.slice(-20)).length;
  }

  countRecentTroughs(lows) {
    return this.findTroughs(lows.slice(-20)).length;
  }

  calculateSimilarity(features1, features2) {
    if (!features1 || !features2 || features1.length !== features2.length) {
      return 0;
    }
    
    let similarity = 0;
    for (let i = 0; i < features1.length; i++) {
      const diff = Math.abs(features1[i] - features2[i]);
      const max = Math.max(Math.abs(features1[i]), Math.abs(features2[i]), 1);
      similarity += 1 - (diff / max);
    }
    
    return similarity / features1.length;
  }

  // Pattern analysis and signal generation
  calculateOverallConfidence(patterns) {
    if (patterns.length === 0) return 0;
    
    const totalWeight = patterns.reduce((sum, pattern) => sum + pattern.confidence, 0);
    return Math.min(95, totalWeight / patterns.length * 100);
  }

  generatePatternSignal(patterns) {
    if (patterns.length === 0) return 'HOLD';
    
    let bullishWeight = 0;
    let bearishWeight = 0;
    
    patterns.forEach(pattern => {
      const weight = pattern.confidence;
      
      if (pattern.signal === 'bullish') {
        bullishWeight += weight;
      } else if (pattern.signal === 'bearish') {
        bearishWeight += weight;
      }
    });
    
    const threshold = 0.6;
    
    if (bullishWeight > bearishWeight && bullishWeight > threshold) {
      return 'BUY';
    } else if (bearishWeight > bullishWeight && bearishWeight > threshold) {
      return 'SELL';
    }
    
    return 'HOLD';
  }

  generatePatternAnalysis(patterns) {
    if (patterns.length === 0) {
      return 'No significant patterns detected in current price action.';
    }
    
    const patternsByType = patterns.reduce((acc, pattern) => {
      acc[pattern.type] = acc[pattern.type] || [];
      acc[pattern.type].push(pattern);
      return acc;
    }, {});
    
    let analysis = `Detected ${patterns.length} patterns:\n\n`;
    
    Object.entries(patternsByType).forEach(([type, typePatterns]) => {
      analysis += `${type.toUpperCase()} PATTERNS:\n`;
      typePatterns.forEach(pattern => {
        analysis += `• ${pattern.name}: ${pattern.description} (${(pattern.confidence * 100).toFixed(0)}% confidence)\n`;
      });
      analysis += '\n';
    });
    
    return analysis;
  }

  // Training and learning functions
  addToTrainingData(priceData, result) {
    const trainingEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      features: this.extractFeatures(priceData),
      patterns: result.patterns,
      signal: result.signal,
      confidence: result.confidence
    };
    
    this.trainingData.push(trainingEntry);
    
    // Keep only recent training data
    if (this.trainingData.length > 1000) {
      this.trainingData = this.trainingData.slice(-1000);
    }
    
    this.saveData();
  }

  // Learn from successful trades
  learnFromTrade(tradeResult, patterns) {
    if (!patterns || patterns.length === 0) return;
    
    const success = tradeResult.pnl > 0;
    
    patterns.forEach(pattern => {
      // Update pattern success rate
      let storedPattern = this.patterns.find(p => p.name === pattern.name);
      
      if (!storedPattern) {
        storedPattern = {
          id: this.generateId(),
          name: pattern.name,
          type: pattern.type,
          features: pattern.features || [],
          signal: pattern.signal,
          occurrences: 0,
          successes: 0,
          successRate: 0.5
        };
        this.patterns.push(storedPattern);
      }
      
      storedPattern.occurrences++;
      if (success) storedPattern.successes++;
      storedPattern.successRate = storedPattern.successes / storedPattern.occurrences;
    });
    
    this.saveData();
  }

  // Utility
  generateId() {
    return 'ML_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  }

  // Get learning statistics
  getLearningStats() {
    return {
      totalPatterns: this.patterns.length,
      trainingDataPoints: this.trainingData.length,
      averageSuccessRate: this.patterns.length > 0 
        ? this.patterns.reduce((sum, p) => sum + p.successRate, 0) / this.patterns.length 
        : 0,
      mostSuccessfulPattern: this.patterns.reduce((best, current) => 
        current.successRate > (best?.successRate || 0) ? current : best, null),
      learningProgress: Math.min(100, (this.trainingData.length / this.config.minTrainingData) * 100)
    };
  }
}

export default MLPatternRecognition;