# 🎮 BOBO SHOOTER - Solana Token Game

A play-to-earn shooting game built on Solana where players earn $BOBO tokens based on their score. Features weapon upgrades, burn-for-lottery mechanics, and tradeable tokens with capped supply.

## 🌟 Features

### Game Mechanics
- **Phaser.js browser-based shooter** - Fast, fun, accessible
- **Entry fee**: ~$1 worth of SOL (0.01 SOL) to play
- **Score-based rewards**: Each point = 1 $BOBO token (capped at 1,000/game)
- **60-second gameplay** with increasing difficulty

### Token Economics
- **Capped supply**: 10,000,000 $BOBO tokens (no more can ever be minted)
- **Max earn per game**: 1,000 tokens
- **Token utility**:
  - Upgrade weapons (Level 2-5)
  - Burn for lottery chances
  - Trade on Solana DEXes

### Weapon Upgrades
- **Level 2**: 100 $BOBO - Double shots
- **Level 3**: 250 $BOBO - Triple shots + auto-fire
- **Level 4**: 500 $BOBO - Triple shots + faster fire rate
- **Level 5**: 1,000 $BOBO - Maximum firepower

### Lottery System
- **50% of entry fees** go to lottery pool
- **Burn tokens** to enter lottery:
  - 100 tokens = 10% win chance
  - 500 tokens = 25% win chance
- **Win 10%** of the lottery pool in SOL
- **Burned tokens** are removed from circulation forever

### Trading
- Tokens are tradeable on Solana DEXes (Raydium, Orca, Jupiter)
- Liquidity pools ensure price discovery
- Deflationary mechanics through burning

## 🚀 Quick Start

### Prerequisites

```bash
# Install Node.js (v18+)
node --version

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Install Anchor (for smart contract deployment)
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Installation

```bash
# Clone the repository
cd bobo-shooter-solana

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### Get Devnet SOL

```bash
# Create a new wallet (or use existing)
solana-keygen new

# Get your address
solana address

# Get devnet SOL (for testing)
solana airdrop 2

# Visit https://faucet.solana.com for more devnet SOL
```

## 📦 Deployment

### Step 1: Deploy Token

```bash
# Deploy BOBO token with capped supply
npm run deploy-token
```

This will:
- Create an SPL token with 9 decimals
- Mint 10,000,000 $BOBO tokens to treasury
- Remove mint authority (caps supply forever)
- Save deployment info to `deployment-info.json`

**Important**: Save the output! You'll need:
- Token Mint Address
- Treasury Wallet Address

### Step 2: Update Configuration

Edit `src/config/gameConfig.js`:

```javascript
export const GameConfig = {
  // ... other settings ...

  // Replace with your deployed addresses
  tokenMint: 'YOUR_TOKEN_MINT_ADDRESS_HERE',
  treasuryWallet: 'YOUR_TREASURY_WALLET_ADDRESS_HERE',
};
```

### Step 3: Deploy Game Program (Optional)

The Solana program in `programs/bobo-game/` handles on-chain game logic.

```bash
# Build the program
anchor build

# Deploy to devnet
anchor deploy

# Update program ID in Anchor.toml and lib.rs
# Then rebuild and redeploy
anchor build
anchor deploy
```

### Step 4: Create Liquidity Pool

```bash
# Get instructions for creating liquidity
npm run init-pool
```

Follow the output to create a liquidity pool on:
- **Raydium** (recommended): 10 SOL + 100,000 $BOBO
- **Orca**: 5 SOL + 50,000 $BOBO

This enables trading on Jupiter and other DEX aggregators.

### Step 5: Run the Game

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Visit http://localhost:3000 to play!

## 🎯 How to Play

1. **Connect Wallet** - Use Phantom or Solflare
2. **Pay Entry Fee** - 0.01 SOL (~$1) to start
3. **Play Game** - Use arrow keys to move, spacebar to shoot
4. **Earn Tokens** - Score points to earn $BOBO (max 1,000/game)
5. **Upgrade or Burn**:
   - Upgrade weapons for better gameplay
   - Burn for lottery chances

## 💰 Tokenomics

### Supply Distribution

```
Total Supply: 10,000,000 $BOBO (CAPPED)
├── Treasury Reserve: 9,900,000 (99%) - For player rewards
├── Initial Liquidity: 100,000 (1%) - SOL-BOBO pool
└── Circulating: Grows as players earn, shrinks as players burn
```

### Token Flow

```
Entry Fee (0.01 SOL)
    ├── 50% → Treasury (for operations)
    └── 50% → Lottery Pool

Game Rewards
    └── Treasury → Player (based on score, max 1,000/game)

Token Burning
    ├── Weapon Upgrades → Removed from circulation
    └── Lottery Entry → Removed from circulation (+ chance to win SOL)
```

### Deflationary Mechanics

- **Capped supply** at 10M tokens
- **Burning** for upgrades and lottery
- **No new minting** possible (authority removed)
- **Price appreciates** as supply decreases

## 🛠️ Technical Architecture

### Frontend Stack
- **React** - UI framework
- **Phaser.js** - Game engine
- **Vite** - Build tool
- **@solana/wallet-adapter** - Wallet integration

### Blockchain Stack
- **Solana** - Layer 1 blockchain
- **SPL Token** - Token standard
- **Anchor** - Smart contract framework
- **Rust** - Program language

### Game Program Features
- `initialize()` - Set up game state
- `pay_entry_fee()` - Handle entry payments
- `reward_player()` - Distribute token rewards
- `burn_for_lottery()` - Lottery logic with token burning
- `upgrade_weapon()` - Burn tokens for upgrades

## 📊 Example Scenarios

### Scenario 1: Player Earns and Trades
1. Pay 0.01 SOL entry fee
2. Score 1,200 points → Earn 1,000 $BOBO (capped)
3. Trade 500 $BOBO on Jupiter for SOL
4. Keep 500 $BOBO for next upgrade

### Scenario 2: Weapon Upgrade Path
1. Play 3 games → Earn ~3,000 $BOBO
2. Upgrade to Level 2 (100 $BOBO)
3. Play with better weapon → Higher scores
4. Upgrade to Level 3 (250 $BOBO)
5. Continue progression

### Scenario 3: Lottery Strategy
1. Accumulate 500 $BOBO tokens
2. Burn for 25% win chance
3. If win: Get 10% of lottery pool (could be 1+ SOL)
4. If lose: Tokens burned, try again

## 🔒 Security Considerations

### Implemented
- ✅ Capped token supply (mint authority removed)
- ✅ Entry fee validation
- ✅ Max rewards per game enforced
- ✅ Token burning validation

### Recommendations for Production
- 🔐 Use multisig for treasury
- 🔐 Implement Chainlink VRF for lottery randomness
- 🔐 Add rate limiting for game plays
- 🔐 Audit smart contracts before mainnet
- 🔐 Time-lock large treasury operations

## 📈 Price Discovery

### Initial Price Calculation
With 10 SOL + 100,000 $BOBO initial liquidity:
- Initial price: ~0.0001 SOL per $BOBO
- At SOL = $100: **$0.01 per $BOBO**

### Price Appreciation Factors
1. **Players earning tokens** - Reduces treasury, same liquidity
2. **Token burning** - Reduces supply, increases scarcity
3. **Trading volume** - Organic price discovery
4. **Game popularity** - More players = more burning = deflationary

## 🌐 Deployment to Production

### Mainnet Deployment

```bash
# Switch to mainnet
solana config set --url https://api.mainnet-beta.solana.com

# Deploy token (will cost ~0.5 SOL)
npm run deploy-token

# Update gameConfig.js with mainnet addresses

# Build production app
npm run build

# Deploy to Vercel, Netlify, or IPFS
```

### Monitoring

- **Solscan**: Track token metrics
- **Birdeye**: Monitor price and liquidity
- **Jupiter**: Trading volume analytics
- **Your own analytics**: Track games played, tokens earned/burned

## 🤝 Contributing

This is a complete starter template. Feel free to:
- Improve game mechanics
- Add new weapons and enemies
- Enhance graphics and sound
- Implement additional token utilities
- Create mobile versions

## 📄 License

MIT License - Feel free to use this as a template for your own projects!

## 🔗 Useful Resources

### Solana Development
- [Solana Docs](https://solana.com/developers)
- [Anchor Book](https://book.anchor-lang.com/)
- [SPL Token Guide](https://spl.solana.com/token)

### Gaming
- [Phaser 3 Docs](https://phaser.io/phaser3)
- [Solana Game Development](https://solana.com/developers/guides/games)

### DEXes
- [Raydium](https://raydium.io/)
- [Orca](https://www.orca.so/)
- [Jupiter](https://jup.ag/)

## 🎮 Game Controls

- **Arrow Keys** - Move Bobo
- **Spacebar** - Shoot
- **Goal** - Survive 60 seconds and maximize score

## 💡 Tips for Players

1. **Start conservative** - Learn the game before upgrading
2. **Upgrade strategically** - Level 3 is the sweet spot
3. **Lottery timing** - Wait for pool to grow
4. **Trade wisely** - Check price on Jupiter before selling
5. **HODL burned tokens** - Deflationary = price up over time

---

**Built with** ❤️ **using Solana, Phaser.js, and React**

For support, visit our Discord or open an issue on GitHub.

**Play, Earn, Upgrade, Win!** 🚀
