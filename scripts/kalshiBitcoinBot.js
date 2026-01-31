/**
 * Kalshi Bitcoin Prediction Bot
 * Scans Kalshi for Bitcoin markets, analyzes price data, and recommends trades
 */

import 'dotenv/config';
import KalshiClient from '../utils/kalshiClient.js';
import BitcoinPriceFetcher from '../utils/bitcoinPriceFetcher.js';
import SignalGenerator from '../utils/signalGenerator.js';

// Configuration
const CONFIG = {
  // Scanning interval in milliseconds
  scanInterval: parseInt(process.env.SCAN_INTERVAL) || 60000, // 1 minute default

  // Minimum confidence to display trade recommendation
  minConfidence: parseInt(process.env.MIN_CONFIDENCE) || 40,

  // Use Kalshi demo API for testing
  useKalshiDemo: process.env.KALSHI_USE_DEMO === 'true',

  // Analysis timeframes
  primaryTimeframe: process.env.PRIMARY_TIMEFRAME || '1h',

  // Auto-trading settings (disabled by default)
  autoTrade: process.env.AUTO_TRADE === 'true',
  maxPositionSize: parseInt(process.env.MAX_POSITION_SIZE) || 10, // Max contracts per trade
  maxDailyLoss: parseInt(process.env.MAX_DAILY_LOSS) || 100 // Max daily loss in dollars
};

class KalshiBitcoinBot {
  constructor() {
    this.kalshi = null;
    this.priceFetcher = new BitcoinPriceFetcher();
    this.signalGenerator = new SignalGenerator();
    this.isRunning = false;
    this.lastAnalysis = null;
    this.tradingStats = {
      totalTrades: 0,
      dailyPnL: 0,
      lastTradeTime: null
    };
  }

  /**
   * Initialize the bot
   */
  async initialize() {
    console.log('\n========================================');
    console.log('  KALSHI BITCOIN PREDICTION BOT');
    console.log('========================================\n');

    // Initialize Kalshi client if credentials provided
    if (process.env.KALSHI_EMAIL && process.env.KALSHI_PASSWORD) {
      this.kalshi = new KalshiClient(
        process.env.KALSHI_EMAIL,
        process.env.KALSHI_PASSWORD,
        CONFIG.useKalshiDemo
      );

      try {
        await this.kalshi.login();
        console.log('[Bot] Connected to Kalshi API');

        const balance = await this.kalshi.getBalance();
        console.log(`[Bot] Account balance: $${(balance.balance / 100).toFixed(2)}`);
      } catch (error) {
        console.warn('[Bot] Could not connect to Kalshi:', error.message);
        console.log('[Bot] Running in analysis-only mode');
        this.kalshi = null;
      }
    } else {
      console.log('[Bot] No Kalshi credentials provided - running in analysis-only mode');
      console.log('[Bot] Set KALSHI_EMAIL and KALSHI_PASSWORD to enable market scanning');
    }

    console.log(`[Bot] Scan interval: ${CONFIG.scanInterval / 1000} seconds`);
    console.log(`[Bot] Minimum confidence: ${CONFIG.minConfidence}%`);
    console.log(`[Bot] Auto-trading: ${CONFIG.autoTrade ? 'ENABLED' : 'DISABLED'}`);
    console.log('');
  }

  /**
   * Start the bot
   */
  async start() {
    await this.initialize();
    this.isRunning = true;

    console.log('[Bot] Starting market analysis...\n');

    // Run immediately, then on interval
    await this.runAnalysisCycle();

    const intervalId = setInterval(async () => {
      if (this.isRunning) {
        await this.runAnalysisCycle();
      }
    }, CONFIG.scanInterval);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n[Bot] Shutting down...');
      this.isRunning = false;
      clearInterval(intervalId);
      process.exit(0);
    });
  }

  /**
   * Run a single analysis cycle
   */
  async runAnalysisCycle() {
    try {
      console.log('----------------------------------------');
      console.log(`[${new Date().toLocaleTimeString()}] Running analysis cycle`);
      console.log('----------------------------------------\n');

      // Fetch Bitcoin price data
      const [currentPrice, stats24h, candles] = await Promise.all([
        this.priceFetcher.getCurrentPrice(),
        this.priceFetcher.get24hStats(),
        this.priceFetcher.getHistoricalData(CONFIG.primaryTimeframe, 100)
      ]);

      // Display current market state
      this.displayMarketState(currentPrice, stats24h);

      // Run technical analysis
      const analysis = this.signalGenerator.analyze(candles);
      this.lastAnalysis = analysis;

      // Display analysis results
      this.displayAnalysis(analysis);

      // Scan Kalshi markets if connected
      if (this.kalshi) {
        await this.scanKalshiMarkets(analysis);
      }

      // Display trade recommendation
      if (analysis.confidence >= CONFIG.minConfidence) {
        this.displayRecommendation(analysis);

        // Auto-trade if enabled
        if (CONFIG.autoTrade && this.kalshi) {
          await this.executeAutoTrade(analysis);
        }
      } else {
        console.log(`\n[Signal] Confidence ${analysis.confidence}% below threshold ${CONFIG.minConfidence}%`);
        console.log('[Signal] No trade recommendation at this time\n');
      }

    } catch (error) {
      console.error('[Bot] Error in analysis cycle:', error.message);
    }
  }

  /**
   * Display current market state
   */
  displayMarketState(currentPrice, stats24h) {
    const changeColor = stats24h.priceChangePercent >= 0 ? '\x1b[32m' : '\x1b[31m';
    const reset = '\x1b[0m';

    console.log('BITCOIN MARKET STATE');
    console.log('====================');
    console.log(`Current Price:  $${currentPrice.toLocaleString()}`);
    console.log(`24h Change:     ${changeColor}${stats24h.priceChangePercent >= 0 ? '+' : ''}${stats24h.priceChangePercent.toFixed(2)}%${reset}`);
    console.log(`24h High:       $${stats24h.highPrice.toLocaleString()}`);
    console.log(`24h Low:        $${stats24h.lowPrice.toLocaleString()}`);
    console.log(`24h Volume:     ${stats24h.volume.toLocaleString()} BTC`);
    console.log('');
  }

  /**
   * Display technical analysis results
   */
  displayAnalysis(analysis) {
    console.log('TECHNICAL ANALYSIS');
    console.log('==================');

    // Key indicators
    const ind = analysis.indicators;
    console.log(`RSI (14):       ${ind.rsi || 'N/A'}`);
    console.log(`MACD:           ${ind.macdLine || 'N/A'} (Signal: ${ind.macdSignal || 'N/A'})`);
    console.log(`SMA 20/50:      ${ind.sma20 || 'N/A'} / ${ind.sma50 || 'N/A'}`);
    console.log(`Bollinger:      ${ind.bollingerLower || 'N/A'} - ${ind.bollingerUpper || 'N/A'}`);
    console.log(`Stochastic:     %K: ${ind.stochK || 'N/A'}, %D: ${ind.stochD || 'N/A'}`);
    console.log('');

    // Signal breakdown
    console.log('SIGNAL BREAKDOWN');
    console.log('----------------');
    console.log(`Trend:          ${this.formatScore(analysis.signals.trend.score)}`);
    console.log(`Momentum:       ${this.formatScore(analysis.signals.momentum.score)}`);
    console.log(`MACD:           ${this.formatScore(analysis.signals.macd.score)}`);
    console.log(`Volatility:     ${this.formatScore(analysis.signals.volatility.score)}`);
    console.log(`Volume:         ${this.formatScore(analysis.signals.volume.score)}`);
    console.log('');

    // Overall signal
    const signalColor = analysis.signal === 'BULLISH' ? '\x1b[32m' :
                        analysis.signal === 'BEARISH' ? '\x1b[31m' : '\x1b[33m';
    const reset = '\x1b[0m';

    console.log('OVERALL SIGNAL');
    console.log('--------------');
    console.log(`Signal:         ${signalColor}${analysis.signal}${reset}`);
    console.log(`Confidence:     ${analysis.confidence}%`);
    console.log(`Composite:      ${analysis.compositeScore.toFixed(3)}`);
    console.log(`Assessment:     ${analysis.description}`);
    console.log('');
  }

  /**
   * Format score for display
   */
  formatScore(score) {
    const direction = score > 0 ? 'Bullish' : score < 0 ? 'Bearish' : 'Neutral';
    const bar = this.createScoreBar(score);
    return `${bar} ${direction} (${(score * 100).toFixed(0)}%)`;
  }

  /**
   * Create visual score bar
   */
  createScoreBar(score) {
    const width = 10;
    const position = Math.round((score + 1) / 2 * width);
    let bar = '';
    for (let i = 0; i < width; i++) {
      if (i === position) bar += '|';
      else if (i < width / 2 && i >= position) bar += '-';
      else if (i >= width / 2 && i <= position) bar += '+';
      else bar += '.';
    }
    return `[${bar}]`;
  }

  /**
   * Scan Kalshi Bitcoin markets
   */
  async scanKalshiMarkets(analysis) {
    try {
      console.log('KALSHI BITCOIN MARKETS');
      console.log('======================');

      const btcMarkets = await this.kalshi.getBitcoinMarkets();

      if (btcMarkets.length === 0) {
        console.log('No active Bitcoin markets found on Kalshi');
        console.log('');
        return;
      }

      console.log(`Found ${btcMarkets.length} Bitcoin-related markets:\n`);

      for (const market of btcMarkets.slice(0, 5)) { // Show top 5 markets
        const parsed = this.kalshi.parseMarket(market);

        console.log(`  ${parsed.title}`);
        if (parsed.subtitle) console.log(`  ${parsed.subtitle}`);
        console.log(`  Ticker: ${parsed.ticker}`);
        console.log(`  Yes: ${(parsed.yesAsk * 100).toFixed(0)}¢ | No: ${(parsed.noAsk * 100).toFixed(0)}¢`);
        console.log(`  Volume: ${parsed.volume} | Open Interest: ${parsed.openInterest}`);

        if (parsed.hoursUntilClose) {
          console.log(`  Closes in: ${parsed.hoursUntilClose.toFixed(1)} hours`);

          // Get timeframe-adjusted analysis for this market
          const adjustedAnalysis = this.signalGenerator.analyzeForTimeframe(
            await this.priceFetcher.getHistoricalData('15m', 96),
            parsed.hoursUntilClose
          );

          const edgeColor = this.calculateEdge(analysis, parsed) > 0 ? '\x1b[32m' : '\x1b[31m';
          const reset = '\x1b[0m';
          console.log(`  Edge: ${edgeColor}${this.calculateEdge(analysis, parsed).toFixed(1)}%${reset}`);
        }
        console.log('');
      }
    } catch (error) {
      console.error('[Bot] Error scanning Kalshi markets:', error.message);
      console.log('');
    }
  }

  /**
   * Calculate potential edge over market
   */
  calculateEdge(analysis, market) {
    // Our predicted probability vs market's implied probability
    let ourProbability;
    if (analysis.signal === 'BULLISH') {
      ourProbability = 0.5 + (analysis.confidence / 200); // 50% + (0-50%)
    } else if (analysis.signal === 'BEARISH') {
      ourProbability = 0.5 - (analysis.confidence / 200); // 50% - (0-50%)
    } else {
      ourProbability = 0.5;
    }

    // Market's implied probability from yes price
    const marketProbability = market.impliedProbability;

    // Edge = our probability - market probability (for YES side)
    return (ourProbability - marketProbability) * 100;
  }

  /**
   * Display trade recommendation
   */
  displayRecommendation(analysis) {
    const rec = analysis.recommendation;
    const color = rec.action === 'BUY YES' ? '\x1b[32m' :
                  rec.action === 'BUY NO' ? '\x1b[31m' : '\x1b[33m';
    const reset = '\x1b[0m';

    console.log('========================================');
    console.log('  TRADE RECOMMENDATION');
    console.log('========================================');
    console.log(`  Action:     ${color}${rec.action}${reset}`);
    console.log(`  Strategy:   ${rec.description}`);
    console.log(`  Rationale:  ${rec.rationale}`);
    console.log(`  Risk Level: ${rec.riskLevel}`);
    console.log(`  Allocation: ${rec.suggestedAllocation}`);
    if (rec.stopCondition) {
      console.log(`  Exit:       ${rec.stopCondition}`);
    }
    console.log('========================================\n');
  }

  /**
   * Execute auto trade (if enabled)
   */
  async executeAutoTrade(analysis) {
    // Safety checks
    if (Math.abs(this.tradingStats.dailyPnL) >= CONFIG.maxDailyLoss) {
      console.log('[AutoTrade] Daily loss limit reached. No more trades today.');
      return;
    }

    if (analysis.confidence < 60) {
      console.log('[AutoTrade] Confidence too low for auto-trade');
      return;
    }

    // Get Bitcoin markets
    const btcMarkets = await this.kalshi.getBitcoinMarkets();
    if (btcMarkets.length === 0) {
      console.log('[AutoTrade] No suitable markets found');
      return;
    }

    // Find best market to trade
    const market = btcMarkets[0]; // Simple selection - could be improved
    const parsed = this.kalshi.parseMarket(market);

    // Calculate position size based on confidence
    const positionSize = Math.min(
      Math.round(analysis.confidence / 10),
      CONFIG.maxPositionSize
    );

    const side = analysis.signal === 'BULLISH' ? 'yes' : 'no';
    const price = side === 'yes' ? Math.round(parsed.yesAsk * 100) : Math.round(parsed.noAsk * 100);

    console.log('[AutoTrade] Placing order:');
    console.log(`  Market: ${parsed.ticker}`);
    console.log(`  Side: ${side.toUpperCase()}`);
    console.log(`  Contracts: ${positionSize}`);
    console.log(`  Price: ${price}¢`);

    try {
      const order = await this.kalshi.placeOrder(
        parsed.ticker,
        side,
        positionSize,
        price,
        'limit'
      );

      console.log(`[AutoTrade] Order placed successfully: ${order.order_id}`);
      this.tradingStats.totalTrades++;
      this.tradingStats.lastTradeTime = new Date();
    } catch (error) {
      console.error('[AutoTrade] Order failed:', error.message);
    }
  }

  /**
   * Get current bot status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastAnalysis: this.lastAnalysis,
      tradingStats: this.tradingStats,
      kalshiConnected: this.kalshi !== null
    };
  }
}

// Main entry point
async function main() {
  const bot = new KalshiBitcoinBot();
  await bot.start();
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

export default KalshiBitcoinBot;
