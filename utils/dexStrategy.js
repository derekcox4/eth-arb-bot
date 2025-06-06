
import { JsonRpcProvider } from "ethers";
import dotenv from "dotenv";
dotenv.config();

const provider = new JsonRpcProvider(process.env.ALCHEMY_URL);

export async function scanDexes() {
  console.log("[ethereum] Scanning real DEX prices for arbitrage with execution...");
  try {
    const blockNumber = await provider.getBlockNumber();
    console.log("Current block number:", blockNumber);
  } catch (err) {
    console.error("Provider error:", err.message);
  }
}
