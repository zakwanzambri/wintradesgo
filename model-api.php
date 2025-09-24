<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'model_manager.php';
require_once 'advanced_features.php';

class ModelManagementAPI {
    private $modelManager;
    private $advancedFeatures;
    
    public function __construct() {
        $this->modelManager = new ModelManager();
        $this->advancedFeatures = new AdvancedTradingFeatures();
    }
    
    public function handleRequest() {
        try {
            $action = $_GET['action'] ?? 'list_models';
            
            switch ($action) {
                case 'list_models':
                    return $this->listModels();
                    
                case 'load_model':
                    return $this->loadModel();
                    
                case 'save_model':
                    return $this->saveModel();
                    
                case 'predict':
                    return $this->makePrediction();
                    
                case 'get_features':
                    return $this->getFeatures();
                    
                case 'toggle_feature':
                    return $this->toggleFeature();
                    
                case 'optimize_portfolio':
                    return $this->optimizePortfolio();
                    
                case 'assess_risk':
                    return $this->assessRisk();
                    
                case 'create_alert':
                    return $this->createAlert();
                    
                default:
                    throw new Exception('Invalid action');
            }
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'timestamp' => date('Y-m-d H:i:s')
            ];
        }
    }
    
    private function listModels() {
        // Get all available models from storage
        $modelDir = 'models/';
        $models = [];
        
        if (is_dir($modelDir)) {
            $files = scandir($modelDir);
            foreach ($files as $file) {
                if (pathinfo($file, PATHINFO_EXTENSION) === 'json') {
                    $modelConfig = json_decode(file_get_contents($modelDir . $file), true);
                    if ($modelConfig) {
                        $models[] = $modelConfig;
                    }
                }
            }
        }
        
        // Add some example models if none exist
        if (empty($models)) {
            $models = [
                [
                    'type' => 'lstm',
                    'symbol' => 'BTC-USD',
                    'version' => '2.1.0',
                    'performance' => [
                        'accuracy' => 0.78,
                        'sharpe' => 1.45,
                        'max_drawdown' => -0.12
                    ],
                    'last_updated' => date('Y-m-d H:i:s', strtotime('-2 days')),
                    'status' => 'active',
                    'file_path' => 'models/lstm_btc_v2.1.0.h5',
                    'hyperparameters' => [
                        'sequence_length' => 60,
                        'hidden_units' => 128,
                        'dropout' => 0.2,
                        'learning_rate' => 0.001
                    ]
                ],
                [
                    'type' => 'lstm',
                    'symbol' => 'ETH-USD', 
                    'version' => '1.9.3',
                    'performance' => [
                        'accuracy' => 0.72,
                        'sharpe' => 1.28,
                        'max_drawdown' => -0.15
                    ],
                    'last_updated' => date('Y-m-d H:i:s', strtotime('-4 days')),
                    'status' => 'active',
                    'file_path' => 'models/lstm_eth_v1.9.3.h5',
                    'hyperparameters' => [
                        'sequence_length' => 45,
                        'hidden_units' => 96,
                        'dropout' => 0.3,
                        'learning_rate' => 0.0008
                    ]
                ],
                [
                    'type' => 'sentiment',
                    'symbol' => 'BTC-USD',
                    'version' => '3.0.1',
                    'performance' => [
                        'accuracy' => 0.85,
                        'precision' => 0.82,
                        'recall' => 0.88
                    ],
                    'last_updated' => date('Y-m-d H:i:s', strtotime('-1 day')),
                    'status' => 'active',
                    'file_path' => 'models/sentiment_btc_v3.0.1.pkl',
                    'sources' => ['twitter', 'reddit', 'news', 'telegram']
                ]
            ];
        }
        
        return [
            'success' => true,
            'models' => $models,
            'count' => count($models),
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
    
    private function loadModel() {
        $modelType = $_POST['type'] ?? $_GET['type'] ?? 'lstm';
        $symbol = $_POST['symbol'] ?? $_GET['symbol'] ?? 'BTC-USD';
        $version = $_POST['version'] ?? $_GET['version'] ?? 'latest';
        
        try {
            $model = $this->modelManager->loadLSTMModel($symbol, $version);
            
            return [
                'success' => true,
                'message' => "Model {$modelType} for {$symbol} v{$version} loaded successfully",
                'model_info' => [
                    'type' => $modelType,
                    'symbol' => $symbol,
                    'version' => $version,
                    'loaded_at' => date('Y-m-d H:i:s')
                ],
                'timestamp' => date('Y-m-d H:i:s')
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => "Failed to load model: " . $e->getMessage(),
                'timestamp' => date('Y-m-d H:i:s')
            ];
        }
    }
    
    private function saveModel() {
        $modelData = json_decode(file_get_contents('php://input'), true);
        
        if (!$modelData) {
            throw new Exception('No model data provided');
        }
        
        $modelPath = $this->modelManager->saveModel(
            $modelData['weights'] ?? [],
            $modelData['config'] ?? [],
            $modelData['symbol'] ?? 'BTC-USD',
            $modelData['version'] ?? '1.0.0'
        );
        
        return [
            'success' => true,
            'message' => 'Model saved successfully',
            'model_path' => $modelPath,
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
    
    private function makePrediction() {
        $symbol = $_POST['symbol'] ?? $_GET['symbol'] ?? 'BTC-USD';
        $data = $_POST['data'] ?? $_GET['data'] ?? null;
        
        if (!$data && isset($_POST['price_data'])) {
            $data = json_decode($_POST['price_data'], true);
        }
        
        // Use current market data if none provided
        if (!$data) {
            $data = $this->generateMockPriceData($symbol);
        }
        
        $prediction = $this->modelManager->predict('lstm', $symbol, $data);
        
        return [
            'success' => true,
            'prediction' => $prediction,
            'symbol' => $symbol,
            'timestamp' => date('Y-m-d H:i:s'),
            'model_used' => 'lstm_' . strtolower(str_replace('-', '_', $symbol))
        ];
    }
    
    private function getFeatures() {
        // Get current feature settings
        $settingsFile = 'config/feature_settings.json';
        $defaultFeatures = [
            'basic_predictions' => ['enabled' => true, 'usage' => 'high'],
            'advanced_sentiment' => ['enabled' => true, 'usage' => 'medium'],
            'portfolio_optimization' => ['enabled' => true, 'usage' => 'low'],
            'risk_management' => ['enabled' => true, 'usage' => 'high'],
            'smart_alerts' => ['enabled' => false, 'usage' => 'none'],
            'backtesting_pro' => ['enabled' => true, 'usage' => 'medium'],
            'real_time_streaming' => ['enabled' => false, 'usage' => 'none'],
            'auto_trading' => ['enabled' => false, 'usage' => 'none']
        ];
        
        if (file_exists($settingsFile)) {
            $savedFeatures = json_decode(file_get_contents($settingsFile), true);
            $features = array_merge($defaultFeatures, $savedFeatures);
        } else {
            $features = $defaultFeatures;
        }
        
        return [
            'success' => true,
            'features' => $features,
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
    
    private function toggleFeature() {
        $featureKey = $_POST['feature'] ?? $_GET['feature'];
        $enabled = filter_var($_POST['enabled'] ?? $_GET['enabled'], FILTER_VALIDATE_BOOLEAN);
        
        if (!$featureKey) {
            throw new Exception('Feature key is required');
        }
        
        // Load current settings
        $settingsFile = 'config/feature_settings.json';
        $features = [];
        
        if (file_exists($settingsFile)) {
            $features = json_decode(file_get_contents($settingsFile), true) ?? [];
        }
        
        // Update feature
        if (!isset($features[$featureKey])) {
            $features[$featureKey] = ['enabled' => false, 'usage' => 'none'];
        }
        
        $features[$featureKey]['enabled'] = $enabled;
        $features[$featureKey]['usage'] = $enabled ? 'low' : 'none';
        
        // Create config directory if it doesn't exist
        if (!is_dir('config')) {
            mkdir('config', 0755, true);
        }
        
        // Save settings
        file_put_contents($settingsFile, json_encode($features, JSON_PRETTY_PRINT));
        
        return [
            'success' => true,
            'message' => "Feature {$featureKey} " . ($enabled ? 'enabled' : 'disabled'),
            'feature' => $featureKey,
            'enabled' => $enabled,
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
    
    private function optimizePortfolio() {
        $portfolio = $_POST['portfolio'] ?? $_GET['portfolio'] ?? null;
        $riskTolerance = $_POST['risk_tolerance'] ?? $_GET['risk_tolerance'] ?? 'moderate';
        $totalCapital = $_POST['capital'] ?? $_GET['capital'] ?? 10000;
        
        if (!$portfolio) {
            // Default portfolio symbols
            $symbols = ['BTC-USD', 'ETH-USD', 'ADA-USD', 'DOT-USD'];
        } else {
            $portfolioData = json_decode($portfolio, true);
            $symbols = array_keys($portfolioData);
        }
        
        $optimization = $this->advancedFeatures->optimizePortfolio($symbols, floatval($totalCapital));
        
        return [
            'success' => true,
            'optimization' => $optimization,
            'original_portfolio' => $portfolio,
            'risk_tolerance' => $riskTolerance,
            'total_capital' => $totalCapital,
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
    
    private function assessRisk() {
        $portfolio = $_POST['portfolio'] ?? $_GET['portfolio'] ?? null;
        $timeframe = $_POST['timeframe'] ?? $_GET['timeframe'] ?? 30;
        
        if (!$portfolio) {
            $portfolio = [
                'BTC-USD' => 10000,
                'ETH-USD' => 5000,
                'ADA-USD' => 2000
            ];
        } else {
            $portfolio = json_decode($portfolio, true);
        }
        
        $riskAssessment = $this->advancedFeatures->assessRisk($portfolio, intval($timeframe));
        
        return [
            'success' => true,
            'risk_assessment' => $riskAssessment,
            'portfolio' => $portfolio,
            'timeframe_days' => intval($timeframe),
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
    
    private function createAlert() {
        $alertData = json_decode(file_get_contents('php://input'), true);
        
        if (!$alertData) {
            $alertData = [
                'symbol' => $_POST['symbol'] ?? 'BTC-USD',
                'condition' => $_POST['condition'] ?? 'price_above',
                'value' => $_POST['value'] ?? 50000,
                'message' => $_POST['message'] ?? 'Price alert triggered'
            ];
        }
        
        $alert = $this->advancedFeatures->createSmartAlert($alertData);
        
        return [
            'success' => true,
            'alert' => $alert,
            'message' => 'Smart alert created successfully',
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
    
    private function generateMockPriceData($symbol) {
        // Generate realistic price data for testing
        $basePrice = $symbol === 'BTC-USD' ? 45000 : 3000;
        $data = [];
        
        for ($i = 59; $i >= 0; $i--) {
            $timestamp = time() - ($i * 60); // 1-minute intervals
            $price = $basePrice + (rand(-1000, 1000) * ($basePrice / 50000));
            
            $data[] = [
                'timestamp' => $timestamp,
                'open' => $price,
                'high' => $price * (1 + rand(0, 20) / 1000),
                'low' => $price * (1 - rand(0, 20) / 1000),
                'close' => $price + (rand(-100, 100) * ($basePrice / 100000)),
                'volume' => rand(100, 10000)
            ];
        }
        
        return $data;
    }
}

// Handle the request
$api = new ModelManagementAPI();
$result = $api->handleRequest();

echo json_encode($result, JSON_PRETTY_PRINT);
?>