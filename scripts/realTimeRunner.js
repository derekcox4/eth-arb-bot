import dotenv from 'dotenv';
import { runArbEngine } from '../utils/arbEngine.js';

dotenv.config();

console.log("Checking .env variables...");
console.log("ALCHEMY_URL loaded:", !!process.env.ALCHEMY_URL);
console.log("WALLET_PRIVATE_KEY loaded:", !!process.env.WALLET_PRIVATE_KEY);
console.log("FLASHBOTS_RELAY_URL loaded:", !!process.env.FLASHBOTS_RELAY_URL);

console.log("Multi-chain Arbitrage Bot Live...");

setInterval(async () => {
  console.log("\nRunning strategies across Ethereum, Base, and Arbitrum...");
  await runArbEngine();
}, 10000);
