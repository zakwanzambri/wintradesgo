<?php
/**
 * Enhanced AI Scheduler Startup Script
 * Initializes and starts the ML-powered AI trading signal system
 */

require_once __DIR__ . '/EnhancedAIScheduler.php';

// Create Enhanced AI Scheduler instance
$enhancedScheduler = new EnhancedAIScheduler();

// Create ML performance metrics table
$enhancedScheduler->createMLMetricsTable();

echo "🚀 Starting Enhanced AI ML Trading System...\n";
echo "🧠 ML Models: LSTM Neural Network + Pattern Recognition + Ensemble Analysis\n";
echo "⏱️  Interval: Every 3 minutes\n";
echo "📊 Symbols: BTC, ETH, ADA, DOT, LINK, SOL, AVAX, MATIC, ATOM, XRP\n";
echo "🎯 High-confidence alerts: >85%\n\n";

// Test single run first
echo "🧪 Running initial test cycle...\n";
$testSignals = $enhancedScheduler->runOnce();
echo "✅ Test complete: " . count($testSignals) . " ML signals generated\n\n";

if (count($testSignals) > 0) {
    echo "💡 Sample ML Signal:\n";
    $sample = $testSignals[0];
    echo "   Symbol: " . $sample['symbol'] . "\n";
    echo "   Signal: " . $sample['signal_type'] . "\n";
    echo "   Confidence: " . $sample['confidence'] . "%\n";
    echo "   AI Model: " . $sample['ai_model'] . "\n";
    echo "   Target: $" . $sample['target_prices']['target_1'] . "\n";
    echo "   Risk Level: " . $sample['risk_assessment']['risk_level'] . "\n\n";
}

// Ask user if they want to start continuous mode
echo "🤖 Ready to start continuous Enhanced ML signal generation?\n";
echo "Press Enter to start or Ctrl+C to exit: ";
$input = trim(fgets(STDIN));

echo "\n🚀 Starting Enhanced AI ML Scheduler...\n";
echo "Press Ctrl+C to stop\n\n";

// Start the enhanced scheduler (3-minute intervals)
$enhancedScheduler->start(3);
?>