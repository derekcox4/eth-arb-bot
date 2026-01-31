/**
 * Technical Analysis Engine
 * Implements various technical indicators for Bitcoin price analysis
 */

class TechnicalAnalysis {
  /**
   * Simple Moving Average (SMA)
   * @param {number[]} data - Array of prices
   * @param {number} period - SMA period
   */
  static SMA(data, period) {
    if (data.length < period) return null;

    const result = [];
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
    return result;
  }

  /**
   * Exponential Moving Average (EMA)
   * @param {number[]} data - Array of prices
   * @param {number} period - EMA period
   */
  static EMA(data, period) {
    if (data.length < period) return null;

    const multiplier = 2 / (period + 1);
    const result = [];

    // Start with SMA for first value
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += data[i];
    }
    result.push(sum / period);

    // Calculate EMA for remaining values
    for (let i = period; i < data.length; i++) {
      const ema = (data[i] - result[result.length - 1]) * multiplier + result[result.length - 1];
      result.push(ema);
    }

    return result;
  }

  /**
   * Relative Strength Index (RSI)
   * @param {number[]} data - Array of closing prices
   * @param {number} period - RSI period (typically 14)
   */
  static RSI(data, period = 14) {
    if (data.length < period + 1) return null;

    const changes = [];
    for (let i = 1; i < data.length; i++) {
      changes.push(data[i] - data[i - 1]);
    }

    const result = [];

    // Calculate first RSI using simple averages
    let gains = 0, losses = 0;
    for (let i = 0; i < period; i++) {
      if (changes[i] > 0) gains += changes[i];
      else losses += Math.abs(changes[i]);
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    if (avgLoss === 0) {
      result.push(100);
    } else {
      const rs = avgGain / avgLoss;
      result.push(100 - (100 / (1 + rs)));
    }

    // Calculate subsequent RSI values using smoothed averages
    for (let i = period; i < changes.length; i++) {
      const change = changes[i];
      const currentGain = change > 0 ? change : 0;
      const currentLoss = change < 0 ? Math.abs(change) : 0;

      avgGain = (avgGain * (period - 1) + currentGain) / period;
      avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

      if (avgLoss === 0) {
        result.push(100);
      } else {
        const rs = avgGain / avgLoss;
        result.push(100 - (100 / (1 + rs)));
      }
    }

    return result;
  }

  /**
   * MACD (Moving Average Convergence Divergence)
   * @param {number[]} data - Array of closing prices
   * @param {number} fastPeriod - Fast EMA period (typically 12)
   * @param {number} slowPeriod - Slow EMA period (typically 26)
   * @param {number} signalPeriod - Signal line period (typically 9)
   */
  static MACD(data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    const fastEMA = this.EMA(data, fastPeriod);
    const slowEMA = this.EMA(data, slowPeriod);

    if (!fastEMA || !slowEMA) return null;

    // Align the arrays (slow EMA starts later)
    const offset = slowPeriod - fastPeriod;
    const macdLine = [];

    for (let i = 0; i < slowEMA.length; i++) {
      macdLine.push(fastEMA[i + offset] - slowEMA[i]);
    }

    const signalLine = this.EMA(macdLine, signalPeriod);
    if (!signalLine) return null;

    const histogram = [];
    const signalOffset = signalPeriod - 1;

    for (let i = 0; i < signalLine.length; i++) {
      histogram.push(macdLine[i + signalOffset] - signalLine[i]);
    }

    return {
      macd: macdLine.slice(-histogram.length),
      signal: signalLine,
      histogram
    };
  }

  /**
   * Bollinger Bands
   * @param {number[]} data - Array of closing prices
   * @param {number} period - SMA period (typically 20)
   * @param {number} stdDev - Standard deviation multiplier (typically 2)
   */
  static BollingerBands(data, period = 20, stdDev = 2) {
    const sma = this.SMA(data, period);
    if (!sma) return null;

    const result = {
      upper: [],
      middle: [],
      lower: []
    };

    for (let i = 0; i < sma.length; i++) {
      const dataSlice = data.slice(i, i + period);
      const mean = sma[i];

      // Calculate standard deviation
      const squaredDiffs = dataSlice.map(x => Math.pow(x - mean, 2));
      const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
      const std = Math.sqrt(variance);

      result.upper.push(mean + stdDev * std);
      result.middle.push(mean);
      result.lower.push(mean - stdDev * std);
    }

    return result;
  }

  /**
   * Average True Range (ATR) - Volatility indicator
   * @param {object[]} candles - Array of candle data with high, low, close
   * @param {number} period - ATR period (typically 14)
   */
  static ATR(candles, period = 14) {
    if (candles.length < period + 1) return null;

    const trueRanges = [];

    for (let i = 1; i < candles.length; i++) {
      const high = candles[i].high;
      const low = candles[i].low;
      const prevClose = candles[i - 1].close;

      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );
      trueRanges.push(tr);
    }

    // Use EMA for smoothing
    return this.EMA(trueRanges, period);
  }

  /**
   * Stochastic Oscillator
   * @param {object[]} candles - Array of candle data
   * @param {number} kPeriod - %K period (typically 14)
   * @param {number} dPeriod - %D smoothing period (typically 3)
   */
  static Stochastic(candles, kPeriod = 14, dPeriod = 3) {
    if (candles.length < kPeriod) return null;

    const kValues = [];

    for (let i = kPeriod - 1; i < candles.length; i++) {
      const slice = candles.slice(i - kPeriod + 1, i + 1);
      const high = Math.max(...slice.map(c => c.high));
      const low = Math.min(...slice.map(c => c.low));
      const close = candles[i].close;

      const k = high === low ? 50 : ((close - low) / (high - low)) * 100;
      kValues.push(k);
    }

    const dValues = this.SMA(kValues, dPeriod);

    return {
      k: kValues,
      d: dValues
    };
  }

  /**
   * Volume Weighted Average Price (VWAP)
   * @param {object[]} candles - Array of candle data with high, low, close, volume
   */
  static VWAP(candles) {
    let cumulativeTPV = 0; // Typical Price * Volume
    let cumulativeVolume = 0;
    const result = [];

    for (const candle of candles) {
      const typicalPrice = (candle.high + candle.low + candle.close) / 3;
      cumulativeTPV += typicalPrice * candle.volume;
      cumulativeVolume += candle.volume;
      result.push(cumulativeTPV / cumulativeVolume);
    }

    return result;
  }

  /**
   * On-Balance Volume (OBV)
   * @param {object[]} candles - Array of candle data with close, volume
   */
  static OBV(candles) {
    if (candles.length < 2) return null;

    const result = [0];

    for (let i = 1; i < candles.length; i++) {
      const prevClose = candles[i - 1].close;
      const close = candles[i].close;
      const volume = candles[i].volume;

      if (close > prevClose) {
        result.push(result[result.length - 1] + volume);
      } else if (close < prevClose) {
        result.push(result[result.length - 1] - volume);
      } else {
        result.push(result[result.length - 1]);
      }
    }

    return result;
  }

  /**
   * Williams %R
   * @param {object[]} candles - Array of candle data
   * @param {number} period - Lookback period (typically 14)
   */
  static WilliamsR(candles, period = 14) {
    if (candles.length < period) return null;

    const result = [];

    for (let i = period - 1; i < candles.length; i++) {
      const slice = candles.slice(i - period + 1, i + 1);
      const high = Math.max(...slice.map(c => c.high));
      const low = Math.min(...slice.map(c => c.low));
      const close = candles[i].close;

      const wr = high === low ? -50 : ((high - close) / (high - low)) * -100;
      result.push(wr);
    }

    return result;
  }

  /**
   * Commodity Channel Index (CCI)
   * @param {object[]} candles - Array of candle data
   * @param {number} period - CCI period (typically 20)
   */
  static CCI(candles, period = 20) {
    if (candles.length < period) return null;

    const typicalPrices = candles.map(c => (c.high + c.low + c.close) / 3);
    const sma = this.SMA(typicalPrices, period);
    if (!sma) return null;

    const result = [];

    for (let i = 0; i < sma.length; i++) {
      const slice = typicalPrices.slice(i, i + period);
      const mean = sma[i];

      // Mean deviation
      const meanDeviation = slice.reduce((sum, tp) => sum + Math.abs(tp - mean), 0) / period;

      const cci = meanDeviation === 0 ? 0 : (typicalPrices[i + period - 1] - mean) / (0.015 * meanDeviation);
      result.push(cci);
    }

    return result;
  }

  /**
   * Get the latest value from an indicator array
   */
  static latest(indicator) {
    if (!indicator || indicator.length === 0) return null;
    return indicator[indicator.length - 1];
  }

  /**
   * Get the previous value from an indicator array
   */
  static previous(indicator, n = 1) {
    if (!indicator || indicator.length <= n) return null;
    return indicator[indicator.length - 1 - n];
  }

  /**
   * Check if indicator is trending up
   */
  static isTrendingUp(indicator, periods = 3) {
    if (!indicator || indicator.length < periods) return null;

    for (let i = indicator.length - periods; i < indicator.length - 1; i++) {
      if (indicator[i + 1] <= indicator[i]) return false;
    }
    return true;
  }

  /**
   * Check if indicator is trending down
   */
  static isTrendingDown(indicator, periods = 3) {
    if (!indicator || indicator.length < periods) return null;

    for (let i = indicator.length - periods; i < indicator.length - 1; i++) {
      if (indicator[i + 1] >= indicator[i]) return false;
    }
    return true;
  }

  /**
   * Detect crossover (value crosses above reference)
   */
  static crossedAbove(value, reference) {
    if (!value || !reference || value.length < 2 || reference.length < 2) return false;

    const currVal = value[value.length - 1];
    const prevVal = value[value.length - 2];
    const currRef = reference[reference.length - 1];
    const prevRef = reference[reference.length - 2];

    return prevVal <= prevRef && currVal > currRef;
  }

  /**
   * Detect crossunder (value crosses below reference)
   */
  static crossedBelow(value, reference) {
    if (!value || !reference || value.length < 2 || reference.length < 2) return false;

    const currVal = value[value.length - 1];
    const prevVal = value[value.length - 2];
    const currRef = reference[reference.length - 1];
    const prevRef = reference[reference.length - 2];

    return prevVal >= prevRef && currVal < currRef;
  }
}

export default TechnicalAnalysis;
