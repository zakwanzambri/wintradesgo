<?php
/**
 * Enhanced AI Trading Engine with Advanced ML Models
 * Combines multiple AI techniques for superior trading predictions
 */

require_once 'LSTMNeuralNetwork.php';
require_once 'PatternRecognitionEngine.php';
require_once 'TechnicalAnalysis.php';
require_once 'SentimentAnalysis.php';
require_once 'MarketDataAPI.php';

class EnhancedAITradingEngine {
    
    private $lstm;
    private $patternEngine;
    private $technicalAnalysis;
    private $sentimentAnalysis;
    private $marketDataAPI;
    private $pdo;
    
    // Advanced ML model weights
    private $ensembleWeights = [
        'lstm_prediction' => 0.30,
        'pattern_analysis' => 0.25,
        'technical_indicators' => 0.25,
        'sentiment_score' => 0.15,
        'market_momentum' => 0.05
    ];
    
    public function __construct() {
        $this->lstm = new LSTMNeuralNetwork();
        $this->patternEngine = new PatternRecognitionEngine();
        $this->technicalAnalysis = new TechnicalAnalysis();
        $this->sentimentAnalysis = new SentimentAnalysis();
        $this->marketDataAPI = new MarketDataAPI();
        
        // Database connection
        try {
            $this->pdo = new PDO(
                "mysql:host=localhost;dbname=wintradesgo",
                "root",
                "",
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
        }
    }
    
    /**
     * Generate comprehensive AI trading signal
     */
    public function generateAdvancedSignal($symbol) {
        try {
            // Get live market data
            $marketData = $this->getEnhancedMarketData($symbol);
            
            // Extract price history
            $priceHistory = $this->getPriceHistory($symbol, 200);
            
            if (empty($priceHistory)) {
                return $this->generateFallbackSignal($symbol, $marketData);
            }
            
            // Run all AI models
            $aiAnalysis = [
                'lstm_prediction' => $this->runLSTMAnalysis($priceHistory),
                'pattern_analysis' => $this->runPatternAnalysis($priceHistory),
                'technical_indicators' => $this->runTechnicalAnalysis($priceHistory),
                'sentiment_analysis' => $this->runSentimentAnalysis($symbol),
                'market_momentum' => $this->calculateMarketMomentum($priceHistory),
                'volatility_analysis' => $this->analyzeVolatility($priceHistory),
                'risk_assessment' => $this->assessRisk($priceHistory)
            ];
            
            // Generate ensemble prediction
            $ensemblePrediction = $this->generateEnsemblePrediction($aiAnalysis);
            
            // Calculate overall confidence
            $confidence = $this->calculateOverallConfidence($aiAnalysis);
            
            // Generate trading signal
            $signal = $this->generateTradingSignal($ensemblePrediction, $confidence, $aiAnalysis);
            
            // Store analysis results
            $this->storeAnalysisResults($symbol, $aiAnalysis, $signal);
            
            return [
                'status' => 'success',
                'symbol' => $symbol,
                'signal' => $signal,
                'ai_analysis' => $aiAnalysis,
                'ensemble_prediction' => $ensemblePrediction,
                'overall_confidence' => $confidence,
                'market_data' => $marketData,
                'timestamp' => date('Y-m-d H:i:s'),
                'engine_version' => 'Enhanced AI v2.0'
            ];
            
        } catch (Exception $e) {
            error_log("AI signal generation failed: " . $e->getMessage());
            return $this->generateErrorResponse($symbol, $e->getMessage());
        }
    }
    
    /**
     * Run LSTM neural network analysis
     */
    private function runLSTMAnalysis($priceHistory) {
        try {
            $prediction = $this->lstm->predictAdvanced($priceHistory);
            
            return [
                'prediction_value' => $prediction['prediction'] ?? 0,
                'confidence' => $prediction['confidence'] ?? 50,
                'timeframe_predictions' => $prediction['timeframe_predictions'] ?? [],
                'market_regime' => $prediction['market_regime'] ?? [],
                'detected_patterns' => $prediction['detected_patterns'] ?? [],
                'model_performance' => $prediction['model_performance'] ?? [],
                'signal_strength' => $this->calculateSignalStrength($prediction['prediction'] ?? 0)
            ];
            
        } catch (Exception $e) {
            return $this->getDefaultLSTMAnalysis();
        }
    }
    
    /**
     * Run pattern recognition analysis
     */
    private function runPatternAnalysis($priceHistory) {
        try {
            $patterns = $this->patternEngine->detectPatterns($priceHistory);
            
            return [
                'detected_patterns' => $patterns,
                'pattern_reliability' => $this->calculatePatternReliability($patterns),
                'bullish_patterns' => $this->countBullishPatterns($patterns),
                'bearish_patterns' => $this->countBearishPatterns($patterns),
                'pattern_strength' => $this->calculatePatternStrength($patterns)
            ];
            
        } catch (Exception $e) {
            return $this->getDefaultPatternAnalysis();
        }
    }
    
    /**
     * Run comprehensive technical analysis
     */
    private function runTechnicalAnalysis($priceHistory) {
        try {
            $indicators = $this->technicalAnalysis->calculateAllIndicators($priceHistory);
            
            return [
                'indicators' => $indicators,
                'technical_score' => $this->calculateTechnicalScore($indicators),
                'trend_direction' => $this->determineTrendDirection($indicators),
                'momentum_status' => $this->analyzeMomentum($indicators),
                'overbought_oversold' => $this->checkOverboughtOversold($indicators)
            ];
            
        } catch (Exception $e) {
            return $this->getDefaultTechnicalAnalysis();
        }
    }
    
    /**
     * Run sentiment analysis
     */
    private function runSentimentAnalysis($symbol) {
        try {
            $sentiment = $this->sentimentAnalysis->analyzeSentiment($symbol);
            
            return [
                'sentiment_score' => $sentiment['overall_sentiment'] ?? 0,
                'news_sentiment' => $sentiment['news_sentiment'] ?? 'neutral',
                'social_sentiment' => $sentiment['social_sentiment'] ?? 'neutral',
                'fear_greed_index' => $sentiment['fear_greed_index'] ?? 50,
                'sentiment_trend' => $sentiment['sentiment_trend'] ?? 'stable'
            ];
            
        } catch (Exception $e) {
            return $this->getDefaultSentimentAnalysis();
        }
    }
    
    /**
     * Calculate market momentum
     */
    private function calculateMarketMomentum($priceHistory) {
        if (count($priceHistory) < 20) {
            return ['momentum' => 0, 'strength' => 'weak', 'direction' => 'sideways'];
        }
        
        $recent10 = array_slice($priceHistory, -10);
        $previous10 = array_slice($priceHistory, -20, 10);
        
        $recentAvg = array_sum($recent10) / count($recent10);
        $previousAvg = array_sum($previous10) / count($previous10);
        
        $momentum = ($recentAvg - $previousAvg) / $previousAvg;
        
        $strength = 'weak';
        if (abs($momentum) > 0.05) $strength = 'strong';
        elseif (abs($momentum) > 0.02) $strength = 'medium';
        
        $direction = 'sideways';
        if ($momentum > 0.01) $direction = 'bullish';
        elseif ($momentum < -0.01) $direction = 'bearish';
        
        return [
            'momentum' => round($momentum * 100, 2),
            'strength' => $strength,
            'direction' => $direction,
            'momentum_score' => min(100, abs($momentum) * 1000)
        ];
    }
    
    /**
     * Analyze volatility patterns
     */
    private function analyzeVolatility($priceHistory) {
        if (count($priceHistory) < 20) {
            return ['volatility' => 'low', 'score' => 25];
        }
        
        $returns = [];
        for ($i = 1; $i < count($priceHistory); $i++) {
            $returns[] = ($priceHistory[$i] - $priceHistory[$i-1]) / $priceHistory[$i-1];
        }
        
        $volatility = sqrt(array_sum(array_map(function($x) {
            return $x * $x;
        }, $returns)) / count($returns));
        
        $volatilityLevel = 'low';
        if ($volatility > 0.05) $volatilityLevel = 'high';
        elseif ($volatility > 0.025) $volatilityLevel = 'medium';
        
        return [
            'volatility' => $volatilityLevel,
            'volatility_value' => round($volatility * 100, 2),
            'score' => min(100, $volatility * 2000),
            'trend' => $this->getVolatilityTrend($priceHistory)
        ];
    }
    
    /**
     * Assess trading risk
     */
    private function assessRisk($priceHistory) {
        $volatilityAnalysis = $this->analyzeVolatility($priceHistory);
        $momentum = $this->calculateMarketMomentum($priceHistory);
        
        $riskScore = 50; // Base risk
        
        // Adjust for volatility
        if ($volatilityAnalysis['volatility'] === 'high') $riskScore += 30;
        elseif ($volatilityAnalysis['volatility'] === 'medium') $riskScore += 15;
        
        // Adjust for momentum
        if ($momentum['strength'] === 'strong') $riskScore += 10;
        
        $riskLevel = 'medium';
        if ($riskScore > 75) $riskLevel = 'high';
        elseif ($riskScore < 40) $riskLevel = 'low';
        
        return [
            'risk_level' => $riskLevel,
            'risk_score' => min(100, $riskScore),
            'risk_factors' => $this->identifyRiskFactors($volatilityAnalysis, $momentum)
        ];
    }
    
    /**
     * Generate ensemble prediction
     */
    private function generateEnsemblePrediction($aiAnalysis) {
        $weightedSum = 0;
        $totalWeight = 0;
        
        // LSTM prediction
        if (isset($aiAnalysis['lstm_prediction']['prediction_value'])) {
            $weight = $this->ensembleWeights['lstm_prediction'];
            $weightedSum += $aiAnalysis['lstm_prediction']['prediction_value'] * $weight;
            $totalWeight += $weight;
        }
        
        // Pattern analysis
        if (isset($aiAnalysis['pattern_analysis']['pattern_strength'])) {
            $weight = $this->ensembleWeights['pattern_analysis'];
            $patternScore = $aiAnalysis['pattern_analysis']['pattern_strength'] / 100;
            $weightedSum += $patternScore * $weight;
            $totalWeight += $weight;
        }
        
        // Technical indicators
        if (isset($aiAnalysis['technical_indicators']['technical_score'])) {
            $weight = $this->ensembleWeights['technical_indicators'];
            $techScore = ($aiAnalysis['technical_indicators']['technical_score'] - 50) / 50;
            $weightedSum += $techScore * $weight;
            $totalWeight += $weight;
        }
        
        // Sentiment
        if (isset($aiAnalysis['sentiment_analysis']['sentiment_score'])) {
            $weight = $this->ensembleWeights['sentiment_score'];
            $sentimentScore = $aiAnalysis['sentiment_analysis']['sentiment_score'] / 100;
            $weightedSum += $sentimentScore * $weight;
            $totalWeight += $weight;
        }
        
        // Market momentum
        if (isset($aiAnalysis['market_momentum']['momentum_score'])) {
            $weight = $this->ensembleWeights['market_momentum'];
            $momentumScore = $aiAnalysis['market_momentum']['momentum_score'] / 100;
            $weightedSum += $momentumScore * $weight;
            $totalWeight += $weight;
        }
        
        $ensemblePrediction = $totalWeight > 0 ? $weightedSum / $totalWeight : 0;
        
        return [
            'prediction_value' => round($ensemblePrediction, 4),
            'prediction_direction' => $ensemblePrediction > 0.1 ? 'bullish' : ($ensemblePrediction < -0.1 ? 'bearish' : 'neutral'),
            'prediction_strength' => min(100, abs($ensemblePrediction) * 100)
        ];
    }
    
    /**
     * Calculate overall confidence
     */
    private function calculateOverallConfidence($aiAnalysis) {
        $confidenceFactors = [];
        
        // LSTM confidence
        if (isset($aiAnalysis['lstm_prediction']['confidence'])) {
            $confidenceFactors[] = $aiAnalysis['lstm_prediction']['confidence'];
        }
        
        // Pattern reliability
        if (isset($aiAnalysis['pattern_analysis']['pattern_reliability'])) {
            $confidenceFactors[] = $aiAnalysis['pattern_analysis']['pattern_reliability'];
        }
        
        // Technical score consistency
        if (isset($aiAnalysis['technical_indicators']['technical_score'])) {
            $techScore = $aiAnalysis['technical_indicators']['technical_score'];
            $techConfidence = abs($techScore - 50) * 2; // Distance from neutral
            $confidenceFactors[] = min(100, $techConfidence);
        }
        
        // Volatility adjustment (lower volatility = higher confidence)
        if (isset($aiAnalysis['volatility_analysis']['volatility_value'])) {
            $volAdjustment = max(50, 100 - ($aiAnalysis['volatility_analysis']['volatility_value'] * 10));
            $confidenceFactors[] = $volAdjustment;
        }
        
        $overallConfidence = !empty($confidenceFactors) ? array_sum($confidenceFactors) / count($confidenceFactors) : 50;
        
        return min(95, max(30, $overallConfidence));
    }
    
    /**
     * Generate final trading signal
     */
    private function generateTradingSignal($ensemblePrediction, $confidence, $aiAnalysis) {
        $prediction = $ensemblePrediction['prediction_value'];
        $direction = $ensemblePrediction['prediction_direction'];
        
        $signal = 'HOLD';
        $action_confidence = $confidence;
        
        // Determine signal based on prediction and confidence
        if ($prediction > 0.15 && $confidence > 65) {
            $signal = 'BUY';
        } elseif ($prediction < -0.15 && $confidence > 65) {
            $signal = 'SELL';
        } elseif (abs($prediction) > 0.05 && $confidence > 75) {
            $signal = $prediction > 0 ? 'WEAK_BUY' : 'WEAK_SELL';
            $action_confidence *= 0.8;
        }
        
        // Generate reasons
        $reasons = $this->generateSignalReasons($aiAnalysis, $direction);
        
        return [
            'signal' => $signal,
            'confidence' => round($action_confidence, 1),
            'prediction_value' => $prediction,
            'direction' => $direction,
            'strength' => $ensemblePrediction['prediction_strength'],
            'reasons' => $reasons,
            'risk_level' => $aiAnalysis['risk_assessment']['risk_level'] ?? 'medium',
            'recommended_position_size' => $this->calculatePositionSize($signal, $confidence, $aiAnalysis),
            'stop_loss_suggestion' => $this->calculateStopLoss($prediction, $aiAnalysis),
            'take_profit_suggestion' => $this->calculateTakeProfit($prediction, $aiAnalysis)
        ];
    }
    
    /**
     * Helper methods for calculations
     */
    private function calculateSignalStrength($prediction) {
        return min(100, abs($prediction) * 100);
    }
    
    private function calculateTechnicalScore($indicators) {
        $bullishSignals = 0;
        $bearishSignals = 0;
        $totalSignals = 0;
        
        // RSI analysis
        if (isset($indicators['rsi'])) {
            $totalSignals++;
            if ($indicators['rsi'] < 30) $bullishSignals++;
            elseif ($indicators['rsi'] > 70) $bearishSignals++;
        }
        
        // MACD analysis
        if (isset($indicators['macd']['macd']) && isset($indicators['macd']['signal'])) {
            $totalSignals++;
            if ($indicators['macd']['macd'] > $indicators['macd']['signal']) $bullishSignals++;
            else $bearishSignals++;
        }
        
        // Moving averages
        if (isset($indicators['moving_averages'])) {
            $ma = $indicators['moving_averages'];
            if (isset($ma['sma_20']) && isset($ma['sma_50'])) {
                $totalSignals++;
                if ($ma['sma_20'] > $ma['sma_50']) $bullishSignals++;
                else $bearishSignals++;
            }
        }
        
        if ($totalSignals === 0) return 50;
        
        $bullishPercent = ($bullishSignals / $totalSignals) * 100;
        return round($bullishPercent, 1);
    }
    
    private function getEnhancedMarketData($symbol) {
        try {
            $coinId = $this->symbolToCoinId($symbol);
            return $this->marketDataAPI->getMarketData($coinId);
        } catch (Exception $e) {
            return ['symbol' => $symbol, 'price' => 0, 'error' => $e->getMessage()];
        }
    }
    
    private function getPriceHistory($symbol, $days) {
        try {
            $coinId = $this->symbolToCoinId($symbol);
            $historical = $this->marketDataAPI->getHistoricalData($coinId, $days);
            return array_column($historical, 'price');
        } catch (Exception $e) {
            return [];
        }
    }
    
    private function symbolToCoinId($symbol) {
        $mapping = [
            'BTC' => 'bitcoin',
            'ETH' => 'ethereum',
            'ADA' => 'cardano',
            'SOL' => 'solana',
            'DOT' => 'polkadot',
            'MATIC' => 'polygon'
        ];
        
        return $mapping[strtoupper($symbol)] ?? 'bitcoin';
    }
    
    // Default analysis methods for error handling
    private function getDefaultLSTMAnalysis() {
        return [
            'prediction_value' => 0,
            'confidence' => 50,
            'signal_strength' => 0
        ];
    }
    
    private function getDefaultPatternAnalysis() {
        return [
            'detected_patterns' => [],
            'pattern_reliability' => 0,
            'pattern_strength' => 0
        ];
    }
    
    private function getDefaultTechnicalAnalysis() {
        return [
            'technical_score' => 50,
            'trend_direction' => 'neutral'
        ];
    }
    
    private function getDefaultSentimentAnalysis() {
        return [
            'sentiment_score' => 50,
            'news_sentiment' => 'neutral'
        ];
    }
    
    private function generateSignalReasons($aiAnalysis, $direction) {
        $reasons = [];
        
        if ($direction === 'bullish') {
            $reasons[] = 'AI ensemble predicts upward price movement';
            $reasons[] = 'Technical indicators show bullish momentum';
        } elseif ($direction === 'bearish') {
            $reasons[] = 'AI ensemble predicts downward price movement';
            $reasons[] = 'Technical indicators show bearish momentum';
        } else {
            $reasons[] = 'Mixed signals from AI models';
            $reasons[] = 'Market showing consolidation pattern';
        }
        
        return $reasons;
    }
    
    private function calculatePositionSize($signal, $confidence, $aiAnalysis) {
        $baseSize = 1.0; // 100%
        
        if ($signal === 'BUY' || $signal === 'SELL') {
            $riskAdjustment = 1.0;
            if (isset($aiAnalysis['risk_assessment']['risk_level'])) {
                switch ($aiAnalysis['risk_assessment']['risk_level']) {
                    case 'high': $riskAdjustment = 0.5; break;
                    case 'medium': $riskAdjustment = 0.75; break;
                    case 'low': $riskAdjustment = 1.0; break;
                }
            }
            
            $confidenceAdjustment = $confidence / 100;
            return round($baseSize * $riskAdjustment * $confidenceAdjustment, 2);
        }
        
        return 0;
    }
    
    private function calculateStopLoss($prediction, $aiAnalysis) {
        $baseStopLoss = 0.05; // 5%
        
        if (isset($aiAnalysis['volatility_analysis']['volatility_value'])) {
            $volatility = $aiAnalysis['volatility_analysis']['volatility_value'] / 100;
            $baseStopLoss = max(0.02, min(0.15, $volatility * 2));
        }
        
        return round($baseStopLoss * 100, 1);
    }
    
    private function calculateTakeProfit($prediction, $aiAnalysis) {
        $stopLoss = $this->calculateStopLoss($prediction, $aiAnalysis) / 100;
        $takeProfit = $stopLoss * 2; // 2:1 risk reward ratio
        
        return round($takeProfit * 100, 1);
    }
    
    private function storeAnalysisResults($symbol, $aiAnalysis, $signal) {
        if (!$this->pdo) return;
        
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO ai_analysis_results 
                (symbol, analysis_data, signal_data, created_at) 
                VALUES (?, ?, ?, NOW())
            ");
            
            $stmt->execute([
                $symbol,
                json_encode($aiAnalysis),
                json_encode($signal)
            ]);
            
        } catch (PDOException $e) {
            error_log("Failed to store analysis results: " . $e->getMessage());
        }
    }
    
    private function generateFallbackSignal($symbol, $marketData) {
        return [
            'status' => 'limited_data',
            'symbol' => $symbol,
            'signal' => [
                'signal' => 'HOLD',
                'confidence' => 30,
                'reasons' => ['Insufficient historical data for comprehensive analysis']
            ],
            'market_data' => $marketData,
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
    
    private function generateErrorResponse($symbol, $errorMessage) {
        return [
            'status' => 'error',
            'symbol' => $symbol,
            'error' => $errorMessage,
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
}
?>