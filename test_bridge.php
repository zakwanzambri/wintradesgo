<?php
/**
 * Test PHP-Python Bridge
 */

require_once 'php_python_bridge.php';

echo "🧪 Testing PHP-Python Bridge\n";
echo "================================\n\n";

// Create bridge instance
$bridge = new PythonMLBridge();
$bridge->__init();

// Test 1: Health Check
echo "1️⃣ Health Check:\n";
$health = $bridge->getHealthStatus();
print_r($health);
echo "\n";

// Test 2: Model Info
echo "2️⃣ Model Info:\n";
$modelInfo = $bridge->getModelInfo('BTCUSDT');
print_r($modelInfo);
echo "\n";

// Test 3: LSTM Prediction
echo "3️⃣ LSTM Prediction:\n";
$prediction = $bridge->getLSTMPrediction('BTCUSDT');
print_r($prediction);
echo "\n";

// Test 4: Ensemble Prediction (if possible)
echo "4️⃣ Ensemble Prediction:\n";
$ensemble = $bridge->getEnsemblePrediction('BTCUSDT');
print_r($ensemble);
echo "\n";

echo "✅ Bridge testing complete!\n";
?>