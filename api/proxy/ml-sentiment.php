<?php
/**
 * ML Sentiment Proxy - CORS-free endpoint for React
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
    $symbol = $_GET['symbol'] ?? 'BTC-USD';
    
    $_GET['action'] = 'sentiment_analysis';
    $_GET['symbol'] = $symbol;
    
    ob_start();
    include __DIR__ . '/../ml/phase3.php';
    $output = ob_get_clean();
    
    echo $output;
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Proxy error: ' . $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>