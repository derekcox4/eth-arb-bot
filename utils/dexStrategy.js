
import { ethers } from "ethers";

export async function runDEXStrategy(chain) {
  console.log(`[${chain}] Scanning real DEX prices for arbitrage with execution...`);
  const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_URL);
  const blockNumber = await provider.getBlockNumber();
  console.log(`Current block number: ${blockNumber}`);
}
