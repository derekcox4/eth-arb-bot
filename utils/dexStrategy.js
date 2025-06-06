
import { ethers } from "ethers";

function getRpcUrl(chain) {
  const mapping = {
    ethereum: "ETHEREUM_RPC_URL",
    base: "BASE_RPC_URL",
    arbitrum: "ARBITRUM_RPC_URL",
  };
  const envVar = mapping[chain];
  if (!envVar) {
    throw new Error(`Unsupported chain: ${chain}`);
  }
  const url = process.env[envVar];
  if (!url) {
    throw new Error(`Missing RPC URL for ${chain}. Set ${envVar} in your environment.`);
  }
  return url;
}

export async function runDEXStrategy(chain, rpcUrl) {
  console.log(`[${chain}] Scanning real DEX prices for arbitrage with execution...`);
  const url = rpcUrl || getRpcUrl(chain);
  const provider = new ethers.JsonRpcProvider(url);
  const blockNumber = await provider.getBlockNumber();
  console.log(`Current block number: ${blockNumber}`);
}
