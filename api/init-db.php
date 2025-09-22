<?php
require_once('../config/database.php');

echo "Initializing WinTrades Database...\n";

try {
    $database = getDatabase();
    $conn = $database->getConnection();
    
    if ($conn) {
        echo "✓ Database connection successful\n";
        echo "✓ Database initialized with demo user\n";
        echo "Demo credentials: username=demo, password=demo123\n";
        
        // Test the database connection function
        $result = testDatabaseConnection();
        echo "Database test result: " . json_encode($result, JSON_PRETTY_PRINT) . "\n";
        
    } else {
        echo "✗ Failed to connect to database\n";
    }
    
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
}

echo "Database initialization complete.\n";
?>