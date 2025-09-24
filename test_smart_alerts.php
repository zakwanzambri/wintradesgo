<?php
require_once 'advanced_features.php';

echo "<h1>🔔 Smart Alerts Test</h1>";

$features = new AdvancedTradingFeatures();

// Try to create a smart alert (should be blocked)
echo "<h2>Testing Smart Alert Creation...</h2>";
$result = $features->createSmartAlert('ml_prediction', 'BTC-USD', [
    'prediction' => 'BUY',
    'min_confidence' => 0.75
]);

echo "<pre>";
print_r($result);
echo "</pre>";

if (isset($result['error'])) {
    echo "<p style='color: red; font-weight: bold;'>🚫 Smart alerts are BLOCKED (feature disabled)</p>";
} else {
    echo "<p style='color: green; font-weight: bold;'>✅ Smart alerts are WORKING (feature enabled)</p>";
}
?>