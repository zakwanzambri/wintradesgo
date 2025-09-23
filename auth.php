<?php
/**
 * Authentication and Security System for WinTrades AI Backend
 * Handles user authentication, API key management, and security measures
 */

require_once 'config/database.php';

class AuthenticationSystem {
    
    private $pdo;
    private $jwtSecret;
    private $jwtAlgorithm = 'HS256';
    private $jwtExpiry = 86400; // 24 hours
    
    public function __construct() {
        $database = new Database();
        $this->pdo = $database->getConnection();
        $this->jwtSecret = JWT_SECRET ?? 'default-secret-key-change-in-production';
    }
    
    /**
     * Register new user
     */
    public function registerUser($username, $email, $password, $planType = 'free') {
        try {
            // Validate input
            $validation = $this->validateRegistrationData($username, $email, $password);
            if (!$validation['valid']) {
                return ['success' => false, 'errors' => $validation['errors']];
            }
            
            // Check if user already exists
            $existingUser = $this->getUserByEmail($email);
            if ($existingUser) {
                return ['success' => false, 'errors' => ['Email already registered']];
            }
            
            $existingUsername = $this->getUserByUsername($username);
            if ($existingUsername) {
                return ['success' => false, 'errors' => ['Username already taken']];
            }
            
            // Hash password
            $passwordHash = password_hash($password, PASSWORD_DEFAULT);
            
            // Generate API key
            $apiKey = $this->generateApiKey();
            
            // Calculate subscription expiry
            $subscriptionExpires = $this->calculateSubscriptionExpiry($planType);
            
            // Insert user
            $stmt = $this->pdo->prepare("
                INSERT INTO users 
                (username, email, password_hash, api_key, plan_type, subscription_expires) 
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $username, $email, $passwordHash, $apiKey, $planType, $subscriptionExpires
            ]);
            
            $userId = $this->pdo->lastInsertId();
            
            // Create default portfolio
            $this->createDefaultPortfolio($userId);
            
            // Create default preferences
            $this->createDefaultPreferences($userId);
            
            // Log registration
            $this->logActivity('user_registered', "User {$username} registered", $userId);
            
            return [
                'success' => true,
                'user_id' => $userId,
                'api_key' => $apiKey,
                'message' => 'Registration successful'
            ];
            
        } catch (Exception $e) {
            $this->logActivity('registration_error', $e->getMessage());
            return ['success' => false, 'errors' => ['Registration failed: ' . $e->getMessage()]];
        }
    }
    
    /**
     * Authenticate user login
     */
    public function authenticateUser($emailOrUsername, $password) {
        try {
            // Get user by email or username
            $user = filter_var($emailOrUsername, FILTER_VALIDATE_EMAIL) 
                ? $this->getUserByEmail($emailOrUsername)
                : $this->getUserByUsername($emailOrUsername);
            
            if (!$user) {
                $this->logActivity('login_failed', "Invalid credentials for: {$emailOrUsername}");
                return ['success' => false, 'error' => 'Invalid credentials'];
            }
            
            // Verify password
            if (!password_verify($password, $user['password_hash'])) {
                $this->logActivity('login_failed', "Wrong password for user: {$user['username']}", $user['id']);
                return ['success' => false, 'error' => 'Invalid credentials'];
            }
            
            // Check if account is active
            if (!$user['is_active']) {
                return ['success' => false, 'error' => 'Account is deactivated'];
            }
            
            // Update last login
            $this->updateLastLogin($user['id']);
            
            // Generate JWT token
            $token = $this->generateJWT($user);
            
            // Log successful login
            $this->logActivity('login_success', "User {$user['username']} logged in", $user['id']);
            
            return [
                'success' => true,
                'token' => $token,
                'user' => [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'email' => $user['email'],
                    'plan_type' => $user['plan_type'],
                    'api_key' => $user['api_key']
                ]
            ];
            
        } catch (Exception $e) {
            $this->logActivity('login_error', $e->getMessage());
            return ['success' => false, 'error' => 'Login failed: ' . $e->getMessage()];
        }
    }
    
    /**
     * Validate JWT token
     */
    public function validateToken($token) {
        try {
            if (empty($token)) {
                return ['valid' => false, 'error' => 'No token provided'];
            }
            
            // Remove Bearer prefix if present
            $token = str_replace('Bearer ', '', $token);
            
            // Decode JWT
            $decoded = $this->decodeJWT($token);
            
            if (!$decoded) {
                return ['valid' => false, 'error' => 'Invalid token'];
            }
            
            // Check expiration
            if ($decoded['exp'] < time()) {
                return ['valid' => false, 'error' => 'Token expired'];
            }
            
            // Get user data
            $user = $this->getUserById($decoded['user_id']);
            
            if (!$user || !$user['is_active']) {
                return ['valid' => false, 'error' => 'User not found or inactive'];
            }
            
            return [
                'valid' => true,
                'user' => $user,
                'token_data' => $decoded
            ];
            
        } catch (Exception $e) {
            return ['valid' => false, 'error' => 'Token validation failed'];
        }
    }
    
    /**
     * Validate API key
     */
    public function validateApiKey($apiKey) {
        try {
            if (empty($apiKey)) {
                return ['valid' => false, 'error' => 'No API key provided'];
            }
            
            $user = $this->getUserByApiKey($apiKey);
            
            if (!$user) {
                $this->logActivity('invalid_api_key', "Invalid API key used: " . substr($apiKey, 0, 8) . "...");
                return ['valid' => false, 'error' => 'Invalid API key'];
            }
            
            if (!$user['is_active']) {
                return ['valid' => false, 'error' => 'Account inactive'];
            }
            
            // Check subscription status
            if ($this->isSubscriptionExpired($user)) {
                return ['valid' => false, 'error' => 'Subscription expired'];
            }
            
            // Log API usage
            $this->logApiUsage($user['id'], $apiKey);
            
            return [
                'valid' => true,
                'user' => $user
            ];
            
        } catch (Exception $e) {
            return ['valid' => false, 'error' => 'API key validation failed'];
        }
    }
    
    /**
     * Generate new API key for user
     */
    public function regenerateApiKey($userId) {
        try {
            $apiKey = $this->generateApiKey();
            
            $stmt = $this->pdo->prepare("UPDATE users SET api_key = ? WHERE id = ?");
            $stmt->execute([$apiKey, $userId]);
            
            $this->logActivity('api_key_regenerated', "API key regenerated", $userId);
            
            return ['success' => true, 'api_key' => $apiKey];
            
        } catch (Exception $e) {
            return ['success' => false, 'error' => 'Failed to regenerate API key'];
        }
    }
    
    /**
     * Change user password
     */
    public function changePassword($userId, $currentPassword, $newPassword) {
        try {
            $user = $this->getUserById($userId);
            
            if (!$user) {
                return ['success' => false, 'error' => 'User not found'];
            }
            
            // Verify current password
            if (!password_verify($currentPassword, $user['password_hash'])) {
                return ['success' => false, 'error' => 'Current password is incorrect'];
            }
            
            // Validate new password
            $validation = $this->validatePassword($newPassword);
            if (!$validation['valid']) {
                return ['success' => false, 'errors' => $validation['errors']];
            }
            
            // Hash new password
            $newPasswordHash = password_hash($newPassword, PASSWORD_DEFAULT);
            
            // Update password
            $stmt = $this->pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
            $stmt->execute([$newPasswordHash, $userId]);
            
            $this->logActivity('password_changed', "Password changed", $userId);
            
            return ['success' => true, 'message' => 'Password changed successfully'];
            
        } catch (Exception $e) {
            return ['success' => false, 'error' => 'Failed to change password'];
        }
    }
    
    /**
     * Reset password via email
     */
    public function requestPasswordReset($email) {
        try {
            $user = $this->getUserByEmail($email);
            
            if (!$user) {
                // Don't reveal if email exists
                return ['success' => true, 'message' => 'If email exists, reset instructions sent'];
            }
            
            $resetToken = $this->generateResetToken();
            $expiresAt = date('Y-m-d H:i:s', time() + 3600); // 1 hour
            
            // Store reset token
            $stmt = $this->pdo->prepare("
                INSERT INTO password_resets (user_id, token, expires_at) 
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE token = ?, expires_at = ?
            ");
            $stmt->execute([$user['id'], $resetToken, $expiresAt, $resetToken, $expiresAt]);
            
            // In production, send email here
            $this->logActivity('password_reset_requested', "Password reset requested", $user['id']);
            
            return [
                'success' => true,
                'message' => 'Reset instructions sent',
                'reset_token' => $resetToken // Remove in production
            ];
            
        } catch (Exception $e) {
            return ['success' => false, 'error' => 'Failed to process reset request'];
        }
    }
    
    /**
     * Check rate limiting
     */
    public function checkRateLimit($userId, $endpoint, $limit = 100, $window = 3600) {
        try {
            $since = date('Y-m-d H:i:s', time() - $window);
            
            $stmt = $this->pdo->prepare("
                SELECT COUNT(*) as count 
                FROM api_usage 
                WHERE user_id = ? AND endpoint LIKE ? AND created_at > ?
            ");
            $stmt->execute([$userId, $endpoint . '%', $since]);
            
            $usage = $stmt->fetch(PDO::FETCH_ASSOC);
            $currentCount = $usage['count'] ?? 0;
            
            return [
                'allowed' => $currentCount < $limit,
                'current_usage' => $currentCount,
                'limit' => $limit,
                'reset_time' => time() + $window
            ];
            
        } catch (Exception $e) {
            // Allow on error to not block legitimate users
            return ['allowed' => true, 'current_usage' => 0, 'limit' => $limit];
        }
    }
    
    /**
     * Get user permissions
     */
    public function getUserPermissions($user) {
        $planPermissions = [
            'free' => [
                'api_calls_per_hour' => 100,
                'ai_signals_per_day' => 10,
                'portfolio_tracking' => 1,
                'real_time_data' => false,
                'advanced_analytics' => false,
                'backtesting' => false
            ],
            'premium' => [
                'api_calls_per_hour' => 1000,
                'ai_signals_per_day' => 100,
                'portfolio_tracking' => 5,
                'real_time_data' => true,
                'advanced_analytics' => true,
                'backtesting' => true
            ],
            'pro' => [
                'api_calls_per_hour' => 10000,
                'ai_signals_per_day' => 1000,
                'portfolio_tracking' => 'unlimited',
                'real_time_data' => true,
                'advanced_analytics' => true,
                'backtesting' => true,
                'custom_strategies' => true,
                'api_access' => true
            ]
        ];
        
        return $planPermissions[$user['plan_type']] ?? $planPermissions['free'];
    }
    
    /**
     * Helper methods
     */
    private function validateRegistrationData($username, $email, $password) {
        $errors = [];
        
        // Username validation
        if (strlen($username) < 3 || strlen($username) > 50) {
            $errors[] = 'Username must be 3-50 characters';
        }
        
        if (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
            $errors[] = 'Username can only contain letters, numbers, and underscores';
        }
        
        // Email validation
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors[] = 'Invalid email format';
        }
        
        // Password validation
        $passwordValidation = $this->validatePassword($password);
        if (!$passwordValidation['valid']) {
            $errors = array_merge($errors, $passwordValidation['errors']);
        }
        
        return ['valid' => empty($errors), 'errors' => $errors];
    }
    
    private function validatePassword($password) {
        $errors = [];
        
        if (strlen($password) < 8) {
            $errors[] = 'Password must be at least 8 characters';
        }
        
        if (!preg_match('/[A-Z]/', $password)) {
            $errors[] = 'Password must contain at least one uppercase letter';
        }
        
        if (!preg_match('/[a-z]/', $password)) {
            $errors[] = 'Password must contain at least one lowercase letter';
        }
        
        if (!preg_match('/[0-9]/', $password)) {
            $errors[] = 'Password must contain at least one number';
        }
        
        return ['valid' => empty($errors), 'errors' => $errors];
    }
    
    private function generateApiKey() {
        return 'wt_' . bin2hex(random_bytes(32));
    }
    
    private function generateResetToken() {
        return bin2hex(random_bytes(32));
    }
    
    private function calculateSubscriptionExpiry($planType) {
        if ($planType === 'free') {
            return null;
        }
        
        return date('Y-m-d', strtotime('+1 month'));
    }
    
    private function generateJWT($user) {
        $header = json_encode(['typ' => 'JWT', 'alg' => $this->jwtAlgorithm]);
        $payload = json_encode([
            'user_id' => $user['id'],
            'username' => $user['username'],
            'plan_type' => $user['plan_type'],
            'iat' => time(),
            'exp' => time() + $this->jwtExpiry
        ]);
        
        $headerEncoded = $this->base64UrlEncode($header);
        $payloadEncoded = $this->base64UrlEncode($payload);
        
        $signature = hash_hmac('sha256', $headerEncoded . '.' . $payloadEncoded, $this->jwtSecret, true);
        $signatureEncoded = $this->base64UrlEncode($signature);
        
        return $headerEncoded . '.' . $payloadEncoded . '.' . $signatureEncoded;
    }
    
    private function decodeJWT($token) {
        $parts = explode('.', $token);
        
        if (count($parts) !== 3) {
            return false;
        }
        
        $header = json_decode($this->base64UrlDecode($parts[0]), true);
        $payload = json_decode($this->base64UrlDecode($parts[1]), true);
        $signature = $this->base64UrlDecode($parts[2]);
        
        $expectedSignature = hash_hmac('sha256', $parts[0] . '.' . $parts[1], $this->jwtSecret, true);
        
        if (!hash_equals($signature, $expectedSignature)) {
            return false;
        }
        
        return $payload;
    }
    
    private function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
    
    private function base64UrlDecode($data) {
        return base64_decode(str_pad(strtr($data, '-_', '+/'), strlen($data) % 4, '=', STR_PAD_RIGHT));
    }
    
    private function getUserByEmail($email) {
        $stmt = $this->pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    private function getUserByUsername($username) {
        $stmt = $this->pdo->prepare("SELECT * FROM users WHERE username = ?");
        $stmt->execute([$username]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    private function getUserById($id) {
        $stmt = $this->pdo->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    private function getUserByApiKey($apiKey) {
        $stmt = $this->pdo->prepare("SELECT * FROM users WHERE api_key = ?");
        $stmt->execute([$apiKey]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    private function isSubscriptionExpired($user) {
        if ($user['plan_type'] === 'free') {
            return false;
        }
        
        return $user['subscription_expires'] && $user['subscription_expires'] < date('Y-m-d');
    }
    
    private function updateLastLogin($userId) {
        $stmt = $this->pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
        $stmt->execute([$userId]);
    }
    
    private function createDefaultPortfolio($userId) {
        $stmt = $this->pdo->prepare("
            INSERT INTO portfolios (user_id, name, description, is_default) 
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$userId, 'My Portfolio', 'Default trading portfolio', true]);
    }
    
    private function createDefaultPreferences($userId) {
        $defaultPreferences = [
            'risk_tolerance' => 'moderate',
            'notifications' => ['email' => true, 'push' => false],
            'trading' => ['auto_execute' => false, 'max_position_size' => 10]
        ];
        
        $stmt = $this->pdo->prepare("
            INSERT INTO user_preferences 
            (user_id, trading_preferences, notification_settings, risk_tolerance) 
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([
            $userId,
            json_encode($defaultPreferences['trading']),
            json_encode($defaultPreferences['notifications']),
            $defaultPreferences['risk_tolerance']
        ]);
    }
    
    private function logActivity($action, $message, $userId = null) {
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO system_logs 
                (log_level, component, message, user_id, ip_address) 
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                'info',
                'auth',
                $message,
                $userId,
                $_SERVER['REMOTE_ADDR'] ?? 'unknown'
            ]);
        } catch (Exception $e) {
            error_log("Failed to log activity: " . $e->getMessage());
        }
    }
    
    private function logApiUsage($userId, $apiKey) {
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO api_usage 
                (user_id, api_key, endpoint, method, ip_address, user_agent) 
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $userId,
                $apiKey,
                $_SERVER['REQUEST_URI'] ?? 'unknown',
                $_SERVER['REQUEST_METHOD'] ?? 'GET',
                $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
            ]);
        } catch (Exception $e) {
            error_log("Failed to log API usage: " . $e->getMessage());
        }
    }
}

/**
 * Middleware for authentication
 */
class AuthMiddleware {
    
    private $auth;
    
    public function __construct() {
        $this->auth = new AuthenticationSystem();
    }
    
    /**
     * Verify JWT token from request
     */
    public function verifyToken() {
        $token = $this->getTokenFromRequest();
        
        if (!$token) {
            $this->sendUnauthorized('No token provided');
            return false;
        }
        
        $validation = $this->auth->validateToken($token);
        
        if (!$validation['valid']) {
            $this->sendUnauthorized($validation['error']);
            return false;
        }
        
        // Set global user for request
        $GLOBALS['current_user'] = $validation['user'];
        
        return $validation['user'];
    }
    
    /**
     * Verify API key from request
     */
    public function verifyApiKey() {
        $apiKey = $this->getApiKeyFromRequest();
        
        if (!$apiKey) {
            $this->sendUnauthorized('No API key provided');
            return false;
        }
        
        $validation = $this->auth->validateApiKey($apiKey);
        
        if (!$validation['valid']) {
            $this->sendUnauthorized($validation['error']);
            return false;
        }
        
        // Set global user for request
        $GLOBALS['current_user'] = $validation['user'];
        
        return $validation['user'];
    }
    
    /**
     * Check rate limiting
     */
    public function checkRateLimit($endpoint, $limit = 100) {
        $user = $GLOBALS['current_user'] ?? null;
        
        if (!$user) {
            return true; // Skip if no user context
        }
        
        $rateLimit = $this->auth->checkRateLimit($user['id'], $endpoint, $limit);
        
        if (!$rateLimit['allowed']) {
            $this->sendRateLimited($rateLimit);
            return false;
        }
        
        return true;
    }
    
    private function getTokenFromRequest() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        
        if (strpos($authHeader, 'Bearer ') === 0) {
            return substr($authHeader, 7);
        }
        
        return $_GET['token'] ?? $_POST['token'] ?? null;
    }
    
    private function getApiKeyFromRequest() {
        $headers = getallheaders();
        return $headers['X-API-Key'] ?? $_GET['api_key'] ?? $_POST['api_key'] ?? null;
    }
    
    private function sendUnauthorized($message) {
        http_response_code(401);
        echo json_encode([
            'error' => 'Unauthorized',
            'message' => $message,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        exit;
    }
    
    private function sendRateLimited($rateLimit) {
        http_response_code(429);
        echo json_encode([
            'error' => 'Rate limit exceeded',
            'current_usage' => $rateLimit['current_usage'],
            'limit' => $rateLimit['limit'],
            'reset_time' => $rateLimit['reset_time'],
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        exit;
    }
}
?>