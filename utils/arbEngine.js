
const { scanUniswapArb } = require('./dexStrategy');
const { checkLendingRateArb } = require('./lendingStrategy');
const { logProfit } = require('./profitLogger');

async function runAllStrategies() {
  console.log("Running strategies across Ethereum, Base, and Arbitrum...");
  await scanUniswapArb('ethereum');
  await scanUniswapArb('base');
  await scanUniswapArb('arbitrum');
  await checkLendingRateArb();
  logProfit();
}

module.exports = { runAllStrategies };
