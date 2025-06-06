import { ethers } from "ethers";
import { fetchOutput } from "./priceChecker.js";

// Example token pair to compare across networks (WETH -> USDC)
const TOKEN_IN = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"; // WETH
const TOKEN_OUT = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606EB48"; // USDC

export async function runDEXStrategy(chain) {
  console.log(`[${chain}] Scanning real DEX prices for arbitrage with execution...`);

  const configs = {
    ethereum: {
      provider: new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL),
      router: process.env.ETHEREUM_ROUTER,
    },
    base: {
      provider: new ethers.JsonRpcProvider(process.env.BASE_RPC_URL),
      router: process.env.BASE_ROUTER,
    },
    arbitrum: {
      provider: new ethers.JsonRpcProvider(process.env.ARBITRUM_RPC_URL),
      router: process.env.ARBITRUM_ROUTER,
    },
  };

  const amountIn = ethers.parseUnits("1", 18);
  const outputs = {};

  for (const [name, { provider, router }] of Object.entries(configs)) {
    try {
      outputs[name] = await fetchOutput(provider, TOKEN_IN, TOKEN_OUT, amountIn, router);
    } catch (err) {
      console.error(`Failed to fetch price on ${name}:`, err.message);
      return;
    }
  }

  console.log("Price outputs (tokenOut per tokenIn):", outputs);

  const values = Object.values(outputs).map((v) => Number(v));
  const maxOut = Math.max(...values);
  const minOut = Math.min(...values);
  const spread = (maxOut - minOut) / minOut;

  const threshold = parseFloat(process.env.OPPORTUNITY_THRESHOLD || "0.01");
  const foundOpportunity = spread > threshold;

  if (foundOpportunity) {
    console.log(`Arbitrage opportunity! Spread ${(spread * 100).toFixed(2)}%`);
  }
}
