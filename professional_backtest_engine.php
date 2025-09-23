<?php
/**
 * Professional Backtesting Engine
 * Advanced backtesting with real transaction costs, slippage, and market impact
 */

class ProfessionalBacktestEngine {
    private $initialCapital;
    private $transactionCost;
    private $slippageFactor;
    private $minimumTrade;
    private $maxPositionSize;
    private $riskFreeRate;
    private $logFile;
    
    public function __construct($config = []) {
        // Default configuration
        $this->initialCapital = $config['initial_capital'] ?? 10000;
        $this->transactionCost = $config['transaction_cost'] ?? 0.001; // 0.1% per trade
        $this->slippageFactor = $config['slippage_factor'] ?? 0.0005; // 0.05%
        $this->minimumTrade = $config['minimum_trade'] ?? 10; // $10 minimum
        $this->maxPositionSize = $config['max_position_size'] ?? 0.95; // 95% max position
        $this->riskFreeRate = $config['risk_free_rate'] ?? 0.02; // 2% annual
        $this->logFile = __DIR__ . '/logs/backtest.log';
        
        // Ensure log directory exists
        if (!is_dir(dirname($this->logFile))) {
            mkdir(dirname($this->logFile), 0755, true);
        }
        
        $this->log("Professional Backtest Engine initialized");
    }
    
    /**
     * Run comprehensive backtest
     */
    public function runBacktest($strategy, $marketData, $parameters = []) {
        $this->log("Starting backtest for strategy: " . ($parameters['strategy_name'] ?? 'Unknown'));
        
        $startTime = microtime(true);
        
        // Initialize portfolio state
        $portfolio = $this->initializePortfolio();
        
        // Track performance metrics
        $metrics = $this->initializeMetrics();
        
        // Process each time period
        $trades = [];
        $equityCurve = [];
        $drawdowns = [];
        
        foreach ($marketData as $index => $candle) {
            // Get strategy signal
            $signal = $this->getStrategySignal($strategy, $marketData, $index, $parameters);
            
            // Execute trade if signal exists
            if ($signal && $signal['action'] !== 'HOLD') {
                $trade = $this->executeTrade($portfolio, $signal, $candle, $index);
                if ($trade) {
                    $trades[] = $trade;
                }
            }
            
            // Update portfolio value
            $portfolioValue = $this->calculatePortfolioValue($portfolio, $candle);
            $equityCurve[] = [
                'timestamp' => $candle['timestamp'],
                'value' => $portfolioValue,
                'returns' => $portfolioValue / $this->initialCapital - 1,
                'position' => $portfolio['position']
            ];
            
            // Calculate drawdown
            $drawdown = $this->calculateDrawdown($equityCurve);
            $drawdowns[] = $drawdown;
            
            // Update metrics
            $this->updateMetrics($metrics, $portfolioValue, $drawdown, $trades);
        }
        
        $endTime = microtime(true);
        $executionTime = $endTime - $startTime;
        
        // Calculate final performance metrics
        $finalMetrics = $this->calculateFinalMetrics($trades, $equityCurve, $drawdowns, $metrics);
        
        $result = [
            'success' => true,
            'summary' => [
                'initial_capital' => $this->initialCapital,
                'final_value' => end($equityCurve)['value'],
                'total_return' => $finalMetrics['total_return'],
                'annual_return' => $finalMetrics['annual_return'],
                'sharpe_ratio' => $finalMetrics['sharpe_ratio'],
                'max_drawdown' => $finalMetrics['max_drawdown'],
                'total_trades' => count($trades),
                'win_rate' => $finalMetrics['win_rate'],
                'profit_factor' => $finalMetrics['profit_factor']
            ],
            'detailed_metrics' => $finalMetrics,
            'trades' => $trades,
            'equity_curve' => $equityCurve,
            'drawdowns' => $drawdowns,
            'execution_time' => round($executionTime, 3),
            'configuration' => [
                'transaction_cost' => $this->transactionCost,
                'slippage_factor' => $this->slippageFactor,
                'initial_capital' => $this->initialCapital
            ]
        ];
        
        $this->log("Backtest completed: " . count($trades) . " trades, " . 
                  round($finalMetrics['total_return'] * 100, 2) . "% return");
        
        return $result;
    }
    
    /**
     * Initialize portfolio state
     */
    private function initializePortfolio() {
        return [
            'cash' => $this->initialCapital,
            'position' => 0, // 0 = no position, 1 = long, -1 = short
            'shares' => 0,
            'entry_price' => 0,
            'entry_time' => null,
            'unrealized_pnl' => 0,
            'realized_pnl' => 0
        ];
    }
    
    /**
     * Initialize metrics tracking
     */
    private function initializeMetrics() {
        return [
            'peak_value' => $this->initialCapital,
            'total_fees' => 0,
            'total_slippage' => 0,
            'winning_trades' => 0,
            'losing_trades' => 0,
            'gross_profit' => 0,
            'gross_loss' => 0,
            'returns' => []
        ];
    }
    
    /**
     * Get strategy signal
     */
    private function getStrategySignal($strategy, $marketData, $currentIndex, $parameters) {
        // Check if it's a custom function
        if (function_exists($strategy)) {
            return call_user_func($strategy, $marketData, $currentIndex);
        }
        
        switch ($strategy) {
            case 'lstm_strategy':
                return $this->getLSTMSignal($marketData, $currentIndex, $parameters);
                
            case 'technical_strategy':
                return $this->getTechnicalSignal($marketData, $currentIndex, $parameters);
                
            case 'ensemble_strategy':
                return $this->getEnsembleSignal($marketData, $currentIndex, $parameters);
                
            case 'buy_hold':
                return $this->getBuyHoldSignal($marketData, $currentIndex);
                
            default:
                return null;
        }
    }
    
    /**
     * LSTM Strategy Signal
     */
    private function getLSTMSignal($marketData, $currentIndex, $parameters) {
        // Simulate LSTM prediction (in real implementation, call actual LSTM)
        $confidence_threshold = $parameters['confidence_threshold'] ?? 0.6;
        
        // Simple momentum-based simulation
        if ($currentIndex < 20) return null;
        
        $recentPrices = array_slice(array_column($marketData, 'close'), $currentIndex - 20, 20);
        $momentum = (end($recentPrices) - $recentPrices[0]) / $recentPrices[0];
        
        $confidence = min(0.9, abs($momentum) * 10);
        
        if ($confidence > $confidence_threshold) {
            return [
                'action' => $momentum > 0 ? 'BUY' : 'SELL',
                'confidence' => $confidence,
                'type' => 'LSTM',
                'reason' => 'LSTM prediction based on momentum'
            ];
        }
        
        return ['action' => 'HOLD'];
    }
    
    /**
     * Technical Analysis Signal
     */
    private function getTechnicalSignal($marketData, $currentIndex, $parameters) {
        if ($currentIndex < 20) return null; // Reduced from 50 to 20
        
        $prices = array_column($marketData, 'close');
        $currentPrice = $prices[$currentIndex];
        
        // Simple moving averages
        $sma10 = array_sum(array_slice($prices, $currentIndex - 10, 10)) / 10;
        $sma20 = array_sum(array_slice($prices, $currentIndex - 20, 20)) / 20;
        
        // RSI calculation
        $rsi = $this->calculateRSI(array_slice($prices, $currentIndex - 14, 14));
        
        $signals = 0;
        
        // MA crossover signal (more sensitive)
        if ($sma10 > $sma20 && $currentPrice > $sma10) {
            $signals += 2; // Stronger signal
        } elseif ($sma10 < $sma20 && $currentPrice < $sma10) {
            $signals -= 2; // Stronger signal
        }
        
        // RSI signal (more aggressive)
        if ($rsi < 40) { // Changed from 30 to 40
            $signals++;
        } elseif ($rsi > 60) { // Changed from 70 to 60
            $signals--;
        }
        
        // Price momentum
        if ($currentIndex >= 5) {
            $momentum = ($currentPrice - $prices[$currentIndex - 5]) / $prices[$currentIndex - 5];
            if ($momentum > 0.02) { // 2% upward momentum
                $signals++;
            } elseif ($momentum < -0.02) { // 2% downward momentum
                $signals--;
            }
        }
        
        if ($signals >= 2) {
            return ['action' => 'BUY', 'confidence' => 0.8, 'type' => 'Technical'];
        } elseif ($signals <= -2) {
            return ['action' => 'SELL', 'confidence' => 0.8, 'type' => 'Technical'];
        }
        
        return ['action' => 'HOLD'];
    }
    
    /**
     * Execute trade with realistic costs
     */
    private function executeTrade(&$portfolio, $signal, $candle, $index) {
        $currentPrice = $candle['close'] ?? $candle['price'];
        $timestamp = $candle['timestamp'];
        
        // Calculate slippage
        $slippage = $this->calculateSlippage($signal['action'], $currentPrice);
        $executionPrice = $currentPrice + $slippage;
        
        $trade = null;
        
        if ($signal['action'] === 'BUY' && $portfolio['position'] <= 0) {
            // Close short position if exists, then go long
            if ($portfolio['position'] < 0) {
                $closeTrade = $this->closePosition($portfolio, $executionPrice, $timestamp, 'Cover Short');
                if ($closeTrade) $trade = $closeTrade;
            }
            
            // Open long position
            $openTrade = $this->openLongPosition($portfolio, $executionPrice, $timestamp, $signal);
            if ($openTrade && !$trade) {
                $trade = $openTrade;
            }
            
        } elseif ($signal['action'] === 'SELL') {
            if ($portfolio['position'] > 0) {
                // Close long position if exists
                $closeTrade = $this->closePosition($portfolio, $executionPrice, $timestamp, 'Sell Long');
                if ($closeTrade) $trade = $closeTrade;
            }
            
            // Open short position (if enabled)
            // For simplicity, we'll just close the position
        }
        
        return $trade;
    }
    
    /**
     * Calculate realistic slippage
     */
    private function calculateSlippage($action, $price) {
        $baseSlippage = $price * $this->slippageFactor;
        
        // Add random component to simulate market impact
        $randomFactor = (rand(-50, 50) / 100) * $baseSlippage;
        
        $totalSlippage = $baseSlippage + $randomFactor;
        
        // Slippage works against the trader
        return $action === 'BUY' ? $totalSlippage : -$totalSlippage;
    }
    
    /**
     * Open long position
     */
    private function openLongPosition(&$portfolio, $price, $timestamp, $signal) {
        if ($price <= 0) {
            return null; // Invalid price
        }
        
        $availableCash = $portfolio['cash'] * $this->maxPositionSize;
        $shares = floor($availableCash / $price);
        $cost = $shares * $price;
        $fees = $cost * $this->transactionCost;
        
        if ($cost + $fees < $this->minimumTrade || $shares <= 0) {
            return null;
        }
        
        $portfolio['cash'] -= ($cost + $fees);
        $portfolio['shares'] = $shares;
        $portfolio['position'] = 1;
        $portfolio['entry_price'] = $price;
        $portfolio['entry_time'] = $timestamp;
        
        return [
            'type' => 'BUY',
            'timestamp' => $timestamp,
            'price' => $price,
            'shares' => $shares,
            'cost' => $cost,
            'fees' => $fees,
            'signal_confidence' => $signal['confidence'] ?? 0,
            'strategy' => $signal['type'] ?? 'Unknown'
        ];
    }
    
    /**
     * Close position
     */
    private function closePosition(&$portfolio, $price, $timestamp, $reason) {
        if ($portfolio['position'] == 0 || $portfolio['shares'] == 0) {
            return null;
        }
        
        $proceeds = $portfolio['shares'] * $price;
        $fees = $proceeds * $this->transactionCost;
        $netProceeds = $proceeds - $fees;
        
        $pnl = $netProceeds - ($portfolio['shares'] * $portfolio['entry_price']);
        
        $portfolio['cash'] += $netProceeds;
        $portfolio['realized_pnl'] += $pnl;
        
        $trade = [
            'type' => 'SELL',
            'timestamp' => $timestamp,
            'entry_price' => $portfolio['entry_price'],
            'exit_price' => $price,
            'shares' => $portfolio['shares'],
            'proceeds' => $proceeds,
            'fees' => $fees,
            'pnl' => $pnl,
            'return_pct' => $pnl / ($portfolio['shares'] * $portfolio['entry_price']),
            'hold_time' => $timestamp - $portfolio['entry_time'],
            'reason' => $reason
        ];
        
        // Reset position
        $portfolio['shares'] = 0;
        $portfolio['position'] = 0;
        $portfolio['entry_price'] = 0;
        $portfolio['entry_time'] = null;
        
        return $trade;
    }
    
    /**
     * Calculate portfolio value
     */
    private function calculatePortfolioValue($portfolio, $candle) {
        $cash = $portfolio['cash'];
        $positionValue = $portfolio['shares'] * ($candle['close'] ?? $candle['price']);
        return $cash + $positionValue;
    }
    
    /**
     * Calculate drawdown
     */
    private function calculateDrawdown($equityCurve) {
        if (empty($equityCurve)) return 0;
        
        $currentValue = end($equityCurve)['value'];
        $peak = $this->initialCapital;
        
        foreach ($equityCurve as $point) {
            if ($point['value'] > $peak) {
                $peak = $point['value'];
            }
        }
        
        return ($peak - $currentValue) / $peak;
    }
    
    /**
     * Calculate final performance metrics
     */
    private function calculateFinalMetrics($trades, $equityCurve, $drawdowns, $metrics) {
        $finalValue = end($equityCurve)['value'];
        $totalReturn = ($finalValue / $this->initialCapital) - 1;
        
        // Calculate returns for Sharpe ratio
        $returns = [];
        for ($i = 1; $i < count($equityCurve); $i++) {
            $returns[] = ($equityCurve[$i]['value'] / $equityCurve[$i-1]['value']) - 1;
        }
        
        $meanReturn = !empty($returns) ? array_sum($returns) / count($returns) : 0;
        $returnStdDev = $this->calculateStandardDeviation($returns);
        
        // Sharpe ratio (simplified)
        $sharpeRatio = $returnStdDev > 0 ? ($meanReturn - $this->riskFreeRate/252) / $returnStdDev : 0;
        
        // Win rate and profit factor
        $winningTrades = array_filter($trades, function($trade) {
            return isset($trade['pnl']) && $trade['pnl'] > 0;
        });
        
        $losingTrades = array_filter($trades, function($trade) {
            return isset($trade['pnl']) && $trade['pnl'] < 0;
        });
        
        $winRate = count($trades) > 0 ? count($winningTrades) / count($trades) : 0;
        
        $grossProfit = array_sum(array_column($winningTrades, 'pnl'));
        $grossLoss = abs(array_sum(array_column($losingTrades, 'pnl')));
        $profitFactor = $grossLoss > 0 ? $grossProfit / $grossLoss : 0;
        
        // Max drawdown
        $maxDrawdown = !empty($drawdowns) ? max($drawdowns) : 0;
        
        // Annual return (assuming daily data)
        $periods = count($equityCurve);
        $annualReturn = $periods > 0 ? pow(1 + $totalReturn, 252 / $periods) - 1 : 0;
        
        return [
            'total_return' => $totalReturn,
            'annual_return' => $annualReturn,
            'sharpe_ratio' => $sharpeRatio,
            'max_drawdown' => $maxDrawdown,
            'win_rate' => $winRate,
            'profit_factor' => $profitFactor,
            'gross_profit' => $grossProfit,
            'gross_loss' => $grossLoss,
            'average_win' => count($winningTrades) > 0 ? $grossProfit / count($winningTrades) : 0,
            'average_loss' => count($losingTrades) > 0 ? $grossLoss / count($losingTrades) : 0,
            'largest_win' => count($winningTrades) > 0 ? max(array_column($winningTrades, 'pnl')) : 0,
            'largest_loss' => count($losingTrades) > 0 ? min(array_column($losingTrades, 'pnl')) : 0,
            'total_fees' => array_sum(array_column($trades, 'fees')),
            'return_volatility' => $returnStdDev
        ];
    }
    
    /**
     * Calculate RSI
     */
    private function calculateRSI($prices) {
        if (count($prices) < 2) return 50;
        
        $gains = [];
        $losses = [];
        
        for ($i = 1; $i < count($prices); $i++) {
            $change = $prices[$i] - $prices[$i-1];
            $gains[] = $change > 0 ? $change : 0;
            $losses[] = $change < 0 ? abs($change) : 0;
        }
        
        $avgGain = array_sum($gains) / count($gains);
        $avgLoss = array_sum($losses) / count($losses);
        
        if ($avgLoss == 0) return 100;
        
        $rs = $avgGain / $avgLoss;
        return 100 - (100 / (1 + $rs));
    }
    
    /**
     * Calculate standard deviation
     */
    private function calculateStandardDeviation($values) {
        if (count($values) < 2) return 0;
        
        $mean = array_sum($values) / count($values);
        $variance = array_sum(array_map(function($x) use ($mean) { 
            return pow($x - $mean, 2); 
        }, $values)) / count($values);
        
        return sqrt($variance);
    }
    
    /**
     * Update metrics during backtest
     */
    private function updateMetrics(&$metrics, $portfolioValue, $drawdown, $trades) {
        if ($portfolioValue > $metrics['peak_value']) {
            $metrics['peak_value'] = $portfolioValue;
        }
        
        // Add latest return
        if (!empty($metrics['returns'])) {
            $lastValue = end($metrics['returns']);
            if ($lastValue != 0) {
                $metrics['returns'][] = ($portfolioValue / $this->initialCapital) - 1;
            } else {
                $metrics['returns'][] = 0;
            }
        } else {
            $metrics['returns'][] = ($portfolioValue / $this->initialCapital) - 1;
        }
    }
    
    /**
     * Buy and hold strategy signal
     */
    private function getBuyHoldSignal($marketData, $currentIndex) {
        // Buy at the beginning, hold forever
        if ($currentIndex === 1) { // Changed from 0 to 1
            return ['action' => 'BUY', 'confidence' => 1.0, 'type' => 'BuyHold'];
        }
        
        return ['action' => 'HOLD'];
    }
    
    /**
     * Ensemble strategy signal
     */
    private function getEnsembleSignal($marketData, $currentIndex, $parameters) {
        $lstmSignal = $this->getLSTMSignal($marketData, $currentIndex, $parameters);
        $techSignal = $this->getTechnicalSignal($marketData, $currentIndex, $parameters);
        
        if (!$lstmSignal || !$techSignal) {
            return ['action' => 'HOLD'];
        }
        
        // Simple ensemble: both must agree
        if ($lstmSignal['action'] === $techSignal['action'] && 
            $lstmSignal['action'] !== 'HOLD') {
            
            $avgConfidence = ($lstmSignal['confidence'] + $techSignal['confidence']) / 2;
            
            return [
                'action' => $lstmSignal['action'],
                'confidence' => $avgConfidence,
                'type' => 'Ensemble',
                'components' => ['LSTM', 'Technical']
            ];
        }
        
        return ['action' => 'HOLD'];
    }
    
    /**
     * Log backtest activities
     */
    private function log($message) {
        $timestamp = date('Y-m-d H:i:s');
        $logEntry = "[$timestamp] $message" . PHP_EOL;
        @file_put_contents($this->logFile, $logEntry, FILE_APPEND | LOCK_EX);
    }
}

// Test the backtesting engine
if (php_sapi_name() === 'cli') {
    echo "🧪 Testing Professional Backtesting Engine\n";
    echo "==========================================\n\n";
    
    // Generate sample market data
    $marketData = [];
    $basePrice = 100; // Starting price (much lower)
    $timestamp = strtotime('2023-01-01');
    
    for ($i = 0; $i < 365; $i++) {
        $change = (rand(-100, 100) / 100) * 0.02; // ±2% random walk
        $basePrice *= (1 + $change);
        
        $marketData[] = [
            'timestamp' => $timestamp + ($i * 86400),
            'open' => $basePrice * 0.999,
            'high' => $basePrice * 1.01,
            'low' => $basePrice * 0.99,
            'close' => $basePrice,
            'volume' => rand(1000000, 5000000)
        ];
    }
    
    // Initialize backtest engine
    $engine = new ProfessionalBacktestEngine([
        'initial_capital' => 10000,
        'transaction_cost' => 0.001,
        'slippage_factor' => 0.0005
    ]);
    
    // Test different strategies
    $strategies = ['technical_strategy', 'buy_hold'];
    
    foreach ($strategies as $strategy) {
        echo "📊 Testing $strategy strategy:\n";
        
        $result = $engine->runBacktest($strategy, $marketData, [
            'strategy_name' => $strategy,
            'confidence_threshold' => 0.6
        ]);
        
        if ($result['success']) {
            $summary = $result['summary'];
            echo "   💰 Final Value: $" . number_format($summary['final_value'], 2) . "\n";
            echo "   📈 Total Return: " . number_format($summary['total_return'] * 100, 2) . "%\n";
            echo "   📊 Annual Return: " . number_format($summary['annual_return'] * 100, 2) . "%\n";
            echo "   🏆 Sharpe Ratio: " . number_format($summary['sharpe_ratio'], 3) . "\n";
            echo "   📉 Max Drawdown: " . number_format($summary['max_drawdown'] * 100, 2) . "%\n";
            echo "   🎯 Win Rate: " . number_format($summary['win_rate'] * 100, 1) . "%\n";
            echo "   💼 Total Trades: " . $summary['total_trades'] . "\n";
            echo "   ⚡ Execution Time: " . $result['execution_time'] . "s\n";
        }
        
        echo "\n";
    }
    
    echo "✅ Professional backtesting test complete!\n";
}
?>