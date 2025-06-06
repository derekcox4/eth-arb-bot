
import dotenv from "dotenv";
dotenv.config();

import { runArbitrageStrategies } from "../utils/arbEngine.js";

console.log("Checking .env variables...");
console.log("ALCHEMY_URL loaded:", !!process.env.ALCHEMY_URL);
console.log("WALLET_PRIVATE_KEY loaded:", !!process.env.WALLET_PRIVATE_KEY);
console.log("FLASHBOTS_RELAY_URL loaded:", !!process.env.FLASHBOTS_RELAY_URL);

console.log("Multi-chain Arbitrage Bot Live...");
setInterval(runArbitrageStrategies, 15000);
