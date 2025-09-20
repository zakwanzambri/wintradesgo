<?php
/**
 * AI Signals API
 * GET /api/signals/get.php
 * Returns current AI trading signals
 */

require_once '../config/database.php';

try {
    $database = new Database();
    $pdo = $database->getConnection();
    
    // Get recent AI signals (last 24 hours or most recent)
    $stmt = $pdo->prepare("
        SELECT 
            id,
            symbol,
            signal_type,
            confidence,
            current_price,
            target_price,
            stop_loss,
            timeframe,
            reason,
            created_at,
            TIMESTAMPDIFF(MINUTE, created_at, NOW()) as minutes_ago
        FROM ai_signals 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        ORDER BY created_at DESC
        LIMIT 20
    ");
    
    $stmt->execute();
    $signals = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format the results
    $formattedSignals = array_map(function($signal) {
        $signal['minutes_ago'] = (int)$signal['minutes_ago'];
        $signal['confidence'] = (float)$signal['confidence'];
        $signal['current_price'] = $signal['current_price'] ? (float)$signal['current_price'] : null;
        $signal['target_price'] = $signal['target_price'] ? (float)$signal['target_price'] : null;
        $signal['stop_loss'] = $signal['stop_loss'] ? (float)$signal['stop_loss'] : null;
        return $signal;
    }, $signals);
    
    sendResponse([
        'signals' => $formattedSignals,
        'total_signals' => count($formattedSignals),
        'last_updated' => date('Y-m-d H:i:s')
    ], 'AI signals retrieved successfully');
    
} catch (Exception $e) {
    sendResponse([], 'Failed to retrieve AI signals: ' . $e->getMessage(), 500);
}
?>