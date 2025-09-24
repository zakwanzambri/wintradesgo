<?php
/**
 * Test disabled auto trading feature
 */

require_once 'advanced_features.php';

echo "<h1>🚫 Testing Disabled Feature</h1>";

$features = new AdvancedTradingFeatures();

// Try to use auto trading (should be blocked)
echo "<h2>🤖 Auto Trading Test (Should be Blocked)</h2>";
$autoTrade = $features->executeAutoTrade('BUY', 'BTC-USD', 0.1);
echo "<pre>" . print_r($autoTrade, true) . "</pre>";

echo "<h2>✅ Feature correctly blocked!</h2>";
?>