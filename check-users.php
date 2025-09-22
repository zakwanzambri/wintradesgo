<?php
require_once('config/database.php');

try {
    $database = getDatabase();
    $pdo = $database->getConnection();
    
    // Get all users
    $stmt = $pdo->prepare("SELECT id, username, email, role, created_at, is_active FROM users");
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'users' => $users,
        'count' => count($users)
    ], JSON_PRETTY_PRINT);
    
} catch(Exception $e) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
?>