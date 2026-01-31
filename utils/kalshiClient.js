/**
 * Kalshi API Client
 * Handles authentication, market data fetching, and order placement
 */

const KALSHI_API_BASE = 'https://trading-api.kalshi.com/trade-api/v2';
const KALSHI_DEMO_API_BASE = 'https://demo-api.kalshi.co/trade-api/v2';

class KalshiClient {
  constructor(email, password, useDemo = false) {
    this.email = email;
    this.password = password;
    this.baseUrl = useDemo ? KALSHI_DEMO_API_BASE : KALSHI_API_BASE;
    this.token = null;
    this.memberId = null;
    this.tokenExpiry = null;
  }

  /**
   * Login to Kalshi and get authentication token
   */
  async login() {
    try {
      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: this.email,
          password: this.password
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Login failed: ${response.status} - ${error}`);
      }

      const data = await response.json();
      this.token = data.token;
      this.memberId = data.member_id;
      // Token typically expires in 24 hours
      this.tokenExpiry = Date.now() + (23 * 60 * 60 * 1000);

      console.log('[Kalshi] Successfully logged in');
      return data;
    } catch (error) {
      console.error('[Kalshi] Login error:', error.message);
      throw error;
    }
  }

  /**
   * Ensure we have a valid token
   */
  async ensureAuthenticated() {
    if (!this.token || Date.now() > this.tokenExpiry) {
      await this.login();
    }
  }

  /**
   * Make authenticated API request
   */
  async request(endpoint, method = 'GET', body = null) {
    await this.ensureAuthenticated();

    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, options);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API request failed: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Get all events (market categories)
   */
  async getEvents(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = `/events${queryParams ? '?' + queryParams : ''}`;
    return this.request(endpoint);
  }

  /**
   * Get markets for a specific event or all markets
   */
  async getMarkets(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = `/markets${queryParams ? '?' + queryParams : ''}`;
    return this.request(endpoint);
  }

  /**
   * Get specific market by ticker
   */
  async getMarket(ticker) {
    return this.request(`/markets/${ticker}`);
  }

  /**
   * Get Bitcoin-related markets
   */
  async getBitcoinMarkets() {
    try {
      // Search for Bitcoin/BTC related markets
      const allMarkets = await this.getMarkets({
        status: 'open',
        limit: 200
      });

      const btcMarkets = allMarkets.markets.filter(market => {
        const title = (market.title || '').toLowerCase();
        const ticker = (market.ticker || '').toLowerCase();
        const subtitle = (market.subtitle || '').toLowerCase();

        return title.includes('bitcoin') ||
               title.includes('btc') ||
               ticker.includes('btc') ||
               subtitle.includes('bitcoin') ||
               subtitle.includes('btc');
      });

      return btcMarkets;
    } catch (error) {
      console.error('[Kalshi] Error fetching Bitcoin markets:', error.message);
      return [];
    }
  }

  /**
   * Get orderbook for a market
   */
  async getOrderbook(ticker) {
    return this.request(`/markets/${ticker}/orderbook`);
  }

  /**
   * Get market history/trades
   */
  async getMarketTrades(ticker, params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = `/markets/${ticker}/trades${queryParams ? '?' + queryParams : ''}`;
    return this.request(endpoint);
  }

  /**
   * Get account balance
   */
  async getBalance() {
    return this.request('/portfolio/balance');
  }

  /**
   * Get current positions
   */
  async getPositions(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = `/portfolio/positions${queryParams ? '?' + queryParams : ''}`;
    return this.request(endpoint);
  }

  /**
   * Place an order
   * @param {string} ticker - Market ticker
   * @param {string} side - 'yes' or 'no'
   * @param {number} count - Number of contracts
   * @param {number} price - Price in cents (1-99)
   * @param {string} type - 'limit' or 'market'
   */
  async placeOrder(ticker, side, count, price, type = 'limit') {
    const order = {
      ticker,
      action: 'buy',
      side,
      count,
      type
    };

    if (type === 'limit') {
      order.yes_price = side === 'yes' ? price : undefined;
      order.no_price = side === 'no' ? price : undefined;
    }

    return this.request('/portfolio/orders', 'POST', order);
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId) {
    return this.request(`/portfolio/orders/${orderId}`, 'DELETE');
  }

  /**
   * Get open orders
   */
  async getOrders(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = `/portfolio/orders${queryParams ? '?' + queryParams : ''}`;
    return this.request(endpoint);
  }

  /**
   * Parse market data into standardized format
   */
  parseMarket(market) {
    return {
      ticker: market.ticker,
      title: market.title,
      subtitle: market.subtitle,
      status: market.status,
      yesAsk: market.yes_ask / 100, // Convert cents to dollars
      yesBid: market.yes_bid / 100,
      noAsk: market.no_ask / 100,
      noBid: market.no_bid / 100,
      lastPrice: market.last_price / 100,
      volume: market.volume,
      openInterest: market.open_interest,
      closeTime: market.close_time,
      expirationTime: market.expiration_time,
      resultTime: market.result ? market.result_time : null,
      result: market.result,
      // Implied probability from yes price
      impliedProbability: market.yes_ask / 100,
      // Time until expiration
      hoursUntilClose: market.close_time ?
        (new Date(market.close_time) - Date.now()) / (1000 * 60 * 60) : null
    };
  }
}

export default KalshiClient;
