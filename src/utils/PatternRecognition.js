/**
 * REAL PATTERN RECOGNITION ENGINE
 * Detects actual chart patterns using mathematical analysis
 */

export class PatternRecognition {
  constructor() {
    this.minPatternLength = 5;
    this.tolerance = 0.02; // 2% tolerance for pattern matching
  }

  // Helper function to find local peaks
  findPeaks(prices, windowSize = 3) {
    const peaks = [];
    for (let i = windowSize; i < prices.length - windowSize; i++) {
      let isPeak = true;
      for (let j = i - windowSize; j <= i + windowSize; j++) {
        if (j !== i && prices[j] >= prices[i]) {
          isPeak = false;
          break;
        }
      }
      if (isPeak) {
        peaks.push({ index: i, price: prices[i] });
      }
    }
    return peaks;
  }

  // Helper function to find local troughs
  findTroughs(prices, windowSize = 3) {
    const troughs = [];
    for (let i = windowSize; i < prices.length - windowSize; i++) {
      let isTrough = true;
      for (let j = i - windowSize; j <= i + windowSize; j++) {
        if (j !== i && prices[j] <= prices[i]) {
          isTrough = false;
          break;
        }
      }
      if (isTrough) {
        troughs.push({ index: i, price: prices[i] });
      }
    }
    return troughs;
  }

  // Detect Head and Shoulders pattern
  detectHeadAndShoulders(prices) {
    const peaks = this.findPeaks(prices, 5);
    const troughs = this.findTroughs(prices, 3);

    if (peaks.length < 3 || troughs.length < 2) return null;

    // Look for three consecutive peaks where middle is highest
    for (let i = 0; i < peaks.length - 2; i++) {
      const leftShoulder = peaks[i];
      const head = peaks[i + 1];
      const rightShoulder = peaks[i + 2];

      // Check if head is higher than shoulders
      if (head.price > leftShoulder.price && head.price > rightShoulder.price) {
        // Check if shoulders are roughly equal height
        const shoulderDiff = Math.abs(leftShoulder.price - rightShoulder.price) / leftShoulder.price;
        
        if (shoulderDiff < this.tolerance * 2) {
          // Find neckline (troughs between shoulders and head)
          const leftTrough = troughs.find(t => t.index > leftShoulder.index && t.index < head.index);
          const rightTrough = troughs.find(t => t.index > head.index && t.index < rightShoulder.index);

          if (leftTrough && rightTrough) {
            const necklineLevel = (leftTrough.price + rightTrough.price) / 2;
            const targetPrice = necklineLevel - (head.price - necklineLevel);

            return {
              pattern: 'Head and Shoulders',
              confidence: this.calculatePatternConfidence(prices, 'head_shoulders'),
              prediction: 'BEARISH',
              neckline: necklineLevel,
              targetPrice: Math.max(targetPrice, 0),
              formation: [leftShoulder, head, rightShoulder],
              support: necklineLevel,
              resistance: head.price,
              timeframe: this.estimateTimeframe(rightShoulder.index - leftShoulder.index)
            };
          }
        }
      }
    }
    return null;
  }

  // Detect Inverse Head and Shoulders
  detectInverseHeadAndShoulders(prices) {
    const peaks = this.findPeaks(prices, 3);
    const troughs = this.findTroughs(prices, 5);

    if (troughs.length < 3 || peaks.length < 2) return null;

    // Look for three consecutive troughs where middle is lowest
    for (let i = 0; i < troughs.length - 2; i++) {
      const leftShoulder = troughs[i];
      const head = troughs[i + 1];
      const rightShoulder = troughs[i + 2];

      if (head.price < leftShoulder.price && head.price < rightShoulder.price) {
        const shoulderDiff = Math.abs(leftShoulder.price - rightShoulder.price) / leftShoulder.price;
        
        if (shoulderDiff < this.tolerance * 2) {
          const leftPeak = peaks.find(p => p.index > leftShoulder.index && p.index < head.index);
          const rightPeak = peaks.find(p => p.index > head.index && p.index < rightShoulder.index);

          if (leftPeak && rightPeak) {
            const necklineLevel = (leftPeak.price + rightPeak.price) / 2;
            const targetPrice = necklineLevel + (necklineLevel - head.price);

            return {
              pattern: 'Inverse Head and Shoulders',
              confidence: this.calculatePatternConfidence(prices, 'inverse_head_shoulders'),
              prediction: 'BULLISH',
              neckline: necklineLevel,
              targetPrice: targetPrice,
              formation: [leftShoulder, head, rightShoulder],
              support: head.price,
              resistance: necklineLevel,
              timeframe: this.estimateTimeframe(rightShoulder.index - leftShoulder.index)
            };
          }
        }
      }
    }
    return null;
  }

  // Detect Double Top pattern
  detectDoubleTop(prices) {
    const peaks = this.findPeaks(prices, 5);
    const troughs = this.findTroughs(prices, 3);

    if (peaks.length < 2) return null;

    for (let i = 0; i < peaks.length - 1; i++) {
      const firstPeak = peaks[i];
      const secondPeak = peaks[i + 1];

      // Check if peaks are at similar levels
      const priceDiff = Math.abs(firstPeak.price - secondPeak.price) / firstPeak.price;
      
      if (priceDiff < this.tolerance) {
        // Find trough between peaks
        const middleTrough = troughs.find(t => 
          t.index > firstPeak.index && t.index < secondPeak.index
        );

        if (middleTrough) {
          const avgPeakPrice = (firstPeak.price + secondPeak.price) / 2;
          const targetPrice = middleTrough.price - (avgPeakPrice - middleTrough.price);

          return {
            pattern: 'Double Top',
            confidence: this.calculatePatternConfidence(prices, 'double_top'),
            prediction: 'BEARISH',
            support: middleTrough.price,
            resistance: avgPeakPrice,
            targetPrice: Math.max(targetPrice, 0),
            formation: [firstPeak, middleTrough, secondPeak],
            timeframe: this.estimateTimeframe(secondPeak.index - firstPeak.index)
          };
        }
      }
    }
    return null;
  }

  // Detect Double Bottom pattern
  detectDoubleBottom(prices) {
    const peaks = this.findPeaks(prices, 3);
    const troughs = this.findTroughs(prices, 5);

    if (troughs.length < 2) return null;

    for (let i = 0; i < troughs.length - 1; i++) {
      const firstTrough = troughs[i];
      const secondTrough = troughs[i + 1];

      const priceDiff = Math.abs(firstTrough.price - secondTrough.price) / firstTrough.price;
      
      if (priceDiff < this.tolerance) {
        const middlePeak = peaks.find(p => 
          p.index > firstTrough.index && p.index < secondTrough.index
        );

        if (middlePeak) {
          const avgTroughPrice = (firstTrough.price + secondTrough.price) / 2;
          const targetPrice = middlePeak.price + (middlePeak.price - avgTroughPrice);

          return {
            pattern: 'Double Bottom',
            confidence: this.calculatePatternConfidence(prices, 'double_bottom'),
            prediction: 'BULLISH',
            support: avgTroughPrice,
            resistance: middlePeak.price,
            targetPrice: targetPrice,
            formation: [firstTrough, middlePeak, secondTrough],
            timeframe: this.estimateTimeframe(secondTrough.index - firstTrough.index)
          };
        }
      }
    }
    return null;
  }

  // Detect Triangle patterns
  detectTriangle(prices) {
    if (prices.length < 20) return null;

    const peaks = this.findPeaks(prices, 4);
    const troughs = this.findTroughs(prices, 4);

    if (peaks.length < 2 || troughs.length < 2) return null;

    // Get recent peaks and troughs
    const recentPeaks = peaks.slice(-3);
    const recentTroughs = troughs.slice(-3);

    // Check for ascending triangle (horizontal resistance, rising support)
    if (recentPeaks.length >= 2 && recentTroughs.length >= 2) {
      const peakPrices = recentPeaks.map(p => p.price);
      const troughPrices = recentTroughs.map(t => t.price);

      // Check if peaks are roughly horizontal
      const peakVariation = (Math.max(...peakPrices) - Math.min(...peakPrices)) / Math.min(...peakPrices);
      
      // Check if troughs are ascending
      const isAscendingTroughs = troughPrices.every((price, i) => 
        i === 0 || price >= troughPrices[i - 1] * (1 - this.tolerance)
      );

      if (peakVariation < this.tolerance && isAscendingTroughs) {
        const resistance = Math.max(...peakPrices);
        const support = troughPrices[troughPrices.length - 1];
        
        return {
          pattern: 'Ascending Triangle',
          confidence: this.calculatePatternConfidence(prices, 'ascending_triangle'),
          prediction: 'BULLISH',
          support: support,
          resistance: resistance,
          targetPrice: resistance + (resistance - support) * 0.618,
          formation: [...recentTroughs, ...recentPeaks],
          timeframe: this.estimateTimeframe(Math.max(...recentPeaks.map(p => p.index)) - Math.min(...recentTroughs.map(t => t.index)))
        };
      }

      // Check for descending triangle (falling resistance, horizontal support)
      const troughVariation = (Math.max(...troughPrices) - Math.min(...troughPrices)) / Math.min(...troughPrices);
      
      const isDescendingPeaks = peakPrices.every((price, i) => 
        i === 0 || price <= peakPrices[i - 1] * (1 + this.tolerance)
      );

      if (troughVariation < this.tolerance && isDescendingPeaks) {
        const support = Math.min(...troughPrices);
        const resistance = peakPrices[peakPrices.length - 1];
        
        return {
          pattern: 'Descending Triangle',
          confidence: this.calculatePatternConfidence(prices, 'descending_triangle'),
          prediction: 'BEARISH',
          support: support,
          resistance: resistance,
          targetPrice: Math.max(support - (resistance - support) * 0.618, 0),
          formation: [...recentTroughs, ...recentPeaks],
          timeframe: this.estimateTimeframe(Math.max(...recentPeaks.map(p => p.index)) - Math.min(...recentTroughs.map(t => t.index)))
        };
      }
    }

    return null;
  }

  // Calculate pattern confidence based on various factors
  calculatePatternConfidence(prices, patternType) {
    let baseConfidence = 60;
    
    // Volume consideration (if available)
    const volatility = this.calculateVolatility(prices);
    const trend = this.analyzeTrend(prices);
    
    // Adjust confidence based on market conditions
    if (volatility < 0.02) baseConfidence += 10; // Low volatility increases confidence
    if (volatility > 0.05) baseConfidence -= 10; // High volatility decreases confidence
    
    // Pattern-specific adjustments
    switch (patternType) {
      case 'head_shoulders':
      case 'inverse_head_shoulders':
        baseConfidence += 15; // Well-established patterns
        break;
      case 'double_top':
      case 'double_bottom':
        baseConfidence += 10;
        break;
      case 'ascending_triangle':
      case 'descending_triangle':
        baseConfidence += 5;
        break;
    }

    return Math.min(Math.max(baseConfidence, 50), 95);
  }

  calculateVolatility(prices) {
    if (prices.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }

  analyzeTrend(prices) {
    if (prices.length < 3) return 'NEUTRAL';
    
    const firstThird = prices.slice(0, Math.floor(prices.length / 3));
    const lastThird = prices.slice(-Math.floor(prices.length / 3));
    
    const firstAvg = firstThird.reduce((sum, p) => sum + p, 0) / firstThird.length;
    const lastAvg = lastThird.reduce((sum, p) => sum + p, 0) / lastThird.length;
    
    const change = (lastAvg - firstAvg) / firstAvg;
    
    if (change > 0.02) return 'BULLISH';
    if (change < -0.02) return 'BEARISH';
    return 'NEUTRAL';
  }

  estimateTimeframe(periodLength) {
    if (periodLength < 10) return '1H';
    if (periodLength < 30) return '2H';
    if (periodLength < 60) return '4H';
    if (periodLength < 120) return '1D';
    return '1W';
  }

  // Main pattern detection function
  detectPatterns(prices, symbol) {
    const patterns = [];

    try {
      // Detect various patterns
      const headShoulders = this.detectHeadAndShoulders(prices);
      if (headShoulders) patterns.push({ ...headShoulders, symbol });

      const inverseHeadShoulders = this.detectInverseHeadAndShoulders(prices);
      if (inverseHeadShoulders) patterns.push({ ...inverseHeadShoulders, symbol });

      const doubleTop = this.detectDoubleTop(prices);
      if (doubleTop) patterns.push({ ...doubleTop, symbol });

      const doubleBottom = this.detectDoubleBottom(prices);
      if (doubleBottom) patterns.push({ ...doubleBottom, symbol });

      const triangle = this.detectTriangle(prices);
      if (triangle) patterns.push({ ...triangle, symbol });

      // Sort by confidence
      patterns.sort((a, b) => b.confidence - a.confidence);

      return patterns;
    } catch (error) {
      console.error(`❌ Error detecting patterns for ${symbol}:`, error);
      return [];
    }
  }
}

export default PatternRecognition;