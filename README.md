# Kalshi Bitcoin Prediction Bot

A sophisticated trading bot that scans Kalshi for Bitcoin prediction markets and uses technical analysis to recommend trades.

## Features

- **Real-time Bitcoin Price Monitoring**: Fetches prices from multiple sources (Binance, CoinGecko, Coinbase)
- **Comprehensive Technical Analysis**:
  - Moving Averages (SMA, EMA)
  - RSI (Relative Strength Index)
  - MACD (Moving Average Convergence Divergence)
  - Bollinger Bands
  - Stochastic Oscillator
  - Volume analysis (OBV, VWAP)
  - And more...
- **Kalshi Market Integration**: Scans and analyzes Bitcoin-related prediction markets
- **Trade Recommendations**: Generates BUY YES/NO signals with confidence scores
- **Optional Auto-Trading**: Automated order placement (disabled by default)

## Installation

```bash
# Clone the repository
git clone <repo-url>
cd kalshi-bitcoin-bot

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your settings
nano .env
```

## Configuration

Edit `.env` file with your settings:

```env
# Kalshi credentials (optional - for market scanning)
KALSHI_EMAIL=your-email@example.com
KALSHI_PASSWORD=your-password

# Use demo API for testing
KALSHI_USE_DEMO=true

# Scan interval (milliseconds)
SCAN_INTERVAL=60000

# Minimum confidence for recommendations
MIN_CONFIDENCE=40
```

## Usage

### Run the Bot

```bash
npm start
# or
npm run bot
```

### Analysis-Only Mode

If you don't provide Kalshi credentials, the bot runs in analysis-only mode:
- Fetches Bitcoin prices
- Runs technical analysis
- Generates trade recommendations
- Does NOT scan Kalshi markets or place trades

## Output Example

```
========================================
  KALSHI BITCOIN PREDICTION BOT
========================================

BITCOIN MARKET STATE
====================
Current Price:  $67,234
24h Change:     +2.34%
24h High:       $67,890
24h Low:        $65,432
24h Volume:     12,345 BTC

TECHNICAL ANALYSIS
==================
RSI (14):       58.3
MACD:           234.56 (Signal: 198.23)
SMA 20/50:      66,500 / 65,200
Bollinger:      64,000 - 68,500

SIGNAL BREAKDOWN
----------------
Trend:          [.....|++++] Bullish (62%)
Momentum:       [....|+++++] Bullish (54%)
MACD:           [...|++++++] Bullish (71%)
Volatility:     [.....|++++] Bullish (48%)
Volume:         [.....|++++] Bullish (55%)

OVERALL SIGNAL
--------------
Signal:         BULLISH
Confidence:     58%
Assessment:     Moderate bullish signal

========================================
  TRADE RECOMMENDATION
========================================
  Action:     BUY YES
  Strategy:   Buy YES contracts on Bitcoin going UP
  Rationale:  58% confidence in upward movement
  Risk Level: HIGH
  Allocation: 5-10%
========================================
```

## Technical Indicators

| Indicator | Description | Use |
|-----------|-------------|-----|
| SMA | Simple Moving Average | Trend direction |
| EMA | Exponential Moving Average | Recent trend emphasis |
| RSI | Relative Strength Index | Overbought/oversold |
| MACD | Moving Average Convergence Divergence | Momentum & trend |
| Bollinger Bands | Volatility bands | Support/resistance |
| Stochastic | Price momentum oscillator | Entry/exit timing |
| ATR | Average True Range | Volatility measurement |
| OBV | On-Balance Volume | Volume confirmation |
| VWAP | Volume Weighted Avg Price | Fair value |

## Signal Interpretation

- **BULLISH**: Buy YES on "Bitcoin Up" markets, or NO on "Bitcoin Down" markets
- **BEARISH**: Buy NO on "Bitcoin Up" markets, or YES on "Bitcoin Down" markets
- **NEUTRAL**: Wait for clearer signals

### Confidence Levels

- **65%+**: Strong signal - consider larger position
- **40-65%**: Moderate signal - standard position size
- **Below 40%**: Weak signal - wait for confirmation

## Risk Warning

**This bot is for educational purposes. Trading prediction markets involves substantial risk.**

- Never trade with money you can't afford to lose
- Past performance doesn't guarantee future results
- Technical analysis is not foolproof
- Always do your own research
- Auto-trading is disabled by default for safety

## Project Structure

```
├── scripts/
│   └── kalshiBitcoinBot.js    # Main bot entry point
├── utils/
│   ├── kalshiClient.js        # Kalshi API client
│   ├── bitcoinPriceFetcher.js # Price data fetching
│   ├── technicalAnalysis.js   # TA indicator calculations
│   └── signalGenerator.js     # Signal generation logic
├── .env.example               # Environment template
├── package.json
└── README.md
```

## License

MIT
