# Phase 2: PostgreSQL Cloud Setup Guide

## Cloud Provider Options

### Option A: AWS RDS PostgreSQL (Recommended)

#### 1. Create AWS RDS Instance

```bash
# Using AWS CLI (or use AWS Console)
aws rds create-db-instance \
    --db-instance-identifier wintradesgo-prod \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --engine-version 15.4 \
    --allocated-storage 20 \
    --storage-type gp2 \
    --db-name wintradesgo \
    --master-username wintradesadmin \
    --master-user-password "YourSecurePassword123!" \
    --vpc-security-group-ids sg-xxxxxxxxx \
    --backup-retention-period 7 \
    --multi-az \
    --publicly-accessible \
    --storage-encrypted
```

#### 2. Security Configuration

```yaml
Security Group Rules:
  Inbound:
    - Type: PostgreSQL
      Protocol: TCP
      Port: 5432
      Source: Your IP / Application servers
    
  Outbound:
    - Type: All traffic
      Protocol: All
      Port: All
      Destination: 0.0.0.0/0
```

### Option B: Google Cloud SQL

#### 1. Create Cloud SQL Instance

```bash
# Using gcloud CLI
gcloud sql instances create wintradesgo-prod \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region=us-central1 \
    --storage-size=20GB \
    --storage-type=SSD \
    --backup-start-time=03:00 \
    --enable-bin-log \
    --authorized-networks=0.0.0.0/0
```

#### 2. Create Database and User

```bash
# Create database
gcloud sql databases create wintradesgo --instance=wintradesgo-prod

# Create user
gcloud sql users create wintradesadmin \
    --instance=wintradesgo-prod \
    --password=YourSecurePassword123!
```

### Option C: Azure Database for PostgreSQL

#### 1. Create Azure PostgreSQL

```bash
# Using Azure CLI
az postgres server create \
    --name wintradesgo-prod \
    --resource-group myResourceGroup \
    --location "East US" \
    --admin-user wintradesadmin \
    --admin-password "YourSecurePassword123!" \
    --sku-name B_Gen5_1 \
    --version 11 \
    --storage-size 20480
```

## PostgreSQL Schema Conversion

### 1. Convert MySQL Schema to PostgreSQL

```sql
-- PostgreSQL schema (converted from MySQL)
CREATE DATABASE wintradesgo;
\c wintradesgo;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    plan_type VARCHAR(20) DEFAULT 'starter' CHECK (plan_type IN ('starter', 'pro', 'enterprise')),
    api_key VARCHAR(64) UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_api_key ON users(api_key);

-- Portfolio holdings
CREATE TABLE portfolio_holdings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL,
    amount DECIMAL(20,8) NOT NULL DEFAULT 0,
    avg_price DECIMAL(20,8) NOT NULL DEFAULT 0,
    current_price DECIMAL(20,8) DEFAULT 0,
    total_value DECIMAL(20,8) GENERATED ALWAYS AS (amount * current_price) STORED,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, symbol)
);

-- Create indexes
CREATE INDEX idx_portfolio_user_id ON portfolio_holdings(user_id);
CREATE INDEX idx_portfolio_symbol ON portfolio_holdings(symbol);

-- Trades table
CREATE TABLE trades (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(10) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('buy', 'sell')),
    amount DECIMAL(20,8) NOT NULL,
    price DECIMAL(20,8) NOT NULL,
    total_value DECIMAL(20,8) NOT NULL,
    fee DECIMAL(20,8) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
    notes TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_symbol ON trades(symbol);
CREATE INDEX idx_trades_timestamp ON trades(timestamp);
CREATE INDEX idx_trades_user_symbol_time ON trades(user_id, symbol, timestamp);

-- User settings
CREATE TABLE user_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(10) DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
    currency VARCHAR(3) DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR', 'GBP', 'JPY')),
    notifications_enabled BOOLEAN DEFAULT TRUE,
    email_alerts BOOLEAN DEFAULT TRUE,
    price_alerts BOOLEAN DEFAULT TRUE,
    news_alerts BOOLEAN DEFAULT TRUE,
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Price alerts
CREATE TABLE price_alerts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(10) NOT NULL,
    alert_type VARCHAR(10) NOT NULL CHECK (alert_type IN ('above', 'below')),
    target_price DECIMAL(20,8) NOT NULL,
    current_price DECIMAL(20,8) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    triggered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI signals
CREATE TABLE ai_signals (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL,
    signal_type VARCHAR(10) NOT NULL CHECK (signal_type IN ('BUY', 'SELL', 'HOLD')),
    confidence DECIMAL(5,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    timeframe VARCHAR(10) NOT NULL,
    reason TEXT,
    target_price DECIMAL(20,8),
    stop_loss DECIMAL(20,8),
    current_price DECIMAL(20,8) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Market data cache
CREATE TABLE market_data (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL UNIQUE,
    price DECIMAL(20,8) NOT NULL,
    volume_24h DECIMAL(20,2),
    change_24h DECIMAL(10,4),
    market_cap DECIMAL(20,2),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User sessions
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON user_sessions(expires_at);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to users table
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to user_settings table
CREATE TRIGGER update_user_settings_updated_at 
    BEFORE UPDATE ON user_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

### 2. Connection Configuration for PostgreSQL

```php
<?php
// api/config/database_postgres.php

class PostgreSQLDatabase {
    private $host;
    private $database_name;
    private $username;
    private $password;
    private $port;
    
    public $conn;
    
    public function __construct() {
        // Load from environment or config
        $this->host = $_ENV['DB_HOST'] ?? 'your-postgres-host.region.rds.amazonaws.com';
        $this->database_name = $_ENV['DB_NAME'] ?? 'wintradesgo';
        $this->username = $_ENV['DB_USER'] ?? 'wintradesadmin';
        $this->password = $_ENV['DB_PASS'] ?? 'YourSecurePassword123!';
        $this->port = $_ENV['DB_PORT'] ?? '5432';
    }
    
    public function getConnection() {
        $this->conn = null;
        
        try {
            $dsn = "pgsql:host={$this->host};port={$this->port};dbname={$this->database_name}";
            
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            
            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
            
        } catch(PDOException $exception) {
            throw new Exception('PostgreSQL connection failed: ' . $exception->getMessage());
        }
        
        return $this->conn;
    }
    
    public function testConnection() {
        try {
            $conn = $this->getConnection();
            $stmt = $conn->query("SELECT version()");
            $version = $stmt->fetchColumn();
            
            return [
                'success' => true,
                'message' => 'PostgreSQL connection successful',
                'version' => $version
            ];
        } catch(Exception $e) {
            return [
                'success' => false,
                'message' => 'PostgreSQL connection failed: ' . $e->getMessage()
            ];
        }
    }
}
?>
```

## Environment Configuration

### 1. Create .env file

```env
# Environment
ENVIRONMENT=production

# Database Configuration
DB_TYPE=postgresql
DB_HOST=your-postgres-host.region.rds.amazonaws.com
DB_PORT=5432
DB_NAME=wintradesgo
DB_USER=wintradesadmin
DB_PASS=YourSecurePassword123!

# Security
JWT_SECRET=your-super-secure-jwt-secret-key-here
ENCRYPTION_KEY=your-encryption-key-here

# API Configuration
API_BASE_URL=https://yourdomain.com/api
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# External APIs
COINAPI_KEY=your-coinapi-key
COINGECKO_API_KEY=your-coingecko-key

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-email-password

# Cache Configuration
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

### 2. Load Environment Variables

```php
<?php
// api/config/env.php

class Env {
    public static function load($file = '.env') {
        if (!file_exists($file)) {
            return;
        }
        
        $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0) {
                continue;
            }
            
            list($name, $value) = explode('=', $line, 2);
            $name = trim($name);
            $value = trim($value);
            
            if (!array_key_exists($name, $_SERVER) && !array_key_exists($name, $_ENV)) {
                putenv(sprintf('%s=%s', $name, $value));
                $_ENV[$name] = $value;
                $_SERVER[$name] = $value;
            }
        }
    }
}

// Load environment variables
Env::load(__DIR__ . '/../../.env');
?>
```

## Testing Cloud Setup

### 1. Test Connection Script

```php
<?php
// test-postgres.php
require_once 'api/config/env.php';
require_once 'api/config/database_postgres.php';

try {
    $db = new PostgreSQLDatabase();
    $result = $db->testConnection();
    
    if ($result['success']) {
        echo "✅ PostgreSQL connection successful!\n";
        echo "Version: " . $result['version'] . "\n";
        
        // Test basic operations
        $conn = $db->getConnection();
        
        // Test creating a user
        $stmt = $conn->prepare("SELECT COUNT(*) FROM users");
        $stmt->execute();
        $userCount = $stmt->fetchColumn();
        
        echo "✅ Users table accessible. Current count: $userCount\n";
        
    } else {
        echo "❌ Connection failed: " . $result['message'] . "\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
```

### 2. Run Migration Test

```bash
# Test the setup
php test-postgres.php

# If successful, you should see:
# ✅ PostgreSQL connection successful!
# Version: PostgreSQL 15.4 on x86_64-pc-linux-gnu...
# ✅ Users table accessible. Current count: 0
```

## Next Steps

1. **Set up your chosen cloud provider**
2. **Create the PostgreSQL instance**
3. **Run the schema creation script**
4. **Test the connection**
5. **Update your API configuration**
6. **Ready for Phase 3: Migration**

## Cost Estimates

### AWS RDS PostgreSQL
- **db.t3.micro**: ~$15-20/month
- **db.t3.small**: ~$30-40/month
- **db.t3.medium**: ~$60-80/month

### Google Cloud SQL
- **db-f1-micro**: ~$10-15/month
- **db-g1-small**: ~$25-35/month
- **db-n1-standard-1**: ~$50-70/month

### Azure PostgreSQL
- **Basic B1**: ~$15-25/month
- **General Purpose GP_Gen5_1**: ~$30-45/month
- **General Purpose GP_Gen5_2**: ~$60-85/month

Choose based on your expected traffic and performance needs!