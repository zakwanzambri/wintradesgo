<?php
/**
 * User Login API
 * POST /api/auth/login.php
 */

require_once '../config/database.php';

try {
    // Only allow POST requests
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        handleError('Method not allowed', 405);
    }
    
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        handleError('Invalid JSON input', 400);
    }
    
    // Validation rules
    $rules = [
        'email' => ['required' => true, 'type' => 'email'],
        'password' => ['required' => true, 'type' => 'string']
    ];
    
    $validation = validateInput($input, $rules);
    
    if (!empty($validation['errors'])) {
        handleError('Validation failed: ' . implode(', ', $validation['errors']), 400);
    }
    
    $data = $validation['data'];
    
    // Connect to database
    $database = new Database();
    $db = $database->getConnection();
    
    // Find user by email
    $user_query = "SELECT id, email, password_hash, first_name, last_name, plan_type, api_key, email_verified 
                   FROM users WHERE email = ? LIMIT 1";
    $user_stmt = $db->prepare($user_query);
    $user_stmt->execute([$data['email']]);
    
    if ($user_stmt->rowCount() === 0) {
        handleError('Invalid credentials', 401);
    }
    
    $user = $user_stmt->fetch();
    
    // Verify password
    if (!password_verify($data['password'], $user['password_hash'])) {
        handleError('Invalid credentials', 401);
    }
    
    // Generate JWT token (simplified - in production use proper JWT library)
    $token_payload = [
        'user_id' => $user['id'],
        'email' => $user['email'],
        'plan' => $user['plan_type'],
        'exp' => time() + Config::$jwt_expire
    ];
    
    $token = base64_encode(json_encode($token_payload));
    
    // Create new session
    $session_token = bin2hex(random_bytes(32));
    $expires_at = date('Y-m-d H:i:s', time() + Config::$jwt_expire);
    
    // Clean up old sessions (optional)
    $cleanup_query = "DELETE FROM user_sessions WHERE user_id = ? AND expires_at < NOW()";
    $cleanup_stmt = $db->prepare($cleanup_query);
    $cleanup_stmt->execute([$user['id']]);
    
    // Insert new session
    $session_query = "INSERT INTO user_sessions (user_id, session_token, expires_at, ip_address, user_agent) 
                      VALUES (?, ?, ?, ?, ?)";
    $session_stmt = $db->prepare($session_query);
    $session_stmt->execute([
        $user['id'],
        $session_token,
        $expires_at,
        $_SERVER['REMOTE_ADDR'] ?? '',
        $_SERVER['HTTP_USER_AGENT'] ?? ''
    ]);
    
    // Get user settings
    $settings_query = "SELECT theme, currency, notifications_enabled, timezone, language 
                       FROM user_settings WHERE user_id = ?";
    $settings_stmt = $db->prepare($settings_query);
    $settings_stmt->execute([$user['id']]);
    $settings = $settings_stmt->fetch() ?: [];
    
    // Get portfolio summary
    $portfolio_query = "SELECT COUNT(*) as total_holdings, 
                               SUM(total_value) as total_value,
                               SUM(CASE WHEN (current_price - avg_price) > 0 THEN 1 ELSE 0 END) as profitable_positions
                        FROM portfolio_holdings WHERE user_id = ?";
    $portfolio_stmt = $db->prepare($portfolio_query);
    $portfolio_stmt->execute([$user['id']]);
    $portfolio_summary = $portfolio_stmt->fetch() ?: [];
    
    // Return success response
    sendResponse([
        'user' => [
            'id' => $user['id'],
            'email' => $user['email'],
            'first_name' => $user['first_name'],
            'last_name' => $user['last_name'],
            'plan_type' => $user['plan_type'],
            'email_verified' => (bool)$user['email_verified'],
            'settings' => $settings,
            'portfolio_summary' => $portfolio_summary
        ],
        'token' => $token,
        'session_token' => $session_token,
        'expires_at' => $expires_at,
        'permissions' => [
            'ai_signals' => in_array($user['plan_type'], ['pro', 'enterprise']),
            'unlimited_alerts' => in_array($user['plan_type'], ['pro', 'enterprise']),
            'api_access' => $user['plan_type'] === 'enterprise'
        ]
    ], 'Login successful');
    
} catch (Exception $e) {
    handleError('Login failed: ' . $e->getMessage(), 500);
}
?>