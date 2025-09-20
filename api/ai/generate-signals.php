<?php
/**
 * AI Signal Generation API Endpoint
 * GET/POST /api/ai/generate-signals.php
 * Manually trigger AI signal generation
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../../ai/AISignalGenerator.php';

try {
    $aiGenerator = new AISignalGenerator();
    
    // Handle different request methods
    $method = $_SERVER['REQUEST_METHOD'];
    
    if ($method === 'POST' || $method === 'GET') {
        $startTime = microtime(true);
        
        // Generate new AI signals
        $signals = $aiGenerator->generateAllSignals();
        
        $endTime = microtime(true);
        $executionTime = round($endTime - $startTime, 2);
        
        // Get performance statistics
        $performance = $aiGenerator->getPerformanceStats(7);
        
        sendResponse([
            'signals_generated' => count($signals),
            'execution_time' => $executionTime . 's',
            'signals' => $signals,
            'performance_stats' => $performance,
            'generated_at' => date('Y-m-d H:i:s')
        ], 'AI signals generated successfully');
        
    } else {
        sendResponse([], 'Method not allowed', 405);
    }
    
} catch (Exception $e) {
    sendResponse([], 'Failed to generate AI signals: ' . $e->getMessage(), 500);
}
?>