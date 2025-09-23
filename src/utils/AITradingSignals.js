/**
 * REAL AI TRADING SIGNALS ENGINE
 * Combines technical analysis, pattern recognition, and market data
 * for genuine trading signals
 */

import TechnicalAnalysis from './TechnicalAnalysis.js';
import PatternRecognition from './PatternRecognition.js';
import BinanceDataFetcher from './BinanceDataFetcher.js';

export class AITradingSignals {
  constructor() {
    this.technicalAnalysis = new TechnicalAnalysis();
    this.patternRecognition = new PatternRecognition();
    this.dataFetcher = new BinanceDataFetcher();
    
    this.symbols = ['BTCUSDT', 'ETHUSDT', 'ADAUSDT'];
    this.analysisCache = new Map();
    this.lastAnalysis = null;
    
    // Signal weights for different analysis types
    this.weights = {
      technical: 0.4,      // 40% weight to technical indicators
      pattern: 0.3,        // 30% weight to chart patterns
      momentum: 0.2,       // 20% weight to momentum analysis
      volume: 0.1          // 10% weight to volume analysis
    };
  }

  // Generate comprehensive analysis for a symbol
  async analyzeSymbol(symbol, interval = '1h', lookback = 100) {
    try {
      console.log(`🔍 Analyzing ${symbol} with ${interval} timeframe...`);
      
      // Fetch historical data
      const priceData = await this.dataFetcher.getPriceArrays(symbol, interval, lookback);
      if (!priceData || priceData.closes.length < 50) {
        console.warn(`⚠️ Insufficient data for ${symbol}`);
        return null;
      }

      // Get 24hr stats for additional context
      const stats24hr = await this.dataFetcher.get24hrStats(symbol);
      
      // Technical analysis
      const technicalAnalysis = await this.technicalAnalysis.analyzeSymbol(
        symbol, 
        priceData.closes, 
        priceData.highs, 
        priceData.lows, 
        priceData.closes
      );

      // Pattern recognition
      const patterns = this.patternRecognition.detectPatterns(priceData.closes, symbol);
      
      // Volume analysis
      const volumeAnalysis = this.analyzeVolume(priceData.volumes, priceData.closes);
      
      // Market structure analysis
      const marketStructure = this.analyzeMarketStructure(priceData);
      
      // Generate combined signal
      const combinedSignal = this.generateCombinedSignal(
        technicalAnalysis,
        patterns,
        volumeAnalysis,
        marketStructure,
        stats24hr
      );

      const analysis = {
        symbol: symbol.replace('USDT', ''),
        timestamp: new Date().toISOString(),
        timeframe: interval,
        currentPrice: priceData.closes[priceData.closes.length - 1],
        technicalAnalysis,
        patterns,
        volumeAnalysis,
        marketStructure,
        stats24hr,
        signal: combinedSignal,
        confidence: combinedSignal.confidence,
        recommendation: this.generateRecommendation(combinedSignal),
        riskAssessment: this.assessRisk(technicalAnalysis, patterns, volumeAnalysis)
      };

      console.log(`✅ Analysis complete for ${symbol}: ${combinedSignal.signal} (${combinedSignal.confidence}%)`);
      return analysis;

    } catch (error) {
      console.error(`❌ Error analyzing ${symbol}:`, error.message);
      return null;
    }
  }

  // Analyze volume patterns
  analyzeVolume(volumes, prices) {
    if (volumes.length < 20) return null;

    const recentVolumes = volumes.slice(-20);
    const avgVolume = recentVolumes.reduce((sum, vol) => sum + vol, 0) / recentVolumes.length;
    const currentVolume = volumes[volumes.length - 1];
    
    const volumeSpike = currentVolume > avgVolume * 1.5;
    const volumeTrend = this.calculateVolumeTrend(volumes.slice(-10));
    
    // Price-volume divergence analysis
    const priceTrend = prices[prices.length - 1] > prices[prices.length - 10];
    const volumeIncrease = currentVolume > volumes[volumes.length - 10];
    
    const divergence = (priceTrend && !volumeIncrease) || (!priceTrend && volumeIncrease);

    return {
      currentVolume,
      avgVolume,
      volumeRatio: currentVolume / avgVolume,
      volumeSpike,
      volumeTrend,
      divergence,
      signal: this.getVolumeSignal(volumeSpike, volumeTrend, divergence)
    };
  }

  calculateVolumeTrend(volumes) {
    if (volumes.length < 5) return 'NEUTRAL';
    
    const firstHalf = volumes.slice(0, Math.floor(volumes.length / 2));
    const secondHalf = volumes.slice(Math.floor(volumes.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, vol) => sum + vol, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, vol) => sum + vol, 0) / secondHalf.length;
    
    const change = (secondAvg - firstAvg) / firstAvg;
    
    if (change > 0.1) return 'INCREASING';
    if (change < -0.1) return 'DECREASING';
    return 'STABLE';
  }

  getVolumeSignal(volumeSpike, volumeTrend, divergence) {
    if (volumeSpike && volumeTrend === 'INCREASING') return 'BULLISH';
    if (divergence) return 'BEARISH';
    if (volumeTrend === 'DECREASING') return 'NEUTRAL';
    return 'BULLISH';
  }

  // Analyze market structure (support/resistance levels)
  analyzeMarketStructure(priceData) {
    const prices = priceData.closes;
    const highs = priceData.highs;
    const lows = priceData.lows;
    
    if (prices.length < 50) return null;

    // Find key support and resistance levels
    const supportLevels = this.findSupportLevels(lows);
    const resistanceLevels = this.findResistanceLevels(highs);
    
    // Current price position relative to structure
    const currentPrice = prices[prices.length - 1];
    const nearestSupport = this.findNearestLevel(currentPrice, supportLevels, 'below');
    const nearestResistance = this.findNearestLevel(currentPrice, resistanceLevels, 'above');
    
    // Calculate price position as percentage
    const pricePosition = nearestSupport && nearestResistance ? 
      ((currentPrice - nearestSupport) / (nearestResistance - nearestSupport)) * 100 : 50;

    return {
      supportLevels: supportLevels.slice(0, 3), // Top 3 support levels
      resistanceLevels: resistanceLevels.slice(0, 3), // Top 3 resistance levels
      nearestSupport,
      nearestResistance,
      pricePosition,
      structureSignal: this.getStructureSignal(pricePosition, currentPrice, nearestSupport, nearestResistance)
    };
  }

  findSupportLevels(lows) {
    const levels = [];
    const tolerance = 0.02; // 2% tolerance
    
    for (let i = 0; i < lows.length; i++) {
      const level = lows[i];
      let touchCount = 0;
      
      for (let j = 0; j < lows.length; j++) {
        if (Math.abs(lows[j] - level) / level < tolerance) {
          touchCount++;
        }
      }
      
      if (touchCount >= 2) {
        levels.push({ price: level, strength: touchCount, index: i });
      }
    }
    
    // Sort by strength and remove duplicates
    return levels
      .sort((a, b) => b.strength - a.strength)
      .filter((level, index, arr) => 
        index === 0 || Math.abs(level.price - arr[index - 1].price) / level.price > tolerance
      );
  }

  findResistanceLevels(highs) {
    const levels = [];
    const tolerance = 0.02;
    
    for (let i = 0; i < highs.length; i++) {
      const level = highs[i];
      let touchCount = 0;
      
      for (let j = 0; j < highs.length; j++) {
        if (Math.abs(highs[j] - level) / level < tolerance) {
          touchCount++;
        }
      }
      
      if (touchCount >= 2) {
        levels.push({ price: level, strength: touchCount, index: i });
      }
    }
    
    return levels
      .sort((a, b) => b.strength - a.strength)
      .filter((level, index, arr) => 
        index === 0 || Math.abs(level.price - arr[index - 1].price) / level.price > tolerance
      );
  }

  findNearestLevel(currentPrice, levels, direction) {
    const filtered = direction === 'below' ? 
      levels.filter(l => l.price < currentPrice) :
      levels.filter(l => l.price > currentPrice);
    
    if (filtered.length === 0) return null;
    
    return direction === 'below' ? 
      Math.max(...filtered.map(l => l.price)) :
      Math.min(...filtered.map(l => l.price));
  }

  getStructureSignal(pricePosition, currentPrice, support, resistance) {
    if (pricePosition < 20) return 'BULLISH'; // Near support
    if (pricePosition > 80) return 'BEARISH'; // Near resistance
    if (pricePosition >= 40 && pricePosition <= 60) return 'NEUTRAL'; // Middle range
    return 'NEUTRAL';
  }

  // Generate combined signal from all analyses
  generateCombinedSignal(technical, patterns, volume, structure, stats24hr) {
    let bullishScore = 0;
    let bearishScore = 0;
    let confidence = 50;
    
    const signals = [];

    // Technical analysis signals
    if (technical && technical.signal) {
      const weight = this.weights.technical;
      if (technical.signal.signal === 'BUY') {
        bullishScore += technical.signal.confidence * weight;
        signals.push(`Technical: ${technical.signal.signal} (${technical.signal.confidence}%)`);
      } else if (technical.signal.signal === 'SELL') {
        bearishScore += technical.signal.confidence * weight;
        signals.push(`Technical: ${technical.signal.signal} (${technical.signal.confidence}%)`);
      }
    }

    // Pattern analysis signals
    if (patterns && patterns.length > 0) {
      const weight = this.weights.pattern;
      const strongestPattern = patterns[0]; // Highest confidence pattern
      
      if (strongestPattern.prediction === 'BULLISH') {
        bullishScore += strongestPattern.confidence * weight;
        signals.push(`Pattern: ${strongestPattern.pattern} BULLISH (${strongestPattern.confidence}%)`);
      } else if (strongestPattern.prediction === 'BEARISH') {
        bearishScore += strongestPattern.confidence * weight;
        signals.push(`Pattern: ${strongestPattern.pattern} BEARISH (${strongestPattern.confidence}%)`);
      }
    }

    // Volume analysis signals
    if (volume) {
      const weight = this.weights.volume;
      if (volume.signal === 'BULLISH') {
        bullishScore += 70 * weight;
        signals.push(`Volume: BULLISH (${volume.volumeTrend})`);
      } else if (volume.signal === 'BEARISH') {
        bearishScore += 70 * weight;
        signals.push(`Volume: BEARISH (${volume.divergence ? 'Divergence' : 'Weak'})`);
      }
    }

    // Market structure signals
    if (structure) {
      const weight = this.weights.momentum;
      if (structure.structureSignal === 'BULLISH') {
        bullishScore += 60 * weight;
        signals.push(`Structure: Near Support (${structure.pricePosition.toFixed(1)}%)`);
      } else if (structure.structureSignal === 'BEARISH') {
        bearishScore += 60 * weight;
        signals.push(`Structure: Near Resistance (${structure.pricePosition.toFixed(1)}%)`);
      }
    }

    // 24hr momentum
    if (stats24hr) {
      const momentum = parseFloat(stats24hr.priceChangePercent);
      if (momentum > 2) {
        bullishScore += 10;
        signals.push(`24h: +${momentum.toFixed(2)}% (Strong momentum)`);
      } else if (momentum < -2) {
        bearishScore += 10;
        signals.push(`24h: ${momentum.toFixed(2)}% (Weak momentum)`);
      }
    }

    // Calculate final signal
    const totalScore = bullishScore + bearishScore;
    if (totalScore > 0) {
      confidence = Math.min(Math.max((Math.abs(bullishScore - bearishScore) / totalScore) * 100, 55), 95);
    }

    let finalSignal = 'HOLD';
    if (bullishScore > bearishScore + 10) {
      finalSignal = 'BUY';
    } else if (bearishScore > bullishScore + 10) {
      finalSignal = 'SELL';
    }

    return {
      signal: finalSignal,
      confidence: Math.round(confidence),
      bullishScore: Math.round(bullishScore),
      bearishScore: Math.round(bearishScore),
      signals,
      strength: confidence > 80 ? 'STRONG' : confidence > 65 ? 'MEDIUM' : 'WEAK',
      timestamp: new Date().toISOString()
    };
  }

  // Generate trading recommendation
  generateRecommendation(signal) {
    const recommendations = [];
    
    if (signal.signal === 'BUY') {
      recommendations.push(`${signal.confidence > 75 ? 'Strong' : 'Moderate'} BUY signal detected`);
      recommendations.push('Consider entering long position');
      if (signal.confidence < 70) {
        recommendations.push('Wait for confirmation on next timeframe');
      }
    } else if (signal.signal === 'SELL') {
      recommendations.push(`${signal.confidence > 75 ? 'Strong' : 'Moderate'} SELL signal detected`);
      recommendations.push('Consider exiting long positions or entering short');
      if (signal.confidence < 70) {
        recommendations.push('Wait for confirmation on next timeframe');
      }
    } else {
      recommendations.push('HOLD - No clear directional bias');
      recommendations.push('Wait for better setup');
    }

    return recommendations;
  }

  // Assess risk level
  assessRisk(technical, patterns, volume) {
    let riskScore = 0;
    
    // High volatility increases risk
    if (technical && technical.indicators && technical.indicators.bollinger) {
      const bandwidth = technical.indicators.bollinger.bandwidth;
      if (bandwidth > 10) riskScore += 2;
      else if (bandwidth > 5) riskScore += 1;
    }

    // Volume divergence increases risk
    if (volume && volume.divergence) riskScore += 1;

    // Multiple conflicting patterns increase risk
    if (patterns && patterns.length > 2) riskScore += 1;

    if (riskScore >= 3) return 'HIGH';
    if (riskScore >= 2) return 'MEDIUM';
    return 'LOW';
  }

  // Analyze multiple symbols
  async analyzeMultipleSymbols(symbols = this.symbols, interval = '1h') {
    console.log(`🚀 Starting analysis for ${symbols.length} symbols...`);
    
    const results = [];
    
    for (const symbol of symbols) {
      try {
        const analysis = await this.analyzeSymbol(symbol, interval);
        if (analysis) {
          results.push(analysis);
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ Failed to analyze ${symbol}:`, error.message);
      }
    }
    
    // Sort by confidence
    results.sort((a, b) => b.confidence - a.confidence);
    
    this.lastAnalysis = {
      timestamp: new Date().toISOString(),
      results,
      summary: this.generateSummary(results)
    };
    
    console.log(`✅ Analysis complete for ${results.length}/${symbols.length} symbols`);
    return this.lastAnalysis;
  }

  // Generate market summary
  generateSummary(results) {
    const buySignals = results.filter(r => r.signal.signal === 'BUY').length;
    const sellSignals = results.filter(r => r.signal.signal === 'SELL').length;
    const holdSignals = results.filter(r => r.signal.signal === 'HOLD').length;
    
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
    
    let marketSentiment = 'NEUTRAL';
    if (buySignals > sellSignals + holdSignals) marketSentiment = 'BULLISH';
    else if (sellSignals > buySignals + holdSignals) marketSentiment = 'BEARISH';
    
    return {
      totalSymbols: results.length,
      buySignals,
      sellSignals,
      holdSignals,
      avgConfidence: Math.round(avgConfidence),
      marketSentiment,
      strongSignals: results.filter(r => r.signal.confidence > 75).length
    };
  }

  // Get latest analysis results
  getLatestAnalysis() {
    return this.lastAnalysis;
  }

  // Clear cache
  clearCache() {
    this.analysisCache.clear();
    this.dataFetcher.clearCache();
    console.log('🗑️ All caches cleared');
  }
}

export default AITradingSignals;