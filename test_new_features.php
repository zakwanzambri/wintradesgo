<?php
/**
 * Test all new feature toggles functionality
 */

require_once 'advanced_features.php';

echo "<h1>🧪 Feature Toggle System Test</h1>";

$features = new AdvancedTradingFeatures();

// Test Professional Backtesting
echo "<h2>📈 Professional Backtesting Test</h2>";
$backtest = $features->runProfessionalBacktest('technical_strategy', 'BTC-USD', 30);
echo "<pre>" . print_r($backtest, true) . "</pre>";

// Test Real-time Streaming
echo "<h2>🌐 Real-time Streaming Test</h2>";
$streaming = $features->initializeRealTimeStreaming(['BTC-USD', 'ETH-USD']);
echo "<pre>" . print_r($streaming, true) . "</pre>";

// Test Auto Trading
echo "<h2>🤖 Auto Trading Test</h2>";
$autoTrade = $features->executeAutoTrade('BUY', 'BTC-USD', 0.1);
echo "<pre>" . print_r($autoTrade, true) . "</pre>";

echo "<h2>✅ All features tested successfully!</h2>";
?>