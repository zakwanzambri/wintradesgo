<?php
header('Content-Type: application/json');

// Test login functionality
$testCredentials = [
    'username' => 'demo',
    'password' => 'demo123'
];

$url = 'http://localhost/wintradesgo/api/auth-simple.php?action=login';

$postData = json_encode($testCredentials);

$options = [
    'http' => [
        'header' => "Content-Type: application/json\r\n",
        'method' => 'POST',
        'content' => $postData
    ]
];

$context = stream_context_create($options);
$result = file_get_contents($url, false, $context);

echo "Login Test Result:\n";
echo $result;
?>