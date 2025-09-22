<?php
// Database configuration for WinTrades application

// Database settings for XAMPP MySQL
define('DB_HOST', 'localhost');
define('DB_NAME', 'wintradesgo');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// JWT settings
define('JWT_SECRET', 'your-super-secret-jwt-key-change-this-in-production');
define('JWT_ALGORITHM', 'HS256');
define('JWT_EXPIRY', 86400); // 24 hours

// Database connection class
class Database {
    private $host = DB_HOST;
    private $db_name = DB_NAME;
    private $username = DB_USER;
    private $password = DB_PASS;
    private $charset = DB_CHARSET;
    public $conn;

    public function getConnection() {
        $this->conn = null;
        
        try {
            $dsn = "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=" . $this->charset;
            $this->conn = new PDO($dsn, $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch(PDOException $exception) {
            echo "Connection error: " . $exception->getMessage();
        }

        return $this->conn;
    }

    // Create database and tables if they don't exist
    public function initializeDatabase() {
        try {
            // First connect without database to create it if needed
            $dsn = "mysql:host=" . $this->host . ";charset=" . $this->charset;
            $pdo = new PDO($dsn, $this->username, $this->password);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            // Create database if it doesn't exist
            $pdo->exec("CREATE DATABASE IF NOT EXISTS `" . $this->db_name . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            
            // Now connect to the database
            $this->conn = $this->getConnection();
            
            if ($this->conn) {
                $this->createTables();
                return true;
            }
        } catch(PDOException $exception) {
            error_log("Database initialization error: " . $exception->getMessage());
            return false;
        }
        
        return false;
    }

    private function createTables() {
        // Users table
        $users_table = "
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('user', 'admin') DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ";

        // User sessions table for JWT token management
        $sessions_table = "
            CREATE TABLE IF NOT EXISTS user_sessions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                token_hash VARCHAR(255) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_token_hash (token_hash),
                INDEX idx_user_id (user_id),
                INDEX idx_expires_at (expires_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ";

        // Password reset tokens table
        $reset_tokens_table = "
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                token VARCHAR(255) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                used BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_token (token),
                INDEX idx_user_id (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ";

        // Execute table creation
        $this->conn->exec($users_table);
        $this->conn->exec($sessions_table);
        $this->conn->exec($reset_tokens_table);

        // Create demo user if users table is empty
        $this->createDemoUser();
    }

    private function createDemoUser() {
        try {
            // Check if any users exist
            $stmt = $this->conn->prepare("SELECT COUNT(*) FROM users");
            $stmt->execute();
            $userCount = $stmt->fetchColumn();

            if ($userCount == 0) {
                // Create demo user
                $demoUsername = 'demo';
                $demoEmail = 'demo@wintradesgo.com';
                $demoPassword = password_hash('demo123', PASSWORD_DEFAULT);

                $stmt = $this->conn->prepare("
                    INSERT INTO users (username, email, password, role) 
                    VALUES (?, ?, ?, 'user')
                ");
                $stmt->execute([$demoUsername, $demoEmail, $demoPassword]);

                error_log("Demo user created: username=demo, password=demo123");
            }
        } catch(PDOException $exception) {
            error_log("Error creating demo user: " . $exception->getMessage());
        }
    }
}

// Global database connection function
function getDatabase() {
    static $database = null;
    if ($database === null) {
        $database = new Database();
        $database->initializeDatabase();
    }
    return $database;
}

// Test database connection
function testDatabaseConnection() {
    try {
        $database = getDatabase();
        $conn = $database->getConnection();
        
        if ($conn) {
            return [
                'success' => true,
                'message' => 'Database connection successful',
                'database' => DB_NAME,
                'host' => DB_HOST
            ];
        } else {
            return [
                'success' => false,
                'message' => 'Failed to connect to database'
            ];
        }
    } catch(Exception $e) {
        return [
            'success' => false,
            'message' => 'Database error: ' . $e->getMessage()
        ];
    }
}
?>