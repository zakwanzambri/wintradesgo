<?php
/**
 * Portfolio Optimization Engine
 * Modern Portfolio Theory and ML-driven portfolio optimization
 */

class PortfolioOptimizer {
    
    private $pdo;
    
    // Optimization parameters
    private $config = [
        'target_return' => 0.20,        // 20% annual target return
        'max_volatility' => 0.25,       // 25% max portfolio volatility
        'rebalance_threshold' => 0.05,  // 5% deviation triggers rebalance
        'correlation_limit' => 0.7,     // Max correlation between assets
        'min_position_size' => 0.01,    // 1% minimum position
        'max_position_size' => 0.15,    // 15% maximum position
        'risk_free_rate' => 0.02,       // 2% risk-free rate
        'optimization_method' => 'sharpe_ratio', // sharpe_ratio, min_variance, max_return
        'ml_weight_adjustment' => true,  // Use ML confidence for weight adjustment
        'dynamic_rebalancing' => true    // Enable dynamic rebalancing
    ];
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->createOptimizationTables();
    }
    
    /**
     * Optimize portfolio positions based on signals and current holdings
     */
    public function optimizePositions($signals, $portfolio) {
        try {
            $this->log("🎯 Starting Portfolio Optimization");
            
            // 1. Prepare asset universe
            $assetUniverse = $this->prepareAssetUniverse($signals, $portfolio);
            
            // 2. Calculate expected returns and covariance matrix
            $expectedReturns = $this->calculateExpectedReturns($assetUniverse);
            $covarianceMatrix = $this->calculateCovarianceMatrix($assetUniverse);
            
            // 3. Apply ML confidence adjustments
            if ($this->config['ml_weight_adjustment']) {
                $expectedReturns = $this->applyMLAdjustments($expectedReturns, $signals);
            }
            
            // 4. Run optimization algorithm
            $optimalWeights = $this->runOptimization($expectedReturns, $covarianceMatrix);
            
            // 5. Convert weights to actual positions
            $optimizedPositions = $this->convertWeightsToPositions($optimalWeights, $portfolio, $assetUniverse);
            
            // 6. Apply constraints and filters
            $finalPositions = $this->applyConstraints($optimizedPositions, $portfolio);
            
            // 7. Calculate optimization metrics
            $optimizationMetrics = $this->calculateOptimizationMetrics($finalPositions, $expectedReturns, $covarianceMatrix);
            
            $this->log("✅ Portfolio optimization complete - Expected Sharpe: " . round($optimizationMetrics['sharpe_ratio'], 3));
            
            return [
                'positions' => $finalPositions,
                'metrics' => $optimizationMetrics,
                'rebalance_required' => $this->checkRebalanceRequired($finalPositions, $portfolio)
            ];
            
        } catch (Exception $e) {
            $this->log("❌ Portfolio optimization error: " . $e->getMessage());
            return ['positions' => [], 'error' => $e->getMessage()];
        }
    }
    
    /**
     * Prepare asset universe from signals and current holdings
     */
    private function prepareAssetUniverse($signals, $portfolio) {
        $assets = [];
        
        // Add assets from signals
        foreach ($signals as $signal) {
            $assets[$signal['symbol']] = [
                'symbol' => $signal['symbol'],
                'signal_type' => $signal['signal_type'],
                'confidence' => $signal['confidence'],
                'target_return' => $this->calculateSignalReturn($signal),
                'current_weight' => 0,
                'source' => 'signal'
            ];
        }
        
        // Add current holdings
        foreach ($portfolio['positions'] as $position) {
            $symbol = $position['symbol'];
            if (!isset($assets[$symbol])) {
                $assets[$symbol] = [
                    'symbol' => $symbol,
                    'signal_type' => 'HOLD',
                    'confidence' => 70,
                    'target_return' => 0,
                    'current_weight' => 0,
                    'source' => 'holding'
                ];
            }
            
            $assets[$symbol]['current_weight'] = $position['position_value'] / $portfolio['total_value'];
            $assets[$symbol]['current_quantity'] = $position['quantity'];
            $assets[$symbol]['unrealized_pnl'] = $position['unrealized_pnl'];
        }
        
        return array_values($assets);
    }
    
    /**
     * Calculate expected returns for each asset
     */
    private function calculateExpectedReturns($assetUniverse) {
        $returns = [];
        
        foreach ($assetUniverse as $asset) {
            $symbol = $asset['symbol'];
            
            // Base expected return from historical data
            $historicalReturn = $this->getHistoricalReturn($symbol);
            
            // Signal-based adjustment
            $signalAdjustment = $this->getSignalReturnAdjustment($asset);
            
            // ML confidence adjustment
            $confidenceAdjustment = ($asset['confidence'] / 100) - 0.5; // -0.5 to +0.5
            
            // Final expected return (annualized)
            $expectedReturn = $historicalReturn + $signalAdjustment + ($confidenceAdjustment * 0.1);
            
            $returns[$symbol] = $expectedReturn;
        }
        
        return $returns;
    }
    
    /**
     * Calculate covariance matrix for portfolio optimization
     */
    private function calculateCovarianceMatrix($assetUniverse) {
        $symbols = array_column($assetUniverse, 'symbol');
        $matrix = [];
        
        foreach ($symbols as $i => $symbol1) {
            $matrix[$symbol1] = [];
            foreach ($symbols as $j => $symbol2) {
                if ($i === $j) {
                    // Variance (diagonal)
                    $matrix[$symbol1][$symbol2] = $this->calculateAssetVariance($symbol1);
                } else {
                    // Covariance (off-diagonal)
                    $matrix[$symbol1][$symbol2] = $this->calculateCovariance($symbol1, $symbol2);
                }
            }
        }
        
        return $matrix;
    }
    
    /**
     * Apply ML confidence adjustments to expected returns
     */
    private function applyMLAdjustments($expectedReturns, $signals) {
        $adjusted = $expectedReturns;
        
        foreach ($signals as $signal) {
            $symbol = $signal['symbol'];
            if (isset($adjusted[$symbol])) {
                // Boost expected return for high-confidence signals
                $confidenceBoost = ($signal['confidence'] - 75) / 100; // 0 to 0.25 boost
                $adjusted[$symbol] += $confidenceBoost * 0.1; // Up to 10% boost
                
                // Apply ML model ensemble weighting
                $mlEnsembleBoost = $this->calculateMLEnsembleBoost($signal);
                $adjusted[$symbol] += $mlEnsembleBoost;
            }
        }
        
        return $adjusted;
    }
    
    /**
     * Run portfolio optimization algorithm
     */
    private function runOptimization($expectedReturns, $covarianceMatrix) {
        switch ($this->config['optimization_method']) {
            case 'sharpe_ratio':
                return $this->optimizeMaxSharpe($expectedReturns, $covarianceMatrix);
            case 'min_variance':
                return $this->optimizeMinVariance($expectedReturns, $covarianceMatrix);
            case 'max_return':
                return $this->optimizeMaxReturn($expectedReturns, $covarianceMatrix);
            default:
                return $this->optimizeMaxSharpe($expectedReturns, $covarianceMatrix);
        }
    }
    
    /**
     * Maximum Sharpe Ratio optimization
     */
    private function optimizeMaxSharpe($expectedReturns, $covarianceMatrix) {
        $symbols = array_keys($expectedReturns);
        $n = count($symbols);
        
        // Initialize equal weights
        $weights = array_fill_keys($symbols, 1.0 / $n);
        
        // Iterative optimization (simplified Markowitz)
        for ($iteration = 0; $iteration < 50; $iteration++) {
            $portfolioReturn = $this->calculatePortfolioReturn($weights, $expectedReturns);
            $portfolioVariance = $this->calculatePortfolioVariance($weights, $covarianceMatrix);
            $portfolioVolatility = sqrt($portfolioVariance);
            
            $currentSharpe = ($portfolioReturn - $this->config['risk_free_rate']) / $portfolioVolatility;
            
            // Gradient-based weight adjustment
            $newWeights = $this->adjustWeightsForSharpe($weights, $expectedReturns, $covarianceMatrix);
            
            // Check convergence
            $weightChange = $this->calculateWeightChange($weights, $newWeights);
            if ($weightChange < 0.001) break; // Converged
            
            $weights = $newWeights;
        }
        
        // Normalize weights to sum to 1
        $totalWeight = array_sum($weights);
        foreach ($weights as $symbol => $weight) {
            $weights[$symbol] = $weight / $totalWeight;
        }
        
        return $weights;
    }
    
    /**
     * Minimum Variance optimization
     */
    private function optimizeMinVariance($expectedReturns, $covarianceMatrix) {
        $symbols = array_keys($expectedReturns);
        $n = count($symbols);
        
        // Equal risk contribution approach
        $weights = [];
        foreach ($symbols as $symbol) {
            $assetVariance = $covarianceMatrix[$symbol][$symbol];
            $weights[$symbol] = 1.0 / $assetVariance;
        }
        
        // Normalize weights
        $totalWeight = array_sum($weights);
        foreach ($weights as $symbol => $weight) {
            $weights[$symbol] = $weight / $totalWeight;
        }
        
        return $weights;
    }
    
    /**
     * Convert optimal weights to actual trading positions
     */
    private function convertWeightsToPositions($weights, $portfolio, $assetUniverse) {
        $positions = [];
        $portfolioValue = $portfolio['total_value'];
        
        foreach ($weights as $symbol => $weight) {
            if ($weight > $this->config['min_position_size']) {
                $targetValue = $portfolioValue * $weight;
                
                // Find corresponding asset info
                $asset = null;
                foreach ($assetUniverse as $a) {
                    if ($a['symbol'] === $symbol) {
                        $asset = $a;
                        break;
                    }
                }
                
                if ($asset) {
                    $positions[] = [
                        'symbol' => $symbol,
                        'target_weight' => $weight,
                        'target_value' => $targetValue,
                        'position_size' => $weight * 100, // Convert to percentage
                        'signal_type' => $asset['signal_type'],
                        'confidence' => $asset['confidence'],
                        'optimization_score' => $this->calculateOptimizationScore($asset, $weight),
                        'rebalance_action' => $this->determineRebalanceAction($asset, $weight)
                    ];
                }
            }
        }
        
        // Sort by optimization score
        usort($positions, function($a, $b) {
            return $b['optimization_score'] <=> $a['optimization_score'];
        });
        
        return $positions;
    }
    
    /**
     * Apply position constraints and filters
     */
    private function applyConstraints($positions, $portfolio) {
        $finalPositions = [];
        $totalWeight = 0;
        
        foreach ($positions as $position) {
            // Apply position size limits
            $weight = $position['target_weight'];
            $weight = max($this->config['min_position_size'], $weight);
            $weight = min($this->config['max_position_size'], $weight);
            
            // Check if adding this position violates correlation limits
            if ($this->checkCorrelationConstraint($position['symbol'], $finalPositions)) {
                $position['target_weight'] = $weight;
                $position['position_size'] = $weight * 100;
                $finalPositions[] = $position;
                $totalWeight += $weight;
            }
        }
        
        // Normalize weights if they exceed 100%
        if ($totalWeight > 1.0) {
            foreach ($finalPositions as &$position) {
                $position['target_weight'] /= $totalWeight;
                $position['position_size'] = $position['target_weight'] * 100;
            }
        }
        
        return $finalPositions;
    }
    
    /**
     * Calculate optimization metrics
     */
    private function calculateOptimizationMetrics($positions, $expectedReturns, $covarianceMatrix) {
        if (empty($positions)) {
            return ['error' => 'No positions to analyze'];
        }
        
        // Create weight array
        $weights = [];
        foreach ($positions as $position) {
            $weights[$position['symbol']] = $position['target_weight'];
        }
        
        // Calculate portfolio metrics
        $portfolioReturn = $this->calculatePortfolioReturn($weights, $expectedReturns);
        $portfolioVariance = $this->calculatePortfolioVariance($weights, $covarianceMatrix);
        $portfolioVolatility = sqrt($portfolioVariance);
        $sharpeRatio = ($portfolioReturn - $this->config['risk_free_rate']) / $portfolioVolatility;
        
        // Calculate diversification metrics
        $concentrationRisk = $this->calculateConcentrationRisk($weights);
        $correlationScore = $this->calculateCorrelationScore($weights, $covarianceMatrix);
        
        return [
            'expected_return' => round($portfolioReturn * 100, 2) . '%',
            'expected_volatility' => round($portfolioVolatility * 100, 2) . '%',
            'sharpe_ratio' => round($sharpeRatio, 3),
            'concentration_risk' => round($concentrationRisk, 3),
            'correlation_score' => round($correlationScore, 3),
            'number_of_positions' => count($positions),
            'optimization_method' => $this->config['optimization_method'],
            'risk_budget_used' => round(array_sum($weights) * 100, 1) . '%'
        ];
    }
    
    /**
     * Check if portfolio rebalancing is required
     */
    private function checkRebalanceRequired($optimizedPositions, $currentPortfolio) {
        $rebalanceNeeded = false;
        $rebalanceActions = [];
        
        foreach ($optimizedPositions as $position) {
            $symbol = $position['symbol'];
            $targetWeight = $position['target_weight'];
            
            // Find current weight
            $currentWeight = 0;
            foreach ($currentPortfolio['positions'] as $currentPos) {
                if ($currentPos['symbol'] === $symbol) {
                    $currentWeight = $currentPos['position_value'] / $currentPortfolio['total_value'];
                    break;
                }
            }
            
            $weightDifference = abs($targetWeight - $currentWeight);
            
            if ($weightDifference > $this->config['rebalance_threshold']) {
                $rebalanceNeeded = true;
                $rebalanceActions[] = [
                    'symbol' => $symbol,
                    'current_weight' => round($currentWeight * 100, 2) . '%',
                    'target_weight' => round($targetWeight * 100, 2) . '%',
                    'weight_difference' => round($weightDifference * 100, 2) . '%',
                    'action' => $targetWeight > $currentWeight ? 'INCREASE' : 'DECREASE'
                ];
            }
        }
        
        return [
            'required' => $rebalanceNeeded,
            'actions' => $rebalanceActions,
            'threshold' => $this->config['rebalance_threshold'] * 100 . '%'
        ];
    }
    
    /**
     * Dynamic rebalancing based on market conditions
     */
    public function performDynamicRebalancing($portfolio) {
        if (!$this->config['dynamic_rebalancing']) {
            return ['message' => 'Dynamic rebalancing disabled'];
        }
        
        $marketConditions = $this->assessMarketConditions();
        $rebalanceSignal = $this->generateRebalanceSignal($marketConditions, $portfolio);
        
        if ($rebalanceSignal['rebalance_recommended']) {
            return $this->executeRebalancing($portfolio, $rebalanceSignal);
        }
        
        return ['message' => 'No rebalancing required'];
    }
    
    /**
     * Helper methods for optimization calculations
     */
    private function calculatePortfolioReturn($weights, $expectedReturns) {
        $return = 0;
        foreach ($weights as $symbol => $weight) {
            if (isset($expectedReturns[$symbol])) {
                $return += $weight * $expectedReturns[$symbol];
            }
        }
        return $return;
    }
    
    private function calculatePortfolioVariance($weights, $covarianceMatrix) {
        $variance = 0;
        foreach ($weights as $symbol1 => $weight1) {
            foreach ($weights as $symbol2 => $weight2) {
                if (isset($covarianceMatrix[$symbol1][$symbol2])) {
                    $variance += $weight1 * $weight2 * $covarianceMatrix[$symbol1][$symbol2];
                }
            }
        }
        return $variance;
    }
    
    private function getHistoricalReturn($symbol) {
        // Simulate historical return calculation
        $baseReturns = [
            'BTC' => 0.25, 'ETH' => 0.30, 'ADA' => 0.15, 'DOT' => 0.20,
            'LINK' => 0.18, 'SOL' => 0.35, 'AVAX' => 0.28, 'MATIC' => 0.22
        ];
        return $baseReturns[$symbol] ?? 0.15;
    }
    
    private function calculateAssetVariance($symbol) {
        // Simulate variance calculation
        $baseVariances = [
            'BTC' => 0.16, 'ETH' => 0.25, 'ADA' => 0.36, 'DOT' => 0.30,
            'LINK' => 0.28, 'SOL' => 0.40, 'AVAX' => 0.35, 'MATIC' => 0.32
        ];
        return $baseVariances[$symbol] ?? 0.25;
    }
    
    private function calculateCovariance($symbol1, $symbol2) {
        // Simplified covariance calculation
        $variance1 = $this->calculateAssetVariance($symbol1);
        $variance2 = $this->calculateAssetVariance($symbol2);
        $correlation = $this->getSymbolCorrelation($symbol1, $symbol2);
        return $correlation * sqrt($variance1) * sqrt($variance2);
    }
    
    private function getSymbolCorrelation($symbol1, $symbol2) {
        // Simulate correlation matrix
        if ($symbol1 === $symbol2) return 1.0;
        
        // Higher correlation within similar asset types
        $cryptoCorrelations = [
            'BTC-ETH' => 0.7, 'BTC-ADA' => 0.6, 'ETH-ADA' => 0.65,
            'DOT-LINK' => 0.5, 'SOL-AVAX' => 0.55, 'AVAX-MATIC' => 0.6
        ];
        
        $pair = $symbol1 . '-' . $symbol2;
        $reversePair = $symbol2 . '-' . $symbol1;
        
        return $cryptoCorrelations[$pair] ?? $cryptoCorrelations[$reversePair] ?? 0.3;
    }
    
    private function createOptimizationTables() {
        // Portfolio optimization history
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS portfolio_optimizations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                optimization_method VARCHAR(50) NOT NULL,
                expected_return DECIMAL(8,4) NOT NULL,
                expected_volatility DECIMAL(8,4) NOT NULL,
                sharpe_ratio DECIMAL(8,4) NOT NULL,
                positions_json JSON NOT NULL,
                market_conditions JSON NULL,
                timestamp DATETIME NOT NULL,
                INDEX idx_timestamp (timestamp)
            ) ENGINE=InnoDB
        ");
        
        // Rebalancing events
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS rebalancing_events (
                id INT AUTO_INCREMENT PRIMARY KEY,
                trigger_type VARCHAR(50) NOT NULL,
                actions_taken JSON NOT NULL,
                portfolio_value_before DECIMAL(20,2) NOT NULL,
                portfolio_value_after DECIMAL(20,2) NULL,
                optimization_improvement DECIMAL(8,4) NULL,
                timestamp DATETIME NOT NULL,
                INDEX idx_timestamp (timestamp)
            ) ENGINE=InnoDB
        ");
    }
    
    private function log($message) {
        $timestamp = date('Y-m-d H:i:s');
        $logEntry = "[{$timestamp}] {$message}" . PHP_EOL;
        file_put_contents(__DIR__ . '/logs/portfolio_optimization.log', $logEntry, FILE_APPEND | LOCK_EX);
    }
    
    // Additional helper methods would be implemented here
    private function calculateSignalReturn($signal) { /* Implementation */ }
    private function getSignalReturnAdjustment($asset) { /* Implementation */ }
    private function calculateMLEnsembleBoost($signal) { /* Implementation */ }
    private function adjustWeightsForSharpe($weights, $returns, $covariance) { /* Implementation */ }
    private function calculateWeightChange($oldWeights, $newWeights) { /* Implementation */ }
    private function calculateOptimizationScore($asset, $weight) { /* Implementation */ }
    private function determineRebalanceAction($asset, $weight) { /* Implementation */ }
    private function checkCorrelationConstraint($symbol, $positions) { /* Implementation */ }
    private function calculateConcentrationRisk($weights) { /* Implementation */ }
    private function calculateCorrelationScore($weights, $covariance) { /* Implementation */ }
    private function assessMarketConditions() { /* Implementation */ }
    private function generateRebalanceSignal($conditions, $portfolio) { /* Implementation */ }
    private function executeRebalancing($portfolio, $signal) { /* Implementation */ }
}
?>