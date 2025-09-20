<?php
/**
 * AI Signal Generator
 * Combines technical analysis and sentiment analysis for comprehensive trading signals
 */

require_once __DIR__ . '/../api/config/database.php';
require_once __DIR__ . '/MarketDataAPI.php';
require_once __DIR__ . '/TechnicalAnalysis.php';
require_once __DIR__ . '/SentimentAnalysis.php';

class AISignalGenerator {
    
    private $database;
    private $marketAPI;
    private $technicalAnalysis;
    private $sentimentAnalysis;
    
    public function __construct() {
        $this->database = new Database();
        $this->marketAPI = new MarketDataAPI();
        $this->technicalAnalysis = new TechnicalAnalysis();
        $this->sentimentAnalysis = new SentimentAnalysis();
    }
    
    /**
     * Get database instance
     * @return Database Database instance
     */
    public function getDatabase() {
        return $this->database;
    }
    
    /**
     * Generate comprehensive AI signals for all tracked cryptocurrencies
     * @return array Results of signal generation
     */
    public function generateAllSignals() {
        $symbols = ['bitcoin', 'ethereum', 'cardano', 'solana'];
        $results = [];
        
        // Update market data first
        $this->marketAPI->updateMarketDataTable($this->database);
        
        foreach ($symbols as $coinId) {
            try {
                $signal = $this->generateSignalForSymbol($coinId);
                if ($signal) {
                    $this->saveSignalToDatabase($signal);
                    $results[] = $signal;
                }
            } catch (Exception $e) {
                error_log("Error generating signal for {$coinId}: " . $e->getMessage());
            }
        }
        
        return $results;
    }
    
    /**
     * Generate AI signal for a specific cryptocurrency
     * @param string $coinId CoinGecko coin ID (bitcoin, ethereum, etc.)
     * @return array|false AI signal data or false on failure
     */
    public function generateSignalForSymbol($coinId) {
        // Get historical price data
        $historicalData = $this->marketAPI->getHistoricalData($coinId, 30);
        if (!$historicalData) {
            return false;
        }
        
        // Extract prices for technical analysis
        $prices = array_column($historicalData, 'price');
        
        // Get current market data
        $marketData = $this->marketAPI->getMarketData($coinId);
        if (!$marketData) {
            return false;
        }
        
        // Perform technical analysis
        $technicalSignal = $this->technicalAnalysis->generateTechnicalSignal($prices);
        
        // Perform sentiment analysis
        $sentimentSignal = $this->sentimentAnalysis->getCompleteSentimentAnalysis($marketData['symbol']);
        
        // Combine signals using weighted approach
        $finalSignal = $this->combineSignals($technicalSignal, $sentimentSignal, $marketData);
        
        return $finalSignal;
    }
    
    /**
     * Combine technical and sentiment signals with weighted approach
     * @param array $technical Technical analysis result
     * @param array $sentiment Sentiment analysis result
     * @param array $marketData Current market data
     * @return array Combined AI signal
     */
    private function combineSignals($technical, $sentiment, $marketData) {
        // Signal weights (can be adjusted based on market conditions)
        $technicalWeight = 0.65; // Technical analysis carries more weight
        $sentimentWeight = 0.35;  // Sentiment provides confirmation
        
        // Convert signals to numerical scores
        $technicalScore = $this->signalToScore($technical['signal_type'], $technical['confidence']);
        $sentimentScore = $this->signalToScore($sentiment['sentiment_signal'], $sentiment['confidence']);
        
        // Calculate weighted combined score
        $combinedScore = ($technicalScore * $technicalWeight) + ($sentimentScore * $sentimentWeight);
        
        // Determine final signal type and confidence
        if ($combinedScore > 20) {
            $signalType = 'BUY';
            $confidence = min(95, 50 + abs($combinedScore));
        } elseif ($combinedScore < -20) {
            $signalType = 'SELL';
            $confidence = min(95, 50 + abs($combinedScore));
        } else {
            $signalType = 'HOLD';
            $confidence = 50 + (abs($combinedScore) / 2);
        }
        
        // Generate comprehensive reason
        $reasons = [];
        if ($technical['confidence'] > 60) {
            $reasons[] = "Technical: " . $technical['reasons'];
        }
        if ($sentiment['confidence'] > 60) {
            $reasons[] = "Sentiment: " . $sentiment['sentiment_signal'];
        }
        
        $reason = !empty($reasons) ? implode(' | ', $reasons) : 'Mixed signals, proceed with caution';
        
        // Calculate target and stop loss prices
        $currentPrice = $marketData['current_price'];
        $targetPrice = $this->calculateTargetPrice($currentPrice, $signalType, $confidence);
        $stopLoss = $this->calculateStopLoss($currentPrice, $signalType, $confidence);
        
        return [
            'symbol' => $marketData['symbol'],
            'signal_type' => $signalType,
            'confidence' => round($confidence, 1),
            'current_price' => $currentPrice,
            'target_price' => $targetPrice,
            'stop_loss' => $stopLoss,
            'timeframe' => $this->determineTimeframe($confidence),
            'reason' => $reason,
            'technical_analysis' => $technical,
            'sentiment_analysis' => $sentiment,
            'combined_score' => round($combinedScore, 1),
            'market_data' => $marketData,
            'generated_at' => date('Y-m-d H:i:s')
        ];
    }
    
    /**
     * Convert signal type and confidence to numerical score
     * @param string $signalType BUY, SELL, HOLD, BULLISH, BEARISH, NEUTRAL
     * @param float $confidence Confidence percentage
     * @return float Numerical score (-100 to 100)
     */
    private function signalToScore($signalType, $confidence) {
        $baseScore = 0;
        
        switch (strtoupper($signalType)) {
            case 'BUY':
            case 'BULLISH':
                $baseScore = $confidence;
                break;
            case 'SELL':
            case 'BEARISH':
                $baseScore = -$confidence;
                break;
            case 'HOLD':
            case 'NEUTRAL':
            default:
                $baseScore = 0;
                break;
        }
        
        return $baseScore;
    }
    
    /**
     * Calculate target price based on signal and confidence
     * @param float $currentPrice Current market price
     * @param string $signalType BUY, SELL, HOLD
     * @param float $confidence Signal confidence
     * @return float|null Target price or null
     */
    private function calculateTargetPrice($currentPrice, $signalType, $confidence) {
        if ($signalType === 'HOLD') {
            return null;
        }
        
        // Calculate potential move based on confidence
        $movePercentage = ($confidence / 100) * 0.15; // Max 15% move for 100% confidence
        
        if ($signalType === 'BUY') {
            return round($currentPrice * (1 + $movePercentage), 8);
        } elseif ($signalType === 'SELL') {
            return round($currentPrice * (1 - $movePercentage), 8);
        }
        
        return null;
    }
    
    /**
     * Calculate stop loss price based on signal and confidence
     * @param float $currentPrice Current market price
     * @param string $signalType BUY, SELL, HOLD
     * @param float $confidence Signal confidence
     * @return float|null Stop loss price or null
     */
    private function calculateStopLoss($currentPrice, $signalType, $confidence) {
        if ($signalType === 'HOLD') {
            return null;
        }
        
        // Stop loss percentage based on confidence (lower confidence = tighter stop)
        $stopPercentage = 0.08 - (($confidence / 100) * 0.03); // 5%-8% stop loss range
        
        if ($signalType === 'BUY') {
            return round($currentPrice * (1 - $stopPercentage), 8);
        } elseif ($signalType === 'SELL') {
            return round($currentPrice * (1 + $stopPercentage), 8);
        }
        
        return null;
    }
    
    /**
     * Determine recommended timeframe based on confidence
     * @param float $confidence Signal confidence
     * @return string Timeframe recommendation
     */
    private function determineTimeframe($confidence) {
        if ($confidence >= 80) {
            return '1d';  // High confidence - longer timeframe
        } elseif ($confidence >= 65) {
            return '4h';  // Medium confidence - medium timeframe
        } else {
            return '1h';  // Lower confidence - shorter timeframe
        }
    }
    
    /**
     * Save generated signal to database
     * @param array $signal AI signal data
     * @return bool Success status
     */
    private function saveSignalToDatabase($signal) {
        try {
            $pdo = $this->database->getConnection();
            
            // Check if a recent signal exists for this symbol (within last hour)
            $stmt = $pdo->prepare("
                SELECT id FROM ai_signals 
                WHERE symbol = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
                ORDER BY created_at DESC LIMIT 1
            ");
            $stmt->execute([$signal['symbol']]);
            
            if ($stmt->rowCount() > 0) {
                // Update existing signal
                $signalId = $stmt->fetchColumn();
                $stmt = $pdo->prepare("
                    UPDATE ai_signals SET
                        signal_type = ?,
                        confidence = ?,
                        current_price = ?,
                        target_price = ?,
                        stop_loss = ?,
                        timeframe = ?,
                        reason = ?,
                        expires_at = DATE_ADD(NOW(), INTERVAL 1 DAY)
                    WHERE id = ?
                ");
                
                return $stmt->execute([
                    $signal['signal_type'],
                    $signal['confidence'],
                    $signal['current_price'],
                    $signal['target_price'],
                    $signal['stop_loss'],
                    $signal['timeframe'],
                    $signal['reason'],
                    $signalId
                ]);
            } else {
                // Insert new signal
                $stmt = $pdo->prepare("
                    INSERT INTO ai_signals (
                        symbol, signal_type, confidence, current_price, 
                        target_price, stop_loss, timeframe, reason, expires_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 1 DAY))
                ");
                
                return $stmt->execute([
                    $signal['symbol'],
                    $signal['signal_type'],
                    $signal['confidence'],
                    $signal['current_price'],
                    $signal['target_price'],
                    $signal['stop_loss'],
                    $signal['timeframe'],
                    $signal['reason']
                ]);
            }
        } catch (Exception $e) {
            error_log("Error saving signal to database: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Get performance statistics for AI signals
     * @param int $days Number of days to analyze
     * @return array Performance statistics
     */
    public function getPerformanceStats($days = 7) {
        try {
            $pdo = $this->database->getConnection();
            
            $stmt = $pdo->prepare("
                SELECT 
                    symbol,
                    signal_type,
                    confidence,
                    COUNT(*) as signal_count,
                    AVG(confidence) as avg_confidence
                FROM ai_signals 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                GROUP BY symbol, signal_type
                ORDER BY symbol, signal_type
            ");
            
            $stmt->execute([$days]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
            
        } catch (Exception $e) {
            error_log("Error getting performance stats: " . $e->getMessage());
            return [];
        }
    }
}

// Command line execution
if (php_sapi_name() === 'cli') {
    echo "🤖 Starting AI Signal Generation...\n";
    
    $aiGenerator = new AISignalGenerator();
    $signals = $aiGenerator->generateAllSignals();
    
    echo "✅ Generated " . count($signals) . " AI signals:\n";
    
    foreach ($signals as $signal) {
        echo sprintf(
            "  %s: %s (%.1f%% confidence) - %s\n",
            $signal['symbol'],
            $signal['signal_type'],
            $signal['confidence'],
            substr($signal['reason'], 0, 50) . '...'
        );
    }
    
    echo "🎯 AI Signal Generation Complete!\n";
}
?>