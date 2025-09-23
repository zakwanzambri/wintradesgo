<?php
/**
 * Monitoring Dashboard for Model Retraining System
 */

require_once 'enhanced_lstm_bridge.php';
require_once 'scheduler.php';

class MonitoringDashboard {
    private $bridge;
    private $scheduler;
    
    public function __construct() {
        $this->bridge = new EnhancedLSTMBridge();
        $this->scheduler = new ModelRetrainingScheduler();
    }
    
    public function generateReport() {
        $health = $this->bridge->getSystemHealth();
        $schedulerStatus = $this->scheduler->getStatus();
        $logs = $this->scheduler->getLastLogs(10);
        
        return [
            'timestamp' => date('c'),
            'system_health' => $health,
            'scheduler_status' => $schedulerStatus,
            'recent_logs' => $logs,
            'summary' => $this->generateSummary($health, $schedulerStatus)
        ];
    }
    
    private function generateSummary($health, $schedulerStatus) {
        $modelsCount = count(array_filter($health['models'], fn($m) => $m['exists']));
        $totalModels = count($health['models']);
        
        $lastRun = $schedulerStatus ? $schedulerStatus['timestamp'] : 'Never';
        $lastStatus = $schedulerStatus ? $schedulerStatus['status'] : 'Unknown';
        
        return [
            'models_available' => "$modelsCount/$totalModels",
            'overall_health' => $health['overall_status'],
            'last_retraining' => $lastRun,
            'last_retraining_status' => $lastStatus,
            'warnings_count' => count($health['warnings']),
            'errors_count' => count($health['errors'])
        ];
    }
}

// API endpoint
if (isset($_GET['action']) && $_GET['action'] === 'report') {
    header('Content-Type: application/json');
    $dashboard = new MonitoringDashboard();
    $report = $dashboard->generateReport();
    echo json_encode(['success' => true, 'data' => $report]);
    exit;
}

// CLI interface
if (php_sapi_name() === 'cli') {
    echo "📊 Monitoring Report\n";
    echo "===================\n\n";
    
    $dashboard = new MonitoringDashboard();
    $report = $dashboard->generateReport();
    
    echo "System Health: " . strtoupper($report['summary']['overall_health']) . "\n";
    echo "Models: " . $report['summary']['models_available'] . "\n";
    echo "Last Retraining: " . $report['summary']['last_retraining'] . "\n";
    echo "Warnings: " . $report['summary']['warnings_count'] . "\n";
    echo "\nDetailed Status:\n";
    
    foreach ($report['system_health']['models'] as $symbol => $model) {
        $status = $model['exists'] ? '✅' : '❌';
        $age = $model['age_hours'] ? sprintf('%.1fh old', $model['age_hours']) : 'N/A';
        echo "  $symbol: $status ($age)\n";
    }
    
    if (!empty($report['system_health']['warnings'])) {
        echo "\nWarnings:\n";
        foreach ($report['system_health']['warnings'] as $warning) {
            echo "  ⚠️  $warning\n";
        }
    }
    
    exit;
}

// Web interface
?>
<!DOCTYPE html>
<html>
<head>
    <title>Model Retraining Monitor</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .card { background: white; padding: 20px; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .status-healthy { color: #28a745; }
        .status-warning { color: #ffc107; }
        .status-error { color: #dc3545; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .metric { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .logs { background-color: #f8f9fa; padding: 15px; border-radius: 5px; font-family: monospace; white-space: pre-wrap; max-height: 300px; overflow-y: auto; }
        button { padding: 10px 20px; margin: 5px; border: none; border-radius: 4px; cursor: pointer; }
        .btn-primary { background-color: #007bff; color: white; }
        .btn-success { background-color: #28a745; color: white; }
        .btn-danger { background-color: #dc3545; color: white; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔄 Model Retraining Monitor</h1>
        
        <div id="summary-card" class="card">
            <h2>📊 System Summary</h2>
            <div id="summary-content">Loading...</div>
        </div>
        
        <div class="grid">
            <div class="card">
                <h3>🤖 Model Status</h3>
                <div id="models-content">Loading...</div>
            </div>
            
            <div class="card">
                <h3>⏰ Scheduler Status</h3>
                <div id="scheduler-content">Loading...</div>
            </div>
        </div>
        
        <div class="card">
            <h3>📝 Recent Logs</h3>
            <div id="logs-content" class="logs">Loading...</div>
        </div>
        
        <div class="card">
            <h3>🎛️ Controls</h3>
            <button class="btn-primary" onclick="refreshData()">🔄 Refresh</button>
            <button class="btn-success" onclick="triggerRetraining()">⚡ Force Retrain</button>
            <button class="btn-danger" onclick="showDetailedLogs()">📋 Detailed Logs</button>
        </div>
    </div>
    
    <script>
        function refreshData() {
            fetch('monitor.php?action=report')
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        updateDashboard(data.data);
                    }
                })
                .catch(error => console.error('Error:', error));
        }
        
        function updateDashboard(report) {
            // Update summary
            const summary = report.summary;
            document.getElementById('summary-content').innerHTML = `
                <div class="metric">
                    <span>Overall Health:</span>
                    <span class="status-${summary.overall_health}">${summary.overall_health.toUpperCase()}</span>
                </div>
                <div class="metric">
                    <span>Models Available:</span>
                    <span>${summary.models_available}</span>
                </div>
                <div class="metric">
                    <span>Warnings:</span>
                    <span class="status-warning">${summary.warnings_count}</span>
                </div>
                <div class="metric">
                    <span>Last Retraining:</span>
                    <span>${summary.last_retraining}</span>
                </div>
            `;
            
            // Update models
            let modelsHtml = '';
            for (const [symbol, model] of Object.entries(report.system_health.models)) {
                const status = model.exists ? 'healthy' : 'error';
                const age = model.age_hours ? `${Math.round(model.age_hours)}h old` : 'N/A';
                modelsHtml += `
                    <div class="metric">
                        <span>${symbol}:</span>
                        <span class="status-${status}">${model.exists ? '✅' : '❌'} ${age}</span>
                    </div>
                `;
            }
            document.getElementById('models-content').innerHTML = modelsHtml;
            
            // Update scheduler
            const scheduler = report.scheduler_status;
            document.getElementById('scheduler-content').innerHTML = `
                <div class="metric">
                    <span>Status:</span>
                    <span>${scheduler ? scheduler.status : 'Unknown'}</span>
                </div>
                <div class="metric">
                    <span>Last Run:</span>
                    <span>${scheduler ? scheduler.timestamp : 'Never'}</span>
                </div>
            `;
            
            // Update logs
            document.getElementById('logs-content').textContent = report.recent_logs.join('\n');
        }
        
        function triggerRetraining() {
            if (confirm('Force retraining? This may take several minutes.')) {
                fetch('scheduler.php?action=trigger&force=true')
                    .then(response => response.json())
                    .then(data => {
                        alert(data.message);
                        if (data.success) {
                            setTimeout(refreshData, 2000);
                        }
                    });
            }
        }
        
        function showDetailedLogs() {
            window.open('scheduler.php?action=logs&lines=100', '_blank');
        }
        
        // Auto-refresh every 60 seconds
        setInterval(refreshData, 60000);
        refreshData();
    </script>
</body>
</html>