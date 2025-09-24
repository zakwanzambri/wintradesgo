<?php
/**
 * ML Prediction Proxy - CORS-free endpoint for React
 * Returns ensemble predictions without CORS issues
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    // Get symbol parameter
    $symbol = $_GET['symbol'] ?? 'BTC-USD';
    
    // Set parameters for the API
    $_GET['action'] = 'ensemble_prediction';
    $_GET['symbol'] = $symbol;
    
    // Capture output from the main API
    ob_start();
    include __DIR__ . '/../ml/phase3.php';
    $output = ob_get_clean();
    
    // Return the JSON directly
    echo $output;
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Proxy error: ' . $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>