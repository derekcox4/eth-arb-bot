
require('dotenv').config();
require('dotenv').config();
console.log("Checking .env variables...");
console.log("ALCHEMY_URL loaded:", !!process.env.ALCHEMY_URL);
console.log("WALLET_PRIVATE_KEY loaded:", !!process.env.WALLET_PRIVATE_KEY);
console.log("FLASHBOTS_RELAY_URL loaded:", !!process.env.FLASHBOTS_RELAY_URL);
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
