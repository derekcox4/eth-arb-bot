# Ethereum Arbitrage Bot

This bot monitors multiple chains for arbitrage opportunities across decentralized exchanges and lending platforms.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your credentials.
3. Start the bot:
   ```bash
   npm start
   ```

## Environment Variables

The application requires RPC endpoints for each supported chain along with credentials for signing and submitting transactions.

- `ETHEREUM_RPC_URL` - RPC URL for Ethereum mainnet
- `BASE_RPC_URL` - RPC URL for the Base network
- `ARBITRUM_RPC_URL` - RPC URL for Arbitrum
- `WALLET_PRIVATE_KEY` - Private key used for signing transactions
- `FLASHBOTS_RELAY_URL` - URL of the Flashbots relay

Ensure these variables are present in your `.env` file before running the bot.
