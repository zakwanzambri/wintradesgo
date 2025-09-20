<?php
/**
 * Test Discord Webhook Alert
 */

require_once 'ai/SmartAlertSystem.php';

// Test signal data
$testSignal = [
    'id' => 999,
    'symbol' => 'BTC',
    'signal_type' => 'BUY',
    'confidence' => 87.3,
    'current_price' => 115635.00,
    'timeframe' => '4h',
    'reason' => 'Technical: RSI oversold | Sentiment: BULLISH',
    'created_at' => date('Y-m-d H:i:s')
];

echo "🧪 Testing Discord Alert System...\n\n";

// Check if Discord webhook is configured
$webhookUrl = getenv('DISCORD_WEBHOOK_URL');

if (empty($webhookUrl)) {
    echo "❌ No Discord webhook URL configured.\n";
    echo "Set it with: \$env:DISCORD_WEBHOOK_URL = \"YOUR_WEBHOOK_URL\"\n";
    exit(1);
}

echo "✅ Discord webhook URL found\n";
echo "📤 Sending test alert...\n";

// Create alert system and send test alert
$alertSystem = new SmartAlertSystem();

// Use reflection to access private method for testing
$reflection = new ReflectionClass($alertSystem);
$sendDiscordAlert = $reflection->getMethod('sendDiscordAlert');
$sendDiscordAlert->setAccessible(true);

$result = $sendDiscordAlert->invoke($alertSystem, $testSignal);

if ($result['success']) {
    echo "🎉 Discord alert sent successfully!\n";
    echo "Check your Discord channel for the test message.\n";
} else {
    echo "❌ Failed to send Discord alert: " . ($result['reason'] ?? 'Unknown error') . "\n";
}

echo "\n📊 Test Signal Details:\n";
echo "Symbol: {$testSignal['symbol']}\n";
echo "Signal: {$testSignal['signal_type']}\n";
echo "Confidence: {$testSignal['confidence']}%\n";
echo "Price: $" . number_format($testSignal['current_price'], 2) . "\n";
echo "Reason: {$testSignal['reason']}\n";
?>