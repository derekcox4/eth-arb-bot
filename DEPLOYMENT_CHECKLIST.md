# 🚀 Deployment Checklist

Use this checklist to deploy your Bobo Shooter game with Solana token rewards.

## Pre-Deployment

- [ ] Install all prerequisites (Node.js, Solana CLI, Anchor, Rust)
- [ ] Run `npm install` successfully
- [ ] Create Solana wallet with `solana-keygen new`
- [ ] Get devnet SOL from faucet (need ~2 SOL for testing)
- [ ] Copy `.env.example` to `.env`

## Token Deployment

- [ ] Run `npm run deploy-token`
- [ ] Save the token mint address
- [ ] Save the treasury wallet address
- [ ] Verify token info on Solscan (devnet)
- [ ] Confirm supply is capped (mint authority = null)

## Configuration

- [ ] Update `src/config/gameConfig.js` with token mint address
- [ ] Update `src/config/gameConfig.js` with treasury wallet address
- [ ] Verify entry fee amount (default 0.01 SOL)
- [ ] Verify max tokens per game (default 1,000)
- [ ] Verify max supply (default 10,000,000)

## Smart Contract (Optional)

- [ ] Run `anchor build` successfully
- [ ] Deploy with `anchor deploy`
- [ ] Copy program ID from deployment output
- [ ] Update `Anchor.toml` with program ID
- [ ] Update `programs/bobo-game/src/lib.rs` with program ID (declare_id!)
- [ ] Rebuild with `anchor build`
- [ ] Redeploy with `anchor deploy`
- [ ] Verify program on Solana Explorer

## Liquidity Pool

- [ ] Run `npm run init-pool` for instructions
- [ ] Choose DEX (Raydium recommended)
- [ ] Prepare liquidity (e.g., 10 SOL + 100,000 $BOBO)
- [ ] Create pool on chosen DEX
- [ ] Verify pool exists on Jupiter
- [ ] Test swap (buy/sell small amount)
- [ ] Share pool address with users

## Frontend Testing

- [ ] Run `npm run dev`
- [ ] Connect Phantom wallet
- [ ] Verify wallet connection works
- [ ] Verify SOL balance displays correctly
- [ ] Pay entry fee and start game
- [ ] Play game and verify scoring works
- [ ] Complete game and verify token reward
- [ ] Check token balance increased
- [ ] Test weapon upgrade (burn tokens)
- [ ] Test lottery (burn tokens for chance)
- [ ] Verify all UI elements display correctly

## Production Deployment

### Mainnet Preparation
- [ ] Switch Solana CLI to mainnet: `solana config set --url mainnet-beta`
- [ ] Fund mainnet wallet with SOL (need ~5-10 SOL)
- [ ] Update `src/App.jsx` to use `WalletAdapterNetwork.Mainnet`
- [ ] Run mainnet token deployment
- [ ] Update config with mainnet addresses
- [ ] Deploy mainnet smart contract (if using)
- [ ] Create mainnet liquidity pool

### Frontend Hosting
- [ ] Build production app: `npm run build`
- [ ] Test production build locally: `npm run preview`
- [ ] Choose hosting platform (Vercel, Netlify, IPFS, etc.)
- [ ] Deploy to hosting platform
- [ ] Verify custom domain (optional)
- [ ] Test on production URL

### Security
- [ ] Audit smart contract code
- [ ] Set up multisig for treasury (recommended)
- [ ] Implement rate limiting (if needed)
- [ ] Add monitoring and alerts
- [ ] Prepare incident response plan

## Post-Deployment

### Marketing
- [ ] Create Twitter account
- [ ] Create Discord server
- [ ] Submit to play-to-earn directories
- [ ] Create demo video
- [ ] Write announcement blog post
- [ ] Share on Solana community forums

### Monitoring
- [ ] Set up Solscan alerts for token
- [ ] Monitor liquidity pool on Birdeye
- [ ] Track game metrics (plays, rewards, burns)
- [ ] Monitor treasury balance
- [ ] Track lottery pool growth

### Community
- [ ] Create game tutorial
- [ ] Set up support channels
- [ ] Build community guidelines
- [ ] Plan token events/competitions
- [ ] Gather player feedback

## Maintenance

### Regular Tasks
- [ ] Monitor gas/transaction fees
- [ ] Check treasury SOL balance
- [ ] Review lottery pool size
- [ ] Analyze token distribution
- [ ] Update game based on feedback

### Emergency Procedures
- [ ] Backup treasury keys (secure location)
- [ ] Document wallet recovery process
- [ ] Prepare for potential exploits
- [ ] Have rollback plan for frontend
- [ ] Maintain communication channels

## Success Metrics

Track these metrics to measure success:

- [ ] Total games played
- [ ] Unique players
- [ ] Total tokens distributed
- [ ] Total tokens burned
- [ ] Lottery pool size
- [ ] Token price trend
- [ ] Liquidity depth
- [ ] Community size

## Troubleshooting

Common issues and solutions:

| Issue | Solution |
|-------|----------|
| "Insufficient funds" | Get more SOL from faucet or fund wallet |
| "Transaction failed" | Check RPC endpoint, try again, or use different RPC |
| "Wallet not connecting" | Clear browser cache, try different wallet |
| "Token not showing" | Manually add token using mint address |
| "Game not loading" | Check browser console, verify RPC connection |

## Support Resources

- **Solana Discord**: https://discord.gg/solana
- **Phantom Support**: https://help.phantom.app/
- **Anchor Docs**: https://book.anchor-lang.com/
- **This Project Issues**: Open issue on GitHub

---

**Good luck with your deployment! 🚀**

Once complete, don't forget to:
1. Backup your keypairs
2. Share with the community
3. Monitor regularly
4. Iterate based on feedback
