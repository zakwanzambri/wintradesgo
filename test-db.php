<?php
require_once('config/database.php');

// Test database connection
$result = testDatabaseConnection();
header('Content-Type: application/json');
echo json_encode($result, JSON_PRETTY_PRINT);
?>