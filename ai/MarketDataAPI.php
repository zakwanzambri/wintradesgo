<?php
/**
 * Live Market Data Integration
 * Fetches real-time cryptocurrency prices and historical data
 */

class MarketDataAPI {
    private $baseUrl = 'https://api.coingecko.com/api/v3';
    
    public function getCurrentPrices($symbols = ['bitcoin', 'ethereum', 'cardano', 'solana']) {
        $symbolsStr = implode(',', $symbols);
        $url = "{$this->baseUrl}/simple/price?ids={$symbolsStr}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true";
        
        $response = $this->makeRequest($url);
        return $response ? $this->formatPriceData($response) : false;
    }
    
    public function getHistoricalData($coinId, $days = 30) {
        $url = "{$this->baseUrl}/coins/{$coinId}/market_chart?vs_currency=usd&days={$days}&interval=daily";
        
        $response = $this->makeRequest($url);
        return $response ? $this->formatHistoricalData($response) : false;
    }
    
    public function getMarketData($coinId) {
        $url = "{$this->baseUrl}/coins/{$coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false";
        
        $response = $this->makeRequest($url);
        return $response ? $this->formatMarketData($response) : false;
    }
    
    private function makeRequest($url) {
        $context = stream_context_create([
            'http' => [
                'timeout' => 10,
                'user_agent' => 'WinTrades AI Trading System/1.0'
            ]
        ]);
        
        $response = @file_get_contents($url, false, $context);
        return $response ? json_decode($response, true) : false;
    }
    
    private function formatPriceData($data) {
        $formatted = [];
        
        foreach ($data as $coin => $details) {
            $formatted[] = [
                'symbol' => $this->coinIdToSymbol($coin),
                'name' => ucfirst($coin),
                'price' => $details['usd'],
                'change_24h' => $details['usd_24h_change'] ?? 0,
                'market_cap' => $details['usd_market_cap'] ?? 0,
                'volume_24h' => $details['usd_24h_vol'] ?? 0,
                'timestamp' => time()
            ];
        }
        
        return $formatted;
    }
    
    private function formatHistoricalData($data) {
        $prices = [];
        
        if (isset($data['prices'])) {
            foreach ($data['prices'] as $point) {
                $prices[] = [
                    'timestamp' => $point[0] / 1000, // Convert to seconds
                    'price' => $point[1],
                    'date' => date('Y-m-d H:i:s', $point[0] / 1000)
                ];
            }
        }
        
        return $prices;
    }
    
    private function formatMarketData($data) {
        if (!isset($data['market_data'])) return false;
        
        $market = $data['market_data'];
        
        return [
            'symbol' => strtoupper($data['symbol']),
            'name' => $data['name'],
            'current_price' => $market['current_price']['usd'] ?? 0,
            'market_cap' => $market['market_cap']['usd'] ?? 0,
            'total_volume' => $market['total_volume']['usd'] ?? 0,
            'price_change_24h' => $market['price_change_24h'] ?? 0,
            'price_change_percentage_24h' => $market['price_change_percentage_24h'] ?? 0,
            'market_cap_rank' => $market['market_cap_rank'] ?? 0,
            'circulating_supply' => $market['circulating_supply'] ?? 0,
            'total_supply' => $market['total_supply'] ?? 0,
            'ath' => $market['ath']['usd'] ?? 0,
            'atl' => $market['atl']['usd'] ?? 0,
            'last_updated' => $market['last_updated'] ?? date('Y-m-d H:i:s')
        ];
    }
    
    private function coinIdToSymbol($coinId) {
        $mapping = [
            'bitcoin' => 'BTC',
            'ethereum' => 'ETH', 
            'cardano' => 'ADA',
            'solana' => 'SOL',
            'binancecoin' => 'BNB',
            'ripple' => 'XRP',
            'polkadot' => 'DOT',
            'chainlink' => 'LINK'
        ];
        
        return $mapping[$coinId] ?? strtoupper($coinId);
    }
    
    public function updateMarketDataTable($database) {
        $prices = $this->getCurrentPrices();
        
        if (!$prices) {
            return false;
        }
        
        $pdo = $database->getConnection();
        
        foreach ($prices as $coin) {
            $stmt = $pdo->prepare("
                INSERT INTO market_data (symbol, name, price, change_24h, market_cap, volume_24h, last_updated)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE
                    price = VALUES(price),
                    change_24h = VALUES(change_24h),
                    market_cap = VALUES(market_cap),
                    volume_24h = VALUES(volume_24h),
                    last_updated = NOW()
            ");
            
            $stmt->execute([
                $coin['symbol'],
                $coin['name'],
                $coin['price'],
                $coin['change_24h'],
                $coin['market_cap'],
                $coin['volume_24h']
            ]);
        }
        
        return true;
    }
}
?>