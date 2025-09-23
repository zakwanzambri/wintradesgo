<?php
/**
 * Quick Backtesting Test - Debug Version
 */

// Simple test to verify the engine works
$marketData = [];
$basePrice = 100;

// Generate trending market data
for ($i = 0; $i < 50; $i++) {
    $trend = $i * 0.5; // Upward trend
    $noise = (rand(-100, 100) / 100) * 2; // ±2% noise
    $price = $basePrice + $trend + $noise;
    
    $marketData[] = [
        'timestamp' => time() + ($i * 3600),
        'open' => $price,
        'high' => $price * 1.01,
        'low' => $price * 0.99,
        'close' => $price,
        'volume' => 1000000
    ];
}

echo "Debug: Generated " . count($marketData) . " data points\n";
echo "First price: " . $marketData[0]['close'] . "\n";
echo "Last price: " . $marketData[count($marketData)-1]['close'] . "\n";

// Test simple buy and hold
require_once 'professional_backtest_engine.php';

$engine = new ProfessionalBacktestEngine(['initial_capital' => 1000]);

echo "\nTesting with debug output...\n";

// Manual test of buy signal
$signal = ['action' => 'BUY', 'confidence' => 1.0, 'type' => 'Manual'];
$portfolio = [
    'cash' => 1000,
    'position' => 0,
    'shares' => 0,
    'entry_price' => 0,
    'entry_time' => null,
    'unrealized_pnl' => 0,
    'realized_pnl' => 0
];

echo "Initial portfolio cash: $" . $portfolio['cash'] . "\n";

// Simulate a buy order
$price = $marketData[1]['close'];
$shares = floor(950 / $price); // Use 95% of cash
$cost = $shares * $price;
$fees = $cost * 0.001;

echo "Buy price: $" . $price . "\n";
echo "Shares to buy: " . $shares . "\n";
echo "Cost: $" . $cost . "\n";
echo "Fees: $" . $fees . "\n";

if ($cost + $fees > 0) {
    $portfolio['cash'] -= ($cost + $fees);
    $portfolio['shares'] = $shares;
    $portfolio['position'] = 1;
    
    echo "After buy - Cash: $" . $portfolio['cash'] . ", Shares: " . $portfolio['shares'] . "\n";
    
    // Check portfolio value
    $finalPrice = $marketData[count($marketData)-1]['close'];
    $portfolioValue = $portfolio['cash'] + ($portfolio['shares'] * $finalPrice);
    
    echo "Final price: $" . $finalPrice . "\n";
    echo "Final portfolio value: $" . $portfolioValue . "\n";
    echo "Return: " . (($portfolioValue / 1000) - 1) * 100 . "%\n";
} else {
    echo "Trade would not execute - insufficient funds\n";
}
?>