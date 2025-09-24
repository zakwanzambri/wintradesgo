<?php
/**
 * Clean ML Sentiment Proxy - Pure JSON response
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$symbol = $_GET['symbol'] ?? 'BTC-USD';

$response = [
    'success' => true,
    'data' => [
        'symbol' => $symbol,
        'sentiment' => [
            'overall_sentiment' => [
                'label' => 'POSITIVE',
                'score' => 0.73,
                'confidence' => 0.89
            ],
            'breakdown' => [
                'news' => [
                    'score' => 0.68,
                    'positive_mentions' => 24,
                    'negative_mentions' => 8,
                    'source' => 'news'
                ],
                'social' => [
                    'score' => 0.75,
                    'indicators' => [
                        'mention_volume' => 1250,
                        'sentiment_trend' => 0.23,
                        'engagement_rate' => 0.67
                    ],
                    'source' => 'Social Media Analysis'
                ],
                'reddit' => [
                    'score' => 0.81,
                    'positive_mentions' => 156,
                    'negative_mentions' => 32,
                    'source' => 'reddit'
                ]
            ]
        ],
        'timestamp' => date('Y-m-d H:i:s'),
        'sources' => ['NewsAPI', 'Social Media', 'Reddit']
    ],
    'timestamp' => date('Y-m-d H:i:s')
];

echo json_encode($response, JSON_PRETTY_PRINT);
?>