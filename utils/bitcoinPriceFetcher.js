/**
 * Bitcoin Price Fetcher
 * Fetches real-time and historical Bitcoin price data from multiple sources
 */

// Free APIs for Bitcoin price data
const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const BINANCE_API = 'https://api.binance.com/api/v3';
const COINBASE_API = 'https://api.coinbase.com/v2';

class BitcoinPriceFetcher {
  constructor() {
    this.cache = {
      price: null,
      priceTimestamp: 0,
      history: null,
      historyTimestamp: 0
    };
    this.cacheDuration = 10000; // 10 seconds for price
    this.historyCacheDuration = 60000; // 1 minute for history
  }

  /**
   * Get current Bitcoin price from multiple sources
   */
  async getCurrentPrice() {
    // Check cache
    if (this.cache.price && Date.now() - this.cache.priceTimestamp < this.cacheDuration) {
      return this.cache.price;
    }

    const sources = [
      this.getBinancePrice(),
      this.getCoinGeckoPrice(),
      this.getCoinbasePrice()
    ];

    try {
      // Use Promise.allSettled to get all results even if some fail
      const results = await Promise.allSettled(sources);
      const prices = results
        .filter(r => r.status === 'fulfilled' && r.value)
        .map(r => r.value);

      if (prices.length === 0) {
        throw new Error('Unable to fetch Bitcoin price from any source');
      }

      // Return median price for reliability
      prices.sort((a, b) => a - b);
      const medianPrice = prices[Math.floor(prices.length / 2)];

      this.cache.price = medianPrice;
      this.cache.priceTimestamp = Date.now();

      return medianPrice;
    } catch (error) {
      console.error('[Price] Error fetching current price:', error.message);
      throw error;
    }
  }

  /**
   * Get price from Binance
   */
  async getBinancePrice() {
    try {
      const response = await fetch(`${BINANCE_API}/ticker/price?symbol=BTCUSDT`);
      if (!response.ok) throw new Error('Binance API error');
      const data = await response.json();
      return parseFloat(data.price);
    } catch (error) {
      console.warn('[Price] Binance fetch failed:', error.message);
      return null;
    }
  }

  /**
   * Get price from CoinGecko
   */
  async getCoinGeckoPrice() {
    try {
      const response = await fetch(
        `${COINGECKO_API}/simple/price?ids=bitcoin&vs_currencies=usd`
      );
      if (!response.ok) throw new Error('CoinGecko API error');
      const data = await response.json();
      return data.bitcoin.usd;
    } catch (error) {
      console.warn('[Price] CoinGecko fetch failed:', error.message);
      return null;
    }
  }

  /**
   * Get price from Coinbase
   */
  async getCoinbasePrice() {
    try {
      const response = await fetch(`${COINBASE_API}/prices/BTC-USD/spot`);
      if (!response.ok) throw new Error('Coinbase API error');
      const data = await response.json();
      return parseFloat(data.data.amount);
    } catch (error) {
      console.warn('[Price] Coinbase fetch failed:', error.message);
      return null;
    }
  }

  /**
   * Get historical OHLCV data from Binance
   * @param {string} interval - Kline interval (1m, 5m, 15m, 1h, 4h, 1d)
   * @param {number} limit - Number of candles (max 1000)
   */
  async getHistoricalData(interval = '1h', limit = 100) {
    const cacheKey = `${interval}_${limit}`;

    // Check cache
    if (
      this.cache.history &&
      this.cache.historyKey === cacheKey &&
      Date.now() - this.cache.historyTimestamp < this.historyCacheDuration
    ) {
      return this.cache.history;
    }

    try {
      const response = await fetch(
        `${BINANCE_API}/klines?symbol=BTCUSDT&interval=${interval}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(`Binance klines API error: ${response.status}`);
      }

      const data = await response.json();

      // Parse Binance kline format:
      // [openTime, open, high, low, close, volume, closeTime, quoteVolume, trades, ...]
      const candles = data.map(candle => ({
        timestamp: candle[0],
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5]),
        closeTime: candle[6],
        quoteVolume: parseFloat(candle[7]),
        trades: candle[8]
      }));

      this.cache.history = candles;
      this.cache.historyKey = cacheKey;
      this.cache.historyTimestamp = Date.now();

      return candles;
    } catch (error) {
      console.error('[Price] Error fetching historical data:', error.message);
      throw error;
    }
  }

  /**
   * Get 24-hour price change statistics
   */
  async get24hStats() {
    try {
      const response = await fetch(`${BINANCE_API}/ticker/24hr?symbol=BTCUSDT`);
      if (!response.ok) throw new Error('Binance 24hr stats API error');
      const data = await response.json();

      return {
        priceChange: parseFloat(data.priceChange),
        priceChangePercent: parseFloat(data.priceChangePercent),
        highPrice: parseFloat(data.highPrice),
        lowPrice: parseFloat(data.lowPrice),
        volume: parseFloat(data.volume),
        quoteVolume: parseFloat(data.quoteVolume),
        openPrice: parseFloat(data.openPrice),
        lastPrice: parseFloat(data.lastPrice),
        weightedAvgPrice: parseFloat(data.weightedAvgPrice)
      };
    } catch (error) {
      console.error('[Price] Error fetching 24h stats:', error.message);
      throw error;
    }
  }

  /**
   * Get multiple timeframe data for comprehensive analysis
   */
  async getMultiTimeframeData() {
    try {
      const [h1, h4, d1, m15] = await Promise.all([
        this.getHistoricalData('1h', 100),
        this.getHistoricalData('4h', 50),
        this.getHistoricalData('1d', 30),
        this.getHistoricalData('15m', 96) // Last 24 hours of 15m candles
      ]);

      return {
        m15,
        h1,
        h4,
        d1
      };
    } catch (error) {
      console.error('[Price] Error fetching multi-timeframe data:', error.message);
      throw error;
    }
  }

  /**
   * Extract closing prices from candle data
   */
  getClosePrices(candles) {
    return candles.map(c => c.close);
  }

  /**
   * Extract high prices from candle data
   */
  getHighPrices(candles) {
    return candles.map(c => c.high);
  }

  /**
   * Extract low prices from candle data
   */
  getLowPrices(candles) {
    return candles.map(c => c.low);
  }

  /**
   * Extract volumes from candle data
   */
  getVolumes(candles) {
    return candles.map(c => c.volume);
  }
}

export default BitcoinPriceFetcher;
