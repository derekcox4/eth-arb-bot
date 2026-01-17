# 🎯 PEW SHOOTER - Solana Play-to-Earn Game

A secure, production-ready play-to-earn shooting game built on Solana where players earn $PEW tokens and compete for SOL prizes. Features daily leaderboards, weapon upgrades with token recycling, NFT trophies for winners, and transparent developer revenue tracking.

## 🌟 Key Features

### 🎮 Game Mechanics
- **Phaser.js browser-based shooter** - Fast, fun, accessible gameplay
- **Entry fee**: ~$1 worth of SOL (0.01 SOL configurable) to play
- **Score-based rewards**: Each point = 1 $PEW token (capped at 1,000/game)
- **60-second gameplay** with progressively harder enemies
- **Rate limiting**: 10 games/hour with 60s cooldown (prevents abuse)

### 💰 Token Economics
- **Capped supply**: 10,000,000 $PEW tokens (no more can ever be minted)
- **Max earn per game**: 1,000 tokens (prevents inflation)
- **Token utility**:
  - **Weapon Upgrades** (Level 2-4) - Tokens RECYCLED to treasury
  - **DEX Trading** - Trade on Raydium, Orca, Jupiter

### ⚔️ Weapon Upgrades (Token Recycling)
- **Level 2**: 100 $PEW - Double shots
- **Level 3**: 250 $PEW - Triple shots + auto-fire
- **Level 4**: 500 $PEW - Triple shots + faster fire rate

**💡 Key Feature:** Tokens used for upgrades are **transferred back to treasury** for redistribution to future players, NOT burned. This creates a sustainable economy!

### 🏆 Daily Leaderboard & Prize System
- **75% of entry fees** go to daily prize pool
- **25% of entry fees** go to developer revenue
- **Top 10 players** split the daily pot at midnight UTC
- **Prize distribution**:
  - 🥇 1st Place: 25% of pot
  - 🥈 2nd Place: 18% of pot
  - 🥉 3rd Place: 13% of pot
  - 4th-10th: Decreasing percentages (10%, 8%, 7%, 6%, 5%, 4%, 4%)
- **Only best daily score counts** - Play multiple times to improve your rank
- **NFT Trophies** - Top 3 players receive exclusive trophy NFTs
- **Automatic distribution** - Prizes distributed at midnight UTC
- **Skill-based competition** - No gambling, pure skill

### 🎁 New Features
- **📊 Historical Stats Dashboard** - View past leaderboards and your all-time performance
- **🐦 Social Sharing** - Share your rank on Twitter, Discord, or copy to clipboard
- **🏅 NFT Trophy System** - Top 3 players receive exclusive daily trophy NFTs
- **📈 Player Stats Tracking** - Track your days played, total games, best score, and top 10 finishes
- **⏰ Real-time Countdown** - Live timer showing when leaderboard resets
- **💰 Transparent Revenue** - Developer revenue tracked on-chain and withdrawable anytime

### 🔒 Security Features
- ✅ **Rate limiting** (10 games/hour, 60s cooldown)
- ✅ **On-chain rate limiting** in Solana program
- ✅ **On-chain leaderboard** for transparency
- ✅ **Multisig treasury** support
- ✅ **Capped token supply** (mint authority removed)
- ✅ **Smart contract audit ready** (see AUDIT_CHECKLIST.md)
- ✅ **Token recycling** for sustainable economy
- ✅ **Automated prize distribution** at midnight UTC

### 📈 Tokenomics Model

```
Supply: 10,000,000 $PEW (CAPPED - mint authority removed)

Distribution:
├── Treasury Reserve: 9,900,000 (99%) - For player rewards
├── Initial Liquidity: 100,000 (1%) - SOL-PEW pool on Raydium
└── Circulating: Grows as players earn

Token Flow:
Entry Fee (0.01 SOL)
    ├── 75% (0.0075 SOL) → Daily Prize Pool (for top 10 players)
    └── 25% (0.0025 SOL) → Dev Revenue (withdrawable anytime)

Player Earns Tokens:
    Treasury → Player (based on score, max 1,000/game)

Weapon Upgrades:
    Player → Treasury (tokens RECYCLED for redistribution) ♻️

Prize Distribution (Midnight UTC):
    Daily Prize Pool → Top 10 Players (based on rank percentages)
```

**Developer Revenue:**
- You earn **25% of every entry fee** automatically
- Tracked on-chain in `game_state.dev_revenue`
- Withdraw anytime using `withdraw_dev_revenue` function
- At 1,000 games/day = **2.5 SOL/day** = **~$250/day** (at $100/SOL)
- See `DEV_REVENUE_GUIDE.md` for detailed projections

## 🚀 Quick Start

### Prerequisites

```bash
# Node.js v18+
node --version

# Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Anchor (for smart contract deployment)
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest

# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Get devnet SOL for testing
solana-keygen new
solana airdrop 2
# Or visit: https://faucet.solana.com
```

## 📦 Deployment

### Step 1: Deploy $PEW Token

```bash
npm run deploy-token
```

This will:
- Create an SPL token with 9 decimals
- Mint 10,000,000 $PEW tokens to treasury
- **Remove mint authority** (caps supply forever - cannot be undone!)
- Save deployment info to `deployment-info.json`

**⚠️ IMPORTANT:** Save the output addresses!

### Step 2: Configure Game

Edit `src/config/gameConfig.js`:

```javascript
export const GameConfig = {
  tokenName: 'PEW',
  tokenSymbol: '$PEW',

  // Replace with your deployed addresses:
  tokenMint: 'YOUR_TOKEN_MINT_ADDRESS_HERE',
  treasuryWallet: 'YOUR_TREASURY_WALLET_ADDRESS_HERE',

  // Optionally adjust economics:
  entryFee: 0.01, // SOL
  maxTokensPerGame: 1000,
  maxGamesPerHour: 10,
  minTimeBetweenGames: 60000, // 60 seconds
};
```

### Step 3: Deploy Game Program (Optional)

The Solana program handles on-chain game logic with rate limiting and VRF lottery.

```bash
# Build program
anchor build

# Deploy to devnet
anchor deploy

# Update program ID in Anchor.toml and lib.rs
# Rebuild and redeploy
anchor build
anchor deploy
```

### Step 4: Set Up Multisig Treasury (Production)

For mainnet, use a multisig wallet:

**Option A: Squads Protocol (Recommended)**
```bash
# Visit https://squads.so/
# Create 3-of-5 or 2-of-3 multisig
# Update gameConfig.js with multisig address
```

**Option B: Goki Smart Wallet**
```bash
# Visit https://goki.so/
# Configure multisig parameters
```

See `SECURITY.md` for detailed multisig setup.

### Step 5: Integrate VRF (Production Required!)

**⚠️ Current lottery uses pseudo-random numbers (demo only).**

For production, integrate Switchboard or Orao VRF:

```bash
# Option A: Switchboard VRF
npm install @switchboard-xyz/solana.js
# Docs: https://docs.switchboard.xyz/randomness

# Option B: Orao VRF
npm install @orao-network/solana-vrf
# Docs: https://docs.orao.network/
```

See `SECURITY.md` for VRF integration guide.

### Step 6: Create Liquidity Pool

```bash
npm run init-pool
```

Follow instructions to create liquidity on:
- **Raydium**: 10 SOL + 100,000 $PEW (recommended)
- **Orca**: 5 SOL + 50,000 $PEW

This enables trading on Jupiter and other DEX aggregators.

### Step 7: Run the Game

```bash
# Development
npm run dev

# Production build
npm run build
npm run preview
```

Visit http://localhost:3000 to play!

## 🔒 Security (Production Checklist)

Before mainnet deployment:

### Critical Requirements:
- [ ] **Professional security audit** ($25k-60k, 2-4 weeks)
- [ ] **Multisig treasury** (3-of-5 or better)
- [ ] **VRF integration** (Switchboard or Orao)
- [ ] **All audit findings resolved**
- [ ] **Bug bounty program launched**

### Recommended:
- [ ] Emergency pause mechanism
- [ ] Time-locked large withdrawals
- [ ] Transaction monitoring & alerts
- [ ] Incident response plan documented
- [ ] Regular code reviews

**See SECURITY.md for complete security guide.**
**See AUDIT_CHECKLIST.md for audit preparation.**

## 🎮 How to Play

1. **Connect Wallet** - Use Phantom, Solflare, or other Solana wallet
2. **Pay Entry Fee** - 0.01 SOL (~$1) to start
3. **Play Game**:
   - Arrow keys to move
   - Spacebar to shoot
   - Survive 60 seconds
   - Shoot enemies for points
4. **Earn Tokens** - Score points to earn $PEW (max 1,000/game)
5. **Compete for Prizes**:
   - Your best daily score counts toward leaderboard
   - Reach top 10 to win SOL prizes at midnight UTC
   - Top 3 receive exclusive NFT trophies
6. **Upgrade Weapons** - Use $PEW tokens to upgrade (tokens recycled) ♻️
7. **Share Your Rank** - Show off your achievements on social media 🐦

### Rate Limits (Anti-Abuse)
- **10 games per hour** maximum
- **60-second cooldown** between games
- Prevents bot farming and abuse
- Enforced both client-side and on-chain

## 💡 Tokenomics Deep Dive

### Supply Dynamics

```
Initial State:
- Total Supply: 10,000,000 $PEW
- Treasury: 9,900,000 (for rewards)
- Liquidity Pool: 100,000

After 100 Games (avg 500 tokens each):
- Players Earned: 50,000
- Treasury: 9,850,000
- Circulating: 150,000

After 100 Upgrades (avg 200 tokens each):
- Tokens Recycled: 20,000
- Treasury: 9,870,000 ↑ (replenished!)
- Circulating: 130,000

After 50 Lottery Entries (avg 100 tokens each):
- Tokens Burned: 5,000
- Total Supply: 9,995,000 ↓ (deflationary!)
- Circulating: 125,000
```

### Price Discovery

With initial liquidity of **10 SOL + 100,000 $PEW**:

- **Initial price**: ~$0.01 per $PEW (if SOL = $100)
- **After 50k burned**: ~$0.012 per $PEW (+20%)
- **After 100k burned**: ~$0.0133 per $PEW (+33%)
- **After 500k burned**: ~$0.02 per $PEW (+100%)

**Price factors:**
1. Token burns (lottery) → Supply decreases → Price up
2. Token recycling (upgrades) → Supply stable → Price stable
3. Player earning → Circulating increases → Potential sell pressure
4. Buy pressure from new players → Price up

## 📊 Example Scenarios

### Scenario 1: Grinder Strategy
1. Play 10 games (max daily) → Earn ~5,000 $PEW
2. Don't upgrade weapons yet
3. Accumulate 20,000 $PEW over 4 days
4. Trade on Jupiter for profit

**ROI:** If price 2x, gain ~$200 from $4 investment (10 games × $0.40)

### Scenario 2: Upgrade Path
1. Play with Level 1 weapon → Earn 300-500 per game
2. Upgrade to Level 2 (100 $PEW) → Earn 500-700 per game
3. Upgrade to Level 3 (250 $PEW) → Earn 700-900 per game
4. Efficiency boost: +50% earnings

### Scenario 3: Lottery Gambler
1. Accumulate 500 $PEW
2. Burn for 25% win chance
3. If win: Get 10% of lottery pool (could be 2+ SOL = $200!)
4. If lose: Tokens burned, reducing supply (benefits all holders)

**Expected value:** 0.25 × (pool × 0.1) - 500 × price

## 🛠️ Technical Architecture

### Frontend
- **React** - UI framework
- **Vite** - Build tool & dev server
- **Phaser.js** - Game engine
- **@solana/wallet-adapter** - Wallet integration
- **LocalStorage** - Client-side rate limiting

### Blockchain
- **Solana** - Layer 1 blockchain (fast, cheap)
- **SPL Token** - Token standard
- **Anchor** - Smart contract framework
- **Rust** - Program language
- **Switchboard/Orao VRF** - Verifiable randomness

### Smart Contract Functions

```rust
// Initialize game state with dev wallet
initialize(entry_fee: u64, max_tokens_per_game: u64)

// Pay entry fee (75% to pot, 25% to dev)
pay_entry_fee()

// Submit score to on-chain leaderboard
submit_score(score: u64)

// Distribute daily prizes to top 10
distribute_daily_prizes()

// Winners claim their prizes
claim_prize()

// Mint NFT trophy for top 3
mint_trophy_nft(rank: u8, day: i64)

// Developer withdraws accumulated revenue
withdraw_dev_revenue(amount: u64)

// Upgrade weapon (recycles tokens to treasury)
upgrade_weapon(level: u8, cost: u64)
```

See `programs/bobo-game/src/lib.rs` for full implementation.

## 📁 Project Structure

```
pew-shooter-solana/
├── src/
│   ├── game/BoboShooterGame.js       # Phaser game engine
│   ├── components/
│   │   ├── GameContainer.jsx         # React UI + wallet + rate limiting
│   │   ├── Leaderboard.jsx           # Daily leaderboard display
│   │   ├── HistoricalStats.jsx       # Historical leaderboard & player stats
│   │   └── SocialShare.jsx           # Social media sharing
│   ├── utils/
│   │   └── leaderboard.js            # Leaderboard utilities
│   ├── config/gameConfig.js          # Game & token configuration
│   ├── App.jsx                       # Main React app
│   └── main.jsx                      # Entry point
├── programs/
│   └── bobo-game/src/lib.rs          # Solana smart contract (on-chain leaderboard)
├── scripts/
│   ├── deployToken.js                # Deploy $PEW token
│   └── initLiquidityPool.js          # Liquidity pool guide
├── SECURITY.md                       # Security best practices
├── AUDIT_CHECKLIST.md                # Audit preparation
├── DAILY_LEADERBOARD.md              # Leaderboard system documentation
├── DEV_REVENUE_GUIDE.md              # Developer revenue guide
├── DEPLOYMENT_CHECKLIST.md           # Deployment steps
└── README.md                         # This file
```

## 🔗 Useful Links

### Development
- [Solana Docs](https://solana.com/developers)
- [Anchor Book](https://book.anchor-lang.com/)
- [SPL Token Guide](https://spl.solana.com/token)
- [Phaser 3 Docs](https://phaser.io/phaser3)

### Security
- [Switchboard VRF](https://docs.switchboard.xyz/randomness)
- [Orao VRF](https://docs.orao.network/)
- [Squads Multisig](https://squads.so/)
- [Sealevel Attacks](https://github.com/coral-xyz/sealevel-attacks)

### DEXes & Trading
- [Raydium](https://raydium.io/) - Create liquidity pools
- [Orca](https://www.orca.so/) - Alternative DEX
- [Jupiter](https://jup.ag/) - DEX aggregator

### Monitoring
- [Solscan](https://solscan.io/) - Block explorer
- [Birdeye](https://birdeye.so/) - Token analytics
- [Helius](https://www.helius.dev/) - Webhook monitoring

## 🎯 Roadmap

### Phase 1: Core Features ✅ (Completed)
- [x] Core game mechanics
- [x] Token deployment with capped supply
- [x] Rate limiting (10 games/hour, 60s cooldown)
- [x] Token recycling for upgrades
- [x] Daily leaderboard system
- [x] On-chain leaderboard storage
- [x] Automated prize distribution
- [x] NFT trophy system for top 3
- [x] Historical stats dashboard
- [x] Social media sharing
- [x] Developer revenue tracking
- [x] Security documentation

### Phase 2: Security (Before Mainnet)
- [ ] Professional security audit
- [ ] Multisig treasury setup (Squads Protocol)
- [ ] Bug bounty program
- [ ] Incident response plan
- [ ] Emergency pause mechanism

### Phase 3: Enhancement
- [ ] NFT weapon skins (cosmetic upgrades)
- [ ] Weekly & monthly tournaments
- [ ] Mobile version (React Native)
- [ ] Additional game modes
- [ ] Achievement system with badges
- [ ] Player profiles & statistics
- [ ] Governance (DAO for game parameters)

### Phase 4: Expansion
- [ ] Multiplayer mode
- [ ] Seasonal events with special prizes
- [ ] Cross-game token utility
- [ ] Partnerships with other Solana games
- [ ] Staking $PEW for passive rewards
- [ ] Community-created levels

## 🤝 Contributing

Contributions welcome! Areas for improvement:

- Better game graphics/sound
- Additional weapon types
- New enemy patterns
- UI/UX enhancements
- Security improvements
- Gas optimizations

## ⚠️ Disclaimers

### Security
- **Audit required before mainnet** - Current code is for educational purposes
- **Test thoroughly on devnet** before mainnet deployment
- **Use multisig for treasury** - Single key is high risk
- **Monitor for exploits** - Set up alerts and monitoring

### Legal
- Check local gaming/competition laws before launch
- Token may be considered a security in some jurisdictions
- Consult legal counsel for compliance
- Implement KYC if required by your jurisdiction
- Prize distributions may have tax implications

### Financial
- This is experimental software
- Players can lose their entry fees
- Token value can go to zero
- No guarantees of profits
- Competition-based prizes involve skill but also variance

## 📄 License

MIT License - Free to use, modify, and distribute.

See LICENSE file for details.

## 📞 Support

- **Documentation**:
  - `SECURITY.md` - Security best practices
  - `AUDIT_CHECKLIST.md` - Audit preparation
  - `DAILY_LEADERBOARD.md` - Leaderboard system details
  - `DEV_REVENUE_GUIDE.md` - Developer revenue projections
- **Issues**: Open issue on GitHub
- **Discord**: [Your Discord Server]
- **Twitter**: [@YourGameTwitter]

## 🎉 Acknowledgments

Inspired by successful Solana play-to-earn games:
- **Aurory** - Battle-to-earn mechanics
- **Star Atlas** - Space exploration & token rewards
- **STEPN** - Move-to-earn model
- **DeFi Land** - Gamified DeFi

Built with:
- Solana & Anchor
- React & Phaser.js
- Switchboard/Orao VRF
- Squads Protocol

---

## 🚀 Ready to Play?

1. Install dependencies: `npm install`
2. Deploy token: `npm run deploy-token`
3. Update config: `src/config/gameConfig.js`
4. Run game: `npm run dev`
5. Connect wallet & play!

**Remember:** Complete security checklist before mainnet!

---

**Built with ❤️ on Solana**

**Play. Compete. Earn. Win!** 🎯🏆💰

**Version:** 3.0.0 (Leaderboard Edition)
**Last Updated:** 2026-01-17

**New in 3.0:**
- Daily leaderboard with automatic prize distribution
- NFT trophies for top 3 players
- Historical stats dashboard
- Social media sharing
- Transparent developer revenue tracking
