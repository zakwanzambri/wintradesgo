<?php
/**
 * Portfolio Management API
 * GET /api/portfolio/get.php
 */

require_once '../config/database.php';

try {
    // Only allow GET requests
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        handleError('Method not allowed', 405);
    }
    
    // Simple authentication check (in production, use proper JWT verification)
    $headers = apache_request_headers();
    $auth_header = $headers['Authorization'] ?? '';
    
    if (!$auth_header || !str_starts_with($auth_header, 'Bearer ')) {
        handleError('Unauthorized: Missing or invalid token', 401);
    }
    
    $token = str_replace('Bearer ', '', $auth_header);
    $token_data = json_decode(base64_decode($token), true);
    
    if (!$token_data || !isset($token_data['user_id']) || $token_data['exp'] < time()) {
        handleError('Unauthorized: Invalid or expired token', 401);
    }
    
    $user_id = $token_data['user_id'];
    
    // Connect to database
    $database = new Database();
    $db = $database->getConnection();
    
    // Get portfolio holdings
    $holdings_query = "SELECT 
                        ph.id,
                        ph.symbol,
                        ph.name,
                        ph.amount,
                        ph.avg_price,
                        ph.current_price,
                        ph.total_value,
                        ROUND(((ph.current_price - ph.avg_price) / ph.avg_price) * 100, 2) as change_percentage,
                        ph.last_updated
                       FROM portfolio_holdings ph 
                       WHERE ph.user_id = ? 
                       ORDER BY ph.total_value DESC";
    
    $holdings_stmt = $db->prepare($holdings_query);
    $holdings_stmt->execute([$user_id]);
    $holdings = $holdings_stmt->fetchAll();
    
    // Calculate portfolio totals
    $total_value = 0;
    $total_cost = 0;
    $profitable_positions = 0;
    
    foreach ($holdings as &$holding) {
        $cost_basis = $holding['amount'] * $holding['avg_price'];
        $current_value = $holding['total_value'];
        
        $total_value += $current_value;
        $total_cost += $cost_basis;
        
        if ($current_value > $cost_basis) {
            $profitable_positions++;
        }
        
        // Add calculated fields
        $holding['cost_basis'] = $cost_basis;
        $holding['profit_loss'] = $current_value - $cost_basis;
        $holding['profit_loss_percentage'] = $cost_basis > 0 ? 
            round((($current_value - $cost_basis) / $cost_basis) * 100, 2) : 0;
    }
    
    $total_profit_loss = $total_value - $total_cost;
    $total_profit_loss_percentage = $total_cost > 0 ? 
        round(($total_profit_loss / $total_cost) * 100, 2) : 0;
    
    // Get recent trades
    $trades_query = "SELECT 
                        t.id,
                        t.symbol,
                        t.type,
                        t.amount,
                        t.price,
                        t.total_value,
                        t.fee,
                        t.status,
                        t.timestamp
                     FROM trades t 
                     WHERE t.user_id = ? 
                     ORDER BY t.timestamp DESC 
                     LIMIT 10";
    
    $trades_stmt = $db->prepare($trades_query);
    $trades_stmt->execute([$user_id]);
    $recent_trades = $trades_stmt->fetchAll();
    
    // Get portfolio allocation data for charts
    $allocation_data = [];
    foreach ($holdings as $holding) {
        $allocation_data[] = [
            'name' => $holding['name'],
            'symbol' => $holding['symbol'],
            'value' => round(($holding['total_value'] / $total_value) * 100, 1),
            'amount' => $holding['amount'],
            'usdValue' => $holding['total_value'],
            'change' => $holding['change_percentage'],
            'color' => getAssetColor($holding['symbol'])
        ];
    }
    
    // Performance data (last 30 days) - simplified version
    $performance_data = generatePerformanceData($user_id, $db);
    
    // Portfolio statistics
    $stats = [
        'total_value' => round($total_value, 2),
        'total_cost' => round($total_cost, 2),
        'total_profit_loss' => round($total_profit_loss, 2),
        'total_profit_loss_percentage' => $total_profit_loss_percentage,
        'total_holdings' => count($holdings),
        'profitable_positions' => $profitable_positions,
        'win_rate' => count($holdings) > 0 ? round(($profitable_positions / count($holdings)) * 100, 1) : 0,
        'largest_holding' => $holdings[0] ?? null,
        'best_performer' => getBestPerformer($holdings),
        'worst_performer' => getWorstPerformer($holdings)
    ];
    
    sendResponse([
        'summary' => $stats,
        'holdings' => $holdings,
        'allocation' => $allocation_data,
        'recent_trades' => $recent_trades,
        'performance_data' => $performance_data,
        'last_updated' => date('Y-m-d H:i:s')
    ], 'Portfolio data retrieved successfully');
    
} catch (Exception $e) {
    handleError('Failed to retrieve portfolio: ' . $e->getMessage(), 500);
}

/**
 * Helper function to get asset color for charts
 */
function getAssetColor($symbol) {
    $colors = [
        'BTC' => '#f7931a',
        'ETH' => '#627eea',
        'ADA' => '#0033ad',
        'SOL' => '#9945ff',
        'DOT' => '#e6007a',
        'LINK' => '#2a5ada',
        'UNI' => '#ff007a',
        'LTC' => '#bfbbbb'
    ];
    
    return $colors[$symbol] ?? '#6b7280';
}

/**
 * Generate performance data for the last 30 days
 */
function generatePerformanceData($user_id, $db) {
    // Simplified version - in production, you'd have historical portfolio values
    $data = [];
    $base_value = 100000; // Starting value for demo
    
    for ($i = 29; $i >= 0; $i--) {
        $date = date('Y-m-d', strtotime("-$i days"));
        $variance = (rand(-500, 1000) / 100); // Random variance for demo
        $base_value += $variance;
        
        $data[] = [
            'date' => $date,
            'value' => round($base_value, 2),
            'change' => round($variance, 2)
        ];
    }
    
    return $data;
}

/**
 * Get best performing asset
 */
function getBestPerformer($holdings) {
    if (empty($holdings)) return null;
    
    $best = null;
    $best_performance = -999999;
    
    foreach ($holdings as $holding) {
        if ($holding['change_percentage'] > $best_performance) {
            $best_performance = $holding['change_percentage'];
            $best = $holding;
        }
    }
    
    return $best;
}

/**
 * Get worst performing asset
 */
function getWorstPerformer($holdings) {
    if (empty($holdings)) return null;
    
    $worst = null;
    $worst_performance = 999999;
    
    foreach ($holdings as $holding) {
        if ($holding['change_percentage'] < $worst_performance) {
            $worst_performance = $holding['change_percentage'];
            $worst = $holding;
        }
    }
    
    return $worst;
}
?>