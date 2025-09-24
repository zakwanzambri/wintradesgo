<?php
/**
 * Feature Manager - Controls system functionality based on feature toggles
 * Makes feature toggles actually affect system behavior
 */

class FeatureManager {
    private $configFile;
    private $features;
    private $defaultFeatures;
    
    public function __construct($configFile = 'config/feature_settings.json') {
        $this->configFile = $configFile;
        $this->defaultFeatures = [
            'basic_predictions' => ['enabled' => true, 'usage' => 'high'],
            'advanced_sentiment' => ['enabled' => true, 'usage' => 'medium'],
            'portfolio_optimization' => ['enabled' => true, 'usage' => 'low'],
            'risk_management' => ['enabled' => true, 'usage' => 'high'],
            'smart_alerts' => ['enabled' => false, 'usage' => 'none'],
            'backtesting_pro' => ['enabled' => true, 'usage' => 'medium'],
            'real_time_streaming' => ['enabled' => false, 'usage' => 'none'],
            'auto_trading' => ['enabled' => false, 'usage' => 'none']
        ];
        
        $this->loadFeatures();
    }
    
    /**
     * Load feature settings from config file
     */
    private function loadFeatures() {
        if (file_exists($this->configFile)) {
            $savedFeatures = json_decode(file_get_contents($this->configFile), true);
            $this->features = array_merge($this->defaultFeatures, $savedFeatures ?: []);
        } else {
            $this->features = $this->defaultFeatures;
        }
    }
    
    /**
     * Reload features from disk (for real-time updates)
     */
    public function reloadFeatures() {
        $this->loadFeatures();
    }
    
    /**
     * Check if a feature is enabled
     */
    public function isEnabled($featureKey) {
        return isset($this->features[$featureKey]) && $this->features[$featureKey]['enabled'] === true;
    }
    
    /**
     * Get feature usage level
     */
    public function getUsage($featureKey) {
        return $this->features[$featureKey]['usage'] ?? 'none';
    }
    
    /**
     * Get all features
     */
    public function getAllFeatures() {
        return $this->features;
    }
    
    /**
     * Check if basic ML predictions are enabled
     */
    public function canUseBasicPredictions() {
        return $this->isEnabled('basic_predictions');
    }
    
    /**
     * Check if advanced sentiment analysis is enabled
     */
    public function canUseAdvancedSentiment() {
        return $this->isEnabled('advanced_sentiment');
    }
    
    /**
     * Check if portfolio optimization is enabled
     */
    public function canUsePortfolioOptimization() {
        return $this->isEnabled('portfolio_optimization');
    }
    
    /**
     * Check if risk management is enabled
     */
    public function canUseRiskManagement() {
        return $this->isEnabled('risk_management');
    }
    
    /**
     * Check if smart alerts are enabled
     */
    public function canUseSmartAlerts() {
        return $this->isEnabled('smart_alerts');
    }
    
    /**
     * Check if professional backtesting is enabled
     */
    public function canUseBacktestingPro() {
        return $this->isEnabled('backtesting_pro');
    }
    
    /**
     * Check if real-time streaming is enabled
     */
    public function canUseRealTimeStreaming() {
        return $this->isEnabled('real_time_streaming');
    }
    
    /**
     * Check if auto trading is enabled
     */
    public function canUseAutoTrading() {
        return $this->isEnabled('auto_trading');
    }
    
    /**
     * Execute function only if feature is enabled
     */
    public function executeIfEnabled($featureKey, $callback, $fallback = null) {
        if ($this->isEnabled($featureKey)) {
            return call_user_func($callback);
        } else {
            return $fallback ? call_user_func($fallback) : null;
        }
    }
    
    /**
     * Log feature usage
     */
    public function logFeatureUsage($featureKey) {
        if (!$this->isEnabled($featureKey)) {
            error_log("Feature '{$featureKey}' is disabled but was attempted to be used");
            return false;
        }
        
        error_log("Feature '{$featureKey}' was used successfully");
        return true;
    }
    
    /**
     * Get disabled features message
     */
    public function getDisabledMessage($featureKey) {
        return [
            'success' => false,
            'error' => "Feature '{$featureKey}' is currently disabled. Please enable it in Model Management settings.",
            'feature' => $featureKey,
            'enabled' => false,
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
}
?>