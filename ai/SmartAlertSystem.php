<?php
/**
 * Smart Alert System
 * Sends notifications when high-confidence AI signals are generated
 */

class SmartAlertSystem {
    
    private $alertThreshold = 85; // Minimum confidence for alerts
    private $logFile;
    private $database;
    
    public function __construct($database = null) {
        $this->database = $database;
        $this->logFile = __DIR__ . '/logs/alerts.log';
        
        // Create logs directory if it doesn't exist
        if (!file_exists(dirname($this->logFile))) {
            mkdir(dirname($this->logFile), 0755, true);
        }
    }
    
    /**
     * Check for new high-confidence signals and send alerts
     * @return array Alert results
     */
    public function checkAndSendAlerts() {
        try {
            $pdo = $this->database->getConnection();
            
            // Get signals from last 10 minutes with high confidence
            $stmt = $pdo->prepare("
                SELECT * FROM ai_signals 
                WHERE confidence >= ? 
                AND created_at >= DATE_SUB(NOW(), INTERVAL 10 MINUTE)
                AND signal_type IN ('BUY', 'SELL')
                ORDER BY confidence DESC, created_at DESC
            ");
            
            $stmt->execute([$this->alertThreshold]);
            $highConfidenceSignals = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $alertsSent = [];
            
            foreach ($highConfidenceSignals as $signal) {
                // Check if we already sent an alert for this signal
                if (!$this->hasAlertBeenSent($signal)) {
                    $alertResult = $this->sendAlert($signal);
                    if ($alertResult['success']) {
                        $this->markAlertAsSent($signal);
                        $alertsSent[] = $alertResult;
                    }
                }
            }
            
            return [
                'success' => true,
                'signals_checked' => count($highConfidenceSignals),
                'alerts_sent' => count($alertsSent),
                'alerts' => $alertsSent
            ];
            
        } catch (Exception $e) {
            $this->log("ERROR: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Send alert for a high-confidence signal
     * @param array $signal Signal data
     * @return array Alert result
     */
    private function sendAlert($signal) {
        $alertData = [
            'signal' => $signal,
            'timestamp' => date('Y-m-d H:i:s'),
            'methods' => []
        ];
        
        // Send Discord webhook (if configured)
        $discordResult = $this->sendDiscordAlert($signal);
        if ($discordResult['success']) {
            $alertData['methods'][] = 'Discord';
        }
        
        // Send email alert (if configured)
        $emailResult = $this->sendEmailAlert($signal);
        if ($emailResult['success']) {
            $alertData['methods'][] = 'Email';
        }
        
        // Send SMS alert (if configured)
        $smsResult = $this->sendSMSAlert($signal);
        if ($smsResult['success']) {
            $alertData['methods'][] = 'SMS';
        }
        
        // Browser notification (always available)
        $browserResult = $this->createBrowserNotification($signal);
        if ($browserResult['success']) {
            $alertData['methods'][] = 'Browser';
        }
        
        $success = !empty($alertData['methods']);
        
        if ($success) {
            $this->log("🚨 ALERT SENT: {$signal['symbol']} {$signal['signal_type']} ({$signal['confidence']}%) via " . implode(', ', $alertData['methods']));
        }
        
        return [
            'success' => $success,
            'signal_id' => $signal['id'],
            'methods' => $alertData['methods'],
            'data' => $alertData
        ];
    }
    
    /**
     * Send Discord webhook alert
     * @param array $signal Signal data
     * @return array Result
     */
    private function sendDiscordAlert($signal) {
        // Discord webhook URL (set this in your environment or config)
        $webhookUrl = getenv('DISCORD_WEBHOOK_URL') ?: '';
        
        if (empty($webhookUrl)) {
            return ['success' => false, 'reason' => 'No Discord webhook configured'];
        }
        
        $color = $signal['signal_type'] === 'BUY' ? 0x00ff00 : 0xff0000; // Green for BUY, Red for SELL
        $emoji = $signal['signal_type'] === 'BUY' ? '🚀' : '📉';
        
        $embed = [
            'title' => "{$emoji} HIGH CONFIDENCE AI SIGNAL",
            'description' => "**{$signal['symbol']}** - {$signal['signal_type']} Signal",
            'color' => $color,
            'fields' => [
                [
                    'name' => 'Confidence',
                    'value' => "{$signal['confidence']}%",
                    'inline' => true
                ],
                [
                    'name' => 'Current Price',
                    'value' => "$" . number_format($signal['current_price'], 4),
                    'inline' => true
                ],
                [
                    'name' => 'Timeframe',
                    'value' => $signal['timeframe'],
                    'inline' => true
                ],
                [
                    'name' => 'Reason',
                    'value' => $signal['reason'],
                    'inline' => false
                ]
            ],
            'timestamp' => date('c'),
            'footer' => [
                'text' => 'WinTrades AI Trading System'
            ]
        ];
        
        $payload = [
            'embeds' => [$embed]
        ];
        
        $result = $this->sendWebhook($webhookUrl, $payload);
        return ['success' => $result];
    }
    
    /**
     * Send email alert
     * @param array $signal Signal data
     * @return array Result
     */
    private function sendEmailAlert($signal) {
        // Email configuration (set these in your environment)
        $toEmail = getenv('ALERT_EMAIL') ?: '';
        $fromEmail = getenv('FROM_EMAIL') ?: 'alerts@wintradesgo.com';
        
        if (empty($toEmail)) {
            return ['success' => false, 'reason' => 'No alert email configured'];
        }
        
        $subject = "🚨 WinTrades AI Alert: {$signal['symbol']} {$signal['signal_type']} ({$signal['confidence']}%)";
        
        $message = "
        <html>
        <body style='font-family: Arial, sans-serif;'>
            <h2 style='color: " . ($signal['signal_type'] === 'BUY' ? '#16a34a' : '#dc2626') . ";'>
                " . ($signal['signal_type'] === 'BUY' ? '🚀' : '📉') . " High Confidence AI Signal
            </h2>
            
            <table style='border-collapse: collapse; width: 100%;'>
                <tr>
                    <td style='border: 1px solid #ddd; padding: 8px; font-weight: bold;'>Symbol:</td>
                    <td style='border: 1px solid #ddd; padding: 8px;'>{$signal['symbol']}</td>
                </tr>
                <tr>
                    <td style='border: 1px solid #ddd; padding: 8px; font-weight: bold;'>Signal:</td>
                    <td style='border: 1px solid #ddd; padding: 8px;'>{$signal['signal_type']}</td>
                </tr>
                <tr>
                    <td style='border: 1px solid #ddd; padding: 8px; font-weight: bold;'>Confidence:</td>
                    <td style='border: 1px solid #ddd; padding: 8px;'>{$signal['confidence']}%</td>
                </tr>
                <tr>
                    <td style='border: 1px solid #ddd; padding: 8px; font-weight: bold;'>Current Price:</td>
                    <td style='border: 1px solid #ddd; padding: 8px;'>$" . number_format($signal['current_price'], 4) . "</td>
                </tr>
                <tr>
                    <td style='border: 1px solid #ddd; padding: 8px; font-weight: bold;'>Timeframe:</td>
                    <td style='border: 1px solid #ddd; padding: 8px;'>{$signal['timeframe']}</td>
                </tr>
                <tr>
                    <td style='border: 1px solid #ddd; padding: 8px; font-weight: bold;'>Reason:</td>
                    <td style='border: 1px solid #ddd; padding: 8px;'>{$signal['reason']}</td>
                </tr>
            </table>
            
            <p style='margin-top: 20px; color: #666;'>
                Generated by WinTrades AI Trading System<br>
                Time: " . date('Y-m-d H:i:s') . "
            </p>
        </body>
        </html>
        ";
        
        $headers = [
            'MIME-Version: 1.0',
            'Content-type: text/html; charset=UTF-8',
            "From: {$fromEmail}",
            "Reply-To: {$fromEmail}",
            'X-Mailer: PHP/' . phpversion()
        ];
        
        $result = mail($toEmail, $subject, $message, implode("\r\n", $headers));
        return ['success' => $result];
    }
    
    /**
     * Send SMS alert (using a service like Twilio)
     * @param array $signal Signal data
     * @return array Result
     */
    private function sendSMSAlert($signal) {
        // SMS configuration (implement with Twilio or similar service)
        $phoneNumber = getenv('ALERT_PHONE') ?: '';
        
        if (empty($phoneNumber)) {
            return ['success' => false, 'reason' => 'No phone number configured'];
        }
        
        $message = "🚨 WinTrades AI Alert: {$signal['symbol']} {$signal['signal_type']} ({$signal['confidence']}%) at $" . number_format($signal['current_price'], 4);
        
        // TODO: Implement actual SMS sending with Twilio API
        // For now, just log the SMS
        $this->log("SMS Alert: {$message} to {$phoneNumber}");
        
        return ['success' => true, 'method' => 'simulated'];
    }
    
    /**
     * Create browser notification data
     * @param array $signal Signal data
     * @return array Result
     */
    private function createBrowserNotification($signal) {
        $notificationData = [
            'title' => "WinTrades AI Alert: {$signal['symbol']} {$signal['signal_type']}",
            'body' => "Confidence: {$signal['confidence']}% | Price: $" . number_format($signal['current_price'], 4),
            'icon' => '/favicon.ico',
            'tag' => 'ai-signal-' . $signal['id'],
            'timestamp' => time(),
            'data' => $signal
        ];
        
        // Save notification to file for frontend to pickup
        $notificationFile = __DIR__ . '/notifications/latest.json';
        if (!file_exists(dirname($notificationFile))) {
            mkdir(dirname($notificationFile), 0755, true);
        }
        
        file_put_contents($notificationFile, json_encode($notificationData));
        
        return ['success' => true, 'data' => $notificationData];
    }
    
    /**
     * Send webhook payload
     * @param string $url Webhook URL
     * @param array $payload Data payload
     * @return bool Success status
     */
    private function sendWebhook($url, $payload) {
        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => [
                    'Content-Type: application/json',
                    'User-Agent: WinTrades-AI/1.0'
                ],
                'content' => json_encode($payload),
                'timeout' => 10
            ]
        ]);
        
        $result = @file_get_contents($url, false, $context);
        return $result !== false;
    }
    
    /**
     * Check if alert has already been sent for this signal
     * @param array $signal Signal data
     * @return bool Whether alert was already sent
     */
    private function hasAlertBeenSent($signal) {
        $alertFile = __DIR__ . '/logs/sent_alerts.txt';
        
        if (!file_exists($alertFile)) {
            return false;
        }
        
        $sentAlerts = file_get_contents($alertFile);
        $alertKey = "signal_" . $signal['id'] . "_" . $signal['created_at'];
        
        return strpos($sentAlerts, $alertKey) !== false;
    }
    
    /**
     * Mark alert as sent
     * @param array $signal Signal data
     */
    private function markAlertAsSent($signal) {
        $alertFile = __DIR__ . '/logs/sent_alerts.txt';
        $alertKey = "signal_" . $signal['id'] . "_" . $signal['created_at'];
        
        file_put_contents($alertFile, $alertKey . "\n", FILE_APPEND | LOCK_EX);
    }
    
    /**
     * Log message
     * @param string $message Log message
     */
    private function log($message) {
        $timestamp = date('Y-m-d H:i:s');
        $logEntry = "[{$timestamp}] {$message}\n";
        file_put_contents($this->logFile, $logEntry, FILE_APPEND | LOCK_EX);
    }
    
    /**
     * Get recent alerts
     * @param int $limit Number of recent alerts to return
     * @return array Recent alerts
     */
    public function getRecentAlerts($limit = 10) {
        if (!file_exists($this->logFile)) {
            return [];
        }
        
        $logContent = file_get_contents($this->logFile);
        $logLines = explode("\n", $logContent);
        $alertLines = array_filter($logLines, function($line) {
            return strpos($line, 'ALERT SENT:') !== false;
        });
        
        return array_slice(array_reverse($alertLines), 0, $limit);
    }
}
?>