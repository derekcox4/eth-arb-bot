import { ethers } from "ethers";

export async function runDEXStrategy(chain) {
  console.log(`[${chain}] Scanning real DEX prices for arbitrage with execution..`);

  const { ETHEREUM_URL, BASE_URL, ARBITRUM_URL } = process.env;

  let rpcUrl;
  switch (chain) {
    case "ethereum":
      rpcUrl = ETHEREUM_URL;
      break;
    case "base":
      rpcUrl = BASE_URL;
      break;
    case "arbitrum":
      rpcUrl = ARBITRUM_URL;
      break;
    default:
      throw new Error(`Unsupported chain: ${chain}`);
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const blockNumber = await provider.getBlockNumber();
  console.log(`Current block number: ${blockNumber}`);
}
