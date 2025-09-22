<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../../config/database.php';

/**
 * Authentication API for WinTrades
 * Handles user registration, login, JWT tokens, and session management
 */

class AuthAPI {
    
    private $pdo;
    private $jwt_secret;
    private $jwt_algorithm = 'HS256';
    
    public function __construct() {
        // Database connection
        $this->pdo = new PDO(
            "mysql:host=localhost;dbname=wintradesgo;charset=utf8mb4",
            "root",
            "",
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ]
        );
        
        // JWT Secret (in production, use environment variable)
        $this->jwt_secret = 'wintradesgo_jwt_secret_key_2025';
        
        // Initialize database tables
        $this->initializeTables();
    }
    
    public function handleRequest() {
        try {
            $action = $_GET['action'] ?? $_POST['action'] ?? 'status';
            $method = $_SERVER['REQUEST_METHOD'];
            
            switch ($action) {
                case 'register':
                    return $this->register();
                    
                case 'login':
                    return $this->login();
                    
                case 'logout':
                    return $this->logout();
                    
                case 'verify':
                    return $this->verifyToken();
                    
                case 'refresh':
                    return $this->refreshToken();
                    
                case 'profile':
                    return $this->getProfile();
                    
                case 'update_profile':
                    return $this->updateProfile();
                    
                case 'change_password':
                    return $this->changePassword();
                    
                case 'forgot_password':
                    return $this->forgotPassword();
                    
                case 'reset_password':
                    return $this->resetPassword();
                    
                case 'status':
                default:
                    return $this->getStatus();
            }
            
        } catch (Exception $e) {
            return $this->sendResponse(false, null, 'Server error: ' . $e->getMessage());
        }
    }
    
    /**
     * Initialize database tables
     */
    private function initializeTables() {
        // Users table
        $sql = "CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            first_name VARCHAR(50),
            last_name VARCHAR(50),
            avatar_url VARCHAR(255),
            email_verified BOOLEAN DEFAULT FALSE,
            is_active BOOLEAN DEFAULT TRUE,
            role ENUM('user', 'premium', 'admin') DEFAULT 'user',
            last_login DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX(username),
            INDEX(email)
        )";
        $this->pdo->exec($sql);
        
        // User sessions table
        $sql = "CREATE TABLE IF NOT EXISTS user_sessions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            token_hash VARCHAR(255) NOT NULL,
            refresh_token_hash VARCHAR(255) NOT NULL,
            device_info TEXT,
            ip_address VARCHAR(45),
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX(user_id),
            INDEX(token_hash),
            INDEX(expires_at)
        )";
        $this->pdo->exec($sql);
        
        // Password reset tokens table
        $sql = "CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            token VARCHAR(255) NOT NULL,
            expires_at DATETIME NOT NULL,
            used BOOLEAN DEFAULT FALSE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX(user_id),
            INDEX(token),
            INDEX(expires_at)
        )";
        $this->pdo->exec($sql);
        
        // Create default admin user if not exists
        $this->createDefaultUser();
    }
    
    /**
     * Create default admin user
     */
    private function createDefaultUser() {
        $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM users WHERE role = 'admin'");
        $stmt->execute();
        
        if ($stmt->fetchColumn() == 0) {
            $sql = "INSERT INTO users (username, email, password_hash, first_name, last_name, role, email_verified) 
                   VALUES (?, ?, ?, ?, ?, 'admin', TRUE)";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                'admin',
                'admin@wintradesgo.com',
                password_hash('admin123', PASSWORD_DEFAULT),
                'System',
                'Administrator'
            ]);
        }
    }
    
    /**
     * User registration
     */
    private function register() {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            return $this->sendResponse(false, null, 'Invalid JSON input');
        }
        
        $username = trim($input['username'] ?? '');
        $email = trim($input['email'] ?? '');
        $password = $input['password'] ?? '';
        $firstName = trim($input['firstName'] ?? '');
        $lastName = trim($input['lastName'] ?? '');
        
        // Validation
        if (empty($username) || empty($email) || empty($password)) {
            return $this->sendResponse(false, null, 'Username, email, and password are required');
        }
        
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->sendResponse(false, null, 'Invalid email format');
        }
        
        if (strlen($password) < 6) {
            return $this->sendResponse(false, null, 'Password must be at least 6 characters long');
        }
        
        // Check if user exists
        $stmt = $this->pdo->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
        $stmt->execute([$username, $email]);
        
        if ($stmt->fetch()) {
            return $this->sendResponse(false, null, 'Username or email already exists');
        }
        
        // Create user
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
        $sql = "INSERT INTO users (username, email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?, ?)";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$username, $email, $passwordHash, $firstName, $lastName]);
        
        $userId = $this->pdo->lastInsertId();
        
        // Generate tokens
        $tokens = $this->generateTokens($userId);
        
        return $this->sendResponse(true, [
            'user' => $this->getUserData($userId),
            'tokens' => $tokens
        ], 'Registration successful');
    }
    
    /**
     * User login
     */
    private function login() {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            return $this->sendResponse(false, null, 'Invalid JSON input');
        }
        
        $identifier = trim($input['username'] ?? $input['email'] ?? '');
        $password = $input['password'] ?? '';
        $rememberMe = $input['rememberMe'] ?? false;
        
        if (empty($identifier) || empty($password)) {
            return $this->sendResponse(false, null, 'Username/email and password are required');
        }
        
        // Find user
        $sql = "SELECT * FROM users WHERE (username = ? OR email = ?) AND is_active = TRUE";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$identifier, $identifier]);
        $user = $stmt->fetch();
        
        if (!$user || !password_verify($password, $user['password_hash'])) {
            return $this->sendResponse(false, null, 'Invalid credentials');
        }
        
        // Update last login
        $stmt = $this->pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
        $stmt->execute([$user['id']]);
        
        // Generate tokens
        $tokens = $this->generateTokens($user['id'], $rememberMe);
        
        return $this->sendResponse(true, [
            'user' => $this->getUserData($user['id']),
            'tokens' => $tokens
        ], 'Login successful');
    }
    
    /**
     * Generate JWT tokens
     */
    private function generateTokens($userId, $rememberMe = false) {
        $now = time();
        $expiry = $rememberMe ? $now + (30 * 24 * 60 * 60) : $now + (24 * 60 * 60); // 30 days or 1 day
        $refreshExpiry = $now + (30 * 24 * 60 * 60); // 30 days
        
        // Access token payload
        $payload = [
            'user_id' => $userId,
            'iat' => $now,
            'exp' => $expiry
        ];
        
        // Refresh token payload
        $refreshPayload = [
            'user_id' => $userId,
            'type' => 'refresh',
            'iat' => $now,
            'exp' => $refreshExpiry
        ];
        
        $accessToken = $this->createJWT($payload);
        $refreshToken = $this->createJWT($refreshPayload);
        
        // Store session
        $this->storeSession($userId, $accessToken, $refreshToken, $expiry);
        
        return [
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
            'expires_in' => $expiry - $now,
            'token_type' => 'Bearer'
        ];
    }
    
    /**
     * Simple JWT creation (base64 encoded)
     */
    private function createJWT($payload) {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode($payload);
        
        $headerEncoded = $this->base64UrlEncode($header);
        $payloadEncoded = $this->base64UrlEncode($payload);
        
        $signature = hash_hmac('sha256', $headerEncoded . '.' . $payloadEncoded, $this->jwt_secret, true);
        $signatureEncoded = $this->base64UrlEncode($signature);
        
        return $headerEncoded . '.' . $payloadEncoded . '.' . $signatureEncoded;
    }
    
    /**
     * Verify JWT token
     */
    private function verifyJWT($token) {
        $parts = explode('.', $token);
        
        if (count($parts) !== 3) {
            return false;
        }
        
        list($headerEncoded, $payloadEncoded, $signatureEncoded) = $parts;
        
        $signature = $this->base64UrlDecode($signatureEncoded);
        $expectedSignature = hash_hmac('sha256', $headerEncoded . '.' . $payloadEncoded, $this->jwt_secret, true);
        
        if (!hash_equals($signature, $expectedSignature)) {
            return false;
        }
        
        $payload = json_decode($this->base64UrlDecode($payloadEncoded), true);
        
        if (!$payload || $payload['exp'] < time()) {
            return false;
        }
        
        return $payload;
    }
    
    /**
     * Store user session
     */
    private function storeSession($userId, $accessToken, $refreshToken, $expiry) {
        $tokenHash = hash('sha256', $accessToken);
        $refreshTokenHash = hash('sha256', $refreshToken);
        $deviceInfo = $_SERVER['HTTP_USER_AGENT'] ?? '';
        $ipAddress = $_SERVER['REMOTE_ADDR'] ?? '';
        
        $sql = "INSERT INTO user_sessions (user_id, token_hash, refresh_token_hash, device_info, ip_address, expires_at) 
               VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            $userId, 
            $tokenHash, 
            $refreshTokenHash, 
            $deviceInfo, 
            $ipAddress, 
            date('Y-m-d H:i:s', $expiry)
        ]);
    }
    
    /**
     * Verify token endpoint
     */
    private function verifyToken() {
        $token = $this->getBearerToken();
        
        if (!$token) {
            return $this->sendResponse(false, null, 'No token provided');
        }
        
        $payload = $this->verifyJWT($token);
        
        if (!$payload) {
            return $this->sendResponse(false, null, 'Invalid or expired token');
        }
        
        return $this->sendResponse(true, [
            'user' => $this->getUserData($payload['user_id']),
            'valid' => true
        ], 'Token is valid');
    }
    
    /**
     * Get user profile
     */
    private function getProfile() {
        $token = $this->getBearerToken();
        
        if (!$token) {
            return $this->sendResponse(false, null, 'Authentication required');
        }
        
        $payload = $this->verifyJWT($token);
        
        if (!$payload) {
            return $this->sendResponse(false, null, 'Invalid or expired token');
        }
        
        return $this->sendResponse(true, [
            'user' => $this->getUserData($payload['user_id'])
        ]);
    }
    
    /**
     * Get user data
     */
    private function getUserData($userId) {
        $stmt = $this->pdo->prepare("
            SELECT id, username, email, first_name, last_name, avatar_url, 
                   role, email_verified, last_login, created_at 
            FROM users WHERE id = ?
        ");
        $stmt->execute([$userId]);
        return $stmt->fetch();
    }
    
    /**
     * Get Bearer token from header
     */
    private function getBearerToken() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        
        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return $matches[1];
        }
        
        return null;
    }
    
    /**
     * Logout
     */
    private function logout() {
        $token = $this->getBearerToken();
        
        if ($token) {
            $tokenHash = hash('sha256', $token);
            $stmt = $this->pdo->prepare("DELETE FROM user_sessions WHERE token_hash = ?");
            $stmt->execute([$tokenHash]);
        }
        
        return $this->sendResponse(true, null, 'Logged out successfully');
    }
    
    /**
     * Get API status
     */
    private function getStatus() {
        return $this->sendResponse(true, [
            'service' => 'WinTrades Auth API',
            'version' => '1.0.0',
            'timestamp' => date('Y-m-d H:i:s'),
            'endpoints' => [
                'register' => 'POST /auth.php?action=register',
                'login' => 'POST /auth.php?action=login',
                'logout' => 'POST /auth.php?action=logout',
                'verify' => 'GET /auth.php?action=verify',
                'profile' => 'GET /auth.php?action=profile'
            ]
        ]);
    }
    
    /**
     * Base64 URL encode
     */
    private function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
    
    /**
     * Base64 URL decode
     */
    private function base64UrlDecode($data) {
        return base64_decode(str_pad(strtr($data, '-_', '+/'), strlen($data) % 4, '=', STR_PAD_RIGHT));
    }
    
    /**
     * Send JSON response
     */
    private function sendResponse($success, $data = null, $message = '') {
        echo json_encode([
            'success' => $success,
            'data' => $data,
            'message' => $message,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        exit;
    }
}

// Initialize and handle request
$api = new AuthAPI();
$api->handleRequest();
?>