<?php
require_once('../config/database.php');

try {
    $database = getDatabase();
    $conn = $database->getConnection();
    
    if ($conn) {
        echo "<h3>Users Table Structure:</h3>";
        $stmt = $conn->prepare("DESCRIBE users");
        $stmt->execute();
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "<pre>";
        foreach ($columns as $column) {
            echo "Column: " . $column['Field'] . " | Type: " . $column['Type'] . " | Null: " . $column['Null'] . "\n";
        }
        echo "</pre>";
        
        echo "<br><h3>Existing Users (with correct columns):</h3>";
        $stmt = $conn->prepare("SELECT id, email, first_name, last_name, plan_type, created_at FROM users");
        $stmt->execute();
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "<pre>";
        print_r($users);
        echo "</pre>";
        
    } else {
        echo "Failed to connect to database";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>