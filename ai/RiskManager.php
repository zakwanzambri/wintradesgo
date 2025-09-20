<?php
/**
 * Advanced Risk Management System
 * Comprehensive risk controls for automated trading
 */

class RiskManager {
    
    private $pdo;
    
    // Risk Management Configuration
    private $riskLimits = [
        'max_portfolio_risk' => 0.20,           // 20% max portfolio risk
        'max_position_size' => 0.10,            // 10% max per position
        'max_sector_exposure' => 0.30,          // 30% max per sector
        'max_daily_loss' => 0.05,               // 5% max daily loss
        'max_drawdown' => 0.15,                 // 15% max drawdown
        'min_liquidity_ratio' => 0.10,          // 10% minimum cash
        'max_correlation' => 0.7,               // Max correlation between positions
        'max_open_positions' => 15,             // Maximum concurrent positions
        'min_signal_confidence' => 75,          // Minimum signal confidence
        'stop_loss_mandatory' => true,          // Require stop loss on all positions
        'position_timeout_hours' => 168         // 1 week max position hold
    ];
    
    // Volatility-based risk adjustments
    private $volatilityAdjustments = [
        'low' => 1.0,       // Normal position sizing
        'medium' => 0.75,   // Reduce position size by 25%
        'high' => 0.5,      // Reduce position size by 50%
        'extreme' => 0.25   // Reduce position size by 75%
    ];
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->createRiskTables();
    }
    
    /**
     * Filter trading signals based on risk management rules
     */
    public function filterSignals($signals, $portfolio) {
        $filteredSignals = [];
        
        foreach ($signals as $signal) {
            $riskAssessment = $this->assessSignalRisk($signal, $portfolio);
            
            if ($riskAssessment['approved']) {
                $signal['risk_assessment'] = $riskAssessment;
                $signal['adjusted_position_size'] = $riskAssessment['adjusted_position_size'];
                $filteredSignals[] = $signal;
                
                $this->log("✅ Signal approved: {$signal['symbol']} - Risk Score: {$riskAssessment['risk_score']}");
            } else {
                $this->logRiskRejection($signal, $riskAssessment['rejection_reasons']);
            }
        }
        
        // Apply portfolio-level risk checks
        $filteredSignals = $this->applyPortfolioRiskLimits($filteredSignals, $portfolio);
        
        return $filteredSignals;
    }
    
    /**
     * Assess risk for individual trading signal
     */
    private function assessSignalRisk($signal, $portfolio) {
        $riskFactors = [];
        $riskScore = 0;
        $approved = true;
        $rejectionReasons = [];
        
        // 1. Signal Confidence Check
        if ($signal['confidence'] < $this->riskLimits['min_signal_confidence']) {
            $approved = false;
            $rejectionReasons[] = "Signal confidence ({$signal['confidence']}%) below minimum ({$this->riskLimits['min_signal_confidence']}%)";
        }
        
        // 2. Position Size Limits
        $requestedSize = floatval(str_replace('%', '', $signal['position_size_recommendation'])) / 100;
        if ($requestedSize > $this->riskLimits['max_position_size']) {
            $riskFactors[] = "Position size exceeds limit";
            $riskScore += 25;
            $requestedSize = $this->riskLimits['max_position_size'];
        }
        
        // 3. Risk Level Assessment
        $riskMultiplier = $this->getRiskMultiplier($signal['risk_level']);
        $adjustedPositionSize = $requestedSize * $riskMultiplier;
        
        if ($signal['risk_level'] === 'HIGH') {
            $riskScore += 30;
            $riskFactors[] = "High-risk signal";
        }
        
        // 4. Volatility Assessment
        $volatility = $this->calculateSymbolVolatility($signal['symbol']);
        $volatilityLevel = $this->getVolatilityLevel($volatility);
        $volatilityAdjustment = $this->volatilityAdjustments[$volatilityLevel];
        $adjustedPositionSize *= $volatilityAdjustment;
        
        if ($volatilityLevel === 'high' || $volatilityLevel === 'extreme') {
            $riskScore += 20;
            $riskFactors[] = "High volatility ({$volatility}%)";
        }
        
        // 5. Correlation Check
        $correlationRisk = $this->assessCorrelationRisk($signal['symbol'], $portfolio);
        if ($correlationRisk['high_correlation']) {
            $riskScore += 15;
            $riskFactors[] = "High correlation with existing positions";
            $adjustedPositionSize *= 0.8; // Reduce by 20%
        }
        
        // 6. Sector Exposure Check
        $sectorExposure = $this->calculateSectorExposure($signal['symbol'], $portfolio);
        if ($sectorExposure > $this->riskLimits['max_sector_exposure']) {
            $approved = false;
            $rejectionReasons[] = "Sector exposure limit exceeded ({$sectorExposure}%)";
        }
        
        // 7. Portfolio Risk Budget
        $portfolioRisk = $this->calculatePortfolioRisk($portfolio);
        if ($portfolioRisk > $this->riskLimits['max_portfolio_risk']) {
            $riskScore += 35;
            $riskFactors[] = "Portfolio risk budget exceeded";
            $adjustedPositionSize *= 0.6; // Significant reduction
        }
        
        // 8. Liquidity Check
        $liquidityRatio = $this->calculateLiquidityRatio($portfolio);
        if ($liquidityRatio < $this->riskLimits['min_liquidity_ratio']) {
            $approved = false;
            $rejectionReasons[] = "Insufficient liquidity ratio ({$liquidityRatio}%)";
        }
        
        // 9. Stop Loss Validation
        if ($this->riskLimits['stop_loss_mandatory'] && !isset($signal['stop_loss'])) {
            $approved = false;
            $rejectionReasons[] = "Stop loss is mandatory but not provided";
        }
        
        // 10. Maximum Open Positions
        if (count($portfolio['positions']) >= $this->riskLimits['max_open_positions']) {
            $approved = false;
            $rejectionReasons[] = "Maximum open positions limit reached";
        }
        
        // Final risk score calculation
        $finalRiskScore = min(100, $riskScore);
        
        // Auto-reject if risk score is too high
        if ($finalRiskScore > 75) {
            $approved = false;
            $rejectionReasons[] = "Risk score too high ({$finalRiskScore}%)";
        }
        
        // Ensure minimum position size
        $adjustedPositionSize = max(0.01, min($adjustedPositionSize, $this->riskLimits['max_position_size']));
        
        return [
            'approved' => $approved,
            'risk_score' => $finalRiskScore,
            'risk_factors' => $riskFactors,
            'rejection_reasons' => $rejectionReasons,
            'original_position_size' => $requestedSize,
            'adjusted_position_size' => $adjustedPositionSize,
            'volatility_level' => $volatilityLevel,
            'correlation_risk' => $correlationRisk,
            'portfolio_risk' => $portfolioRisk,
            'liquidity_ratio' => $liquidityRatio
        ];
    }
    
    /**
     * Apply portfolio-level risk limits
     */
    private function applyPortfolioRiskLimits($signals, $portfolio) {
        // Sort signals by confidence and risk score
        usort($signals, function($a, $b) {
            $scoreA = $a['confidence'] - $a['risk_assessment']['risk_score'];
            $scoreB = $b['confidence'] - $b['risk_assessment']['risk_score'];
            return $scoreB <=> $scoreA;
        });
        
        $approvedSignals = [];
        $totalRiskBudget = $this->riskLimits['max_portfolio_risk'];
        $usedRiskBudget = $this->calculatePortfolioRisk($portfolio);
        
        foreach ($signals as $signal) {
            $signalRisk = $signal['adjusted_position_size'] * $this->getSignalRiskWeight($signal);
            
            if (($usedRiskBudget + $signalRisk) <= $totalRiskBudget) {
                $approvedSignals[] = $signal;
                $usedRiskBudget += $signalRisk;
                
                $this->log("✅ Portfolio risk approved: {$signal['symbol']} - Remaining budget: " . 
                          round(($totalRiskBudget - $usedRiskBudget) * 100, 2) . "%");
            } else {
                $this->log("❌ Portfolio risk budget exceeded for: {$signal['symbol']}");
            }
        }
        
        return $approvedSignals;
    }
    
    /**
     * Real-time risk monitoring for open positions
     */
    public function monitorOpenPositions($portfolio) {
        $riskAlerts = [];
        
        foreach ($portfolio['positions'] as $position) {
            $currentPrice = $this->getCurrentPrice($position['symbol']);
            $unrealizedPnL = $position['unrealized_pnl'];
            $positionValue = $position['position_value'];
            
            // Check for excessive losses
            $lossPercentage = ($unrealizedPnL / $positionValue) * 100;
            if ($lossPercentage < -10) { // 10% loss threshold
                $riskAlerts[] = [
                    'type' => 'EXCESSIVE_LOSS',
                    'symbol' => $position['symbol'],
                    'loss_percentage' => $lossPercentage,
                    'severity' => $lossPercentage < -20 ? 'CRITICAL' : 'HIGH',
                    'recommendation' => 'Consider closing position or tightening stop loss'
                ];
            }
            
            // Check position age
            $positionAge = $this->getPositionAge($position['symbol']);
            if ($positionAge > $this->riskLimits['position_timeout_hours']) {
                $riskAlerts[] = [
                    'type' => 'POSITION_TIMEOUT',
                    'symbol' => $position['symbol'],
                    'age_hours' => $positionAge,
                    'severity' => 'MEDIUM',
                    'recommendation' => 'Review position - consider exit strategy'
                ];
            }
            
            // Check for correlation breakdown
            $correlationStatus = $this->checkPositionCorrelation($position, $portfolio);
            if ($correlationStatus['risk_increased']) {
                $riskAlerts[] = [
                    'type' => 'CORRELATION_RISK',
                    'symbol' => $position['symbol'],
                    'correlation_change' => $correlationStatus['change'],
                    'severity' => 'MEDIUM',
                    'recommendation' => 'Monitor closely - correlation risk increased'
                ];
            }
        }
        
        // Portfolio-level checks
        $portfolioDrawdown = $this->calculateCurrentDrawdown($portfolio);
        if ($portfolioDrawdown > $this->riskLimits['max_drawdown']) {
            $riskAlerts[] = [
                'type' => 'MAX_DRAWDOWN_EXCEEDED',
                'drawdown_percentage' => $portfolioDrawdown * 100,
                'severity' => 'CRITICAL',
                'recommendation' => 'IMMEDIATE ACTION: Reduce positions or halt trading'
            ];
        }
        
        return $riskAlerts;
    }
    
    /**
     * Emergency risk controls
     */
    public function triggerEmergencyControls($portfolio, $trigger) {
        $this->log("🚨 EMERGENCY RISK CONTROLS TRIGGERED: {$trigger}");
        
        $actions = [];
        
        switch ($trigger) {
            case 'MAX_DRAWDOWN':
                // Close all losing positions immediately
                $actions[] = $this->closeLosingPositions($portfolio);
                // Halt new position opening for 24 hours
                $actions[] = $this->haltTrading(24);
                break;
                
            case 'EXCESSIVE_VOLATILITY':
                // Reduce all position sizes by 50%
                $actions[] = $this->reducePositionSizes($portfolio, 0.5);
                // Tighten stop losses
                $actions[] = $this->tightenStopLosses($portfolio);
                break;
                
            case 'CORRELATION_SPIKE':
                // Close most correlated positions
                $actions[] = $this->closeCorrelatedPositions($portfolio);
                break;
                
            case 'LIQUIDITY_CRISIS':
                // Convert positions to cash gradually
                $actions[] = $this->gradualLiquidation($portfolio);
                break;
        }
        
        // Record emergency action
        $this->recordEmergencyAction($trigger, $actions);
        
        return $actions;
    }
    
    /**
     * Dynamic position sizing based on market conditions
     */
    public function calculateDynamicPositionSize($signal, $portfolio) {
        $baseSize = floatval(str_replace('%', '', $signal['position_size_recommendation'])) / 100;
        
        // Market volatility adjustment
        $marketVolatility = $this->getMarketVolatility();
        $volatilityAdjustment = $this->getVolatilityAdjustment($marketVolatility);
        
        // Portfolio heat adjustment
        $portfolioHeat = $this->calculatePortfolioHeat($portfolio);
        $heatAdjustment = 1 - ($portfolioHeat * 0.5); // Reduce size as portfolio heat increases
        
        // Confidence adjustment
        $confidenceAdjustment = $signal['confidence'] / 100;
        
        // Risk level adjustment
        $riskAdjustment = $this->getRiskMultiplier($signal['risk_level']);
        
        // Calculate final position size
        $finalSize = $baseSize * $volatilityAdjustment * $heatAdjustment * $confidenceAdjustment * $riskAdjustment;
        
        // Apply absolute limits
        $finalSize = max(0.005, min($finalSize, $this->riskLimits['max_position_size'])); // 0.5% min, 10% max
        
        return [
            'position_size' => $finalSize,
            'adjustments' => [
                'base_size' => $baseSize,
                'volatility_adjustment' => $volatilityAdjustment,
                'heat_adjustment' => $heatAdjustment,
                'confidence_adjustment' => $confidenceAdjustment,
                'risk_adjustment' => $riskAdjustment
            ],
            'market_conditions' => [
                'volatility_level' => $marketVolatility,
                'portfolio_heat' => $portfolioHeat
            ]
        ];
    }
    
    /**
     * Helper methods for risk calculations
     */
    private function calculateSymbolVolatility($symbol) {
        // Calculate 30-day volatility
        return 0.15 + (mt_rand() / mt_getrandmax()) * 0.3; // Simulated 15-45%
    }
    
    private function getVolatilityLevel($volatility) {
        if ($volatility < 0.15) return 'low';
        if ($volatility < 0.25) return 'medium';
        if ($volatility < 0.40) return 'high';
        return 'extreme';
    }
    
    private function getRiskMultiplier($riskLevel) {
        return [
            'LOW' => 1.0,
            'MEDIUM' => 0.8,
            'HIGH' => 0.6
        ][$riskLevel] ?? 0.6;
    }
    
    private function assessCorrelationRisk($symbol, $portfolio) {
        // Simplified correlation assessment
        $highCorrelationCount = 0;
        foreach ($portfolio['positions'] as $position) {
            if ($this->getSymbolCorrelation($symbol, $position['symbol']) > $this->riskLimits['max_correlation']) {
                $highCorrelationCount++;
            }
        }
        
        return [
            'high_correlation' => $highCorrelationCount > 0,
            'correlated_positions' => $highCorrelationCount,
            'max_correlation' => $this->riskLimits['max_correlation']
        ];
    }
    
    private function calculateSectorExposure($symbol, $portfolio) {
        $sector = $this->getSymbolSector($symbol);
        $sectorValue = 0;
        $totalValue = $portfolio['total_value'];
        
        foreach ($portfolio['positions'] as $position) {
            if ($this->getSymbolSector($position['symbol']) === $sector) {
                $sectorValue += $position['position_value'];
            }
        }
        
        return ($sectorValue / $totalValue) * 100;
    }
    
    private function calculatePortfolioRisk($portfolio) {
        // Simplified portfolio risk calculation based on position sizes and volatilities
        $totalRisk = 0;
        
        foreach ($portfolio['positions'] as $position) {
            $positionWeight = $position['position_value'] / $portfolio['total_value'];
            $symbolVolatility = $this->calculateSymbolVolatility($position['symbol']);
            $totalRisk += $positionWeight * $symbolVolatility;
        }
        
        return $totalRisk;
    }
    
    private function calculateLiquidityRatio($portfolio) {
        return ($portfolio['cash_balance'] / $portfolio['total_value']) * 100;
    }
    
    private function getSignalRiskWeight($signal) {
        // Calculate risk weight based on signal characteristics
        $baseWeight = 0.1; // 10% base risk
        
        // Adjust for risk level
        $riskAdjustment = [
            'LOW' => 0.8,
            'MEDIUM' => 1.0,
            'HIGH' => 1.5
        ][$signal['risk_level']] ?? 1.0;
        
        // Adjust for confidence
        $confidenceAdjustment = (100 - $signal['confidence']) / 100;
        
        return $baseWeight * $riskAdjustment * (1 + $confidenceAdjustment);
    }
    
    private function createRiskTables() {
        // Risk events table
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS risk_events (
                id INT AUTO_INCREMENT PRIMARY KEY,
                event_type VARCHAR(50) NOT NULL,
                symbol VARCHAR(10) NULL,
                risk_level ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL,
                description TEXT NOT NULL,
                action_taken TEXT NULL,
                timestamp DATETIME NOT NULL,
                resolved_at DATETIME NULL,
                INDEX idx_timestamp (timestamp),
                INDEX idx_symbol (symbol),
                INDEX idx_risk_level (risk_level)
            ) ENGINE=InnoDB
        ");
        
        // Emergency actions table
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS emergency_actions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                trigger_event VARCHAR(100) NOT NULL,
                actions_taken JSON NOT NULL,
                portfolio_value_before DECIMAL(20,2) NOT NULL,
                portfolio_value_after DECIMAL(20,2) NULL,
                timestamp DATETIME NOT NULL,
                INDEX idx_timestamp (timestamp)
            ) ENGINE=InnoDB
        ");
    }
    
    private function logRiskRejection($signal, $reasons) {
        $reasonsStr = implode(', ', $reasons);
        $this->log("❌ Signal rejected: {$signal['symbol']} - Reasons: {$reasonsStr}");
        
        // Record in database
        $stmt = $this->pdo->prepare("
            INSERT INTO risk_events (event_type, symbol, risk_level, description, timestamp)
            VALUES ('SIGNAL_REJECTION', ?, 'MEDIUM', ?, ?)
        ");
        $stmt->execute([$signal['symbol'], $reasonsStr, date('Y-m-d H:i:s')]);
    }
    
    private function recordEmergencyAction($trigger, $actions) {
        $stmt = $this->pdo->prepare("
            INSERT INTO emergency_actions (trigger_event, actions_taken, portfolio_value_before, timestamp)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([
            $trigger,
            json_encode($actions),
            $this->getPortfolioValue(),
            date('Y-m-d H:i:s')
        ]);
    }
    
    private function log($message) {
        $timestamp = date('Y-m-d H:i:s');
        $logEntry = "[{$timestamp}] {$message}" . PHP_EOL;
        file_put_contents(__DIR__ . '/logs/risk_management.log', $logEntry, FILE_APPEND | LOCK_EX);
    }
    
    // Additional helper methods would be implemented here
    private function getCurrentPrice($symbol) { /* Implementation */ }
    private function getPositionAge($symbol) { /* Implementation */ }
    private function checkPositionCorrelation($position, $portfolio) { /* Implementation */ }
    private function calculateCurrentDrawdown($portfolio) { /* Implementation */ }
    private function getSymbolCorrelation($symbol1, $symbol2) { /* Implementation */ }
    private function getSymbolSector($symbol) { /* Implementation */ }
    private function getMarketVolatility() { /* Implementation */ }
    private function getVolatilityAdjustment($volatility) { /* Implementation */ }
    private function calculatePortfolioHeat($portfolio) { /* Implementation */ }
    private function getPortfolioValue() { /* Implementation */ }
    
    // Emergency action methods
    private function closeLosingPositions($portfolio) { /* Implementation */ }
    private function haltTrading($hours) { /* Implementation */ }
    private function reducePositionSizes($portfolio, $factor) { /* Implementation */ }
    private function tightenStopLosses($portfolio) { /* Implementation */ }
    private function closeCorrelatedPositions($portfolio) { /* Implementation */ }
    private function gradualLiquidation($portfolio) { /* Implementation */ }
}
?>