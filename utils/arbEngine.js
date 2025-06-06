
export async function runArbitrageStrategies({
  runDEXStrategy: dex,
  runLendingStrategy: lend,
} = {}) {
  if (!dex) {
    ({ runDEXStrategy: dex } = await import("./dexStrategy.js"));
  }
  if (!lend) {
    ({ runLendingStrategy: lend } = await import("./lendingStrategy.js"));
  }
  console.log("Running strategies across Ethereum, Base, and Arbitrum...");
  await dex("ethereum");
  await dex("base");
  await dex("arbitrum");

  await lend();
}
