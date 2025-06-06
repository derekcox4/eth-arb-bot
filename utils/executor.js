import { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle";
import { Wallet, ethers } from "ethers";

export async function executeSwap(provider, tx) {
  if (process.env.REAL_EXECUTION !== "true") {
    console.log("REAL_EXECUTION is not enabled. Skipping trade.");
    return;
  }

  if (!process.env.FLASHBOTS_RELAY_URL) {
    console.error("FLASHBOTS_RELAY_URL not set, cannot send private tx");
    return;
  }

  try {
    const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY, provider);
    const flashbotsProvider = await FlashbotsBundleProvider.create(
      provider,
      wallet,
      process.env.FLASHBOTS_RELAY_URL
    );

    const signedBundle = await flashbotsProvider.signBundle([
      {
        signer: wallet,
        transaction: tx,
      },
    ]);

    const block = await provider.getBlockNumber();
    const res = await flashbotsProvider.sendRawBundle(signedBundle, block + 1);
    console.log("Flashbots result", await res.wait());
  } catch (err) {
    console.error("Failed to execute swap via Flashbots:", err.message);
  }
}
