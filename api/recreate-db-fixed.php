<?php
require_once('../config/database.php');

try {
    $database = getDatabase();
    $conn = $database->getConnection();
    
    if ($conn) {
        echo "Recreating database with correct schema...\n";
        
        // Disable foreign key checks temporarily
        $conn->exec("SET FOREIGN_KEY_CHECKS = 0");
        
        // Drop all auth-related tables
        $conn->exec("DROP TABLE IF EXISTS user_sessions");
        $conn->exec("DROP TABLE IF EXISTS password_reset_tokens"); 
        $conn->exec("DROP TABLE IF EXISTS users");
        echo "✓ Dropped existing tables\n";
        
        // Re-enable foreign key checks
        $conn->exec("SET FOREIGN_KEY_CHECKS = 1");
        
        // Create new users table with correct schema
        $users_table = "
            CREATE TABLE users (
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
        
        $conn->exec($users_table);
        echo "✓ Created users table with correct schema\n";
        
        // Create sessions table
        $sessions_table = "
            CREATE TABLE user_sessions (
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
        
        $conn->exec($sessions_table);
        echo "✓ Created user_sessions table\n";
        
        // Create password reset table
        $reset_tokens_table = "
            CREATE TABLE password_reset_tokens (
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
        
        $conn->exec($reset_tokens_table);
        echo "✓ Created password_reset_tokens table\n";
        
        // Create demo user
        $demoUsername = 'demo';
        $demoEmail = 'demo@wintradesgo.com';
        $demoPassword = password_hash('demo123', PASSWORD_DEFAULT);
        
        $stmt = $conn->prepare("
            INSERT INTO users (username, email, password, role) 
            VALUES (?, ?, ?, 'user')
        ");
        $stmt->execute([$demoUsername, $demoEmail, $demoPassword]);
        echo "✓ Created demo user (username: demo, password: demo123)\n";
        
        // Create admin user
        $adminUsername = 'admin';
        $adminEmail = 'admin@wintradesgo.com';
        $adminPassword = password_hash('admin123', PASSWORD_DEFAULT);
        
        $stmt = $conn->prepare("
            INSERT INTO users (username, email, password, role) 
            VALUES (?, ?, ?, 'admin')
        ");
        $stmt->execute([$adminUsername, $adminEmail, $adminPassword]);
        echo "✓ Created admin user (username: admin, password: admin123)\n";
        
        // Verify the tables
        echo "\n--- Verification ---\n";
        $stmt = $conn->prepare("SELECT username, email, role, created_at FROM users");
        $stmt->execute();
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($users as $user) {
            echo "User: {$user['username']} | Email: {$user['email']} | Role: {$user['role']}\n";
        }
        
        echo "\nDatabase recreation complete!\n";
        echo "Demo User: username=demo, password=demo123\n";
        echo "Admin User: username=admin, password=admin123\n";
        
    } else {
        echo "Failed to connect to database\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>