# ETH Arbitrage Bot

Simple multi-chain arbitrage bot example.

## Environment Variables
Create a `.env` file in the project root with the following variables:

```bash
# RPC endpoints
ETHEREUM_URL=<your Ethereum RPC URL>
BASE_URL=<your Base RPC URL>
ARBITRUM_URL=<your Arbitrum RPC URL>

# Flashbots and wallet
WALLET_PRIVATE_KEY=<private key>
FLASHBOTS_RELAY_URL=<relay url>
ALCHEMY_URL=<fallback RPC url>
```

`ETHEREUM_URL`, `BASE_URL`, and `ARBITRUM_URL` provide chain-specific RPC endpoints used by the DEX strategy.
