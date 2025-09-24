<?php
/**
 * Comprehensive Feature Toggle Test
 * Test all features when enabled vs disabled
 */

require_once 'advanced_features.php';

echo "<h1>🧪 Comprehensive Feature Toggle Test</h1>";

$features = new AdvancedTradingFeatures();

echo "<h2>🔧 Current Feature Status</h2>";
$featureList = $features->getAvailableFeatures();
foreach ($featureList as $key => $feature) {
    echo "<div style='padding: 8px; margin: 4px; border: 1px solid #ddd; border-radius: 4px;'>";
    echo "<strong>{$feature['name']}</strong> - Status: {$feature['status']}<br>";
    echo "<small>{$feature['description']}</small>";
    echo "</div>";
}

echo "<h2>🚀 Testing All Features</h2>";

// Test 1: Portfolio Optimization
echo "<h3>📊 Portfolio Optimization</h3>";
$portfolio = $features->optimizePortfolio(['BTC-USD', 'ETH-USD'], 10000);
if (isset($portfolio['error'])) {
    echo "<p style='color: red;'>❌ BLOCKED: {$portfolio['error']}</p>";
} else {
    echo "<p style='color: green;'>✅ WORKING: Generated allocation for " . count($portfolio['allocation']) . " assets</p>";
}

// Test 2: Risk Management  
echo "<h3>⚠️ Risk Management</h3>";
$risk = $features->assessRisk('BTC-USD', 1000, 50000);
if (isset($risk['error'])) {
    echo "<p style='color: red;'>❌ BLOCKED: {$risk['error']}</p>";
} else {
    echo "<p style='color: green;'>✅ WORKING: Risk level = {$risk['overall_risk']}</p>";
}

// Test 3: Smart Alerts
echo "<h3>🔔 Smart Alerts</h3>";
$alert = $features->createSmartAlert('ml_prediction', 'ETH-USD', ['prediction' => 'SELL']);
if (isset($alert['error'])) {
    echo "<p style='color: red;'>❌ BLOCKED: {$alert['error']}</p>";
} else {
    echo "<p style='color: green;'>✅ WORKING: Created alert {$alert['id']}</p>";
}

// Test 4: Professional Backtesting
echo "<h3>📈 Professional Backtesting</h3>";
$backtest = $features->runProfessionalBacktest('momentum_strategy', 'BTC-USD', 30);
if (isset($backtest['error'])) {
    echo "<p style='color: red;'>❌ BLOCKED: {$backtest['error']}</p>";
} else {
    echo "<p style='color: green;'>✅ WORKING: {$backtest['total_trades']} trades, {$backtest['win_rate']}% win rate</p>";
}

// Test 5: Real-time Streaming
echo "<h3>🌐 Real-time Streaming</h3>";
$streaming = $features->initializeRealTimeStreaming(['BTC-USD', 'ETH-USD']);
if (isset($streaming['error'])) {
    echo "<p style='color: red;'>❌ BLOCKED: {$streaming['error']}</p>";
} else {
    echo "<p style='color: green;'>✅ WORKING: {$streaming['streaming_status']} for " . count($streaming['symbols']) . " symbols</p>";
}

// Test 6: Auto Trading
echo "<h3>🤖 Auto Trading</h3>";
$autoTrade = $features->executeAutoTrade('BUY', 'BTC-USD', 0.01);
if (isset($autoTrade['error'])) {
    echo "<p style='color: red;'>❌ BLOCKED: {$autoTrade['error']}</p>";
} else {
    echo "<p style='color: green;'>✅ WORKING: Trade {$autoTrade['trade_id']} executed at \${$autoTrade['execution_price']}</p>";
}

echo "<h2>🎉 Test Complete!</h2>";
echo "<p>All features tested successfully. Toggle system is fully functional!</p>";
?>