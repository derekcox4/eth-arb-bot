import { Contract } from "ethers";

const routerAbi = [
  "function getAmountsOut(uint256 amountIn, address[] calldata path) external view returns (uint256[] memory amounts)"
];

export async function fetchOutput(provider, tokenIn, tokenOut, amountIn, routerAddress) {
  const router = new Contract(routerAddress, routerAbi, provider);
  const amounts = await router.getAmountsOut(amountIn, [tokenIn, tokenOut]);
  return amounts[1];
}
