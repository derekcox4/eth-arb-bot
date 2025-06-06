
export async function runDEXStrategy(
  chain,
  { provider } = {}
) {
  console.log(`[${chain}] Scanning real DEX prices for arbitrage with execution...`);
  if (!provider) {
    const { ethers } = await import("ethers");
    provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_URL);
  }
  const blockNumber = await provider.getBlockNumber();
  console.log(`Current block number: ${blockNumber}`);
}
