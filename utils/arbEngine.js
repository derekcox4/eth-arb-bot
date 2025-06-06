
import { runDEXStrategy } from "./dexStrategy.js";
import { runLendingStrategy } from "./lendingStrategy.js";

// simple cross-layer monitor placeholder
import { runBridgeMonitor } from "./layerMonitor.js";

export async function runArbitrageStrategies() {
  console.log("Running strategies across Ethereum, Base, and Arbitrum...");
  await runDEXStrategy();

  await runLendingStrategy();
  await runBridgeMonitor();
}
