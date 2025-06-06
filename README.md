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
REAL_EXECUTION=<true to send real txs>
```

### Arbitrage detection

`runDEXStrategy` fetches prices for common token pairs across Ethereum, Base and
Arbitrum. When the difference between the highest and lowest output exceeds
`OPPORTUNITY_THRESHOLD` (after a gas/fee buffer) the bot logs an opportunity and
will execute the swap if `REAL_EXECUTION=true`.

The bot also checks Aave and Compound lending rates for profitable borrow/lend
cycles and logs cross-layer price gaps (L1 vs L2) for potential bridging
arbitrage.
