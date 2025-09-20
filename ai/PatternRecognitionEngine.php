<?php
/**
 * Pattern Recognition Engine
 * Identifies trading patterns and chart formations in cryptocurrency price data
 */

class PatternRecognitionEngine {
    
    private $patterns = [
        'head_and_shoulders',
        'double_top',
        'double_bottom',
        'triangle_ascending',
        'triangle_descending',
        'triangle_symmetrical',
        'wedge_rising',
        'wedge_falling',
        'flag_bullish',
        'flag_bearish',
        'pennant',
        'cup_and_handle',
        'inverse_head_shoulders'
    ];
    
    private $candlestickPatterns = [
        'doji',
        'hammer',
        'shooting_star',
        'engulfing_bullish',
        'engulfing_bearish',
        'morning_star',
        'evening_star',
        'piercing_line',
        'dark_cloud_cover',
        'harami_bullish',
        'harami_bearish'
    ];
    
    /**
     * Detect chart patterns in price data
     */
    public function detectChartPatterns($priceData, $minPatternLength = 20) {
        $detectedPatterns = [];
        
        if (count($priceData) < $minPatternLength) {
            return $detectedPatterns;
        }
        
        // Extract highs and lows for pattern analysis
        $highs = array_column($priceData, 'high');
        $lows = array_column($priceData, 'low');
        $closes = array_column($priceData, 'close');
        
        // Detect each pattern type
        foreach ($this->patterns as $patternType) {
            $pattern = $this->{'detect' . ucfirst(str_replace('_', '', $patternType))}($highs, $lows, $closes);
            if ($pattern) {
                $pattern['pattern_type'] = $patternType;
                $pattern['detection_timestamp'] = date('Y-m-d H:i:s');
                $detectedPatterns[] = $pattern;
            }
        }
        
        return $detectedPatterns;
    }
    
    /**
     * Detect Head and Shoulders pattern
     */
    private function detectHeadandshoulders($highs, $lows, $closes) {
        $length = count($highs);
        if ($length < 30) return false;
        
        // Look for three peaks with middle peak higher
        for ($i = 10; $i < $length - 10; $i++) {
            $leftShoulder = $this->findLocalPeak($highs, $i - 10, $i - 5);
            $head = $this->findLocalPeak($highs, $i - 5, $i + 5);
            $rightShoulder = $this->findLocalPeak($highs, $i + 5, $i + 10);
            
            if ($leftShoulder && $head && $rightShoulder) {
                $leftShoulderPrice = $highs[$leftShoulder];
                $headPrice = $highs[$head];
                $rightShoulderPrice = $highs[$rightShoulder];
                
                // Check if head is higher and shoulders are roughly equal
                if ($headPrice > $leftShoulderPrice && $headPrice > $rightShoulderPrice) {
                    $shoulderDiff = abs($leftShoulderPrice - $rightShoulderPrice) / $leftShoulderPrice;
                    
                    if ($shoulderDiff < 0.05) { // 5% tolerance
                        return [
                            'confidence' => 85 - ($shoulderDiff * 100),
                            'signal' => 'BEARISH',
                            'target_price' => $this->calculateHeadShouldersTarget($highs, $lows, $leftShoulder, $head, $rightShoulder),
                            'neckline' => ($lows[$leftShoulder] + $lows[$rightShoulder]) / 2,
                            'formation_points' => [
                                'left_shoulder' => $leftShoulderPrice,
                                'head' => $headPrice,
                                'right_shoulder' => $rightShoulderPrice
                            ]
                        ];
                    }
                }
            }
        }
        
        return false;
    }
    
    /**
     * Detect Double Top pattern
     */
    private function detectDoubletop($highs, $lows, $closes) {
        $length = count($highs);
        if ($length < 20) return false;
        
        for ($i = 10; $i < $length - 10; $i++) {
            $peak1 = $this->findLocalPeak($highs, $i - 10, $i);
            $peak2 = $this->findLocalPeak($highs, $i, $i + 10);
            
            if ($peak1 && $peak2 && $peak1 != $peak2) {
                $peak1Price = $highs[$peak1];
                $peak2Price = $highs[$peak2];
                $priceDiff = abs($peak1Price - $peak2Price) / $peak1Price;
                
                if ($priceDiff < 0.03) { // 3% tolerance for double top
                    $valley = $this->findLocalTrough($lows, $peak1, $peak2);
                    if ($valley) {
                        return [
                            'confidence' => 80 - ($priceDiff * 100),
                            'signal' => 'BEARISH',
                            'target_price' => $lows[$valley] - ($peak1Price - $lows[$valley]),
                            'resistance_level' => ($peak1Price + $peak2Price) / 2,
                            'formation_points' => [
                                'peak1' => $peak1Price,
                                'peak2' => $peak2Price,
                                'valley' => $lows[$valley]
                            ]
                        ];
                    }
                }
            }
        }
        
        return false;
    }
    
    /**
     * Detect Double Bottom pattern
     */
    private function detectDoublebottom($highs, $lows, $closes) {
        $length = count($lows);
        if ($length < 20) return false;
        
        for ($i = 10; $i < $length - 10; $i++) {
            $trough1 = $this->findLocalTrough($lows, $i - 10, $i);
            $trough2 = $this->findLocalTrough($lows, $i, $i + 10);
            
            if ($trough1 && $trough2 && $trough1 != $trough2) {
                $trough1Price = $lows[$trough1];
                $trough2Price = $lows[$trough2];
                $priceDiff = abs($trough1Price - $trough2Price) / $trough1Price;
                
                if ($priceDiff < 0.03) { // 3% tolerance
                    $peak = $this->findLocalPeak($highs, $trough1, $trough2);
                    if ($peak) {
                        return [
                            'confidence' => 80 - ($priceDiff * 100),
                            'signal' => 'BULLISH',
                            'target_price' => $highs[$peak] + ($highs[$peak] - $trough1Price),
                            'support_level' => ($trough1Price + $trough2Price) / 2,
                            'formation_points' => [
                                'trough1' => $trough1Price,
                                'trough2' => $trough2Price,
                                'peak' => $highs[$peak]
                            ]
                        ];
                    }
                }
            }
        }
        
        return false;
    }
    
    /**
     * Detect Ascending Triangle pattern
     */
    private function detectTriangleascending($highs, $lows, $closes) {
        $length = count($highs);
        if ($length < 30) return false;
        
        // Look for horizontal resistance and rising support
        for ($i = 15; $i < $length - 15; $i++) {
            $resistanceLevel = $this->findHorizontalResistance($highs, $i - 15, $i + 15);
            $supportTrend = $this->findRisingSupport($lows, $i - 15, $i + 15);
            
            if ($resistanceLevel && $supportTrend) {
                $convergencePoint = $this->calculateConvergence($resistanceLevel, $supportTrend, $i);
                
                if ($convergencePoint && $convergencePoint > 0) {
                    return [
                        'confidence' => 75,
                        'signal' => 'BULLISH',
                        'breakout_target' => $resistanceLevel['level'] + ($resistanceLevel['level'] - $supportTrend['start_price']),
                        'resistance_level' => $resistanceLevel['level'],
                        'support_trend' => $supportTrend,
                        'convergence_in_bars' => $convergencePoint
                    ];
                }
            }
        }
        
        return false;
    }
    
    /**
     * Detect candlestick patterns
     */
    public function detectCandlestickPatterns($candleData) {
        $detectedPatterns = [];
        
        foreach ($this->candlestickPatterns as $patternType) {
            $pattern = $this->{'detect' . ucfirst(str_replace('_', '', $patternType)) . 'Candle'}($candleData);
            if ($pattern) {
                $pattern['pattern_type'] = $patternType;
                $pattern['detection_timestamp'] = date('Y-m-d H:i:s');
                $detectedPatterns[] = $pattern;
            }
        }
        
        return $detectedPatterns;
    }
    
    /**
     * Detect Doji candlestick pattern
     */
    private function detectDojiCandle($candleData) {
        $length = count($candleData);
        if ($length < 3) return false;
        
        $lastCandle = $candleData[$length - 1];
        $open = $lastCandle['open'];
        $close = $lastCandle['close'];
        $high = $lastCandle['high'];
        $low = $lastCandle['low'];
        
        $bodySize = abs($close - $open);
        $totalRange = $high - $low;
        
        // Doji: very small body relative to the total range
        if ($bodySize / $totalRange < 0.1) {
            return [
                'confidence' => 70,
                'signal' => 'REVERSAL',
                'description' => 'Doji indicates market indecision and potential reversal',
                'candle_data' => $lastCandle
            ];
        }
        
        return false;
    }
    
    /**
     * Detect Hammer candlestick pattern
     */
    private function detectHammerCandle($candleData) {
        $length = count($candleData);
        if ($length < 3) return false;
        
        $lastCandle = $candleData[$length - 1];
        $open = $lastCandle['open'];
        $close = $lastCandle['close'];
        $high = $lastCandle['high'];
        $low = $lastCandle['low'];
        
        $bodySize = abs($close - $open);
        $lowerShadow = min($open, $close) - $low;
        $upperShadow = $high - max($open, $close);
        
        // Hammer: small body, long lower shadow, minimal upper shadow
        if ($lowerShadow > $bodySize * 2 && $upperShadow < $bodySize * 0.5) {
            return [
                'confidence' => 75,
                'signal' => 'BULLISH',
                'description' => 'Hammer indicates potential bullish reversal',
                'candle_data' => $lastCandle
            ];
        }
        
        return false;
    }
    
    /**
     * Detect Engulfing Bullish pattern
     */
    private function detectEngulfingbullishCandle($candleData) {
        $length = count($candleData);
        if ($length < 2) return false;
        
        $prevCandle = $candleData[$length - 2];
        $currCandle = $candleData[$length - 1];
        
        // Previous candle should be bearish, current should be bullish and engulf previous
        $prevBearish = $prevCandle['close'] < $prevCandle['open'];
        $currBullish = $currCandle['close'] > $currCandle['open'];
        $engulfs = $currCandle['open'] < $prevCandle['close'] && $currCandle['close'] > $prevCandle['open'];
        
        if ($prevBearish && $currBullish && $engulfs) {
            return [
                'confidence' => 80,
                'signal' => 'BULLISH',
                'description' => 'Bullish Engulfing pattern indicates strong buying pressure',
                'candle_data' => [$prevCandle, $currCandle]
            ];
        }
        
        return false;
    }
    
    /**
     * Helper function to find local peaks
     */
    private function findLocalPeak($data, $start, $end) {
        $maxValue = -PHP_FLOAT_MAX;
        $maxIndex = false;
        
        for ($i = max(0, $start); $i <= min(count($data) - 1, $end); $i++) {
            if ($data[$i] > $maxValue) {
                $maxValue = $data[$i];
                $maxIndex = $i;
            }
        }
        
        return $maxIndex;
    }
    
    /**
     * Helper function to find local troughs
     */
    private function findLocalTrough($data, $start, $end) {
        $minValue = PHP_FLOAT_MAX;
        $minIndex = false;
        
        for ($i = max(0, $start); $i <= min(count($data) - 1, $end); $i++) {
            if ($data[$i] < $minValue) {
                $minValue = $data[$i];
                $minIndex = $i;
            }
        }
        
        return $minIndex;
    }
    
    /**
     * Find horizontal resistance level
     */
    private function findHorizontalResistance($highs, $start, $end) {
        $peaks = [];
        
        // Find all peaks in the range
        for ($i = $start + 2; $i < $end - 2; $i++) {
            if ($highs[$i] > $highs[$i-1] && $highs[$i] > $highs[$i+1]) {
                $peaks[] = ['index' => $i, 'price' => $highs[$i]];
            }
        }
        
        if (count($peaks) < 2) return false;
        
        // Check if peaks form horizontal resistance
        $avgPrice = array_sum(array_column($peaks, 'price')) / count($peaks);
        $maxDeviation = 0;
        
        foreach ($peaks as $peak) {
            $deviation = abs($peak['price'] - $avgPrice) / $avgPrice;
            $maxDeviation = max($maxDeviation, $deviation);
        }
        
        if ($maxDeviation < 0.02) { // 2% tolerance
            return ['level' => $avgPrice, 'touches' => count($peaks)];
        }
        
        return false;
    }
    
    /**
     * Find rising support trend
     */
    private function findRisingSupport($lows, $start, $end) {
        $troughs = [];
        
        // Find all troughs in the range
        for ($i = $start + 2; $i < $end - 2; $i++) {
            if ($lows[$i] < $lows[$i-1] && $lows[$i] < $lows[$i+1]) {
                $troughs[] = ['index' => $i, 'price' => $lows[$i]];
            }
        }
        
        if (count($troughs) < 2) return false;
        
        // Calculate trend line slope
        $firstTrough = $troughs[0];
        $lastTrough = end($troughs);
        
        $slope = ($lastTrough['price'] - $firstTrough['price']) / ($lastTrough['index'] - $firstTrough['index']);
        
        if ($slope > 0) { // Rising support
            return [
                'start_price' => $firstTrough['price'],
                'end_price' => $lastTrough['price'],
                'slope' => $slope,
                'touches' => count($troughs)
            ];
        }
        
        return false;
    }
    
    /**
     * Calculate target price for Head and Shoulders
     */
    private function calculateHeadShouldersTarget($highs, $lows, $leftShoulder, $head, $rightShoulder) {
        $neckline = ($lows[$leftShoulder] + $lows[$rightShoulder]) / 2;
        $headHeight = $highs[$head] - $neckline;
        return $neckline - $headHeight;
    }
    
    /**
     * Calculate convergence point for triangles
     */
    private function calculateConvergence($resistance, $support, $currentIndex) {
        if (!$resistance || !$support) return false;
        
        // Simplified convergence calculation
        $resistanceLevel = $resistance['level'];
        $supportSlope = $support['slope'];
        $supportCurrentPrice = $support['start_price'] + ($supportSlope * $currentIndex);
        
        if ($supportSlope <= 0) return false;
        
        $barsToConvergence = ($resistanceLevel - $supportCurrentPrice) / $supportSlope;
        return $barsToConvergence > 0 ? $barsToConvergence : false;
    }
    
    /**
     * Generate comprehensive pattern analysis
     */
    public function analyzeAllPatterns($priceData) {
        $chartPatterns = $this->detectChartPatterns($priceData);
        $candlestickPatterns = $this->detectCandlestickPatterns($priceData);
        
        $allPatterns = array_merge($chartPatterns, $candlestickPatterns);
        
        // Calculate overall signal strength
        $bullishSignals = 0;
        $bearishSignals = 0;
        $totalConfidence = 0;
        
        foreach ($allPatterns as $pattern) {
            $confidence = $pattern['confidence'];
            $totalConfidence += $confidence;
            
            if (in_array($pattern['signal'], ['BULLISH', 'STRONG_BULLISH'])) {
                $bullishSignals += $confidence;
            } elseif (in_array($pattern['signal'], ['BEARISH', 'STRONG_BEARISH'])) {
                $bearishSignals += $confidence;
            }
        }
        
        $overallSignal = 'NEUTRAL';
        $overallConfidence = 0;
        
        if (count($allPatterns) > 0) {
            if ($bullishSignals > $bearishSignals * 1.2) {
                $overallSignal = 'BULLISH';
                $overallConfidence = min(95, $bullishSignals / count($allPatterns));
            } elseif ($bearishSignals > $bullishSignals * 1.2) {
                $overallSignal = 'BEARISH';
                $overallConfidence = min(95, $bearishSignals / count($allPatterns));
            } else {
                $overallSignal = 'NEUTRAL';
                $overallConfidence = $totalConfidence / count($allPatterns);
            }
        }
        
        return [
            'detected_patterns' => $allPatterns,
            'pattern_count' => count($allPatterns),
            'overall_signal' => $overallSignal,
            'overall_confidence' => round($overallConfidence, 1),
            'bullish_patterns' => array_filter($allPatterns, function($p) { 
                return in_array($p['signal'], ['BULLISH', 'STRONG_BULLISH']); 
            }),
            'bearish_patterns' => array_filter($allPatterns, function($p) { 
                return in_array($p['signal'], ['BEARISH', 'STRONG_BEARISH']); 
            }),
            'analysis_timestamp' => date('Y-m-d H:i:s')
        ];
    }
}
?>