-- WinTrades MySQL Database Schema
-- For local development with XAMPP

-- Create database
CREATE DATABASE IF NOT EXISTS wintradesgo;
USE wintradesgo;

-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    plan_type ENUM('starter', 'pro', 'enterprise') DEFAULT 'starter',
    api_key VARCHAR(64) UNIQUE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_api_key (api_key)
);

-- Portfolio holdings
CREATE TABLE portfolio_holdings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL,
    amount DECIMAL(20,8) NOT NULL DEFAULT 0,
    avg_price DECIMAL(20,8) NOT NULL DEFAULT 0,
    current_price DECIMAL(20,8) DEFAULT 0,
    total_value DECIMAL(20,8) GENERATED ALWAYS AS (amount * current_price) STORED,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_symbol (user_id, symbol),
    INDEX idx_user_id (user_id),
    INDEX idx_symbol (symbol)
);

-- Trade history
CREATE TABLE trades (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    type ENUM('buy', 'sell') NOT NULL,
    amount DECIMAL(20,8) NOT NULL,
    price DECIMAL(20,8) NOT NULL,
    total_value DECIMAL(20,8) NOT NULL,
    fee DECIMAL(20,8) DEFAULT 0,
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'completed',
    notes TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_symbol (symbol),
    INDEX idx_timestamp (timestamp),
    INDEX idx_user_symbol_time (user_id, symbol, timestamp)
);

-- User settings and preferences
CREATE TABLE user_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    theme ENUM('light', 'dark') DEFAULT 'light',
    currency ENUM('USD', 'EUR', 'GBP', 'JPY') DEFAULT 'USD',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    email_alerts BOOLEAN DEFAULT TRUE,
    price_alerts BOOLEAN DEFAULT TRUE,
    news_alerts BOOLEAN DEFAULT TRUE,
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user (user_id)
);

-- Price alerts
CREATE TABLE price_alerts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    alert_type ENUM('above', 'below') NOT NULL,
    target_price DECIMAL(20,8) NOT NULL,
    current_price DECIMAL(20,8) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    triggered_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_symbol (symbol),
    INDEX idx_active (is_active)
);

-- AI signals (for professional+ plans)
CREATE TABLE ai_signals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    symbol VARCHAR(10) NOT NULL,
    signal_type ENUM('BUY', 'SELL', 'HOLD') NOT NULL,
    confidence DECIMAL(5,2) NOT NULL, -- 0.00 to 100.00
    timeframe VARCHAR(10) NOT NULL, -- 1h, 4h, 1d, etc.
    reason TEXT,
    target_price DECIMAL(20,8),
    stop_loss DECIMAL(20,8),
    current_price DECIMAL(20,8) NOT NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_symbol (symbol),
    INDEX idx_created_at (created_at),
    INDEX idx_signal_type (signal_type)
);

-- Market data cache (for performance)
CREATE TABLE market_data (
    id INT PRIMARY KEY AUTO_INCREMENT,
    symbol VARCHAR(10) NOT NULL,
    price DECIMAL(20,8) NOT NULL,
    volume_24h DECIMAL(20,2),
    change_24h DECIMAL(10,4),
    market_cap DECIMAL(20,2),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_symbol (symbol),
    INDEX idx_last_updated (last_updated)
);

-- User sessions (for authentication)
CREATE TABLE user_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    session_token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_token (session_token),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
);

-- Insert sample data for development
INSERT INTO users (email, password_hash, first_name, last_name, plan_type) VALUES
('demo@wintradesgo.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Demo', 'User', 'pro'),
('admin@wintradesgo.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'User', 'enterprise');

-- Sample portfolio data
INSERT INTO portfolio_holdings (user_id, symbol, name, amount, avg_price, current_price) VALUES
(1, 'BTC', 'Bitcoin', 1.2534, 42000.00, 43250.67),
(1, 'ETH', 'Ethereum', 16.789, 2500.00, 2634.89),
(1, 'ADA', 'Cardano', 25432.1, 0.45, 0.523),
(1, 'SOL', 'Solana', 89.45, 95.00, 98.45);

-- Sample trades
INSERT INTO trades (user_id, symbol, type, amount, price, total_value, fee) VALUES
(1, 'BTC', 'buy', 0.5, 42000.00, 21000.00, 21.00),
(1, 'ETH', 'buy', 10.0, 2500.00, 25000.00, 25.00),
(1, 'BTC', 'sell', 0.2, 44000.00, 8800.00, 8.80),
(1, 'ADA', 'buy', 10000.0, 0.45, 4500.00, 4.50);

-- Sample market data
INSERT INTO market_data (symbol, price, volume_24h, change_24h, market_cap) VALUES
('BTC', 43250.67, 28500000000.00, 2.45, 847200000000.00),
('ETH', 2634.89, 12300000000.00, -1.23, 316800000000.00),
('ADA', 0.523, 324000000.00, 4.67, 18500000000.00),
('SOL', 98.45, 456000000.00, -2.11, 42100000000.00);

-- Sample AI signals
INSERT INTO ai_signals (symbol, signal_type, confidence, timeframe, reason, current_price) VALUES
('BTC', 'BUY', 87.50, '4h', 'Bullish divergence detected on RSI with volume confirmation', 43250.67),
('ETH', 'SELL', 72.30, '1h', 'Resistance level reached at $2650 with decreasing volume', 2634.89),
('ADA', 'HOLD', 65.80, '1d', 'Consolidation phase, waiting for breakout direction', 0.523),
('SOL', 'BUY', 79.20, '2h', 'Golden cross formation with increasing institutional interest', 98.45);