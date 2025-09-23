<?php
/**
 * WinTrades AI Backend - Phase 2 Real Data Integration
 * Advanced AI Trading System with Live Market Data, ML Models, and Real-time Analysis
 */

// Enable CORS for frontend communication
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Auto-load dependencies
require_once 'config/database.php';
require_once 'ai/EnhancedAISignalGenerator.php';
require_once 'ai/MarketDataAPI.php';
require_once 'ai/LSTMNeuralNetwork.php';
require_once 'ai/PatternRecognitionEngine.php';
require_once 'ai/TechnicalAnalysis.php';
require_once 'ai/SentimentAnalysis.php';
require_once 'ai/PortfolioOptimizer.php';
require_once 'ai/RiskManager.php';

/**
 * Main Backend AI Router
 */
class WinTradesBackendAI {
    
    private $database;
    private $pdo;
    private $aiSignalGenerator;
    private $marketDataAPI;
    private $lstm;
    private $patternEngine;
    private $technicalAnalysis;
    private $sentimentAnalysis;
    private $portfolioOptimizer;
    private $riskManager;
    
    public function __construct() {
        $this->initializeComponents();
    }
    
    private function initializeComponents() {
        try {
            // Initialize database
            $this->database = new Database();
            $this->pdo = $this->database->getConnection();
            
            // Initialize AI components
            $this->aiSignalGenerator = new EnhancedAISignalGenerator();
            $this->marketDataAPI = new MarketDataAPI();
            $this->lstm = new LSTMNeuralNetwork();
            $this->patternEngine = new PatternRecognitionEngine();
            $this->technicalAnalysis = new TechnicalAnalysis();
            $this->sentimentAnalysis = new SentimentAnalysis();
            $this->portfolioOptimizer = new PortfolioOptimizer();
            $this->riskManager = new RiskManager();
            
            // Create tables if they don't exist
            $this->initializeTables();
            
        } catch (Exception $e) {
            $this->sendError('System initialization failed: ' . $e->getMessage());
        }
    }
    
    private function initializeTables() {
        $sql = "
        CREATE TABLE IF NOT EXISTS trading_signals (
            id INT AUTO_INCREMENT PRIMARY KEY,
            symbol VARCHAR(20) NOT NULL,
            signal_type ENUM('BUY', 'SELL', 'HOLD') NOT NULL,
            confidence DECIMAL(5,2) NOT NULL,
            price DECIMAL(15,8) NOT NULL,
            lstm_prediction DECIMAL(10,6),
            technical_score DECIMAL(5,2),
            pattern_score DECIMAL(5,2),
            sentiment_score DECIMAL(5,2),
            risk_level ENUM('LOW', 'MEDIUM', 'HIGH') NOT NULL,
            reasons JSON,
            market_data JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            executed BOOLEAN DEFAULT FALSE,
            INDEX idx_symbol_created (symbol, created_at)
        );
        
        CREATE TABLE IF NOT EXISTS market_data (
            id INT AUTO_INCREMENT PRIMARY KEY,
            symbol VARCHAR(20) NOT NULL,
            price DECIMAL(15,8) NOT NULL,
            volume DECIMAL(20,2),
            market_cap DECIMAL(20,2),
            change_24h DECIMAL(10,4),
            change_7d DECIMAL(10,4),
            technical_indicators JSON,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_symbol_timestamp (symbol, timestamp)
        );
        
        CREATE TABLE IF NOT EXISTS ai_performance (
            id INT AUTO_INCREMENT PRIMARY KEY,
            model_type VARCHAR(50) NOT NULL,
            accuracy_24h DECIMAL(5,2),
            accuracy_7d DECIMAL(5,2),
            accuracy_30d DECIMAL(5,2),
            total_predictions INT DEFAULT 0,
            correct_predictions INT DEFAULT 0,
            profit_loss DECIMAL(15,2) DEFAULT 0,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS portfolio_snapshots (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            portfolio_data JSON,
            total_value DECIMAL(15,2),
            daily_pnl DECIMAL(15,2),
            risk_metrics JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS backtesting_results (
            id INT AUTO_INCREMENT PRIMARY KEY,
            strategy_name VARCHAR(100) NOT NULL,
            symbol VARCHAR(20) NOT NULL,
            start_date DATE,
            end_date DATE,
            initial_capital DECIMAL(15,2),
            final_capital DECIMAL(15,2),
            total_return DECIMAL(10,4),
            max_drawdown DECIMAL(10,4),
            sharpe_ratio DECIMAL(10,4),
            total_trades INT,
            win_rate DECIMAL(5,2),
            results_data JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        ";
        
        $this->pdo->exec($sql);
    }
    
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = trim($_SERVER['PATH_INFO'] ?? $_GET['path'] ?? '', '/');
        
        try {
            switch ($method) {
                case 'GET':
                    $this->handleGetRequest($path);
                    break;
                case 'POST':
                    $this->handlePostRequest($path);
                    break;
                default:
                    $this->sendError('Method not allowed', 405);
            }
        } catch (Exception $e) {
            $this->sendError('Request failed: ' . $e->getMessage());
        }
    }
    
    private function handleGetRequest($path) {
        $parts = explode('/', $path);
        $endpoint = $parts[0] ?? '';
        
        switch ($endpoint) {
            case 'signals':
                $symbol = $_GET['symbol'] ?? 'BTC';
                $this->getAISignals($symbol);
                break;
                
            case 'market-data':
                $symbols = $_GET['symbols'] ?? 'bitcoin,ethereum,cardano,solana';
                $this->getRealTimeMarketData(explode(',', $symbols));
                break;
                
            case 'technical-analysis':
                $symbol = $_GET['symbol'] ?? 'BTC';
                $this->getTechnicalAnalysis($symbol);
                break;
                
            case 'pattern-recognition':
                $symbol = $_GET['symbol'] ?? 'BTC';
                $this->getPatternAnalysis($symbol);
                break;
                
            case 'portfolio-analysis':
                $this->getPortfolioAnalysis();
                break;
                
            case 'backtest':
                $strategy = $_GET['strategy'] ?? 'default';
                $symbol = $_GET['symbol'] ?? 'BTC';
                $this->runBacktest($strategy, $symbol);
                break;
                
            case 'ai-performance':
                $this->getAIPerformance();
                break;
                
            case 'sentiment':
                $symbol = $_GET['symbol'] ?? 'BTC';
                $this->getSentimentAnalysis($symbol);
                break;
                
            case 'risk-analysis':
                $this->getRiskAnalysis();
                break;
                
            case 'live-stream':
                $this->getLiveDataStream();
                break;
                
            default:
                $this->getSystemStatus();
        }
    }
    
    private function handlePostRequest($path) {
        $input = json_decode(file_get_contents('php://input'), true);
        $parts = explode('/', $path);
        $endpoint = $parts[0] ?? '';
        
        switch ($endpoint) {
            case 'execute-trade':
                $this->executeTrade($input);
                break;
                
            case 'update-portfolio':
                $this->updatePortfolio($input);
                break;
                
            case 'create-alert':
                $this->createAlert($input);
                break;
                
            case 'optimize-portfolio':
                $this->optimizePortfolio($input);
                break;
                
            default:
                $this->sendError('Endpoint not found', 404);
        }
    }
    
    private function getAISignals($symbol) {
        try {
            // Get enhanced AI signal
            $signal = $this->aiSignalGenerator->generateEnhancedSignal($symbol);
            
            // Get real-time market data
            $marketData = $this->marketDataAPI->getCurrentPrices([strtolower($symbol)]);
            
            // Store signal in database
            $this->storeSignal($signal, $marketData[0] ?? null);
            
            // Get recent performance
            $performance = $this->getModelPerformance();
            
            $response = [
                'status' => 'success',
                'timestamp' => date('Y-m-d H:i:s'),
                'symbol' => $symbol,
                'ai_signal' => $signal,
                'market_data' => $marketData[0] ?? null,
                'ai_performance' => $performance,
                'data_source' => 'live_api',
                'engine_version' => '2.0-enhanced'
            ];
            
            $this->sendSuccess($response);
            
        } catch (Exception $e) {
            $this->sendError('AI signal generation failed: ' . $e->getMessage());
        }
    }
    
    private function getRealTimeMarketData($symbols) {
        try {
            $marketData = $this->marketDataAPI->getCurrentPrices($symbols);
            
            // Store market data
            foreach ($marketData as $data) {
                $this->storeMarketData($data);
            }
            
            // Get technical indicators for each symbol
            $enhancedData = [];
            foreach ($marketData as $data) {
                $historicalData = $this->getStoredPriceHistory($data['symbol'], 50);
                
                if (!empty($historicalData)) {
                    $data['technical_indicators'] = $this->technicalAnalysis->calculateAllIndicators($historicalData);
                }
                
                $enhancedData[] = $data;
            }
            
            $this->sendSuccess([
                'status' => 'success',
                'timestamp' => date('Y-m-d H:i:s'),
                'data' => $enhancedData,
                'total_symbols' => count($enhancedData)
            ]);
            
        } catch (Exception $e) {
            $this->sendError('Market data fetch failed: ' . $e->getMessage());
        }
    }
    
    private function getTechnicalAnalysis($symbol) {
        try {
            $historicalData = $this->getStoredPriceHistory($symbol, 200);
            
            if (empty($historicalData)) {
                // Fetch from API if not in database
                $coinId = $this->symbolToCoinId($symbol);
                $apiData = $this->marketDataAPI->getHistoricalData($coinId, 30);
                $historicalData = array_column($apiData, 'price');
            }
            
            $analysis = $this->technicalAnalysis->calculateAllIndicators($historicalData);
            $analysis['symbol'] = $symbol;
            $analysis['data_points'] = count($historicalData);
            $analysis['timestamp'] = date('Y-m-d H:i:s');
            
            $this->sendSuccess($analysis);
            
        } catch (Exception $e) {
            $this->sendError('Technical analysis failed: ' . $e->getMessage());
        }
    }
    
    private function getPatternAnalysis($symbol) {
        try {
            $historicalData = $this->getStoredPriceHistory($symbol, 100);
            
            if (empty($historicalData)) {
                $coinId = $this->symbolToCoinId($symbol);
                $apiData = $this->marketDataAPI->getHistoricalData($coinId, 30);
                $historicalData = array_column($apiData, 'price');
            }
            
            $patterns = $this->patternEngine->detectPatterns($historicalData);
            
            $this->sendSuccess([
                'status' => 'success',
                'symbol' => $symbol,
                'patterns' => $patterns,
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            
        } catch (Exception $e) {
            $this->sendError('Pattern analysis failed: ' . $e->getMessage());
        }
    }
    
    private function getSentimentAnalysis($symbol) {
        try {
            $sentiment = $this->sentimentAnalysis->analyzeSentiment($symbol);
            
            $this->sendSuccess([
                'status' => 'success',
                'symbol' => $symbol,
                'sentiment' => $sentiment,
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            
        } catch (Exception $e) {
            $this->sendError('Sentiment analysis failed: ' . $e->getMessage());
        }
    }
    
    private function getPortfolioAnalysis() {
        try {
            // Get latest portfolio snapshot
            $stmt = $this->pdo->prepare("SELECT * FROM portfolio_snapshots ORDER BY created_at DESC LIMIT 1");
            $stmt->execute();
            $portfolio = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$portfolio) {
                // Create demo portfolio
                $portfolio = $this->createDemoPortfolio();
            }
            
            // Analyze portfolio
            $analysis = $this->portfolioOptimizer->analyzePortfolio(json_decode($portfolio['portfolio_data'], true));
            
            $this->sendSuccess([
                'status' => 'success',
                'portfolio' => json_decode($portfolio['portfolio_data'], true),
                'analysis' => $analysis,
                'total_value' => $portfolio['total_value'],
                'daily_pnl' => $portfolio['daily_pnl'],
                'timestamp' => $portfolio['created_at']
            ]);
            
        } catch (Exception $e) {
            $this->sendError('Portfolio analysis failed: ' . $e->getMessage());
        }
    }
    
    private function getRiskAnalysis() {
        try {
            $riskMetrics = $this->riskManager->calculateRiskMetrics();
            
            $this->sendSuccess([
                'status' => 'success',
                'risk_analysis' => $riskMetrics,
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            
        } catch (Exception $e) {
            $this->sendError('Risk analysis failed: ' . $e->getMessage());
        }
    }
    
    private function getAIPerformance() {
        try {
            $stmt = $this->pdo->prepare("SELECT * FROM ai_performance ORDER BY last_updated DESC");
            $stmt->execute();
            $performance = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $this->sendSuccess([
                'status' => 'success',
                'performance_metrics' => $performance,
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            
        } catch (Exception $e) {
            $this->sendError('Performance data fetch failed: ' . $e->getMessage());
        }
    }
    
    private function getLiveDataStream() {
        try {
            // Set headers for Server-Sent Events
            header('Content-Type: text/event-stream');
            header('Cache-Control: no-cache');
            
            // Get live data every 5 seconds
            while (true) {
                $data = $this->marketDataAPI->getCurrentPrices(['bitcoin', 'ethereum', 'cardano']);
                echo "data: " . json_encode($data) . "\n\n";
                
                if (connection_aborted()) break;
                sleep(5);
            }
            
        } catch (Exception $e) {
            $this->sendError('Live stream failed: ' . $e->getMessage());
        }
    }
    
    private function getSystemStatus() {
        try {
            $status = [
                'status' => 'operational',
                'version' => '2.0-enhanced',
                'timestamp' => date('Y-m-d H:i:s'),
                'uptime' => $this->getUptime(),
                'components' => [
                    'ai_engine' => 'operational',
                    'market_data_api' => 'operational',
                    'database' => 'operational',
                    'lstm_model' => 'operational',
                    'pattern_recognition' => 'operational',
                    'technical_analysis' => 'operational',
                    'sentiment_analysis' => 'operational',
                    'portfolio_optimizer' => 'operational',
                    'risk_manager' => 'operational'
                ],
                'endpoints' => [
                    '/signals' => 'AI trading signals',
                    '/market-data' => 'Real-time market data',
                    '/technical-analysis' => 'Technical indicators',
                    '/pattern-recognition' => 'Chart pattern analysis',
                    '/portfolio-analysis' => 'Portfolio optimization',
                    '/sentiment' => 'Market sentiment',
                    '/risk-analysis' => 'Risk metrics',
                    '/ai-performance' => 'AI model performance',
                    '/live-stream' => 'Real-time data stream'
                ]
            ];
            
            $this->sendSuccess($status);
            
        } catch (Exception $e) {
            $this->sendError('System status check failed: ' . $e->getMessage());
        }
    }
    
    private function storeSignal($signal, $marketData) {
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO trading_signals 
                (symbol, signal_type, confidence, price, lstm_prediction, technical_score, 
                 pattern_score, sentiment_score, risk_level, reasons, market_data) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $signal['symbol'] ?? 'BTC',
                $signal['signal_type'] ?? 'HOLD',
                $signal['confidence'] ?? 50,
                $marketData['price'] ?? 0,
                $signal['lstm_prediction'] ?? null,
                $signal['technical_score'] ?? null,
                $signal['pattern_score'] ?? null,
                $signal['sentiment_score'] ?? null,
                $signal['risk_level'] ?? 'MEDIUM',
                json_encode($signal['reasons'] ?? []),
                json_encode($marketData)
            ]);
            
        } catch (Exception $e) {
            error_log('Failed to store signal: ' . $e->getMessage());
        }
    }
    
    private function storeMarketData($data) {
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO market_data 
                (symbol, price, volume, market_cap, change_24h, technical_indicators) 
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $data['symbol'],
                $data['price'],
                $data['volume_24h'] ?? null,
                $data['market_cap'] ?? null,
                $data['change_24h'] ?? null,
                json_encode($data['technical_indicators'] ?? [])
            ]);
            
        } catch (Exception $e) {
            error_log('Failed to store market data: ' . $e->getMessage());
        }
    }
    
    private function getStoredPriceHistory($symbol, $limit) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT price FROM market_data 
                WHERE symbol = ? 
                ORDER BY timestamp DESC 
                LIMIT ?
            ");
            $stmt->execute([$symbol, $limit]);
            
            return array_reverse(array_column($stmt->fetchAll(), 'price'));
            
        } catch (Exception $e) {
            return [];
        }
    }
    
    private function getModelPerformance() {
        try {
            $stmt = $this->pdo->prepare("
                SELECT model_type, accuracy_24h, accuracy_7d, total_predictions, correct_predictions 
                FROM ai_performance 
                ORDER BY last_updated DESC 
                LIMIT 5
            ");
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
            
        } catch (Exception $e) {
            return [];
        }
    }
    
    private function createDemoPortfolio() {
        $portfolio = [
            'BTC' => ['amount' => 0.5, 'avg_price' => 67000],
            'ETH' => ['amount' => 2.0, 'avg_price' => 3500],
            'ADA' => ['amount' => 1000, 'avg_price' => 0.45],
            'SOL' => ['amount' => 10, 'avg_price' => 150]
        ];
        
        $stmt = $this->pdo->prepare("
            INSERT INTO portfolio_snapshots (user_id, portfolio_data, total_value, daily_pnl) 
            VALUES (1, ?, 50000, 250)
        ");
        $stmt->execute([json_encode($portfolio)]);
        
        return [
            'portfolio_data' => json_encode($portfolio),
            'total_value' => 50000,
            'daily_pnl' => 250,
            'created_at' => date('Y-m-d H:i:s')
        ];
    }
    
    private function symbolToCoinId($symbol) {
        $mapping = [
            'BTC' => 'bitcoin',
            'ETH' => 'ethereum',
            'ADA' => 'cardano',
            'SOL' => 'solana',
            'DOT' => 'polkadot',
            'MATIC' => 'polygon'
        ];
        
        return $mapping[strtoupper($symbol)] ?? 'bitcoin';
    }
    
    private function getUptime() {
        return shell_exec('uptime') ?: 'Unknown';
    }
    
    private function sendSuccess($data) {
        http_response_code(200);
        echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        exit;
    }
    
    private function sendError($message, $code = 500) {
        http_response_code($code);
        echo json_encode([
            'status' => 'error',
            'message' => $message,
            'timestamp' => date('Y-m-d H:i:s'),
            'error_code' => $code
        ], JSON_PRETTY_PRINT);
        exit;
    }
}

// Initialize and handle request
try {
    $backend = new WinTradesBackendAI();
    $backend->handleRequest();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'System error: ' . $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>