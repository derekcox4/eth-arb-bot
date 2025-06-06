import { ethers } from "ethers";
import { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle";

const pairAbi = [
  "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)"
];

function getAmountOut(amountIn, reserveIn, reserveOut) {
  const amountInWithFee = amountIn * 997n;
  const numerator = amountInWithFee * reserveOut;
  const denominator = reserveIn * 1000n + amountInWithFee;
  return numerator / denominator;
}

export async function runDEXStrategy(chain) {
  console.log(`[${chain}] Scanning real DEX prices for arbitrage with execution...`);

  const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_URL);
  const wallet = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY, provider);

  const pairAddress = process.env.UNISWAP_PAIR;
  const routerAddress = process.env.UNISWAP_ROUTER;
  if (!pairAddress || !routerAddress) {
    console.log("Missing UNISWAP_PAIR or UNISWAP_ROUTER env vars");
    return;
  }

  const pair = new ethers.Contract(pairAddress, pairAbi, provider);
  const [reserve0, reserve1] = await pair.getReserves();
  const price = Number(reserve1) / Number(reserve0);
  console.log(`Current price token0 -> token1: ${price}`);

  const amountIn = ethers.parseEther("1");
  const amountOut = getAmountOut(amountIn, reserve0, reserve1);
  const amountOutNum = Number(ethers.formatUnits(amountOut, 18));
  const slippageOut = amountOutNum * 0.99;
  console.log(`Simulated output after slippage: ${slippageOut}`);

  const feeData = await provider.getFeeData();
  const gasPrice = feeData.gasPrice ?? feeData.maxFeePerGas ?? 0n;
  const gasCost = Number(ethers.formatEther(gasPrice * 150000n));
  const gasCostToken1 = gasCost * price;
  const expectedOut = Number(ethers.formatEther(amountIn)) * price;
  const profit = slippageOut - expectedOut - gasCostToken1;

  console.log(`Estimated profit in token1: ${profit}`);
  if (profit <= 0) {
    console.log("Trade not profitable after slippage and gas.");
    return;
  }

  console.log("Potentially profitable trade found!");
  if (process.env.REAL_EXECUTION === "true") {
    const routerAbi = [
      "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) payable"
    ];
    const router = new ethers.Contract(routerAddress, routerAbi, wallet);

    const tx = await router.populateTransaction.swapExactETHForTokens(
      0,
      [process.env.WETH_ADDRESS, process.env.TOKEN_OUT_ADDRESS],
      wallet.address,
      Math.floor(Date.now() / 1000) + 60
    );
    tx.value = amountIn;

    const flashbotsProvider = await FlashbotsBundleProvider.create(
      provider,
      wallet,
      process.env.FLASHBOTS_RELAY_URL
    );
    const blockNumber = await provider.getBlockNumber();
    const bundleResponse = await flashbotsProvider.sendBundle(
      [{ signer: wallet, transaction: tx }],
      blockNumber + 1
    );
    console.log("Sent Flashbots bundle", bundleResponse.bundleHash);
  }
}
