
import { runDEXStrategy } from "./dexStrategy.js";
import { runLendingStrategy } from "./lendingStrategy.js";

export async function runArbitrageStrategies() {
  console.log("Running strategies across Ethereum, Base, and Arbitrum...");
  await runDEXStrategy("ethereum", process.env.ETHEREUM_RPC_URL);
  await runDEXStrategy("base", process.env.BASE_RPC_URL);
  await runDEXStrategy("arbitrum", process.env.ARBITRUM_RPC_URL);

  await runLendingStrategy();
}
