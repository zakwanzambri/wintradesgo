<?php
/**
 * AI Backend Demo
 * Demonstrate LSTM Neural Network and AI Signal Generation
 */

// Set content type to JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Mock LSTM Neural Network Demo
class LSTMDemo {
    private $hiddenUnits = 50;
    private $learningRate = 0.001;
    private $lookbackPeriod = 60;
    
    public function __construct() {
        // Initialize weight matrices (simplified for demo)
        $this->forgetWeights = $this->initializeWeights(100, $this->hiddenUnits);
        $this->inputWeights = $this->initializeWeights(100, $this->hiddenUnits);
        $this->candidateWeights = $this->initializeWeights(100, $this->hiddenUnits);
        $this->outputWeights = $this->initializeWeights(100, $this->hiddenUnits);
    }
    
    private function initializeWeights($inputSize, $outputSize) {
        $weights = [];
        for ($i = 0; $i < $inputSize; $i++) {
            $weights[$i] = [];
            for ($j = 0; $j < $outputSize; $j++) {
                // Xavier initialization
                $weights[$i][$j] = (rand() / getrandmax() - 0.5) * 2 * sqrt(6 / ($inputSize + $outputSize));
            }
        }
        return $weights;
    }
    
    public function predict($priceData) {
        // Simulate LSTM forward pass
        $cellState = array_fill(0, $this->hiddenUnits, 0);
        $hiddenState = array_fill(0, $this->hiddenUnits, 0);
        
        // Process sequence
        foreach ($priceData as $price) {
            // Normalize input
            $normalizedInput = $this->normalizeInput($price, $priceData);
            
            // LSTM gates simulation
            $forgetGate = $this->sigmoid($this->matrixMultiply($normalizedInput, $this->forgetWeights));
            $inputGate = $this->sigmoid($this->matrixMultiply($normalizedInput, $this->inputWeights));
            $candidateValues = $this->tanh($this->matrixMultiply($normalizedInput, $this->candidateWeights));
            $outputGate = $this->sigmoid($this->matrixMultiply($normalizedInput, $this->outputWeights));
            
            // Update cell state
            for ($i = 0; $i < $this->hiddenUnits; $i++) {
                $cellState[$i] = ($forgetGate[$i] * $cellState[$i]) + ($inputGate[$i] * $candidateValues[$i]);
                $hiddenState[$i] = $outputGate[$i] * tanh($cellState[$i]);
            }
        }
        
        // Generate prediction
        $prediction = array_sum($hiddenState) / count($hiddenState);
        
        return [
            'prediction' => $prediction,
            'confidence' => min(95, abs($prediction) * 100),
            'lstm_layers' => 2,
            'hidden_units' => $this->hiddenUnits,
            'learning_rate' => $this->learningRate
        ];
    }
    
    private function sigmoid($x) {
        if (is_array($x)) {
            return array_map(function($val) { return 1 / (1 + exp(-$val)); }, $x);
        }
        return 1 / (1 + exp(-$x));
    }
    
    private function tanh($x) {
        if (is_array($x)) {
            return array_map('tanh', $x);
        }
        return tanh($x);
    }
    
    private function normalizeInput($currentPrice, $priceHistory) {
        $mean = array_sum($priceHistory) / count($priceHistory);
        $variance = array_sum(array_map(function($x) use ($mean) { return pow($x - $mean, 2); }, $priceHistory)) / count($priceHistory);
        $stdDev = sqrt($variance);
        
        return ($currentPrice - $mean) / ($stdDev + 1e-8);
    }
    
    private function matrixMultiply($input, $weights) {
        $result = [];
        for ($i = 0; $i < count($weights[0]); $i++) {
            $sum = 0;
            for ($j = 0; $j < min(count($weights), 10); $j++) { // Simplified
                $sum += (is_array($input) ? ($input[$j] ?? 0) : $input) * $weights[$j][$i];
            }
            $result[$i] = $sum;
        }
        return $result;
    }
}

// Technical Analysis Engine
class TechnicalAnalysisDemo {
    public function calculateRSI($prices, $period = 14) {
        if (count($prices) < $period + 1) {
            return 50;
        }
        
        $gains = [];
        $losses = [];
        
        for ($i = 1; $i < count($prices); $i++) {
            $change = $prices[$i] - $prices[$i - 1];
            $gains[] = $change > 0 ? $change : 0;
            $losses[] = $change < 0 ? abs($change) : 0;
        }
        
        $avgGain = array_sum(array_slice($gains, -$period)) / $period;
        $avgLoss = array_sum(array_slice($losses, -$period)) / $period;
        
        if ($avgLoss == 0) return 100;
        
        $rs = $avgGain / $avgLoss;
        $rsi = 100 - (100 / (1 + $rs));
        
        return round($rsi, 2);
    }
    
    public function calculateMACD($prices, $fastPeriod = 12, $slowPeriod = 26) {
        if (count($prices) < $slowPeriod) {
            return ['macd' => 0, 'signal' => 0, 'histogram' => 0];
        }
        
        $fastEMA = $this->calculateEMA($prices, $fastPeriod);
        $slowEMA = $this->calculateEMA($prices, $slowPeriod);
        
        $macdLine = $fastEMA - $slowEMA;
        $signalLine = $macdLine; // Simplified
        $histogram = $macdLine - $signalLine;
        
        return [
            'macd' => round($macdLine, 4),
            'signal' => round($signalLine, 4),
            'histogram' => round($histogram, 4)
        ];
    }
    
    private function calculateEMA($prices, $period) {
        if (count($prices) < $period) {
            return array_sum($prices) / count($prices);
        }
        
        $multiplier = 2 / ($period + 1);
        $ema = array_sum(array_slice($prices, 0, $period)) / $period;
        
        for ($i = $period; $i < count($prices); $i++) {
            $ema = ($prices[$i] * $multiplier) + ($ema * (1 - $multiplier));
        }
        
        return $ema;
    }
}

// Main Demo
try {
    // Simulate getting BTC price data
    $btcPrices = [];
    $basePrice = 67000;
    for ($i = 0; $i < 50; $i++) {
        $btcPrices[] = $basePrice + (rand(-2000, 2000));
    }
    
    // Initialize AI engines
    $lstm = new LSTMDemo();
    $techAnalysis = new TechnicalAnalysisDemo();
    
    // Run LSTM prediction
    $lstmResult = $lstm->predict($btcPrices);
    
    // Run technical analysis
    $rsi = $techAnalysis->calculateRSI($btcPrices);
    $macd = $techAnalysis->calculateMACD($btcPrices);
    
    // Generate AI signal
    $signal = 'HOLD';
    $confidence = 65;
    
    if ($lstmResult['prediction'] > 0.3 && $rsi < 30) {
        $signal = 'BUY';
        $confidence = min(95, 70 + abs($lstmResult['prediction']) * 25);
    } elseif ($lstmResult['prediction'] < -0.3 && $rsi > 70) {
        $signal = 'SELL';
        $confidence = min(95, 70 + abs($lstmResult['prediction']) * 25);
    }
    
    // Pattern Recognition Demo
    $patterns = [
        'head_shoulders' => rand(0, 1) ? 'DETECTED' : 'NOT_FOUND',
        'double_top' => rand(0, 1) ? 'DETECTED' : 'NOT_FOUND',
        'triangle_ascending' => rand(0, 1) ? 'DETECTED' : 'NOT_FOUND'
    ];
    
    $response = [
        'status' => 'success',
        'timestamp' => date('Y-m-d H:i:s'),
        'ai_engine' => 'PHP LSTM Neural Network',
        'lstm_prediction' => $lstmResult,
        'technical_analysis' => [
            'rsi' => $rsi,
            'macd' => $macd,
            'moving_average_50' => array_sum(array_slice($btcPrices, -50)) / 50,
            'moving_average_200' => array_sum($btcPrices) / count($btcPrices)
        ],
        'pattern_recognition' => $patterns,
        'ai_signal' => [
            'signal_type' => $signal,
            'confidence' => $confidence,
            'timeframe' => '4h',
            'reasons' => [
                'LSTM Neural Network: ' . ($lstmResult['prediction'] > 0 ? 'Bullish' : 'Bearish'),
                'RSI(' . $rsi . '): ' . ($rsi > 70 ? 'Overbought' : ($rsi < 30 ? 'Oversold' : 'Neutral')),
                'MACD: ' . ($macd['macd'] > 0 ? 'Bullish' : 'Bearish')
            ]
        ],
        'market_data' => [
            'symbol' => 'BTC/USDT',
            'current_price' => end($btcPrices),
            '24h_change' => rand(-500, 500),
            'volume' => rand(1000000, 5000000)
        ],
        'ai_performance' => [
            'accuracy_7d' => rand(75, 92) . '%',
            'total_signals' => rand(150, 300),
            'profitable_signals' => rand(65, 85) . '%'
        ]
    ];
    
    echo json_encode($response, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>