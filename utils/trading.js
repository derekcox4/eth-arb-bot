import { ethers } from "ethers";
import { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle";

const UNISWAP_ROUTER_ABI = [
  "function getAmountsOut(uint256 amountIn, address[] memory path) view returns (uint256[] memory amounts)",
  "function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) returns (uint256[] memory amounts)"
];

export async function executeSwap(provider, privateKey, tokenIn, tokenOut, amountIn) {
  const wallet = new ethers.Wallet(privateKey, provider);
  const router = new ethers.Contract(process.env.UNISWAP_ROUTER_ADDRESS, UNISWAP_ROUTER_ABI, wallet);

  const path = [tokenIn, tokenOut];
  const amounts = await router.getAmountsOut(amountIn, path);
  const amountOutMin = amounts[1];

  const txRequest = await router.populateTransaction.swapExactTokensForTokens(
    amountIn,
    amountOutMin,
    path,
    wallet.address,
    Math.floor(Date.now() / 1000) + 60 * 20
  );

  const network = await provider.getNetwork();
  const baseTx = {
    ...txRequest,
    chainId: network.chainId,
    type: 2,
    maxFeePerGas: ethers.parseUnits("30", "gwei"),
    maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"),
    gasLimit: ethers.toBigInt(200000)
  };

  const signedTx = await wallet.signTransaction(baseTx);
  const flashbotsProvider = await FlashbotsBundleProvider.create(
    provider,
    wallet,
    process.env.FLASHBOTS_RELAY_URL
  );

  const bundleResponse = await flashbotsProvider.sendRawBundle(
    [signedTx],
    (await provider.getBlockNumber()) + 1
  );

  return bundleResponse;
}
