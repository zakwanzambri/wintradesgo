<?php
/**
 * Database Configuration for WinTrades
 * Local MySQL Development Setup
 */

class Database {
    // Local XAMPP MySQL configuration
    private $host = "localhost";
    private $database_name = "wintradesgo";
    private $username = "root";
    private $password = "";
    private $charset = "utf8mb4";
    
    public $conn;
    
    public function getConnection() {
        $this->conn = null;
        
        try {
            $dsn = "mysql:host=" . $this->host . ";dbname=" . $this->database_name . ";charset=" . $this->charset;
            
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
            ];
            
            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
            
        } catch(PDOException $exception) {
            echo json_encode([
                'error' => true,
                'message' => 'Database connection failed: ' . $exception->getMessage()
            ]);
            exit();
        }
        
        return $this->conn;
    }
    
    /**
     * Test database connection
     */
    public function testConnection() {
        try {
            $conn = $this->getConnection();
            $stmt = $conn->query("SELECT 1");
            return [
                'success' => true,
                'message' => 'Database connection successful',
                'server_info' => $conn->getAttribute(PDO::ATTR_SERVER_INFO)
            ];
        } catch(Exception $e) {
            return [
                'success' => false,
                'message' => 'Database connection failed: ' . $e->getMessage()
            ];
        }
    }
}

/**
 * Environment Configuration
 */
class Config {
    // Environment settings
    public static $environment = 'development'; // development, staging, production
    
    // JWT Settings
    public static $jwt_secret = 'your-super-secret-jwt-key-change-in-production';
    public static $jwt_expire = 86400; // 24 hours
    
    // API Settings
    public static $api_version = 'v1';
    public static $api_base_url = 'http://localhost/wintradesgo/api/';
    
    // CORS Settings
    public static $allowed_origins = [
        'http://localhost:5173',  // Vite dev server
        'http://localhost:3000',  // React dev server
        'http://localhost',       // XAMPP
        'http://127.0.0.1:5173'   // Alternative localhost
    ];
    
    // Rate limiting (requests per minute)
    public static $rate_limit = [
        'default' => 60,
        'auth' => 10,
        'portfolio' => 30
    ];
    
    // Pagination
    public static $default_page_size = 20;
    public static $max_page_size = 100;
    
    /**
     * Get database configuration based on environment
     */
    public static function getDatabaseConfig() {
        switch (self::$environment) {
            case 'production':
                return [
                    'host' => $_ENV['DB_HOST'] ?? 'localhost',
                    'name' => $_ENV['DB_NAME'] ?? 'wintradesgo_prod',
                    'user' => $_ENV['DB_USER'] ?? 'root',
                    'pass' => $_ENV['DB_PASS'] ?? '',
                    'type' => $_ENV['DB_TYPE'] ?? 'postgresql'
                ];
            
            case 'staging':
                return [
                    'host' => $_ENV['DB_HOST'] ?? 'localhost',
                    'name' => $_ENV['DB_NAME'] ?? 'wintradesgo_staging',
                    'user' => $_ENV['DB_USER'] ?? 'root',
                    'pass' => $_ENV['DB_PASS'] ?? '',
                    'type' => $_ENV['DB_TYPE'] ?? 'postgresql'
                ];
                
            default: // development
                return [
                    'host' => 'localhost',
                    'name' => 'wintradesgo',
                    'user' => 'root',
                    'pass' => '',
                    'type' => 'mysql'
                ];
        }
    }
}

/**
 * CORS and Headers Setup
 */
function setupCORS() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    if (in_array($origin, Config::$allowed_origins)) {
        header("Access-Control-Allow-Origin: $origin");
    }
    
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    header("Content-Type: application/json; charset=UTF-8");
    
    // Handle preflight requests
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

/**
 * Error handling
 */
function handleError($error, $code = 500) {
    http_response_code($code);
    echo json_encode([
        'error' => true,
        'message' => $error,
        'timestamp' => date('Y-m-d H:i:s'),
        'code' => $code
    ]);
    exit();
}

/**
 * Success response
 */
function sendResponse($data, $message = 'Success', $code = 200) {
    http_response_code($code);
    echo json_encode([
        'success' => true,
        'message' => $message,
        'data' => $data,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}

/**
 * Input validation and sanitization
 */
function validateInput($data, $rules) {
    $errors = [];
    $cleaned = [];
    
    foreach ($rules as $field => $rule) {
        $value = $data[$field] ?? null;
        
        // Required check
        if (isset($rule['required']) && $rule['required'] && empty($value)) {
            $errors[$field] = "$field is required";
            continue;
        }
        
        if (!empty($value)) {
            // Type validation
            if (isset($rule['type'])) {
                switch ($rule['type']) {
                    case 'email':
                        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
                            $errors[$field] = "$field must be a valid email";
                        }
                        break;
                    case 'numeric':
                        if (!is_numeric($value)) {
                            $errors[$field] = "$field must be numeric";
                        }
                        break;
                    case 'string':
                        $value = trim(strip_tags($value));
                        break;
                }
            }
            
            // Length validation
            if (isset($rule['min_length']) && strlen($value) < $rule['min_length']) {
                $errors[$field] = "$field must be at least {$rule['min_length']} characters";
            }
            
            if (isset($rule['max_length']) && strlen($value) > $rule['max_length']) {
                $errors[$field] = "$field must be no more than {$rule['max_length']} characters";
            }
            
            $cleaned[$field] = $value;
        }
    }
    
    return ['data' => $cleaned, 'errors' => $errors];
}

// Initialize CORS for all API requests
setupCORS();
?>