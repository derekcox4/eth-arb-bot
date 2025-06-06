import { ethers } from "ethers";
import { fetchOutput } from "./priceChecker.js";

export async function runBridgeMonitor() {
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

  const tokenIn = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"; // WETH
  const tokenOut = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606EB48"; // USDC
  const amountIn = ethers.parseUnits("1", 18);

  try {
    const ethOut = await fetchOutput(configs.ethereum.provider, tokenIn, tokenOut, amountIn, configs.ethereum.router);
    const baseOut = await fetchOutput(configs.base.provider, tokenIn, tokenOut, amountIn, configs.base.router);
    const arbOut = await fetchOutput(configs.arbitrum.provider, tokenIn, tokenOut, amountIn, configs.arbitrum.router);

    const ethBaseSpread = Math.abs(Number(ethOut) - Number(baseOut)) / Number(ethOut);
    const ethArbSpread = Math.abs(Number(ethOut) - Number(arbOut)) / Number(ethOut);
    const threshold = parseFloat(process.env.OPPORTUNITY_THRESHOLD || "0.01");

    if (ethBaseSpread > threshold) {
      console.log(`[Bridge] L1/L2 spread Ethereum vs Base ${(ethBaseSpread * 100).toFixed(2)}%`);
    }
    if (ethArbSpread > threshold) {
      console.log(`[Bridge] L1/L2 spread Ethereum vs Arbitrum ${(ethArbSpread * 100).toFixed(2)}%`);
    }
  } catch (err) {
    console.error("Bridge monitor error:", err.message);
  }
}
