# ETH Arbitrage Bot

This project contains a simple multi-chain arbitrage bot. It scans decentralized exchanges and lending protocols across Ethereum, Base, and Arbitrum.

The entry point for the bot is [`scripts/realTimeRunner.js`](scripts/realTimeRunner.js), which loads configuration from environment variables and periodically triggers the arbitrage strategies.

## Environment Variables

The bot expects the following variables to be defined:

- `ALCHEMY_URL` – RPC endpoint used to query chain data.
- `WALLET_PRIVATE_KEY` – Private key of the account used to sign transactions.
- `FLASHBOTS_RELAY_URL` – URL for submitting bundles to Flashbots.

These can be placed in a `.env` file or exported in your shell environment before running the bot.

## Getting Started

Install dependencies:

```bash
npm install
```

Run the bot:

```bash
npm start
```

This will run `node scripts/realTimeRunner.js` using the environment variables you provide.
