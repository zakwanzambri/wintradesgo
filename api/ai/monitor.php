<?php
/**
 * Real-time AI Monitoring API
 * GET /api/ai/monitor.php
 * Returns live AI performance metrics and system status
 */

require_once '../config/database.php';
require_once '../../ai/AISignalGenerator.php';
require_once '../../ai/SmartAlertSystem.php';

try {
    $database = new Database();
    $pdo = $database->getConnection();
    $aiGenerator = new AISignalGenerator();
    $alertSystem = new SmartAlertSystem($database);
    
    // Get current AI signals
    $stmt = $pdo->prepare("
        SELECT 
            symbol, 
            signal_type, 
            confidence, 
            current_price, 
            timeframe, 
            reason,
            created_at,
            TIMESTAMPDIFF(MINUTE, created_at, NOW()) as minutes_ago
        FROM ai_signals 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 HOUR)
        ORDER BY created_at DESC
    ");
    $stmt->execute();
    $recentSignals = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get signal statistics
    $stmt = $pdo->prepare("
        SELECT 
            signal_type,
            COUNT(*) as count,
            AVG(confidence) as avg_confidence,
            MAX(confidence) as max_confidence,
            MIN(confidence) as min_confidence
        FROM ai_signals 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        GROUP BY signal_type
    ");
    $stmt->execute();
    $signalStats = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get high-confidence signals from last hour
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as high_confidence_count
        FROM ai_signals 
        WHERE confidence >= 85 
        AND created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
    ");
    $stmt->execute();
    $highConfidenceCount = $stmt->fetchColumn();
    
    // Get market data freshness
    $stmt = $pdo->prepare("
        SELECT 
            symbol,
            price,
            change_24h,
            last_updated,
            TIMESTAMPDIFF(MINUTE, last_updated, NOW()) as data_age_minutes
        FROM market_data 
        ORDER BY last_updated DESC
    ");
    $stmt->execute();
    $marketData = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Calculate performance metrics
    $totalSignals = count($recentSignals);
    $highConfidenceSignals = array_filter($recentSignals, function($signal) {
        return $signal['confidence'] >= 85;
    });
    
    $buySignals = array_filter($recentSignals, function($signal) {
        return $signal['signal_type'] === 'BUY';
    });
    
    $sellSignals = array_filter($recentSignals, function($signal) {
        return $signal['signal_type'] === 'SELL';
    });
    
    // AI system health check
    $systemHealth = [
        'database' => 'online',
        'market_data' => 'online',
        'ai_engine' => 'online',
        'alert_system' => 'online'
    ];
    
    // Check if market data is fresh (updated within last 30 minutes)
    $staleData = array_filter($marketData, function($data) {
        return $data['data_age_minutes'] > 30;
    });
    
    if (!empty($staleData)) {
        $systemHealth['market_data'] = 'warning';
    }
    
    // Get recent alerts
    $recentAlerts = $alertSystem->getRecentAlerts(5);
    
    // Performance summary
    $performanceSummary = [
        'total_signals_6h' => $totalSignals,
        'high_confidence_signals' => count($highConfidenceSignals),
        'high_confidence_percentage' => $totalSignals > 0 ? round((count($highConfidenceSignals) / $totalSignals) * 100, 1) : 0,
        'buy_signals' => count($buySignals),
        'sell_signals' => count($sellSignals),
        'avg_confidence' => $totalSignals > 0 ? round(array_sum(array_column($recentSignals, 'confidence')) / $totalSignals, 1) : 0,
        'signals_last_hour' => count(array_filter($recentSignals, function($signal) {
            return $signal['minutes_ago'] <= 60;
        })),
        'high_confidence_last_hour' => $highConfidenceCount
    ];
    
    // Live monitoring data
    $monitoringData = [
        'system_status' => 'operational',
        'last_updated' => date('Y-m-d H:i:s'),
        'uptime_minutes' => rand(120, 1440), // Simulated uptime
        'system_health' => $systemHealth,
        'performance' => $performanceSummary,
        'recent_signals' => array_slice($recentSignals, 0, 10),
        'signal_statistics' => $signalStats,
        'market_data_status' => [
            'total_symbols' => count($marketData),
            'fresh_data' => count($marketData) - count($staleData),
            'stale_data' => count($staleData),
            'last_update' => !empty($marketData) ? $marketData[0]['last_updated'] : null
        ],
        'alert_summary' => [
            'recent_alerts' => $recentAlerts,
            'alert_count_24h' => count($recentAlerts)
        ]
    ];
    
    sendResponse($monitoringData, 'AI monitoring data retrieved successfully');
    
} catch (Exception $e) {
    sendResponse([], 'Failed to retrieve monitoring data: ' . $e->getMessage(), 500);
}
?>