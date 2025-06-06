
require('dotenv').config();
require('dotenv').config();
console.log("Checking .env variables...");
console.log("ALCHEMY_URL loaded:", !!process.env.https://eth-mainnet.g.alchemy.com/v2/tUF1C1jssmen_eIV_K801);
console.log("WALLET_PRIVATE_KEY loaded:", !!process.env.0de38f52313aebeb186e4ed839380dca4e682177a41aae34a8230f3d435a1a71);
console.log("FLASHBOTS_RELAY_URL loaded:", !!process.env.https://relay.flashbots.net);
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
