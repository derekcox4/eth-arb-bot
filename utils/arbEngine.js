
import { runDEXStrategy } from "./dexStrategy.js";
import { runLendingStrategy } from "./lendingStrategy.js";

export async function runArbitrageStrategies() {
  console.log("Running strategies across Ethereum, Base, and Arbitrum...");
  await runDEXStrategy("ethereum");
  await runDEXStrategy("base");
  await runDEXStrategy("arbitrum");

  await runLendingStrategy();
}
