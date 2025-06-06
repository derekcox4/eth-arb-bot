import { ethers } from "ethers";
import { fetchOutput } from "./priceChecker.js";
import { getTokenList } from "./tokenList.js";
import { executeSwap } from "./executor.js";

export async function runDEXStrategy() {
  console.log("[DEX] Scanning prices across chains...");

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

  const tokens = getTokenList();
  const threshold = parseFloat(process.env.OPPORTUNITY_THRESHOLD || "0.01");
  const gasBuffer = 0.003; // simplified gas cost buffer

  for (const token of tokens) {
    if (token.symbol === "USDC") continue;
    const amountIn = ethers.parseUnits("1", token.decimals);
    const outputs = {};

    for (const [name, { provider, router }] of Object.entries(configs)) {
      try {
        outputs[name] = await fetchOutput(
          provider,
          token.address,
          tokens.find((t) => t.symbol === "USDC").address,
          amountIn,
          router
        );
      } catch (err) {
        console.error(`Failed to fetch price on ${name}:`, err.message);
        continue;
      }
    }

    if (Object.keys(outputs).length < 3) continue;

    const values = Object.values(outputs).map((v) => Number(v));
    const maxOut = Math.max(...values);
    const minOut = Math.min(...values);
    const spread = (maxOut - minOut) / minOut;

    const found = spread > threshold + gasBuffer;
    if (found) {
      console.log(
        `[DEX] ${token.symbol} opportunity! Spread ${(spread * 100).toFixed(2)}%`
      );
      if (process.env.REAL_EXECUTION === "true") {
        // build minimal tx placeholder
        const tx = {
          to: configs.ethereum.router,
          data: "0x",
          value: 0,
        };
        await executeSwap(configs.ethereum.provider, tx);
      }
    }
  }
}
