
require('dotenv').config();
const { runAllStrategies } = require('../utils/arbEngine');
console.log("Multi-chain Arbitrage Bot Live...");

const runBot = async () => {
  while (true) {
    try {
      await runAllStrategies();
      await new Promise(r => setTimeout(r, 15000));
    } catch (err) {
      console.error("Error:", err.message);
    }
  }
};

runBot();
