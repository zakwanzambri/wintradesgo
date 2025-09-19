<?php
/**
 * Database Connection Test
 * GET /api/test-connection.php
 */

require_once 'config/database.php';

try {
    $database = new Database();
    $result = $database->testConnection();
    
    if ($result['success']) {
        sendResponse([
            'database_status' => 'Connected',
            'server_info' => $result['server_info'],
            'environment' => Config::$environment,
            'api_version' => Config::$api_version
        ], 'Database connection successful');
    } else {
        handleError($result['message'], 500);
    }
    
} catch (Exception $e) {
    handleError('Connection test failed: ' . $e->getMessage(), 500);
}
?>