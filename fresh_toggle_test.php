<?php
/**
 * Simple Toggle Test with Fresh Feature Manager Instance
 */

echo "<h1>🔄 Fresh Feature Manager Test</h1>";

// Test 1: Create fresh instance and test auto trading
echo "<h2>Test 1: Auto Trading (Should Work)</h2>";
require_once 'advanced_features.php';
$features1 = new AdvancedTradingFeatures();
$result1 = $features1->executeAutoTrade('BUY', 'BTC-USD', 0.1);
if (isset($result1['error'])) {
    echo "<p style='color: red;'>❌ BLOCKED: {$result1['error']}</p>";
} else {
    echo "<p style='color: green;'>✅ WORKING: Trade executed successfully</p>";
}

// Disable auto trading via API
echo "<h2>Disabling Auto Trading via API...</h2>";
$disableResult = file_get_contents('http://localhost/wintradesgo/model-api.php?action=toggle_feature&feature=auto_trading&enabled=false');
$data = json_decode($disableResult, true);
echo "<pre>" . print_r($data, true) . "</pre>";

// Test 2: Create NEW fresh instance after disable
echo "<h2>Test 2: Auto Trading (Should Be Blocked)</h2>";
$features2 = new AdvancedTradingFeatures(); // Fresh instance reads new settings
$result2 = $features2->executeAutoTrade('SELL', 'ETH-USD', 0.2);
if (isset($result2['error'])) {
    echo "<p style='color: red;'>🚫 BLOCKED: {$result2['error']}</p>";
} else {
    echo "<p style='color: green;'>❌ ERROR: Should be blocked but working!</p>";
}

// Enable auto trading again
echo "<h2>Re-enabling Auto Trading via API...</h2>";
$enableResult = file_get_contents('http://localhost/wintradesgo/model-api.php?action=toggle_feature&feature=auto_trading&enabled=true');
$data = json_decode($enableResult, true);
echo "<pre>" . print_r($data, true) . "</pre>";

// Test 3: Create NEW fresh instance after enable
echo "<h2>Test 3: Auto Trading (Should Work Again)</h2>";
$features3 = new AdvancedTradingFeatures(); // Fresh instance reads new settings
$result3 = $features3->executeAutoTrade('BUY', 'AAPL', 0.5);
if (isset($result3['error'])) {
    echo "<p style='color: red;'>❌ BLOCKED: {$result3['error']}</p>";
} else {
    echo "<p style='color: green;'>✅ WORKING: Trade executed successfully</p>";
}

echo "<h2>🔍 Current Feature Settings</h2>";
$currentSettings = json_decode(file_get_contents('config/feature_settings.json'), true);
echo "<pre>" . print_r($currentSettings, true) . "</pre>";
?>