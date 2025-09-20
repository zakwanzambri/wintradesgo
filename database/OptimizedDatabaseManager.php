<?php

/**
 * Database Connection Pool Manager
 * Optimized connection management for high-performance trading operations
 */

class DatabaseConnectionPool {
    
    private static $instance = null;
    private $connections = [];
    private $activeConnections = 0;
    private $maxConnections = 20;
    private $minConnections = 5;
    private $config;
    
    private function __construct() {
        $this->config = [
            'host' => 'localhost',
            'dbname' => 'wintradesgo',
            'username' => 'root',
            'password' => '',
            'charset' => 'utf8mb4',
            'options' => [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => true,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET sql_mode='STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION'",
                PDO::ATTR_PERSISTENT => true
            ]
        ];
        
        $this->initializePool();
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function initializePool() {
        // Create minimum number of connections
        for ($i = 0; $i < $this->minConnections; $i++) {
            $this->connections[] = $this->createConnection();
        }
        $this->activeConnections = $this->minConnections;
    }
    
    private function createConnection() {
        $dsn = "mysql:host={$this->config['host']};dbname={$this->config['dbname']};charset={$this->config['charset']}";
        
        $pdo = new PDO($dsn, $this->config['username'], $this->config['password'], $this->config['options']);
        
        // Set session variables for optimization
        $pdo->exec("SET SESSION sql_mode = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION'");
        $pdo->exec("SET SESSION innodb_lock_wait_timeout = 30");
        $pdo->exec("SET SESSION max_execution_time = 60000");
        
        return $pdo;
    }
    
    public function getConnection() {
        // Return available connection from pool
        if (!empty($this->connections)) {
            return array_pop($this->connections);
        }
        
        // Create new connection if under max limit
        if ($this->activeConnections < $this->maxConnections) {
            $this->activeConnections++;
            return $this->createConnection();
        }
        
        // Wait for connection to become available (simplified)
        usleep(10000); // 10ms wait
        return $this->getConnection();
    }
    
    public function releaseConnection($connection) {
        // Return connection to pool if under max pool size
        if (count($this->connections) < $this->maxConnections) {
            $this->connections[] = $connection;
        } else {
            $this->activeConnections--;
        }
    }
    
    public function getPoolStatus() {
        return [
            'active_connections' => $this->activeConnections,
            'available_connections' => count($this->connections),
            'max_connections' => $this->maxConnections
        ];
    }
}

/**
 * Optimized Database Operations Manager
 * High-performance database operations for trading system
 */

class OptimizedDatabaseManager {
    
    private $connectionPool;
    private $cache;
    private $queryStats = [];
    
    public function __construct() {
        $this->connectionPool = DatabaseConnectionPool::getInstance();
        $this->cache = new DatabaseCache();
    }
    
    /**
     * Execute optimized SELECT query with caching
     */
    public function selectOptimized($query, $params = [], $cacheKey = null, $cacheTTL = 300) {
        // Check cache first
        if ($cacheKey && $this->cache->has($cacheKey)) {
            $this->recordQueryStat($query, 'cache_hit', 0);
            return $this->cache->get($cacheKey);
        }
        
        $startTime = microtime(true);
        $connection = $this->connectionPool->getConnection();
        
        try {
            $stmt = $connection->prepare($query);
            $stmt->execute($params);
            $result = $stmt->fetchAll();
            
            $executionTime = (microtime(true) - $startTime) * 1000;
            $this->recordQueryStat($query, 'executed', $executionTime);
            
            // Cache the result
            if ($cacheKey) {
                $this->cache->set($cacheKey, $result, $cacheTTL);
            }
            
            return $result;
            
        } finally {
            $this->connectionPool->releaseConnection($connection);
        }
    }
    
    /**
     * Execute batch INSERT with transaction optimization
     */
    public function batchInsert($table, $data, $batchSize = 1000) {
        if (empty($data)) return false;
        
        $connection = $this->connectionPool->getConnection();
        $totalInserted = 0;
        
        try {
            $connection->beginTransaction();
            
            $chunks = array_chunk($data, $batchSize);
            
            foreach ($chunks as $chunk) {
                $columns = array_keys($chunk[0]);
                $placeholders = '(' . str_repeat('?,', count($columns) - 1) . '?)';
                $values = str_repeat($placeholders . ',', count($chunk) - 1) . $placeholders;
                
                $query = "INSERT INTO {$table} (" . implode(',', $columns) . ") VALUES {$values}";
                
                $flatData = [];
                foreach ($chunk as $row) {
                    $flatData = array_merge($flatData, array_values($row));
                }
                
                $stmt = $connection->prepare($query);
                $stmt->execute($flatData);
                $totalInserted += $stmt->rowCount();
            }
            
            $connection->commit();
            return $totalInserted;
            
        } catch (Exception $e) {
            $connection->rollBack();
            throw $e;
        } finally {
            $this->connectionPool->releaseConnection($connection);
        }
    }
    
    /**
     * Execute portfolio performance query with optimization
     */
    public function getPortfolioPerformance($days = 30) {
        $cacheKey = "portfolio_performance_{$days}";
        
        $query = "
            SELECT 
                DATE(pb.timestamp) as date,
                pb.total_portfolio_value,
                pb.daily_return,
                pb.unrealized_pnl,
                pb.realized_pnl,
                pm.win_rate,
                pm.sharpe_ratio,
                pm.max_drawdown
            FROM portfolio_balance pb
            LEFT JOIN performance_metrics pm ON DATE(pb.timestamp) = pm.metric_date
            WHERE pb.timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
            ORDER BY pb.timestamp DESC
        ";
        
        return $this->selectOptimized($query, [$days], $cacheKey, 300);
    }
    
    /**
     * Get active positions with real-time pricing
     */
    public function getActivePositions() {
        $query = "
            SELECT 
                tp.id,
                tp.symbol,
                tp.quantity,
                tp.entry_price,
                tp.current_price,
                tp.position_size_usd,
                tp.profit_loss,
                tp.risk_level,
                tp.confidence_score,
                TIMESTAMPDIFF(MINUTE, tp.entry_timestamp, NOW()) as minutes_held,
                ((tp.current_price - tp.entry_price) / tp.entry_price * 100) as unrealized_return_pct,
                mdc.volatility_24h
            FROM trading_positions tp
            LEFT JOIN market_data_cache mdc ON tp.symbol = mdc.symbol 
                AND mdc.timestamp = (
                    SELECT MAX(timestamp) 
                    FROM market_data_cache 
                    WHERE symbol = tp.symbol
                )
            WHERE tp.status = 'OPEN'
            ORDER BY tp.entry_timestamp DESC
        ";
        
        return $this->selectOptimized($query, [], 'active_positions', 30);
    }
    
    /**
     * Get risk assessment data
     */
    public function getRiskAssessmentData() {
        $queries = [
            'portfolio_summary' => "
                SELECT 
                    (SELECT cash_balance FROM portfolio_balance ORDER BY timestamp DESC LIMIT 1) as cash_balance,
                    (SELECT total_portfolio_value FROM portfolio_balance ORDER BY timestamp DESC LIMIT 1) as total_value,
                    COUNT(CASE WHEN tp.status = 'OPEN' THEN 1 END) as open_positions,
                    SUM(CASE WHEN tp.status = 'OPEN' THEN tp.position_size_usd ELSE 0 END) as invested_amount,
                    AVG(CASE WHEN tp.status = 'OPEN' THEN tp.risk_level = 'HIGH' ELSE NULL END) as high_risk_ratio
                FROM trading_positions tp
            ",
            'recent_alerts' => "
                SELECT 
                    event_type,
                    severity,
                    symbol,
                    description,
                    created_at
                FROM risk_events 
                WHERE resolved = FALSE 
                AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
                ORDER BY severity DESC, created_at DESC
                LIMIT 10
            "
        ];
        
        $results = [];
        foreach ($queries as $key => $query) {
            $results[$key] = $this->selectOptimized($query, [], "risk_assessment_{$key}", 60);
        }
        
        return $results;
    }
    
    /**
     * Update position with optimized locking
     */
    public function updatePosition($positionId, $updates) {
        $connection = $this->connectionPool->getConnection();
        
        try {
            $connection->beginTransaction();
            
            // Use SELECT FOR UPDATE for optimistic locking
            $stmt = $connection->prepare("
                SELECT id FROM trading_positions 
                WHERE id = ? 
                FOR UPDATE
            ");
            $stmt->execute([$positionId]);
            
            if (!$stmt->fetch()) {
                throw new Exception("Position not found: {$positionId}");
            }
            
            $setClause = [];
            $values = [];
            
            foreach ($updates as $field => $value) {
                $setClause[] = "{$field} = ?";
                $values[] = $value;
            }
            $values[] = $positionId;
            
            $updateQuery = "UPDATE trading_positions SET " . implode(', ', $setClause) . " WHERE id = ?";
            
            $stmt = $connection->prepare($updateQuery);
            $result = $stmt->execute($values);
            
            $connection->commit();
            
            // Clear relevant caches
            $this->cache->delete('active_positions');
            $this->cache->deletePattern('portfolio_*');
            
            return $result;
            
        } catch (Exception $e) {
            $connection->rollBack();
            throw $e;
        } finally {
            $this->connectionPool->releaseConnection($connection);
        }
    }
    
    /**
     * Record query statistics for monitoring
     */
    private function recordQueryStat($query, $type, $executionTime) {
        $queryHash = md5($query);
        
        if (!isset($this->queryStats[$queryHash])) {
            $this->queryStats[$queryHash] = [
                'query' => substr($query, 0, 100) . '...',
                'executions' => 0,
                'cache_hits' => 0,
                'total_time' => 0,
                'avg_time' => 0
            ];
        }
        
        if ($type === 'executed') {
            $this->queryStats[$queryHash]['executions']++;
            $this->queryStats[$queryHash]['total_time'] += $executionTime;
            $this->queryStats[$queryHash]['avg_time'] = 
                $this->queryStats[$queryHash]['total_time'] / $this->queryStats[$queryHash]['executions'];
        } elseif ($type === 'cache_hit') {
            $this->queryStats[$queryHash]['cache_hits']++;
        }
    }
    
    /**
     * Get performance statistics
     */
    public function getPerformanceStats() {
        return [
            'connection_pool' => $this->connectionPool->getPoolStatus(),
            'cache_stats' => $this->cache->getStats(),
            'query_stats' => array_slice($this->queryStats, 0, 10) // Top 10 queries
        ];
    }
}

/**
 * Simple Redis-like cache implementation for database results
 */
class DatabaseCache {
    
    private $cache = [];
    private $expiry = [];
    private $hits = 0;
    private $misses = 0;
    
    public function set($key, $value, $ttl = 300) {
        $this->cache[$key] = serialize($value);
        $this->expiry[$key] = time() + $ttl;
        return true;
    }
    
    public function get($key) {
        if (!$this->has($key)) {
            $this->misses++;
            return null;
        }
        
        $this->hits++;
        return unserialize($this->cache[$key]);
    }
    
    public function has($key) {
        if (!isset($this->cache[$key])) {
            return false;
        }
        
        if ($this->expiry[$key] < time()) {
            $this->delete($key);
            return false;
        }
        
        return true;
    }
    
    public function delete($key) {
        unset($this->cache[$key], $this->expiry[$key]);
        return true;
    }
    
    public function deletePattern($pattern) {
        $pattern = str_replace('*', '.*', $pattern);
        
        foreach (array_keys($this->cache) as $key) {
            if (preg_match("/{$pattern}/", $key)) {
                $this->delete($key);
            }
        }
    }
    
    public function getStats() {
        $hitRate = ($this->hits + $this->misses) > 0 ? 
            ($this->hits / ($this->hits + $this->misses)) * 100 : 0;
        
        return [
            'hits' => $this->hits,
            'misses' => $this->misses,
            'hit_rate' => round($hitRate, 2) . '%',
            'cached_items' => count($this->cache)
        ];
    }
}

?>