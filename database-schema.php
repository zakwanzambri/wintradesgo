<?php
/**
 * Database Schema Initialization for WinTrades AI Backend
 * Creates all necessary tables for the AI trading system
 */

require_once 'config/database.php';

class DatabaseSchemaManager {
    
    private $pdo;
    
    public function __construct() {
        $database = new Database();
        $this->pdo = $database->getConnection();
    }
    
    /**
     * Initialize all database tables
     */
    public function initializeSchema() {
        try {
            $this->createUserTables();
            $this->createMarketDataTables();
            $this->createAITables();
            $this->createTradingTables();
            $this->createPortfolioTables();
            $this->createAnalyticsTables();
            $this->createSystemTables();
            $this->insertDefaultData();
            
            echo "Database schema initialized successfully!\n";
            
        } catch (Exception $e) {
            echo "Schema initialization failed: " . $e->getMessage() . "\n";
            throw $e;
        }
    }
    
    /**
     * Create user management tables
     */
    private function createUserTables() {
        $sql = "
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            api_key VARCHAR(100) UNIQUE,
            plan_type ENUM('free', 'premium', 'pro') DEFAULT 'free',
            subscription_expires DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT TRUE,
            last_login TIMESTAMP NULL,
            INDEX idx_username (username),
            INDEX idx_email (email),
            INDEX idx_api_key (api_key)
        );
        
        CREATE TABLE IF NOT EXISTS user_preferences (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            trading_preferences JSON,
            notification_settings JSON,
            display_settings JSON,
            risk_tolerance ENUM('conservative', 'moderate', 'aggressive') DEFAULT 'moderate',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        ";
        
        $this->pdo->exec($sql);
    }
    
    /**
     * Create market data tables
     */
    private function createMarketDataTables() {
        $sql = "
        CREATE TABLE IF NOT EXISTS market_data (
            id INT AUTO_INCREMENT PRIMARY KEY,
            symbol VARCHAR(20) NOT NULL,
            price DECIMAL(15,8) NOT NULL,
            volume DECIMAL(20,2),
            market_cap DECIMAL(20,2),
            change_24h DECIMAL(10,4),
            change_7d DECIMAL(10,4),
            high_24h DECIMAL(15,8),
            low_24h DECIMAL(15,8),
            data_source VARCHAR(50) DEFAULT 'coingecko',
            technical_indicators JSON,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_symbol_timestamp (symbol, timestamp),
            INDEX idx_timestamp (timestamp)
        );
        
        CREATE TABLE IF NOT EXISTS historical_prices (
            id INT AUTO_INCREMENT PRIMARY KEY,
            symbol VARCHAR(20) NOT NULL,
            date DATE NOT NULL,
            open_price DECIMAL(15,8) NOT NULL,
            high_price DECIMAL(15,8) NOT NULL,
            low_price DECIMAL(15,8) NOT NULL,
            close_price DECIMAL(15,8) NOT NULL,
            volume DECIMAL(20,2),
            market_cap DECIMAL(20,2),
            data_source VARCHAR(50) DEFAULT 'coingecko',
            UNIQUE KEY unique_symbol_date (symbol, date),
            INDEX idx_symbol (symbol),
            INDEX idx_date (date)
        );
        
        CREATE TABLE IF NOT EXISTS orderbook_data (
            id INT AUTO_INCREMENT PRIMARY KEY,
            symbol VARCHAR(20) NOT NULL,
            bids JSON NOT NULL,
            asks JSON NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_symbol_timestamp (symbol, timestamp)
        );
        ";
        
        $this->pdo->exec($sql);
    }
    
    /**
     * Create AI analysis tables
     */
    private function createAITables() {
        $sql = "
        CREATE TABLE IF NOT EXISTS ai_predictions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            symbol VARCHAR(20) NOT NULL,
            model_type VARCHAR(50) NOT NULL,
            prediction_value DECIMAL(10,6),
            confidence DECIMAL(5,2),
            timeframe VARCHAR(20),
            prediction_data JSON,
            actual_outcome DECIMAL(10,6) NULL,
            accuracy_score DECIMAL(5,2) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_symbol_model (symbol, model_type),
            INDEX idx_created_at (created_at)
        );
        
        CREATE TABLE IF NOT EXISTS pattern_analysis (
            id INT AUTO_INCREMENT PRIMARY KEY,
            symbol VARCHAR(20) NOT NULL,
            pattern_type VARCHAR(50) NOT NULL,
            pattern_data JSON,
            reliability_score DECIMAL(5,2),
            detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expiry_date TIMESTAMP NULL,
            status ENUM('active', 'completed', 'failed') DEFAULT 'active',
            INDEX idx_symbol_pattern (symbol, pattern_type),
            INDEX idx_detected_at (detected_at)
        );
        
        CREATE TABLE IF NOT EXISTS sentiment_analysis (
            id INT AUTO_INCREMENT PRIMARY KEY,
            symbol VARCHAR(20) NOT NULL,
            news_sentiment DECIMAL(5,2),
            social_sentiment DECIMAL(5,2),
            overall_sentiment DECIMAL(5,2),
            fear_greed_index INT,
            sentiment_sources JSON,
            analysis_date DATE NOT NULL,
            INDEX idx_symbol_date (symbol, analysis_date)
        );
        
        CREATE TABLE IF NOT EXISTS ai_model_performance (
            id INT AUTO_INCREMENT PRIMARY KEY,
            model_name VARCHAR(100) NOT NULL,
            model_type VARCHAR(50) NOT NULL,
            accuracy_1d DECIMAL(5,2),
            accuracy_7d DECIMAL(5,2),
            accuracy_30d DECIMAL(5,2),
            total_predictions INT DEFAULT 0,
            correct_predictions INT DEFAULT 0,
            profit_loss DECIMAL(15,2) DEFAULT 0,
            sharpe_ratio DECIMAL(8,4),
            max_drawdown DECIMAL(5,2),
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_model (model_name, model_type)
        );
        ";
        
        $this->pdo->exec($sql);
    }
    
    /**
     * Create trading tables
     */
    private function createTradingTables() {
        $sql = "
        CREATE TABLE IF NOT EXISTS trading_signals (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            symbol VARCHAR(20) NOT NULL,
            signal_type ENUM('BUY', 'SELL', 'HOLD', 'WEAK_BUY', 'WEAK_SELL') NOT NULL,
            confidence DECIMAL(5,2) NOT NULL,
            entry_price DECIMAL(15,8),
            stop_loss DECIMAL(15,8),
            take_profit DECIMAL(15,8),
            position_size DECIMAL(10,4),
            lstm_prediction DECIMAL(10,6),
            technical_score DECIMAL(5,2),
            pattern_score DECIMAL(5,2),
            sentiment_score DECIMAL(5,2),
            risk_level ENUM('LOW', 'MEDIUM', 'HIGH') NOT NULL,
            reasons JSON,
            market_data JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            executed BOOLEAN DEFAULT FALSE,
            executed_at TIMESTAMP NULL,
            execution_price DECIMAL(15,8) NULL,
            INDEX idx_symbol_created (symbol, created_at),
            INDEX idx_user_signals (user_id, created_at),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        );
        
        CREATE TABLE IF NOT EXISTS trades (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            signal_id INT,
            symbol VARCHAR(20) NOT NULL,
            trade_type ENUM('BUY', 'SELL') NOT NULL,
            quantity DECIMAL(15,8) NOT NULL,
            entry_price DECIMAL(15,8) NOT NULL,
            exit_price DECIMAL(15,8) NULL,
            stop_loss DECIMAL(15,8),
            take_profit DECIMAL(15,8),
            status ENUM('open', 'closed', 'cancelled') DEFAULT 'open',
            pnl DECIMAL(15,2) NULL,
            fees DECIMAL(15,2) DEFAULT 0,
            opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            closed_at TIMESTAMP NULL,
            exchange VARCHAR(50),
            trade_data JSON,
            INDEX idx_user_trades (user_id, opened_at),
            INDEX idx_symbol_status (symbol, status),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (signal_id) REFERENCES trading_signals(id) ON DELETE SET NULL
        );
        
        CREATE TABLE IF NOT EXISTS backtesting_results (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            strategy_name VARCHAR(100) NOT NULL,
            symbol VARCHAR(20) NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            initial_capital DECIMAL(15,2) NOT NULL,
            final_capital DECIMAL(15,2) NOT NULL,
            total_return DECIMAL(10,4),
            max_drawdown DECIMAL(10,4),
            sharpe_ratio DECIMAL(10,4),
            sortino_ratio DECIMAL(10,4),
            total_trades INT,
            winning_trades INT,
            losing_trades INT,
            win_rate DECIMAL(5,2),
            avg_win DECIMAL(15,2),
            avg_loss DECIMAL(15,2),
            profit_factor DECIMAL(8,4),
            results_data JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user_strategy (user_id, strategy_name),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        ";
        
        $this->pdo->exec($sql);
    }
    
    /**
     * Create portfolio tables
     */
    private function createPortfolioTables() {
        $sql = "
        CREATE TABLE IF NOT EXISTS portfolios (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            total_value DECIMAL(15,2) DEFAULT 0,
            cash_balance DECIMAL(15,2) DEFAULT 0,
            invested_amount DECIMAL(15,2) DEFAULT 0,
            daily_pnl DECIMAL(15,2) DEFAULT 0,
            total_pnl DECIMAL(15,2) DEFAULT 0,
            is_default BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_user_portfolios (user_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        
        CREATE TABLE IF NOT EXISTS portfolio_holdings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            portfolio_id INT NOT NULL,
            symbol VARCHAR(20) NOT NULL,
            quantity DECIMAL(15,8) NOT NULL,
            avg_cost DECIMAL(15,8) NOT NULL,
            current_price DECIMAL(15,8),
            market_value DECIMAL(15,2),
            unrealized_pnl DECIMAL(15,2),
            realized_pnl DECIMAL(15,2) DEFAULT 0,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_portfolio_symbol (portfolio_id, symbol),
            INDEX idx_portfolio_id (portfolio_id),
            FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE
        );
        
        CREATE TABLE IF NOT EXISTS portfolio_snapshots (
            id INT AUTO_INCREMENT PRIMARY KEY,
            portfolio_id INT NOT NULL,
            snapshot_date DATE NOT NULL,
            total_value DECIMAL(15,2) NOT NULL,
            daily_change DECIMAL(15,2),
            daily_change_percent DECIMAL(5,2),
            holdings_data JSON,
            risk_metrics JSON,
            performance_metrics JSON,
            UNIQUE KEY unique_portfolio_date (portfolio_id, snapshot_date),
            INDEX idx_portfolio_snapshots (portfolio_id, snapshot_date),
            FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE
        );
        ";
        
        $this->pdo->exec($sql);
    }
    
    /**
     * Create analytics tables
     */
    private function createAnalyticsTables() {
        $sql = "
        CREATE TABLE IF NOT EXISTS user_analytics (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            date DATE NOT NULL,
            total_trades INT DEFAULT 0,
            winning_trades INT DEFAULT 0,
            total_pnl DECIMAL(15,2) DEFAULT 0,
            portfolio_value DECIMAL(15,2) DEFAULT 0,
            signals_generated INT DEFAULT 0,
            signals_followed INT DEFAULT 0,
            ai_accuracy DECIMAL(5,2),
            risk_score DECIMAL(5,2),
            activity_data JSON,
            UNIQUE KEY unique_user_date (user_id, date),
            INDEX idx_user_analytics (user_id, date),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        
        CREATE TABLE IF NOT EXISTS market_analytics (
            id INT AUTO_INCREMENT PRIMARY KEY,
            date DATE NOT NULL,
            symbol VARCHAR(20) NOT NULL,
            volatility DECIMAL(8,4),
            volume DECIMAL(20,2),
            price_change_24h DECIMAL(10,4),
            market_cap_change DECIMAL(10,4),
            social_mentions INT DEFAULT 0,
            news_sentiment DECIMAL(5,2),
            technical_score DECIMAL(5,2),
            fear_greed_index INT,
            analytics_data JSON,
            UNIQUE KEY unique_symbol_date (symbol, date),
            INDEX idx_market_analytics (date, symbol)
        );
        ";
        
        $this->pdo->exec($sql);
    }
    
    /**
     * Create system tables
     */
    private function createSystemTables() {
        $sql = "
        CREATE TABLE IF NOT EXISTS alerts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            alert_type ENUM('price', 'signal', 'portfolio', 'news') NOT NULL,
            symbol VARCHAR(20),
            condition_type ENUM('above', 'below', 'equals', 'change_percent') NOT NULL,
            trigger_value DECIMAL(15,8),
            current_value DECIMAL(15,8),
            message TEXT,
            is_triggered BOOLEAN DEFAULT FALSE,
            triggered_at TIMESTAMP NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user_alerts (user_id, is_active),
            INDEX idx_triggered (is_triggered, is_active),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        
        CREATE TABLE IF NOT EXISTS notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            type VARCHAR(50) NOT NULL,
            title VARCHAR(200) NOT NULL,
            message TEXT NOT NULL,
            data JSON,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user_notifications (user_id, created_at),
            INDEX idx_unread (user_id, is_read),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        
        CREATE TABLE IF NOT EXISTS system_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            log_level ENUM('info', 'warning', 'error', 'debug') NOT NULL,
            component VARCHAR(100) NOT NULL,
            message TEXT NOT NULL,
            data JSON,
            user_id INT NULL,
            ip_address VARCHAR(45),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_level_component (log_level, component),
            INDEX idx_created_at (created_at),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        );
        
        CREATE TABLE IF NOT EXISTS password_resets (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            token VARCHAR(255) NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_user_reset (user_id),
            INDEX idx_token (token),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        
        CREATE TABLE IF NOT EXISTS api_usage (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            api_key VARCHAR(100),
            endpoint VARCHAR(200) NOT NULL,
            method VARCHAR(10) NOT NULL,
            response_time INT,
            status_code INT,
            request_data JSON,
            response_size INT,
            ip_address VARCHAR(45),
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user_usage (user_id, created_at),
            INDEX idx_api_key_usage (api_key, created_at),
            INDEX idx_endpoint (endpoint),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        );
        ";
        
        $this->pdo->exec($sql);
    }
    
    /**
     * Insert default data
     */
    private function insertDefaultData() {
        // Insert default AI models
        $modelData = [
            ['LSTM Neural Network', 'lstm', 82.5, 78.3, 74.1, 0, 0, 0.0, 1.45, 12.3],
            ['Pattern Recognition', 'pattern', 75.2, 71.8, 68.9, 0, 0, 0.0, 1.28, 8.7],
            ['Technical Analysis', 'technical', 73.8, 70.2, 67.5, 0, 0, 0.0, 1.12, 15.2],
            ['Sentiment Analysis', 'sentiment', 68.5, 65.1, 62.3, 0, 0, 0.0, 0.95, 22.1],
            ['Ensemble Model', 'ensemble', 85.7, 82.1, 79.4, 0, 0, 0.0, 1.67, 9.8]
        ];
        
        $stmt = $this->pdo->prepare("
            INSERT IGNORE INTO ai_model_performance 
            (model_name, model_type, accuracy_1d, accuracy_7d, accuracy_30d, 
             total_predictions, correct_predictions, profit_loss, sharpe_ratio, max_drawdown) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        foreach ($modelData as $model) {
            $stmt->execute($model);
        }
        
        // Insert default market analytics for major coins
        $symbols = ['BTC', 'ETH', 'ADA', 'SOL', 'DOT', 'MATIC'];
        $stmt = $this->pdo->prepare("
            INSERT IGNORE INTO market_analytics 
            (date, symbol, volatility, fear_greed_index, analytics_data) 
            VALUES (CURDATE(), ?, ?, ?, ?)
        ");
        
        foreach ($symbols as $symbol) {
            $stmt->execute([
                $symbol, 
                rand(15, 45) / 10, 
                rand(20, 80), 
                json_encode(['initialized' => true])
            ]);
        }
    }
    
    /**
     * Drop all tables (use with caution!)
     */
    public function dropAllTables() {
        $tables = [
            'api_usage', 'system_logs', 'notifications', 'alerts',
            'market_analytics', 'user_analytics',
            'portfolio_snapshots', 'portfolio_holdings', 'portfolios',
            'backtesting_results', 'trades', 'trading_signals',
            'ai_model_performance', 'sentiment_analysis', 'pattern_analysis', 'ai_predictions',
            'orderbook_data', 'historical_prices', 'market_data',
            'user_preferences', 'users'
        ];
        
        $this->pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
        
        foreach ($tables as $table) {
            $this->pdo->exec("DROP TABLE IF EXISTS $table");
        }
        
        $this->pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
        
        echo "All tables dropped successfully!\n";
    }
    
    /**
     * Get database status
     */
    public function getDatabaseStatus() {
        $stmt = $this->pdo->query("SHOW TABLES");
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        $status = [
            'total_tables' => count($tables),
            'tables' => $tables,
            'database_size' => $this->getDatabaseSize(),
            'last_updated' => date('Y-m-d H:i:s')
        ];
        
        return $status;
    }
    
    private function getDatabaseSize() {
        $stmt = $this->pdo->query("
            SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'size_mb'
            FROM information_schema.tables 
            WHERE table_schema = 'wintradesgo'
        ");
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['size_mb'] ?? 0;
    }
}

// CLI usage
if (php_sapi_name() === 'cli') {
    $action = $argv[1] ?? 'init';
    
    $schema = new DatabaseSchemaManager();
    
    switch ($action) {
        case 'init':
            $schema->initializeSchema();
            break;
        case 'drop':
            if (($argv[2] ?? '') === '--confirm') {
                $schema->dropAllTables();
            } else {
                echo "Use --confirm flag to drop all tables\n";
            }
            break;
        case 'status':
            $status = $schema->getDatabaseStatus();
            echo json_encode($status, JSON_PRETTY_PRINT) . "\n";
            break;
        default:
            echo "Usage: php database-schema.php [init|drop|status]\n";
    }
}
?>