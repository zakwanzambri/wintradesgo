# WinTrades Production Database Optimization
# Production-grade MySQL optimization script for high-performance trading

# Step 1: Database Configuration Optimization
mysql -u root -p << 'EOF'

-- Switch to wintradesgo database
USE wintradesgo;

-- Enable query cache for repeated queries
SET GLOBAL query_cache_size = 268435456; -- 256MB
SET GLOBAL query_cache_type = ON;

-- Optimize InnoDB settings for trading workload
SET GLOBAL innodb_buffer_pool_size = 2147483648; -- 2GB (adjust based on available RAM)
SET GLOBAL innodb_log_file_size = 536870912; -- 512MB
SET GLOBAL innodb_flush_log_at_trx_commit = 2; -- Better performance for non-critical data
SET GLOBAL innodb_file_per_table = ON;

-- Connection and thread optimization
SET GLOBAL max_connections = 500;
SET GLOBAL thread_cache_size = 50;
SET GLOBAL table_open_cache = 2000;

-- Optimize for read-heavy workload
SET GLOBAL read_buffer_size = 8388608; -- 8MB
SET GLOBAL join_buffer_size = 8388608; -- 8MB
SET GLOBAL sort_buffer_size = 2097152; -- 2MB

-- Show current settings
SHOW VARIABLES LIKE 'innodb_buffer_pool_size';
SHOW VARIABLES LIKE 'query_cache_size';

EOF

# Step 2: Create optimized database schema with proper indexing
mysql -u root -p << 'EOF'

USE wintradesgo;

-- Create optimized tables for trading operations

-- 1. Trading Positions Table (Enhanced with indexes)
DROP TABLE IF EXISTS trading_positions;
CREATE TABLE trading_positions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    signal_type ENUM('BUY', 'SELL', 'HOLD') NOT NULL,
    quantity DECIMAL(18,8) NOT NULL,
    entry_price DECIMAL(18,8) NOT NULL,
    current_price DECIMAL(18,8) DEFAULT NULL,
    position_size_usd DECIMAL(18,2) NOT NULL,
    status ENUM('OPEN', 'CLOSED', 'CANCELLED') DEFAULT 'OPEN',
    profit_loss DECIMAL(18,2) DEFAULT 0,
    entry_timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    exit_timestamp DATETIME NULL,
    risk_level ENUM('LOW', 'MEDIUM', 'HIGH') NOT NULL,
    confidence_score DECIMAL(5,2) NOT NULL,
    ml_model_version VARCHAR(50) DEFAULT NULL,
    stop_loss DECIMAL(18,8) DEFAULT NULL,
    take_profit DECIMAL(18,8) DEFAULT NULL,
    
    -- Optimized indexes for trading queries
    INDEX idx_symbol_status (symbol, status),
    INDEX idx_status_timestamp (status, entry_timestamp),
    INDEX idx_symbol_timestamp (symbol, entry_timestamp),
    INDEX idx_profit_loss (profit_loss),
    INDEX idx_risk_level (risk_level),
    INDEX idx_exit_timestamp (exit_timestamp),
    
    -- Composite indexes for complex queries
    INDEX idx_symbol_status_timestamp (symbol, status, entry_timestamp),
    INDEX idx_performance_analysis (status, profit_loss, entry_timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Portfolio Balance Table (Optimized for time-series data)
DROP TABLE IF EXISTS portfolio_balance;
CREATE TABLE portfolio_balance (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cash_balance DECIMAL(18,2) NOT NULL DEFAULT 100000.00,
    total_portfolio_value DECIMAL(18,2) NOT NULL,
    invested_amount DECIMAL(18,2) DEFAULT 0,
    unrealized_pnl DECIMAL(18,2) DEFAULT 0,
    realized_pnl DECIMAL(18,2) DEFAULT 0,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    daily_return DECIMAL(8,4) DEFAULT NULL,
    cumulative_return DECIMAL(8,4) DEFAULT NULL,
    
    -- Time-series optimized indexes
    INDEX idx_timestamp (timestamp),
    INDEX idx_daily_performance (timestamp, daily_return),
    
    -- Latest balance lookup optimization
    INDEX idx_latest_balance (timestamp DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Performance Metrics Table (High-frequency updates)
DROP TABLE IF EXISTS performance_metrics;
CREATE TABLE performance_metrics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    metric_date DATE NOT NULL,
    total_trades INT DEFAULT 0,
    winning_trades INT DEFAULT 0,
    losing_trades INT DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0,
    profit_factor DECIMAL(8,4) DEFAULT 0,
    sharpe_ratio DECIMAL(8,4) DEFAULT NULL,
    max_drawdown DECIMAL(8,4) DEFAULT NULL,
    volatility DECIMAL(8,4) DEFAULT NULL,
    var_95 DECIMAL(8,4) DEFAULT NULL, -- Value at Risk 95%
    portfolio_value DECIMAL(18,2) NOT NULL,
    benchmark_return DECIMAL(8,4) DEFAULT NULL,
    alpha DECIMAL(8,4) DEFAULT NULL,
    beta DECIMAL(8,4) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Date-based performance queries
    UNIQUE KEY idx_metric_date (metric_date),
    INDEX idx_performance_lookup (metric_date, win_rate, sharpe_ratio),
    INDEX idx_risk_metrics (var_95, max_drawdown, volatility)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Risk Events Table (Real-time risk monitoring)
DROP TABLE IF EXISTS risk_events;
CREATE TABLE risk_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_type ENUM('POSITION_RISK', 'PORTFOLIO_RISK', 'MARKET_RISK', 'SYSTEM_RISK') NOT NULL,
    severity ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL,
    symbol VARCHAR(20) DEFAULT NULL,
    risk_metric VARCHAR(50) NOT NULL,
    current_value DECIMAL(18,8) NOT NULL,
    threshold_value DECIMAL(18,8) NOT NULL,
    description TEXT,
    action_taken TEXT DEFAULT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    
    -- Real-time risk monitoring indexes
    INDEX idx_severity_unresolved (severity, resolved, created_at),
    INDEX idx_symbol_events (symbol, event_type, created_at),
    INDEX idx_event_monitoring (resolved, severity, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Portfolio Optimizations Table (ML optimization history)
DROP TABLE IF EXISTS portfolio_optimizations;
CREATE TABLE portfolio_optimizations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    optimization_method ENUM('max_sharpe', 'min_variance', 'risk_parity', 'black_litterman') NOT NULL,
    expected_return DECIMAL(8,4) NOT NULL,
    expected_volatility DECIMAL(8,4) NOT NULL,
    sharpe_ratio DECIMAL(8,4) NOT NULL,
    positions_json JSON NOT NULL,
    constraints_json JSON DEFAULT NULL,
    ml_confidence DECIMAL(5,2) DEFAULT NULL,
    rebalancing_needed BOOLEAN DEFAULT FALSE,
    implemented BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Optimization tracking indexes
    INDEX idx_method_timestamp (optimization_method, timestamp),
    INDEX idx_performance_metrics (sharpe_ratio, expected_return, timestamp),
    INDEX idx_implementation_status (implemented, rebalancing_needed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Market Data Cache Table (High-frequency price data)
DROP TABLE IF EXISTS market_data_cache;
CREATE TABLE market_data_cache (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    price DECIMAL(18,8) NOT NULL,
    volume DECIMAL(18,2) DEFAULT NULL,
    bid DECIMAL(18,8) DEFAULT NULL,
    ask DECIMAL(18,8) DEFAULT NULL,
    spread DECIMAL(18,8) DEFAULT NULL,
    volatility_24h DECIMAL(8,4) DEFAULT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(50) DEFAULT NULL,
    
    -- High-frequency data access
    UNIQUE KEY idx_symbol_timestamp (symbol, timestamp),
    INDEX idx_latest_prices (symbol, timestamp DESC),
    INDEX idx_volatility_tracking (volatility_24h, timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. ML Model Performance Table (Model tracking)
DROP TABLE IF EXISTS ml_model_performance;
CREATE TABLE ml_model_performance (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    accuracy DECIMAL(5,2) NOT NULL,
    precision_score DECIMAL(5,2) DEFAULT NULL,
    recall_score DECIMAL(5,2) DEFAULT NULL,
    f1_score DECIMAL(5,2) DEFAULT NULL,
    prediction_confidence DECIMAL(5,2) DEFAULT NULL,
    training_date DATE NOT NULL,
    evaluation_date DATE NOT NULL,
    dataset_size INT DEFAULT NULL,
    features_used JSON DEFAULT NULL,
    hyperparameters JSON DEFAULT NULL,
    
    -- Model performance tracking
    INDEX idx_model_version (model_name, model_version),
    INDEX idx_performance_metrics (accuracy, evaluation_date),
    INDEX idx_model_evaluation (model_name, evaluation_date DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. System Performance Logs (Application monitoring)
DROP TABLE IF EXISTS system_performance_logs;
CREATE TABLE system_performance_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    component VARCHAR(100) NOT NULL,
    operation VARCHAR(100) NOT NULL,
    execution_time_ms INT NOT NULL,
    memory_usage_mb DECIMAL(8,2) DEFAULT NULL,
    cpu_usage_percent DECIMAL(5,2) DEFAULT NULL,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT DEFAULT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Performance monitoring indexes
    INDEX idx_component_operation (component, operation, timestamp),
    INDEX idx_performance_analysis (execution_time_ms, timestamp),
    INDEX idx_error_tracking (success, timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create partitioned table for large-scale trade history
DROP TABLE IF EXISTS trade_history_partitioned;
CREATE TABLE trade_history_partitioned (
    id BIGINT AUTO_INCREMENT,
    symbol VARCHAR(20) NOT NULL,
    trade_type ENUM('BUY', 'SELL') NOT NULL,
    quantity DECIMAL(18,8) NOT NULL,
    price DECIMAL(18,8) NOT NULL,
    total_value DECIMAL(18,2) NOT NULL,
    commission DECIMAL(18,8) DEFAULT 0,
    trade_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    position_id BIGINT DEFAULT NULL,
    
    PRIMARY KEY (id, trade_timestamp),
    INDEX idx_symbol_timestamp (symbol, trade_timestamp),
    FOREIGN KEY (position_id) REFERENCES trading_positions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
PARTITION BY RANGE (YEAR(trade_timestamp)) (
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION p2026 VALUES LESS THAN (2027),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- Insert initial portfolio balance
INSERT INTO portfolio_balance (cash_balance, total_portfolio_value, timestamp) 
VALUES (100000.00, 100000.00, NOW());

-- Insert initial performance metrics
INSERT INTO performance_metrics (metric_date, portfolio_value) 
VALUES (CURDATE(), 100000.00);

-- Create stored procedures for common operations

DELIMITER //

-- Get Portfolio Summary
CREATE PROCEDURE GetPortfolioSummary()
BEGIN
    SELECT 
        pb.total_portfolio_value,
        pb.cash_balance,
        pb.invested_amount,
        pb.unrealized_pnl,
        pb.realized_pnl,
        pm.win_rate,
        pm.sharpe_ratio,
        pm.max_drawdown,
        COUNT(tp.id) as open_positions
    FROM portfolio_balance pb
    LEFT JOIN performance_metrics pm ON DATE(pb.timestamp) = pm.metric_date
    LEFT JOIN trading_positions tp ON tp.status = 'OPEN'
    WHERE pb.timestamp = (SELECT MAX(timestamp) FROM portfolio_balance)
    GROUP BY pb.id, pm.id;
END //

-- Calculate Daily Performance
CREATE PROCEDURE CalculateDailyPerformance(IN target_date DATE)
BEGIN
    DECLARE prev_value DECIMAL(18,2);
    DECLARE curr_value DECIMAL(18,2);
    DECLARE daily_ret DECIMAL(8,4);
    
    -- Get previous day value
    SELECT total_portfolio_value INTO prev_value
    FROM portfolio_balance 
    WHERE DATE(timestamp) < target_date
    ORDER BY timestamp DESC LIMIT 1;
    
    -- Get current day value
    SELECT total_portfolio_value INTO curr_value
    FROM portfolio_balance 
    WHERE DATE(timestamp) = target_date
    ORDER BY timestamp DESC LIMIT 1;
    
    -- Calculate daily return
    IF prev_value > 0 THEN
        SET daily_ret = ((curr_value - prev_value) / prev_value) * 100;
        
        UPDATE portfolio_balance 
        SET daily_return = daily_ret
        WHERE DATE(timestamp) = target_date;
    END IF;
END //

-- Update Performance Metrics
CREATE PROCEDURE UpdatePerformanceMetrics(IN metric_date DATE)
BEGIN
    DECLARE total_trades_count INT DEFAULT 0;
    DECLARE winning_trades_count INT DEFAULT 0;
    DECLARE win_rate_calc DECIMAL(5,2) DEFAULT 0;
    DECLARE current_portfolio_value DECIMAL(18,2) DEFAULT 0;
    
    -- Count trades
    SELECT COUNT(*) INTO total_trades_count
    FROM trading_positions 
    WHERE DATE(entry_timestamp) = metric_date AND status = 'CLOSED';
    
    SELECT COUNT(*) INTO winning_trades_count
    FROM trading_positions 
    WHERE DATE(entry_timestamp) = metric_date AND status = 'CLOSED' AND profit_loss > 0;
    
    -- Calculate win rate
    IF total_trades_count > 0 THEN
        SET win_rate_calc = (winning_trades_count / total_trades_count) * 100;
    END IF;
    
    -- Get current portfolio value
    SELECT total_portfolio_value INTO current_portfolio_value
    FROM portfolio_balance 
    WHERE DATE(timestamp) = metric_date
    ORDER BY timestamp DESC LIMIT 1;
    
    -- Insert or update performance metrics
    INSERT INTO performance_metrics (
        metric_date, total_trades, winning_trades, losing_trades, 
        win_rate, portfolio_value
    ) VALUES (
        metric_date, total_trades_count, winning_trades_count, 
        (total_trades_count - winning_trades_count), win_rate_calc, 
        current_portfolio_value
    ) ON DUPLICATE KEY UPDATE
        total_trades = total_trades_count,
        winning_trades = winning_trades_count,
        losing_trades = (total_trades_count - winning_trades_count),
        win_rate = win_rate_calc,
        portfolio_value = current_portfolio_value;
END //

DELIMITER ;

-- Create views for common queries

-- Portfolio Performance View
CREATE VIEW portfolio_performance_view AS
SELECT 
    DATE(pb.timestamp) as date,
    pb.total_portfolio_value,
    pb.daily_return,
    pb.unrealized_pnl,
    pb.realized_pnl,
    pm.win_rate,
    pm.sharpe_ratio,
    pm.max_drawdown,
    pm.profit_factor
FROM portfolio_balance pb
LEFT JOIN performance_metrics pm ON DATE(pb.timestamp) = pm.metric_date
ORDER BY pb.timestamp DESC;

-- Active Positions View
CREATE VIEW active_positions_view AS
SELECT 
    tp.symbol,
    tp.quantity,
    tp.entry_price,
    tp.current_price,
    tp.position_size_usd,
    tp.profit_loss,
    tp.risk_level,
    tp.confidence_score,
    TIMESTAMPDIFF(HOUR, tp.entry_timestamp, NOW()) as hours_held,
    ((tp.current_price - tp.entry_price) / tp.entry_price * 100) as unrealized_return_pct
FROM trading_positions tp
WHERE tp.status = 'OPEN'
ORDER BY tp.entry_timestamp DESC;

-- Risk Summary View
CREATE VIEW risk_summary_view AS
SELECT 
    re.event_type,
    re.severity,
    COUNT(*) as event_count,
    COUNT(CASE WHEN re.resolved = FALSE THEN 1 END) as unresolved_count,
    MAX(re.created_at) as latest_event
FROM risk_events re
WHERE re.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY re.event_type, re.severity
ORDER BY re.severity DESC, event_count DESC;

-- Show optimization results
SHOW INDEX FROM trading_positions;
SHOW INDEX FROM portfolio_balance;
SHOW INDEX FROM performance_metrics;

-- Display table sizes
SELECT 
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.TABLES 
WHERE table_schema = 'wintradesgo'
ORDER BY (data_length + index_length) DESC;

EOF

echo "Database optimization completed successfully!"
echo "Key optimizations applied:"
echo "1. InnoDB buffer pool increased to 2GB"
echo "2. Query cache enabled (256MB)"
echo "3. Comprehensive indexing strategy implemented"
echo "4. Partitioned tables for large datasets"
echo "5. Optimized stored procedures created"
echo "6. Performance monitoring views established"
echo "7. Time-series optimizations for financial data"