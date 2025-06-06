export function getTokenList() {
  // Simplified static token list. In reality this could be fetched from
  // an API or token list provider.
  return [
    {
      symbol: "WETH",
      address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      decimals: 18,
    },
    {
      symbol: "USDC",
      address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606EB48",
      decimals: 6,
    },
    {
      symbol: "USDT",
      address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      decimals: 6,
    },
    {
      symbol: "DAI",
      address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      decimals: 18,
    },
  ];
}
