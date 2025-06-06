
import dotenv from "dotenv";
import { runArbitrageEngine } from "../utils/arbEngine.js";

dotenv.config();

// Simple .env validation test
console.log("Checking .env variables...");
console.log("ALCHEMY_URL loaded:", !!process.env.ALCHEMY_URL === true);
console.log("WALLET_PRIVATE_KEY loaded:", !!process.env.WALLET_PRIVATE_KEY === true);
console.log("FLASHBOTS_RELAY_URL loaded:", !!process.env.FLASHBOTS_RELAY_URL === true);

console.log("Multi-chain Arbitrage Bot Live...");

const startBot = async () => {
  while (true) {
    try {
      await runArbitrageEngine();
      await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds
    } catch (err) {
      console.error("Unexpected error in arbitrage engine:", err);
    }
  }
};

startBot();
