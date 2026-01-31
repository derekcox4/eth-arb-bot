/**
 * Signal Generator
 * Combines multiple technical indicators to generate trading signals
 * for Kalshi Bitcoin prediction markets
 */

import TechnicalAnalysis from './technicalAnalysis.js';

class SignalGenerator {
  constructor(options = {}) {
    // Indicator weights for signal calculation
    this.weights = {
      trend: options.trendWeight || 0.25,        // Moving average trends
      momentum: options.momentumWeight || 0.25,   // RSI, Stochastic
      macd: options.macdWeight || 0.20,          // MACD signals
      volatility: options.volatilityWeight || 0.15, // Bollinger bands
      volume: options.volumeWeight || 0.15        // Volume analysis
    };

    // Thresholds
    this.thresholds = {
      rsiOverbought: options.rsiOverbought || 70,
      rsiOversold: options.rsiOversold || 30,
      strongSignal: options.strongSignal || 0.65,
      weakSignal: options.weakSignal || 0.35
    };
  }

  /**
   * Generate comprehensive signal from price data
   * @param {object[]} candles - Array of OHLCV candle data
   * @returns {object} Signal analysis with recommendation
   */
  analyze(candles) {
    if (!candles || candles.length < 50) {
      return {
        error: 'Insufficient data for analysis',
        signal: 'NEUTRAL',
        confidence: 0
      };
    }

    const closes = candles.map(c => c.close);
    const currentPrice = closes[closes.length - 1];

    // Calculate all indicators
    const indicators = this.calculateIndicators(candles, closes);

    // Generate individual signals
    const signals = {
      trend: this.analyzeTrend(closes, indicators),
      momentum: this.analyzeMomentum(indicators),
      macd: this.analyzeMACD(indicators.macd),
      volatility: this.analyzeVolatility(currentPrice, indicators.bollinger),
      volume: this.analyzeVolume(candles, indicators)
    };

    // Calculate weighted composite score (-1 to +1)
    const compositeScore = this.calculateCompositeScore(signals);

    // Determine signal direction and strength
    const { signal, confidence, description } = this.interpretScore(compositeScore, signals);

    return {
      signal,           // 'BULLISH', 'BEARISH', or 'NEUTRAL'
      confidence,       // 0-100 confidence score
      compositeScore,   // -1 to +1 raw score
      currentPrice,
      indicators: this.formatIndicators(indicators),
      signals,
      description,
      recommendation: this.generateRecommendation(signal, confidence, indicators),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calculate all technical indicators
   */
  calculateIndicators(candles, closes) {
    return {
      sma20: TechnicalAnalysis.SMA(closes, 20),
      sma50: TechnicalAnalysis.SMA(closes, 50),
      ema12: TechnicalAnalysis.EMA(closes, 12),
      ema26: TechnicalAnalysis.EMA(closes, 26),
      rsi: TechnicalAnalysis.RSI(closes, 14),
      macd: TechnicalAnalysis.MACD(closes, 12, 26, 9),
      bollinger: TechnicalAnalysis.BollingerBands(closes, 20, 2),
      stochastic: TechnicalAnalysis.Stochastic(candles, 14, 3),
      atr: TechnicalAnalysis.ATR(candles, 14),
      obv: TechnicalAnalysis.OBV(candles),
      vwap: TechnicalAnalysis.VWAP(candles),
      williamsR: TechnicalAnalysis.WilliamsR(candles, 14),
      cci: TechnicalAnalysis.CCI(candles, 20)
    };
  }

  /**
   * Analyze trend using moving averages
   */
  analyzeTrend(closes, indicators) {
    const currentPrice = closes[closes.length - 1];
    const sma20 = TechnicalAnalysis.latest(indicators.sma20);
    const sma50 = TechnicalAnalysis.latest(indicators.sma50);
    const ema12 = TechnicalAnalysis.latest(indicators.ema12);
    const ema26 = TechnicalAnalysis.latest(indicators.ema26);

    let score = 0;
    const details = [];

    // Price vs SMA20
    if (currentPrice > sma20) {
      score += 0.25;
      details.push('Price above SMA20 (bullish)');
    } else {
      score -= 0.25;
      details.push('Price below SMA20 (bearish)');
    }

    // Price vs SMA50
    if (currentPrice > sma50) {
      score += 0.25;
      details.push('Price above SMA50 (bullish)');
    } else {
      score -= 0.25;
      details.push('Price below SMA50 (bearish)');
    }

    // SMA20 vs SMA50 (Golden/Death cross proximity)
    if (sma20 > sma50) {
      score += 0.25;
      details.push('SMA20 > SMA50 (bullish trend)');
    } else {
      score -= 0.25;
      details.push('SMA20 < SMA50 (bearish trend)');
    }

    // EMA crossover check
    if (TechnicalAnalysis.crossedAbove(indicators.ema12, indicators.ema26)) {
      score += 0.25;
      details.push('EMA12 crossed above EMA26 (bullish signal)');
    } else if (TechnicalAnalysis.crossedBelow(indicators.ema12, indicators.ema26)) {
      score -= 0.25;
      details.push('EMA12 crossed below EMA26 (bearish signal)');
    }

    return { score, details };
  }

  /**
   * Analyze momentum using RSI, Stochastic, and other oscillators
   */
  analyzeMomentum(indicators) {
    const rsi = TechnicalAnalysis.latest(indicators.rsi);
    const stochK = TechnicalAnalysis.latest(indicators.stochastic?.k);
    const stochD = TechnicalAnalysis.latest(indicators.stochastic?.d);
    const williamsR = TechnicalAnalysis.latest(indicators.williamsR);
    const cci = TechnicalAnalysis.latest(indicators.cci);

    let score = 0;
    const details = [];

    // RSI analysis
    if (rsi !== null) {
      if (rsi < this.thresholds.rsiOversold) {
        score += 0.3; // Oversold = potential bullish reversal
        details.push(`RSI oversold at ${rsi.toFixed(1)} (bullish)`);
      } else if (rsi > this.thresholds.rsiOverbought) {
        score -= 0.3; // Overbought = potential bearish reversal
        details.push(`RSI overbought at ${rsi.toFixed(1)} (bearish)`);
      } else if (rsi > 50) {
        score += 0.1;
        details.push(`RSI bullish at ${rsi.toFixed(1)}`);
      } else {
        score -= 0.1;
        details.push(`RSI bearish at ${rsi.toFixed(1)}`);
      }
    }

    // Stochastic analysis
    if (stochK !== null && stochD !== null) {
      if (stochK < 20 && stochD < 20) {
        score += 0.2;
        details.push('Stochastic oversold (bullish)');
      } else if (stochK > 80 && stochD > 80) {
        score -= 0.2;
        details.push('Stochastic overbought (bearish)');
      }

      // Stochastic crossover
      if (TechnicalAnalysis.crossedAbove(indicators.stochastic.k, indicators.stochastic.d)) {
        score += 0.15;
        details.push('Stochastic %K crossed above %D (bullish)');
      } else if (TechnicalAnalysis.crossedBelow(indicators.stochastic.k, indicators.stochastic.d)) {
        score -= 0.15;
        details.push('Stochastic %K crossed below %D (bearish)');
      }
    }

    // Williams %R
    if (williamsR !== null) {
      if (williamsR < -80) {
        score += 0.15;
        details.push('Williams %R oversold (bullish)');
      } else if (williamsR > -20) {
        score -= 0.15;
        details.push('Williams %R overbought (bearish)');
      }
    }

    // CCI
    if (cci !== null) {
      if (cci < -100) {
        score += 0.1;
        details.push('CCI oversold (bullish)');
      } else if (cci > 100) {
        score -= 0.1;
        details.push('CCI overbought (bearish)');
      }
    }

    return { score: Math.max(-1, Math.min(1, score)), details };
  }

  /**
   * Analyze MACD signals
   */
  analyzeMACD(macd) {
    if (!macd) return { score: 0, details: ['MACD data unavailable'] };

    const macdLine = TechnicalAnalysis.latest(macd.macd);
    const signalLine = TechnicalAnalysis.latest(macd.signal);
    const histogram = TechnicalAnalysis.latest(macd.histogram);
    const prevHistogram = TechnicalAnalysis.previous(macd.histogram);

    let score = 0;
    const details = [];

    // MACD line position
    if (macdLine > 0) {
      score += 0.2;
      details.push('MACD above zero line (bullish)');
    } else {
      score -= 0.2;
      details.push('MACD below zero line (bearish)');
    }

    // MACD crossover
    if (TechnicalAnalysis.crossedAbove(macd.macd, macd.signal)) {
      score += 0.4;
      details.push('MACD crossed above signal (strong bullish)');
    } else if (TechnicalAnalysis.crossedBelow(macd.macd, macd.signal)) {
      score -= 0.4;
      details.push('MACD crossed below signal (strong bearish)');
    }

    // Histogram momentum
    if (histogram > prevHistogram) {
      score += 0.2;
      details.push('MACD histogram increasing (bullish momentum)');
    } else {
      score -= 0.2;
      details.push('MACD histogram decreasing (bearish momentum)');
    }

    return { score: Math.max(-1, Math.min(1, score)), details };
  }

  /**
   * Analyze volatility using Bollinger Bands
   */
  analyzeVolatility(currentPrice, bollinger) {
    if (!bollinger) return { score: 0, details: ['Bollinger data unavailable'] };

    const upper = TechnicalAnalysis.latest(bollinger.upper);
    const middle = TechnicalAnalysis.latest(bollinger.middle);
    const lower = TechnicalAnalysis.latest(bollinger.lower);

    let score = 0;
    const details = [];

    const bandWidth = (upper - lower) / middle;
    const pricePosition = (currentPrice - lower) / (upper - lower);

    // Price position within bands
    if (currentPrice <= lower) {
      score += 0.5; // Near lower band = potential bounce
      details.push('Price at lower Bollinger Band (oversold, potential bounce)');
    } else if (currentPrice >= upper) {
      score -= 0.5; // Near upper band = potential pullback
      details.push('Price at upper Bollinger Band (overbought, potential pullback)');
    } else if (pricePosition > 0.5) {
      score += 0.1;
      details.push('Price in upper half of Bollinger Bands');
    } else {
      score -= 0.1;
      details.push('Price in lower half of Bollinger Bands');
    }

    // Band squeeze detection (low volatility = potential breakout)
    if (bandWidth < 0.03) {
      details.push('Bollinger Band squeeze detected (potential breakout incoming)');
    }

    return { score, details };
  }

  /**
   * Analyze volume patterns
   */
  analyzeVolume(candles, indicators) {
    const obv = indicators.obv;
    const vwap = TechnicalAnalysis.latest(indicators.vwap);
    const currentPrice = candles[candles.length - 1].close;

    let score = 0;
    const details = [];

    // OBV trend
    if (obv && obv.length >= 5) {
      const obvTrending = TechnicalAnalysis.isTrendingUp(obv, 5);
      if (obvTrending === true) {
        score += 0.3;
        details.push('OBV trending up (accumulation)');
      } else if (obvTrending === false) {
        score -= 0.3;
        details.push('OBV trending down (distribution)');
      }
    }

    // Price vs VWAP
    if (vwap) {
      if (currentPrice > vwap) {
        score += 0.2;
        details.push('Price above VWAP (bullish)');
      } else {
        score -= 0.2;
        details.push('Price below VWAP (bearish)');
      }
    }

    // Volume spike detection
    const volumes = candles.slice(-20).map(c => c.volume);
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    const currentVolume = candles[candles.length - 1].volume;

    if (currentVolume > avgVolume * 1.5) {
      details.push('Volume spike detected (strong move confirmation)');
    }

    return { score, details };
  }

  /**
   * Calculate weighted composite score
   */
  calculateCompositeScore(signals) {
    return (
      signals.trend.score * this.weights.trend +
      signals.momentum.score * this.weights.momentum +
      signals.macd.score * this.weights.macd +
      signals.volatility.score * this.weights.volatility +
      signals.volume.score * this.weights.volume
    );
  }

  /**
   * Interpret composite score into signal
   */
  interpretScore(score, signals) {
    const absScore = Math.abs(score);
    const confidence = Math.round(absScore * 100);

    let signal, description;

    if (score >= this.thresholds.strongSignal) {
      signal = 'BULLISH';
      description = 'Strong bullish signal - Multiple indicators suggest upward movement';
    } else if (score >= this.thresholds.weakSignal) {
      signal = 'BULLISH';
      description = 'Moderate bullish signal - Majority of indicators suggest upward bias';
    } else if (score <= -this.thresholds.strongSignal) {
      signal = 'BEARISH';
      description = 'Strong bearish signal - Multiple indicators suggest downward movement';
    } else if (score <= -this.thresholds.weakSignal) {
      signal = 'BEARISH';
      description = 'Moderate bearish signal - Majority of indicators suggest downward bias';
    } else {
      signal = 'NEUTRAL';
      description = 'No clear signal - Mixed indicators, consider waiting for confirmation';
    }

    return { signal, confidence, description };
  }

  /**
   * Format indicator values for display
   */
  formatIndicators(indicators) {
    return {
      sma20: TechnicalAnalysis.latest(indicators.sma20)?.toFixed(2),
      sma50: TechnicalAnalysis.latest(indicators.sma50)?.toFixed(2),
      ema12: TechnicalAnalysis.latest(indicators.ema12)?.toFixed(2),
      ema26: TechnicalAnalysis.latest(indicators.ema26)?.toFixed(2),
      rsi: TechnicalAnalysis.latest(indicators.rsi)?.toFixed(1),
      macdLine: TechnicalAnalysis.latest(indicators.macd?.macd)?.toFixed(2),
      macdSignal: TechnicalAnalysis.latest(indicators.macd?.signal)?.toFixed(2),
      macdHistogram: TechnicalAnalysis.latest(indicators.macd?.histogram)?.toFixed(2),
      bollingerUpper: TechnicalAnalysis.latest(indicators.bollinger?.upper)?.toFixed(2),
      bollingerMiddle: TechnicalAnalysis.latest(indicators.bollinger?.middle)?.toFixed(2),
      bollingerLower: TechnicalAnalysis.latest(indicators.bollinger?.lower)?.toFixed(2),
      stochK: TechnicalAnalysis.latest(indicators.stochastic?.k)?.toFixed(1),
      stochD: TechnicalAnalysis.latest(indicators.stochastic?.d)?.toFixed(1),
      atr: TechnicalAnalysis.latest(indicators.atr)?.toFixed(2),
      williamsR: TechnicalAnalysis.latest(indicators.williamsR)?.toFixed(1),
      cci: TechnicalAnalysis.latest(indicators.cci)?.toFixed(1)
    };
  }

  /**
   * Generate trade recommendation for Kalshi markets
   */
  generateRecommendation(signal, confidence, indicators) {
    const rsi = TechnicalAnalysis.latest(indicators.rsi);

    if (signal === 'BULLISH') {
      return {
        action: 'BUY YES',
        description: 'Buy YES contracts on Bitcoin going UP',
        rationale: `${confidence}% confidence in upward movement`,
        riskLevel: confidence >= 65 ? 'MODERATE' : 'HIGH',
        suggestedAllocation: confidence >= 65 ? '10-15%' : '5-10%',
        stopCondition: rsi > 75 ? 'Consider exiting if RSI exceeds 80' : null
      };
    } else if (signal === 'BEARISH') {
      return {
        action: 'BUY NO',
        description: 'Buy NO contracts on Bitcoin going UP (or YES on going DOWN)',
        rationale: `${confidence}% confidence in downward movement`,
        riskLevel: confidence >= 65 ? 'MODERATE' : 'HIGH',
        suggestedAllocation: confidence >= 65 ? '10-15%' : '5-10%',
        stopCondition: rsi < 25 ? 'Consider exiting if RSI drops below 20' : null
      };
    } else {
      return {
        action: 'HOLD',
        description: 'No clear trade signal - wait for better setup',
        rationale: 'Mixed signals from indicators',
        riskLevel: 'N/A',
        suggestedAllocation: 'N/A',
        stopCondition: null
      };
    }
  }

  /**
   * Analyze for a specific Kalshi market timeframe
   * @param {object[]} candles - Candle data
   * @param {number} hoursUntilClose - Hours until market closes
   */
  analyzeForTimeframe(candles, hoursUntilClose) {
    const analysis = this.analyze(candles);

    // Adjust confidence based on timeframe
    // Shorter timeframes = lower confidence in predictions
    let timeframeMultiplier = 1;
    if (hoursUntilClose < 1) {
      timeframeMultiplier = 0.7; // Very short term is harder to predict
    } else if (hoursUntilClose < 6) {
      timeframeMultiplier = 0.85;
    } else if (hoursUntilClose < 24) {
      timeframeMultiplier = 0.95;
    }

    analysis.adjustedConfidence = Math.round(analysis.confidence * timeframeMultiplier);
    analysis.timeframeNote = this.getTimeframeNote(hoursUntilClose);

    return analysis;
  }

  /**
   * Get note about timeframe
   */
  getTimeframeNote(hours) {
    if (hours < 1) {
      return 'Very short timeframe - High uncertainty, consider smaller position size';
    } else if (hours < 6) {
      return 'Short timeframe - Moderate uncertainty';
    } else if (hours < 24) {
      return 'Medium timeframe - Standard analysis applies';
    } else {
      return 'Longer timeframe - More reliable signal, but watch for trend changes';
    }
  }
}

export default SignalGenerator;
