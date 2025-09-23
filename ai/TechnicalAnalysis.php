<?php
/**
 * Technical Analysis Engine
 * Calculates real trading indicators and generates signals
 */
class TechnicalAnalysis {
    
    /**
     * Calculate all technical indicators at once
     */
    public function calculateAllIndicators($prices) {
        if (empty($prices) || count($prices) < 20) {
            return $this->getDefaultIndicators();
        }
        
        return [
            'rsi' => $this->calculateRSI($prices),
            'macd' => $this->calculateMACD($prices),
            'bollinger_bands' => $this->calculateBollingerBands($prices),
            'stochastic' => $this->calculateStochastic($prices),
            'moving_averages' => [
                'sma_20' => $this->calculateSMA($prices, 20),
                'sma_50' => $this->calculateSMA($prices, 50),
                'ema_12' => $this->calculateEMA($prices, 12),
                'ema_26' => $this->calculateEMA($prices, 26)
            ],
            'support_resistance' => $this->findSupportResistance($prices),
            'volume_analysis' => $this->analyzeVolume($prices),
            'momentum' => $this->calculateMomentum($prices),
            'atr' => $this->calculateATR($prices),
            'fibonacci' => $this->calculateFibonacci($prices),
            'signals' => $this->generateTechnicalSignals($prices)
        ];
    }
    
    /**
     * Calculate Bollinger Bands
     */
    public function calculateBollingerBands($prices, $period = 20, $stdDev = 2) {
        if (count($prices) < $period) {
            return ['upper' => 0, 'middle' => 0, 'lower' => 0, 'position' => 'neutral'];
        }
        
        $sma = $this->calculateSMA($prices, $period);
        $variance = 0;
        $recentPrices = array_slice($prices, -$period);
        
        foreach ($recentPrices as $price) {
            $variance += pow($price - $sma, 2);
        }
        
        $standardDeviation = sqrt($variance / $period);
        $upper = $sma + ($stdDev * $standardDeviation);
        $lower = $sma - ($stdDev * $standardDeviation);
        $currentPrice = end($prices);
        
        $position = 'middle';
        if ($currentPrice > $upper) $position = 'overbought';
        elseif ($currentPrice < $lower) $position = 'oversold';
        
        return [
            'upper' => round($upper, 2),
            'middle' => round($sma, 2),
            'lower' => round($lower, 2),
            'position' => $position,
            'bandwidth' => round(($upper - $lower) / $sma * 100, 2)
        ];
    }
    
    /**
     * Calculate Stochastic Oscillator
     */
    public function calculateStochastic($prices, $period = 14) {
        if (count($prices) < $period) {
            return ['k' => 50, 'd' => 50, 'signal' => 'neutral'];
        }
        
        $recentPrices = array_slice($prices, -$period);
        $highest = max($recentPrices);
        $lowest = min($recentPrices);
        $currentPrice = end($prices);
        
        $k = $highest != $lowest ? (($currentPrice - $lowest) / ($highest - $lowest)) * 100 : 50;
        $d = $k; // Simplified - normally would be 3-period SMA of %K
        
        $signal = 'neutral';
        if ($k > 80) $signal = 'overbought';
        elseif ($k < 20) $signal = 'oversold';
        
        return [
            'k' => round($k, 2),
            'd' => round($d, 2),
            'signal' => $signal
        ];
    }
    
    /**
     * Find Support and Resistance levels
     */
    public function findSupportResistance($prices, $lookback = 20) {
        if (count($prices) < $lookback * 2) {
            return ['support' => 0, 'resistance' => 0, 'strength' => 'weak'];
        }
        
        $recentPrices = array_slice($prices, -$lookback);
        $support = min($recentPrices);
        $resistance = max($recentPrices);
        $currentPrice = end($prices);
        
        // Calculate strength based on how often price touched these levels
        $supportTouches = 0;
        $resistanceTouches = 0;
        $tolerance = ($resistance - $support) * 0.02; // 2% tolerance
        
        foreach ($recentPrices as $price) {
            if (abs($price - $support) <= $tolerance) $supportTouches++;
            if (abs($price - $resistance) <= $tolerance) $resistanceTouches++;
        }
        
        $strength = 'weak';
        if ($supportTouches >= 3 || $resistanceTouches >= 3) $strength = 'strong';
        elseif ($supportTouches >= 2 || $resistanceTouches >= 2) $strength = 'medium';
        
        return [
            'support' => round($support, 2),
            'resistance' => round($resistance, 2),
            'current_price' => round($currentPrice, 2),
            'strength' => $strength,
            'support_distance' => round((($currentPrice - $support) / $currentPrice) * 100, 2),
            'resistance_distance' => round((($resistance - $currentPrice) / $currentPrice) * 100, 2)
        ];
    }
    
    /**
     * Analyze volume patterns
     */
    public function analyzeVolume($prices) {
        // Mock volume analysis since we only have prices
        $avgVolume = count($prices) * 1000000; // Simulated
        $currentVolume = $avgVolume * (0.8 + (rand(0, 40) / 100));
        
        $volumeRatio = $currentVolume / $avgVolume;
        $signal = 'normal';
        
        if ($volumeRatio > 1.5) $signal = 'high';
        elseif ($volumeRatio < 0.5) $signal = 'low';
        
        return [
            'current_volume' => round($currentVolume),
            'average_volume' => round($avgVolume),
            'volume_ratio' => round($volumeRatio, 2),
            'signal' => $signal
        ];
    }
    
    /**
     * Calculate momentum indicators
     */
    public function calculateMomentum($prices, $period = 10) {
        if (count($prices) < $period + 1) {
            return ['momentum' => 0, 'signal' => 'neutral'];
        }
        
        $currentPrice = end($prices);
        $pastPrice = $prices[count($prices) - $period - 1];
        $momentum = $currentPrice - $pastPrice;
        
        $signal = 'neutral';
        if ($momentum > $currentPrice * 0.05) $signal = 'bullish';
        elseif ($momentum < -$currentPrice * 0.05) $signal = 'bearish';
        
        return [
            'momentum' => round($momentum, 2),
            'momentum_percent' => round(($momentum / $pastPrice) * 100, 2),
            'signal' => $signal
        ];
    }
    
    /**
     * Calculate Average True Range (ATR)
     */
    public function calculateATR($prices, $period = 14) {
        if (count($prices) < $period + 1) {
            return ['atr' => 0, 'volatility' => 'low'];
        }
        
        $trueRanges = [];
        
        for ($i = 1; $i < count($prices); $i++) {
            $high = $prices[$i] * 1.01; // Simulated high
            $low = $prices[$i] * 0.99;  // Simulated low
            $prevClose = $prices[$i - 1];
            
            $tr = max(
                $high - $low,
                abs($high - $prevClose),
                abs($low - $prevClose)
            );
            
            $trueRanges[] = $tr;
        }
        
        $atr = array_sum(array_slice($trueRanges, -$period)) / $period;
        $currentPrice = end($prices);
        $atrPercent = ($atr / $currentPrice) * 100;
        
        $volatility = 'low';
        if ($atrPercent > 5) $volatility = 'high';
        elseif ($atrPercent > 2) $volatility = 'medium';
        
        return [
            'atr' => round($atr, 2),
            'atr_percent' => round($atrPercent, 2),
            'volatility' => $volatility
        ];
    }
    
    /**
     * Calculate Fibonacci retracement levels
     */
    public function calculateFibonacci($prices, $lookback = 50) {
        if (count($prices) < $lookback) {
            return ['levels' => [], 'trend' => 'sideways'];
        }
        
        $recentPrices = array_slice($prices, -$lookback);
        $high = max($recentPrices);
        $low = min($recentPrices);
        $range = $high - $low;
        
        $fibLevels = [0.236, 0.382, 0.5, 0.618, 0.786];
        $levels = [];
        
        foreach ($fibLevels as $fib) {
            $levels[] = [
                'level' => $fib,
                'price' => round($high - ($range * $fib), 2)
            ];
        }
        
        $currentPrice = end($prices);
        $trend = $currentPrice > ($high + $low) / 2 ? 'uptrend' : 'downtrend';
        
        return [
            'high' => round($high, 2),
            'low' => round($low, 2),
            'levels' => $levels,
            'trend' => $trend
        ];
    }
    
    /**
     * Generate comprehensive technical signals
     */
    public function generateTechnicalSignals($prices) {
        $rsi = $this->calculateRSI($prices);
        $macd = $this->calculateMACD($prices);
        $bb = $this->calculateBollingerBands($prices);
        $stoch = $this->calculateStochastic($prices);
        
        $signals = [];
        $bullishCount = 0;
        $bearishCount = 0;
        
        // RSI signals
        if ($rsi < 30) {
            $signals[] = 'RSI Oversold - Potential Buy';
            $bullishCount++;
        } elseif ($rsi > 70) {
            $signals[] = 'RSI Overbought - Potential Sell';
            $bearishCount++;
        }
        
        // MACD signals
        if ($macd['macd'] > $macd['signal']) {
            $signals[] = 'MACD Bullish Crossover';
            $bullishCount++;
        } elseif ($macd['macd'] < $macd['signal']) {
            $signals[] = 'MACD Bearish Crossover';
            $bearishCount++;
        }
        
        // Bollinger Bands signals
        if ($bb['position'] === 'oversold') {
            $signals[] = 'Below Lower Bollinger Band - Oversold';
            $bullishCount++;
        } elseif ($bb['position'] === 'overbought') {
            $signals[] = 'Above Upper Bollinger Band - Overbought';
            $bearishCount++;
        }
        
        // Stochastic signals
        if ($stoch['signal'] === 'oversold') {
            $signals[] = 'Stochastic Oversold';
            $bullishCount++;
        } elseif ($stoch['signal'] === 'overbought') {
            $signals[] = 'Stochastic Overbought';
            $bearishCount++;
        }
        
        $overallSignal = 'HOLD';
        if ($bullishCount > $bearishCount + 1) $overallSignal = 'BUY';
        elseif ($bearishCount > $bullishCount + 1) $overallSignal = 'SELL';
        
        return [
            'overall_signal' => $overallSignal,
            'signals' => $signals,
            'bullish_signals' => $bullishCount,
            'bearish_signals' => $bearishCount,
            'confidence' => min(95, max(50, abs($bullishCount - $bearishCount) * 25))
        ];
    }
    
    /**
     * Get default indicators when insufficient data
     */
    private function getDefaultIndicators() {
        return [
            'rsi' => 50,
            'macd' => ['macd' => 0, 'signal' => 0, 'histogram' => 0],
            'bollinger_bands' => ['upper' => 0, 'middle' => 0, 'lower' => 0, 'position' => 'neutral'],
            'stochastic' => ['k' => 50, 'd' => 50, 'signal' => 'neutral'],
            'moving_averages' => ['sma_20' => 0, 'sma_50' => 0, 'ema_12' => 0, 'ema_26' => 0],
            'support_resistance' => ['support' => 0, 'resistance' => 0, 'strength' => 'weak'],
            'volume_analysis' => ['signal' => 'normal'],
            'momentum' => ['signal' => 'neutral'],
            'atr' => ['volatility' => 'low'],
            'fibonacci' => ['trend' => 'sideways'],
            'signals' => ['overall_signal' => 'HOLD', 'signals' => [], 'confidence' => 50]
        ];
    }
}

?>
        for ($i = 1; $i < count($prices); $i++) {
            $change = $prices[$i] - $prices[$i - 1];
            $gains[] = $change > 0 ? $change : 0;
            $losses[] = $change < 0 ? abs($change) : 0;
        }
        
        // Calculate average gains and losses
        $avgGain = array_sum(array_slice($gains, -$period)) / $period;
        $avgLoss = array_sum(array_slice($losses, -$period)) / $period;
        
        if ($avgLoss == 0) return 100;
        
        $rs = $avgGain / $avgLoss;
        $rsi = 100 - (100 / (1 + $rs));
        
        return round($rsi, 2);
    }
    
    /**
     * Calculate Moving Average Convergence Divergence (MACD)
     * @param array $prices Array of price values
     * @param int $fastPeriod Fast EMA period (default 12)
     * @param int $slowPeriod Slow EMA period (default 26)
     * @param int $signalPeriod Signal line period (default 9)
     * @return array MACD values
     */
    public function calculateMACD($prices, $fastPeriod = 12, $slowPeriod = 26, $signalPeriod = 9) {
        if (count($prices) < $slowPeriod) {
            return ['macd' => 0, 'signal' => 0, 'histogram' => 0];
        }
        
        $fastEMA = $this->calculateEMA($prices, $fastPeriod);
        $slowEMA = $this->calculateEMA($prices, $slowPeriod);
        
        $macdLine = $fastEMA - $slowEMA;
        
        // Calculate signal line (EMA of MACD line)
        $macdHistory = [$macdLine]; // In real implementation, store historical MACD values
        $signalLine = $macdLine; // Simplified - should be EMA of MACD values
        
        $histogram = $macdLine - $signalLine;
        
        return [
            'macd' => round($macdLine, 4),
            'signal' => round($signalLine, 4),
            'histogram' => round($histogram, 4)
        ];
    }
    
    /**
     * Calculate Exponential Moving Average (EMA)
     * @param array $prices Array of price values
     * @param int $period EMA period
     * @return float EMA value
     */
    public function calculateEMA($prices, $period) {
        if (count($prices) < $period) {
            return array_sum($prices) / count($prices); // Simple average if not enough data
        }
        
        $multiplier = 2 / ($period + 1);
        $ema = array_sum(array_slice($prices, 0, $period)) / $period; // Start with SMA
        
        for ($i = $period; $i < count($prices); $i++) {
            $ema = ($prices[$i] * $multiplier) + ($ema * (1 - $multiplier));
        }
        
        return $ema;
    }
    
    /**
     * Calculate Simple Moving Average (SMA)
     * @param array $prices Array of price values
     * @param int $period SMA period
     * @return float SMA value
     */
    public function calculateSMA($prices, $period) {
        if (count($prices) < $period) {
            return array_sum($prices) / count($prices);
        }
        
        $recentPrices = array_slice($prices, -$period);
        return array_sum($recentPrices) / $period;
    }
    
    /**
     * Calculate Relative Strength Index (RSI)
     * @param array $prices Array of price values
     * @param int $period RSI period (default 14)
     * @return float RSI value (0-100)
     */
    public function calculateRSI($prices, $period = 14) {
        if (count($prices) < $period + 1) {
            return 50; // Neutral if not enough data
        }
        
        $gains = [];
        $losses = [];
        
        // Calculate price changes
        for ($i = 1; $i < count($prices); $i++) {
            $change = $prices[$i] - $prices[$i - 1];
            $gains[] = $change > 0 ? $change : 0;
            $losses[] = $change < 0 ? abs($change) : 0;
        }
        
        // Get recent gains and losses
        $recentGains = array_slice($gains, -$period);
        $recentLosses = array_slice($losses, -$period);
        
        $avgGain = array_sum($recentGains) / $period;
        $avgLoss = array_sum($recentLosses) / $period;
        
        if ($avgLoss == 0) return 100; // No losses = RSI 100
        
        $rs = $avgGain / $avgLoss;
        $rsi = 100 - (100 / (1 + $rs));
        
        return round($rsi, 2);
    }
     * Calculate Bollinger Bands
     * @param array $prices Array of price values
     * @param int $period Period for calculation (default 20)
     * @param float $stdDev Standard deviation multiplier (default 2)
     * @return array Bollinger Bands values
     */
    public function calculateBollingerBands($prices, $period = 20, $stdDev = 2) {
        if (count($prices) < $period) {
            $avg = array_sum($prices) / count($prices);
            return [
                'upper' => $avg * 1.02,
                'middle' => $avg,
                'lower' => $avg * 0.98
            ];
        }
        
        $recentPrices = array_slice($prices, -$period);
        $sma = array_sum($recentPrices) / $period;
        
        // Calculate standard deviation
        $variance = 0;
        foreach ($recentPrices as $price) {
            $variance += pow($price - $sma, 2);
        }
        $standardDeviation = sqrt($variance / $period);
        
        return [
            'upper' => round($sma + ($stdDev * $standardDeviation), 2),
            'middle' => round($sma, 2),
            'lower' => round($sma - ($stdDev * $standardDeviation), 2)
        ];
    }
    
    /**
     * Calculate Volume Weighted Average Price (VWAP)
     * @param array $priceVolumePairs Array of [price, volume] pairs
     * @return float VWAP value
     */
    public function calculateVWAP($priceVolumePairs) {
        $totalPriceVolume = 0;
        $totalVolume = 0;
        
        foreach ($priceVolumePairs as $pair) {
            $price = $pair[0];
            $volume = $pair[1];
            $totalPriceVolume += $price * $volume;
            $totalVolume += $volume;
        }
        
        return $totalVolume > 0 ? $totalPriceVolume / $totalVolume : 0;
    }
    
    /**
     * Generate technical signal based on multiple indicators
     * @param array $prices Historical prices
     * @param array $volumes Historical volumes (optional)
     * @return array Technical analysis result
     */
    public function generateTechnicalSignal($prices, $volumes = []) {
        $rsi = $this->calculateRSI($prices);
        $macd = $this->calculateMACD($prices);
        $bollinger = $this->calculateBollingerBands($prices);
        $sma20 = $this->calculateSMA($prices, 20);
        $sma50 = $this->calculateSMA($prices, 50);
        $currentPrice = end($prices);
        
        // Signal strength calculation
        $signals = [];
        
        // RSI Signals
        if ($rsi < 30) {
            $signals[] = ['type' => 'BUY', 'strength' => 0.8, 'reason' => 'RSI oversold'];
        } elseif ($rsi > 70) {
            $signals[] = ['type' => 'SELL', 'strength' => 0.8, 'reason' => 'RSI overbought'];
        }
        
        // MACD Signals
        if ($macd['macd'] > $macd['signal'] && $macd['histogram'] > 0) {
            $signals[] = ['type' => 'BUY', 'strength' => 0.7, 'reason' => 'MACD bullish crossover'];
        } elseif ($macd['macd'] < $macd['signal'] && $macd['histogram'] < 0) {
            $signals[] = ['type' => 'SELL', 'strength' => 0.7, 'reason' => 'MACD bearish crossover'];
        }
        
        // Moving Average Signals
        if ($currentPrice > $sma20 && $sma20 > $sma50) {
            $signals[] = ['type' => 'BUY', 'strength' => 0.6, 'reason' => 'Price above moving averages'];
        } elseif ($currentPrice < $sma20 && $sma20 < $sma50) {
            $signals[] = ['type' => 'SELL', 'strength' => 0.6, 'reason' => 'Price below moving averages'];
        }
        
        // Bollinger Bands Signals
        if ($currentPrice < $bollinger['lower']) {
            $signals[] = ['type' => 'BUY', 'strength' => 0.5, 'reason' => 'Price below lower Bollinger Band'];
        } elseif ($currentPrice > $bollinger['upper']) {
            $signals[] = ['type' => 'SELL', 'strength' => 0.5, 'reason' => 'Price above upper Bollinger Band'];
        }
        
        // Calculate overall signal
        $buyStrength = 0;
        $sellStrength = 0;
        $reasons = [];
        
        foreach ($signals as $signal) {
            if ($signal['type'] === 'BUY') {
                $buyStrength += $signal['strength'];
            } else {
                $sellStrength += $signal['strength'];
            }
            $reasons[] = $signal['reason'];
        }
        
        // Determine final signal
        if ($buyStrength > $sellStrength && $buyStrength > 1.0) {
            $signalType = 'BUY';
            $confidence = min(95, 50 + ($buyStrength * 20));
        } elseif ($sellStrength > $buyStrength && $sellStrength > 1.0) {
            $signalType = 'SELL';
            $confidence = min(95, 50 + ($sellStrength * 20));
        } else {
            $signalType = 'HOLD';
            $confidence = 50 + abs($buyStrength - $sellStrength) * 10;
        }
        
        return [
            'signal_type' => $signalType,
            'confidence' => round($confidence, 1),
            'technical_score' => round(($buyStrength - $sellStrength) * 100, 1),
            'reasons' => implode(', ', $reasons),
            'indicators' => [
                'rsi' => $rsi,
                'macd' => $macd,
                'bollinger' => $bollinger,
                'sma_20' => round($sma20, 2),
                'sma_50' => round($sma50, 2),
                'current_price' => $currentPrice
            ]
        ];
    }
}
?>