
import { scanDexes } from "./dexStrategy.js";
import { scanLendingRates } from "./lendingStrategy.js";

export async function runArbitrageStrategies() {
  await scanDexes();
  await scanLendingRates();
}
