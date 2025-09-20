<?php
/**
 * Technical Analysis Engine
 * Calculates real trading indicators and generates technical signals
 */

class TechnicalAnalysis {
    
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