# ETH Arbitrage Bot

This project contains a simple framework for arbitrage strategies across multiple Ethereum-based networks.

## Environment Variables
Create a `.env` file with the following variables:

```
ALCHEMY_URL=
WALLET_PRIVATE_KEY=
FLASHBOTS_RELAY_URL=
UNISWAP_ROUTER_ADDRESS=
TOKEN_IN_ADDRESS=
TOKEN_OUT_ADDRESS=
```

`ALCHEMY_URL` should point to a JSON-RPC endpoint, `WALLET_PRIVATE_KEY` is the private key used for signing and submitting transactions and `FLASHBOTS_RELAY_URL` is the relay endpoint for Flashbots bundles.
`UNISWAP_ROUTER_ADDRESS` is the router contract used for swaps. `TOKEN_IN_ADDRESS` and `TOKEN_OUT_ADDRESS` are the ERC20 tokens being exchanged.
