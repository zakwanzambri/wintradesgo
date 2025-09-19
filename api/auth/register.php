<?php
/**
 * User Registration API
 * POST /api/auth/register.php
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
        'email' => ['required' => true, 'type' => 'email', 'max_length' => 255],
        'password' => ['required' => true, 'type' => 'string', 'min_length' => 8],
        'first_name' => ['required' => true, 'type' => 'string', 'max_length' => 100],
        'last_name' => ['required' => true, 'type' => 'string', 'max_length' => 100],
        'plan_type' => ['type' => 'string']
    ];
    
    $validation = validateInput($input, $rules);
    
    if (!empty($validation['errors'])) {
        handleError('Validation failed: ' . implode(', ', $validation['errors']), 400);
    }
    
    $data = $validation['data'];
    
    // Set default plan if not provided
    $plan_type = $data['plan_type'] ?? 'starter';
    if (!in_array($plan_type, ['starter', 'pro', 'enterprise'])) {
        $plan_type = 'starter';
    }
    
    // Connect to database
    $database = new Database();
    $db = $database->getConnection();
    
    // Check if email already exists
    $check_query = "SELECT id FROM users WHERE email = ? LIMIT 1";
    $check_stmt = $db->prepare($check_query);
    $check_stmt->execute([$data['email']]);
    
    if ($check_stmt->rowCount() > 0) {
        handleError('Email already registered', 409);
    }
    
    // Hash password
    $password_hash = password_hash($data['password'], PASSWORD_DEFAULT);
    
    // Generate API key
    $api_key = bin2hex(random_bytes(32));
    
    // Insert new user
    $insert_query = "INSERT INTO users (email, password_hash, first_name, last_name, plan_type, api_key) 
                     VALUES (?, ?, ?, ?, ?, ?)";
    
    $insert_stmt = $db->prepare($insert_query);
    $result = $insert_stmt->execute([
        $data['email'],
        $password_hash,
        $data['first_name'],
        $data['last_name'],
        $plan_type,
        $api_key
    ]);
    
    if (!$result) {
        handleError('Failed to create user account', 500);
    }
    
    $user_id = $db->lastInsertId();
    
    // Create default user settings
    $settings_query = "INSERT INTO user_settings (user_id) VALUES (?)";
    $settings_stmt = $db->prepare($settings_query);
    $settings_stmt->execute([$user_id]);
    
    // Generate JWT token (simplified - in production use proper JWT library)
    $token_payload = [
        'user_id' => $user_id,
        'email' => $data['email'],
        'plan' => $plan_type,
        'exp' => time() + Config::$jwt_expire
    ];
    
    $token = base64_encode(json_encode($token_payload));
    
    // Store session
    $session_token = bin2hex(random_bytes(32));
    $expires_at = date('Y-m-d H:i:s', time() + Config::$jwt_expire);
    
    $session_query = "INSERT INTO user_sessions (user_id, session_token, expires_at, ip_address, user_agent) 
                      VALUES (?, ?, ?, ?, ?)";
    $session_stmt = $db->prepare($session_query);
    $session_stmt->execute([
        $user_id,
        $session_token,
        $expires_at,
        $_SERVER['REMOTE_ADDR'] ?? '',
        $_SERVER['HTTP_USER_AGENT'] ?? ''
    ]);
    
    // Return success response
    sendResponse([
        'user' => [
            'id' => $user_id,
            'email' => $data['email'],
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'plan_type' => $plan_type,
            'api_key' => $api_key
        ],
        'token' => $token,
        'session_token' => $session_token,
        'expires_at' => $expires_at
    ], 'User registered successfully', 201);
    
} catch (Exception $e) {
    handleError('Registration failed: ' . $e->getMessage(), 500);
}
?>