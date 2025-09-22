<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once('../config/database.php');

/**
 * Simple Authentication API for WinTrades
 * Works with current database schema: users (id, username, email, password, role, created_at, updated_at, is_active)
 */

class SimpleAuthAPI {
    
    private $pdo;
    private $jwt_secret = 'wintradesgo_jwt_secret_key_2025';
    
    public function __construct() {
        $database = getDatabase();
        $this->pdo = $database->getConnection();
    }
    
    public function handleRequest() {
        try {
            $action = $_GET['action'] ?? 'status';
            
            switch ($action) {
                case 'login':
                    return $this->login();
                case 'register':
                    return $this->register();
                case 'verify':
                    return $this->verify();
                case 'logout':
                    return $this->logout();
                default:
                    return $this->status();
            }
        } catch (Exception $e) {
            return $this->sendResponse(false, null, 'Server error: ' . $e->getMessage());
        }
    }
    
    private function login() {
        $input = json_decode(file_get_contents('php://input'), true);
        $username = $input['username'] ?? '';
        $password = $input['password'] ?? '';
        
        if (empty($username) || empty($password)) {
            return $this->sendResponse(false, null, 'Username and password are required');
        }
        
        // Find user by username or email
        $stmt = $this->pdo->prepare("SELECT * FROM users WHERE (username = ? OR email = ?) AND is_active = 1");
        $stmt->execute([$username, $username]);
        $user = $stmt->fetch();
        
        if (!$user || !password_verify($password, $user['password'])) {
            return $this->sendResponse(false, null, 'Invalid credentials');
        }
        
        // Generate JWT token
        $token = $this->generateJWT($user);
        
        // Return user data and token
        $userData = [
            'id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'role' => $user['role']
        ];
        
        return $this->sendResponse(true, [
            'user' => $userData,
            'token' => $token
        ], 'Login successful');
    }
    
    private function register() {
        $input = json_decode(file_get_contents('php://input'), true);
        $username = $input['username'] ?? '';
        $email = $input['email'] ?? '';
        $password = $input['password'] ?? '';
        
        if (empty($username) || empty($email) || empty($password)) {
            return $this->sendResponse(false, null, 'Username, email and password are required');
        }
        
        // Validate email format
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->sendResponse(false, null, 'Invalid email format');
        }
        
        // Check if username or email already exists
        $stmt = $this->pdo->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
        $stmt->execute([$username, $email]);
        if ($stmt->fetch()) {
            return $this->sendResponse(false, null, 'Username or email already exists');
        }
        
        // Hash password and create user
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $this->pdo->prepare("INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'user')");
        $stmt->execute([$username, $email, $hashedPassword]);
        
        $userId = $this->pdo->lastInsertId();
        
        // Get the created user
        $stmt = $this->pdo->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        
        // Generate JWT token
        $token = $this->generateJWT($user);
        
        // Return user data and token
        $userData = [
            'id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'role' => $user['role']
        ];
        
        return $this->sendResponse(true, [
            'user' => $userData,
            'token' => $token
        ], 'Registration successful');
    }
    
    private function verify() {
        $token = $this->getBearerToken();
        
        if (!$token) {
            return $this->sendResponse(false, null, 'No token provided');
        }
        
        $userData = $this->verifyJWT($token);
        
        if (!$userData) {
            return $this->sendResponse(false, null, 'Invalid token');
        }
        
        return $this->sendResponse(true, ['user' => $userData], 'Token valid');
    }
    
    private function logout() {
        // In a more complete implementation, you would invalidate the token
        return $this->sendResponse(true, null, 'Logout successful');
    }
    
    private function status() {
        return $this->sendResponse(true, [
            'service' => 'WinTrades Simple Auth API',
            'version' => '1.0.0',
            'endpoints' => [
                'login' => 'POST /auth.php?action=login',
                'register' => 'POST /auth.php?action=register',
                'verify' => 'GET /auth.php?action=verify (with Bearer token)',
                'logout' => 'POST /auth.php?action=logout'
            ]
        ], 'API operational');
    }
    
    private function generateJWT($user) {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode([
            'user_id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'role' => $user['role'],
            'iat' => time(),
            'exp' => time() + (24 * 60 * 60) // 24 hours
        ]);
        
        $base64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
        
        $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, $this->jwt_secret, true);
        $base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        
        return $base64Header . "." . $base64Payload . "." . $base64Signature;
    }
    
    private function verifyJWT($token) {
        $parts = explode('.', $token);
        
        if (count($parts) !== 3) {
            return false;
        }
        
        [$header, $payload, $signature] = $parts;
        
        // Verify signature
        $validSignature = hash_hmac('sha256', $header . "." . $payload, $this->jwt_secret, true);
        $validSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($validSignature));
        
        if (!hash_equals($signature, $validSignature)) {
            return false;
        }
        
        // Decode payload
        $payload = base64_decode(str_replace(['-', '_'], ['+', '/'], $payload));
        $payloadData = json_decode($payload, true);
        
        // Check expiration
        if ($payloadData['exp'] < time()) {
            return false;
        }
        
        // Get current user data from database
        $stmt = $this->pdo->prepare("SELECT * FROM users WHERE id = ? AND is_active = 1");
        $stmt->execute([$payloadData['user_id']]);
        $user = $stmt->fetch();
        
        if (!$user) {
            return false;
        }
        
        return [
            'id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'role' => $user['role']
        ];
    }
    
    private function getBearerToken() {
        $headers = getallheaders();
        
        if (isset($headers['Authorization'])) {
            $authHeader = $headers['Authorization'];
            if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
                return $matches[1];
            }
        }
        
        return null;
    }
    
    private function sendResponse($success, $data = null, $message = '') {
        $response = [
            'success' => $success,
            'data' => $data,
            'message' => $message,
            'timestamp' => date('Y-m-d H:i:s')
        ];
        
        echo json_encode($response);
        return $response;
    }
}

// Initialize and handle request
try {
    $api = new SimpleAuthAPI();
    $api->handleRequest();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'data' => null,
        'message' => 'Server error: ' . $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>