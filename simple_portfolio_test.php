<?php
/**
 * Simplified Backtesting Engine for Testing
 */
class SimpleBacktestEngine {
    private $initialCapital;
    
    public function __construct($initialCapital = 10000) {
        $this->initialCapital = $initialCapital;
    }
    
    public function runTest() {
        echo "🧪 Simple Portfolio Test\n";
        echo "========================\n\n";
        
        // Initial portfolio
        $portfolio = [
            'cash' => $this->initialCapital,
            'shares' => 0,
            'position' => 0,
            'entry_price' => 0
        ];
        
        echo "💰 Initial Portfolio:\n";
        echo "   Cash: $" . number_format($portfolio['cash'], 2) . "\n";
        echo "   Shares: " . $portfolio['shares'] . "\n\n";
        
        // BUY at $100
        $buyPrice = 100;
        $shares = floor($portfolio['cash'] * 0.95 / $buyPrice); // 95% position
        $cost = $shares * $buyPrice;
        
        $portfolio['cash'] -= $cost;
        $portfolio['shares'] = $shares;
        $portfolio['entry_price'] = $buyPrice;
        $portfolio['position'] = 1;
        
        echo "📈 BUY Transaction:\n";
        echo "   Price: $" . $buyPrice . "\n";
        echo "   Shares: " . $shares . "\n";
        echo "   Cost: $" . number_format($cost, 2) . "\n";
        echo "   Remaining Cash: $" . number_format($portfolio['cash'], 2) . "\n\n";
        
        // SELL at $120 (+20% gain)
        $sellPrice = 120;
        $proceeds = $portfolio['shares'] * $sellPrice;
        $profit = $proceeds - ($portfolio['shares'] * $portfolio['entry_price']);
        
        $portfolio['cash'] += $proceeds;
        $portfolio['shares'] = 0;
        $portfolio['position'] = 0;
        
        echo "📉 SELL Transaction:\n";
        echo "   Price: $" . $sellPrice . "\n";
        echo "   Proceeds: $" . number_format($proceeds, 2) . "\n";
        echo "   Profit: $" . number_format($profit, 2) . "\n";
        echo "   Total Cash: $" . number_format($portfolio['cash'], 2) . "\n\n";
        
        // Calculate returns
        $finalValue = $portfolio['cash'] + ($portfolio['shares'] * $sellPrice);
        $totalReturn = ($finalValue / $this->initialCapital) - 1;
        
        echo "📊 Final Results:\n";
        echo "   Initial: $" . number_format($this->initialCapital, 2) . "\n";
        echo "   Final: $" . number_format($finalValue, 2) . "\n";
        echo "   Return: " . number_format($totalReturn * 100, 2) . "%\n";
        echo "   Profit: $" . number_format($finalValue - $this->initialCapital, 2) . "\n";
    }
}

// Run test
$engine = new SimpleBacktestEngine(10000);
$engine->runTest();
?>