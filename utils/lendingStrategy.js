
import { Contract, ethers } from "ethers";

const aaveAbi = [
  "function supplyRatePerBlock() view returns(uint256)",
];
const compoundAbi = [
  "function borrowRatePerBlock() view returns(uint256)",
];

// Dummy addresses used as placeholders
const AAVE_MARKET = "0x0000000000000000000000000000000000000000";
const COMPOUND_MARKET = "0x0000000000000000000000000000000000000000";

export async function runLendingStrategy() {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
    const aave = new Contract(AAVE_MARKET, aaveAbi, provider);
    const compound = new Contract(COMPOUND_MARKET, compoundAbi, provider);

    const supplyRate = await aave.supplyRatePerBlock();
    const borrowRate = await compound.borrowRatePerBlock();

    const diff = Number(supplyRate) - Number(borrowRate);
    if (diff > 0) {
      console.log(
        `Lending arb opportunity! Aave supply minus Compound borrow: ${diff}`
      );
    }
  } catch (err) {
    console.error("Lending strategy error:", err.message);
  }
}
