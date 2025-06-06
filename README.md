# Ethereum Arbitrage Bot

This example project demonstrates a basic multi-chain arbitrage bot. It scans
Uniswap style routers on Ethereum, Base and Arbitrum for price differences and
logs opportunities when a spread threshold is exceeded.

## Setup

1. Copy `.env.example` to `.env` and fill in the required values.
2. Install dependencies with `npm install`.
3. Start the bot with `npm start`.

### Environment variables

```
ETHEREUM_RPC_URL=<your Ethereum RPC endpoint>
BASE_RPC_URL=<your Base RPC endpoint>
ARBITRUM_RPC_URL=<your Arbitrum RPC endpoint>

ETHEREUM_ROUTER=<router address on Ethereum>
BASE_ROUTER=<router address on Base>
ARBITRUM_ROUTER=<router address on Arbitrum>

WALLET_PRIVATE_KEY=<key used for signing transactions>
FLASHBOTS_RELAY_URL=<flashbots relay url>
OPPORTUNITY_THRESHOLD=<decimal spread threshold, e.g. 0.01 for 1%>
```

### Arbitrage detection

`runDEXStrategy` now fetches the expected output for the same token pair on
Ethereum, Base and Arbitrum using the `getAmountsOut` call. If the difference
between the highest and lowest output exceeds `OPPORTUNITY_THRESHOLD` after
accounting for fees and gas, it will log an arbitrage opportunity.
