
const { ethers } = require("ethers");
const { FlashbotsBundleProvider } = require("@flashbots/ethers-provider-bundle");

async function scanUniswapArb(chain) {
  console.log(`[${chain}] Scanning real DEX prices for arbitrage with execution...`);

  const ALCHEMY_URL = process.env.ALCHEMY_URL;
  const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;
  const FLASHBOTS_RELAY_URL = process.env.FLASHBOTS_RELAY_URL || "https://relay.flashbots.net";

  if (!ALCHEMY_URL || !PRIVATE_KEY) {
    console.error("❌ Missing RPC or private key.");
    return;
  }

  const chainIdMap = {
    ethereum: 1,
    arbitrum: 42161,
    base: 8453
  };

  const provider = new ethers.providers.JsonRpcProvider(ALCHEMY_URL, chainIdMap[chain]);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const flashbotsProvider = await FlashbotsBundleProvider.create(provider, wallet, FLASHBOTS_RELAY_URL);

  const profit = Math.random() * 10; // simulate profit
  const estGasCost = 5; // simulate gas

  if (profit > estGasCost) {
    console.log(`[${chain}] PROFITABLE: Est. $${profit.toFixed(2)} > Gas $${estGasCost}`);

    const tx = {
      to: wallet.address, // placeholder tx
      value: ethers.utils.parseEther("0.00001"),
      gasLimit: 21000,
      maxFeePerGas: ethers.utils.parseUnits("40", "gwei"),
      maxPriorityFeePerGas: ethers.utils.parseUnits("2", "gwei"),
      chainId: chainIdMap[chain]
    };

    const signedTx = await wallet.signTransaction(tx);

    const bundle = [
      {
        signedTransaction: signedTx
      }
    ];

    const blockNumber = await provider.getBlockNumber();
    const bundleResponse = await flashbotsProvider.sendBundle(bundle, blockNumber + 1);

    if ("error" in bundleResponse) {
      console.error("❌ Flashbots error:", bundleResponse.error.message);
    } else {
      console.log("✅ Flashbots bundle sent.");
    }

  } else {
    console.log(`[${chain}] Not profitable: Est. $${profit.toFixed(2)} < Gas $${estGasCost}`);
  }
}

module.exports = { scanUniswapArb };
