// Test script to verify Binance API fallback system
// This tests the REST API when WebSocket is unavailable

console.log('🔬 Testing Binance REST API Fallback...');

async function testBinanceRestAPI() {
    console.log('📡 Testing Binance REST API endpoints...');
    
    const symbols = ['BTCUSDT', 'ETHUSDT', 'ADAUSDT'];
    
    try {
        console.log('⏳ Fetching prices from Binance REST API...');
        
        const requests = symbols.map(symbol => 
            fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`, {
                headers: { 'Accept': 'application/json' }
            })
        );
        
        const responses = await Promise.all(requests);
        console.log('✅ All requests completed');
        
        // Check if all responses are OK
        responses.forEach((response, index) => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status} for ${symbols[index]}: ${response.statusText}`);
            }
            console.log(`✅ ${symbols[index]}: ${response.status} ${response.statusText}`);
        });
        
        const dataArray = await Promise.all(responses.map(r => r.json()));
        console.log('📊 Raw Binance API Response:', dataArray);
        
        // Parse Binance response format
        const prices = {
            BTC: parseFloat(dataArray[0]?.price) || null,
            ETH: parseFloat(dataArray[1]?.price) || null,
            ADA: parseFloat(dataArray[2]?.price) || null
        };
        
        console.log('💰 Parsed Prices:', prices);
        
        // Validate prices
        if (!prices.BTC || !prices.ETH || !prices.ADA) {
            throw new Error('Incomplete price data from Binance');
        }
        
        console.log('✅ REST API Fallback Test PASSED!');
        return prices;
        
    } catch (error) {
        console.error('❌ REST API Fallback Test FAILED:', error.message);
        return null;
    }
}

// Run the test
testBinanceRestAPI();