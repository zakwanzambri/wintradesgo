<?php
require_once 'professional_backtest_engine.php';

// Create test engine
$engine = new ProfessionalBacktestEngine(10000);

// Simple test data (3 price points)
$marketData = [
    ['timestamp' => time(), 'price' => 100],
    ['timestamp' => time() + 1, 'price' => 110],  // +10%
    ['timestamp' => time() + 2, 'price' => 120]   // +20% total
];

// Simple buy at start, sell at end strategy
function simple_test_strategy($data, $index) {
    if ($index === 0) {
        return ['action' => 'BUY', 'confidence' => 0.8, 'type' => 'test'];
    } elseif ($index === count($data) - 1) {
        return ['action' => 'SELL', 'confidence' => 0.8, 'type' => 'test'];
    }
    return ['action' => 'HOLD', 'confidence' => 0.5, 'type' => 'test'];
}

echo "🧪 Testing Portfolio Updates\n";
echo "==============================\n\n";

$results = $engine->runBacktest($marketData, 'simple_test_strategy');

echo "📊 Results:\n";
echo "   Initial: $10,000\n";
echo "   Final: $" . number_format($results['summary']['final_value'], 2) . "\n";
echo "   Return: " . number_format($results['summary']['total_return'] * 100, 2) . "%\n";
echo "   Trades: " . $results['summary']['total_trades'] . "\n\n";

// Check individual trades
if (!empty($results['trades'])) {
    echo "🔍 Trade Details:\n";
    foreach ($results['trades'] as $i => $trade) {
        echo "   Trade " . ($i+1) . ": " . $trade['type'] . " at $" . ($trade['exit_price'] ?? $trade['price']) . "\n";
        if (isset($trade['pnl'])) {
            echo "     P&L: $" . number_format($trade['pnl'], 2) . "\n";
        }
    }
}
?>