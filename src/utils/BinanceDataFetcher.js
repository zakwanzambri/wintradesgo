/**
 * BINANCE DATA FETCHER
 * Fetches real historical data for technical analysis
 */

export class BinanceDataFetcher {
  constructor() {
    this.baseUrl = 'https://api.binance.com/api/v3';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
  }

  // Get cache key
  getCacheKey(symbol, interval, limit) {
    return `${symbol}_${interval}_${limit}`;
  }

  // Check if cache is valid
  isCacheValid(cacheEntry) {
    return cacheEntry && (Date.now() - cacheEntry.timestamp) < this.cacheTimeout;
  }

  // Fetch kline/candlestick data from Binance
  async fetchKlineData(symbol, interval = '1h', limit = 100) {
    const cacheKey = this.getCacheKey(symbol, interval, limit);
    const cached = this.cache.get(cacheKey);

    if (this.isCacheValid(cached)) {
      console.log(`📊 Using cached data for ${symbol} ${interval}`);
      return cached.data;
    }

    try {
      console.log(`🔄 Fetching fresh kline data for ${symbol} ${interval}...`);
      
      const url = `${this.baseUrl}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const rawData = await response.json();
      
      // Process kline data
      const processedData = rawData.map(kline => ({
        timestamp: new Date(kline[0]), // Open time
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5]),
        closeTime: new Date(kline[6]),
        quoteVolume: parseFloat(kline[7]),
        tradesCount: parseInt(kline[8])
      }));

      // Cache the result
      this.cache.set(cacheKey, {
        data: processedData,
        timestamp: Date.now()
      });

      console.log(`✅ Fetched ${processedData.length} klines for ${symbol}`);
      return processedData;

    } catch (error) {
      console.error(`❌ Error fetching kline data for ${symbol}:`, error.message);
      
      // Return empty array if fetch fails
      return [];
    }
  }

  // Get price arrays for technical analysis
  async getPriceArrays(symbol, interval = '1h', limit = 100) {
    const klineData = await this.fetchKlineData(symbol, interval, limit);
    
    if (klineData.length === 0) {
      return null;
    }

    return {
      opens: klineData.map(k => k.open),
      highs: klineData.map(k => k.high),
      lows: klineData.map(k => k.low),
      closes: klineData.map(k => k.close),
      volumes: klineData.map(k => k.volume),
      timestamps: klineData.map(k => k.timestamp),
      raw: klineData
    };
  }

  // Get 24hr ticker statistics
  async get24hrStats(symbol) {
    try {
      const url = `${this.baseUrl}/ticker/24hr?symbol=${symbol}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        symbol: data.symbol,
        priceChange: parseFloat(data.priceChange),
        priceChangePercent: parseFloat(data.priceChangePercent),
        weightedAvgPrice: parseFloat(data.weightedAvgPrice),
        prevClosePrice: parseFloat(data.prevClosePrice),
        lastPrice: parseFloat(data.lastPrice),
        lastQty: parseFloat(data.lastQty),
        bidPrice: parseFloat(data.bidPrice),
        askPrice: parseFloat(data.askPrice),
        openPrice: parseFloat(data.openPrice),
        highPrice: parseFloat(data.highPrice),
        lowPrice: parseFloat(data.lowPrice),
        volume: parseFloat(data.volume),
        quoteVolume: parseFloat(data.quoteVolume),
        openTime: new Date(data.openTime),
        closeTime: new Date(data.closeTime),
        count: parseInt(data.count)
      };
    } catch (error) {
      console.error(`❌ Error fetching 24hr stats for ${symbol}:`, error.message);
      return null;
    }
  }

  // Get order book data
  async getOrderBook(symbol, limit = 100) {
    try {
      const url = `${this.baseUrl}/depth?symbol=${symbol}&limit=${limit}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        lastUpdateId: data.lastUpdateId,
        bids: data.bids.map(bid => ({
          price: parseFloat(bid[0]),
          quantity: parseFloat(bid[1])
        })),
        asks: data.asks.map(ask => ({
          price: parseFloat(ask[0]),
          quantity: parseFloat(ask[1])
        }))
      };
    } catch (error) {
      console.error(`❌ Error fetching order book for ${symbol}:`, error.message);
      return null;
    }
  }

  // Get recent trades
  async getRecentTrades(symbol, limit = 100) {
    try {
      const url = `${this.baseUrl}/trades?symbol=${symbol}&limit=${limit}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return data.map(trade => ({
        id: trade.id,
        price: parseFloat(trade.price),
        qty: parseFloat(trade.qty),
        quoteQty: parseFloat(trade.quoteQty),
        time: new Date(trade.time),
        isBuyerMaker: trade.isBuyerMaker
      }));
    } catch (error) {
      console.error(`❌ Error fetching recent trades for ${symbol}:`, error.message);
      return [];
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Cache cleared');
  }

  // Get cache info
  getCacheInfo() {
    const entries = Array.from(this.cache.entries()).map(([key, value]) => ({
      key,
      age: Date.now() - value.timestamp,
      dataPoints: value.data.length
    }));

    return {
      totalEntries: this.cache.size,
      entries
    };
  }

  // Validate symbol format
  validateSymbol(symbol) {
    // Binance symbols are typically like BTCUSDT, ETHUSDT
    const symbolRegex = /^[A-Z]{3,10}USDT?$/;
    return symbolRegex.test(symbol.toUpperCase());
  }

  // Get multiple symbols data in parallel
  async getMultipleSymbolsData(symbols, interval = '1h', limit = 100) {
    const validSymbols = symbols.filter(symbol => this.validateSymbol(symbol));
    
    if (validSymbols.length === 0) {
      console.warn('⚠️ No valid symbols provided');
      return {};
    }

    console.log(`📊 Fetching data for ${validSymbols.length} symbols...`);
    
    const promises = validSymbols.map(async (symbol) => {
      try {
        const data = await this.getPriceArrays(symbol, interval, limit);
        return { symbol, data, success: true };
      } catch (error) {
        console.error(`❌ Failed to fetch data for ${symbol}:`, error.message);
        return { symbol, data: null, success: false, error: error.message };
      }
    });

    const results = await Promise.all(promises);
    
    const symbolData = {};
    results.forEach(result => {
      symbolData[result.symbol] = result.data;
    });

    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Successfully fetched data for ${successCount}/${validSymbols.length} symbols`);

    return symbolData;
  }

  // Get market overview data
  async getMarketOverview(symbols = ['BTCUSDT', 'ETHUSDT', 'ADAUSDT']) {
    try {
      const promises = symbols.map(symbol => this.get24hrStats(symbol));
      const stats = await Promise.all(promises);
      
      return stats.filter(stat => stat !== null);
    } catch (error) {
      console.error('❌ Error fetching market overview:', error.message);
      return [];
    }
  }
}

export default BinanceDataFetcher;