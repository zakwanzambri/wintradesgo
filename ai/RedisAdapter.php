<?php

/**
 * Redis Adapter for WinTrades Trading System
 * Provides Redis-like functionality with fallback to file-based cache
 */

class RedisAdapter {
    
    private $redis = null;
    private $useRedis = false;
    private $cacheDir;
    private $cache = [];
    
    public function __construct() {
        $this->cacheDir = __DIR__ . '/../cache/';
        
        // Create cache directory if it doesn't exist
        if (!is_dir($this->cacheDir)) {
            mkdir($this->cacheDir, 0755, true);
        }
        
        // Try to connect to Redis
        if (class_exists('Redis')) {
            try {
                $this->redis = new Redis();
                $this->redis->connect('127.0.0.1', 6379);
                $this->redis->ping();
                $this->useRedis = true;
                error_log("Redis connection established successfully");
            } catch (Exception $e) {
                error_log("Redis connection failed: " . $e->getMessage() . ". Using file cache fallback.");
                $this->useRedis = false;
            }
        } else {
            error_log("Redis extension not installed. Using file cache fallback.");
            $this->useRedis = false;
        }
    }
    
    /**
     * Set a value with optional expiration
     */
    public function set($key, $value, $ttl = null) {
        if ($this->useRedis) {
            if ($ttl) {
                return $this->redis->setex($key, $ttl, $value);
            }
            return $this->redis->set($key, $value);
        }
        
        // File-based fallback
        $this->cache[$key] = [
            'value' => $value,
            'expires' => $ttl ? time() + $ttl : null
        ];
        
        $cacheFile = $this->cacheDir . md5($key) . '.cache';
        file_put_contents($cacheFile, serialize($this->cache[$key]));
        
        return true;
    }
    
    /**
     * Get a value by key
     */
    public function get($key) {
        if ($this->useRedis) {
            return $this->redis->get($key);
        }
        
        // Check memory cache first
        if (isset($this->cache[$key])) {
            $item = $this->cache[$key];
            if ($item['expires'] === null || $item['expires'] > time()) {
                return $item['value'];
            }
            unset($this->cache[$key]);
        }
        
        // Check file cache
        $cacheFile = $this->cacheDir . md5($key) . '.cache';
        if (file_exists($cacheFile)) {
            $item = unserialize(file_get_contents($cacheFile));
            if ($item['expires'] === null || $item['expires'] > time()) {
                $this->cache[$key] = $item;
                return $item['value'];
            }
            unlink($cacheFile);
        }
        
        return false;
    }
    
    /**
     * Check if key exists
     */
    public function exists($key) {
        if ($this->useRedis) {
            return $this->redis->exists($key);
        }
        
        return $this->get($key) !== false;
    }
    
    /**
     * Delete a key
     */
    public function del($key) {
        if ($this->useRedis) {
            return $this->redis->del($key);
        }
        
        unset($this->cache[$key]);
        $cacheFile = $this->cacheDir . md5($key) . '.cache';
        if (file_exists($cacheFile)) {
            unlink($cacheFile);
        }
        
        return true;
    }
    
    /**
     * Set expiration time for a key
     */
    public function expire($key, $ttl) {
        if ($this->useRedis) {
            return $this->redis->expire($key, $ttl);
        }
        
        $value = $this->get($key);
        if ($value !== false) {
            return $this->set($key, $value, $ttl);
        }
        
        return false;
    }
    
    /**
     * Increment a numeric value
     */
    public function incr($key) {
        if ($this->useRedis) {
            return $this->redis->incr($key);
        }
        
        $value = $this->get($key);
        $newValue = ($value === false) ? 1 : intval($value) + 1;
        $this->set($key, $newValue);
        
        return $newValue;
    }
    
    /**
     * Add to a list (left push)
     */
    public function lpush($key, $value) {
        if ($this->useRedis) {
            return $this->redis->lpush($key, $value);
        }
        
        $list = $this->get($key);
        if ($list === false) {
            $list = [];
        } elseif (!is_array($list)) {
            $list = [$list];
        }
        
        array_unshift($list, $value);
        $this->set($key, $list);
        
        return count($list);
    }
    
    /**
     * Get list range
     */
    public function lrange($key, $start, $stop) {
        if ($this->useRedis) {
            return $this->redis->lrange($key, $start, $stop);
        }
        
        $list = $this->get($key);
        if ($list === false || !is_array($list)) {
            return [];
        }
        
        return array_slice($list, $start, $stop - $start + 1);
    }
    
    /**
     * Hash set
     */
    public function hset($key, $field, $value) {
        if ($this->useRedis) {
            return $this->redis->hset($key, $field, $value);
        }
        
        $hash = $this->get($key);
        if ($hash === false || !is_array($hash)) {
            $hash = [];
        }
        
        $hash[$field] = $value;
        $this->set($key, $hash);
        
        return 1;
    }
    
    /**
     * Hash get
     */
    public function hget($key, $field) {
        if ($this->useRedis) {
            return $this->redis->hget($key, $field);
        }
        
        $hash = $this->get($key);
        if ($hash === false || !is_array($hash)) {
            return false;
        }
        
        return isset($hash[$field]) ? $hash[$field] : false;
    }
    
    /**
     * Get all hash values
     */
    public function hgetall($key) {
        if ($this->useRedis) {
            return $this->redis->hgetall($key);
        }
        
        $hash = $this->get($key);
        if ($hash === false || !is_array($hash)) {
            return [];
        }
        
        return $hash;
    }
    
    /**
     * Ping to test connection
     */
    public function ping() {
        if ($this->useRedis) {
            try {
                return $this->redis->ping();
            } catch (Exception $e) {
                return false;
            }
        }
        
        return 'PONG'; // Simulate Redis response
    }
    
    /**
     * Flush all data
     */
    public function flushall() {
        if ($this->useRedis) {
            return $this->redis->flushall();
        }
        
        $this->cache = [];
        
        // Clear cache files
        $files = glob($this->cacheDir . '*.cache');
        foreach ($files as $file) {
            unlink($file);
        }
        
        return true;
    }
    
    /**
     * Get cache statistics
     */
    public function getStats() {
        if ($this->useRedis) {
            try {
                return [
                    'redis_connected' => true,
                    'memory_usage' => $this->redis->info('memory')['used_memory_human'] ?? 'unknown',
                    'connections' => $this->redis->info('clients')['connected_clients'] ?? 0
                ];
            } catch (Exception $e) {
                return ['redis_connected' => false, 'error' => $e->getMessage()];
            }
        }
        
        $cacheFiles = glob($this->cacheDir . '*.cache');
        $totalSize = 0;
        
        foreach ($cacheFiles as $file) {
            $totalSize += filesize($file);
        }
        
        return [
            'redis_connected' => false,
            'cache_type' => 'file_based',
            'cache_files' => count($cacheFiles),
            'cache_size' => round($totalSize / 1024, 2) . ' KB',
            'memory_items' => count($this->cache)
        ];
    }
    
    /**
     * Get connection status
     */
    public function isConnected() {
        return $this->useRedis;
    }
    
    /**
     * Clean expired cache files
     */
    public function cleanExpiredCache() {
        if ($this->useRedis) {
            return true; // Redis handles this automatically
        }
        
        $files = glob($this->cacheDir . '*.cache');
        $cleaned = 0;
        
        foreach ($files as $file) {
            $item = unserialize(file_get_contents($file));
            if ($item['expires'] && $item['expires'] < time()) {
                unlink($file);
                $cleaned++;
            }
        }
        
        return $cleaned;
    }
}

?>