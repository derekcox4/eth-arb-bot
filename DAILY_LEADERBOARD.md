# 🏆 Daily Leaderboard System

## Overview

The PEW Shooter game features a **daily competitive leaderboard** where players compete for their share of the daily prize pool. This replaces the randomized lottery system with a skill-based competition.

## How It Works

### Daily Competition
- Players compete throughout the day (resets at **midnight UTC**)
- **Only your best score** counts toward the leaderboard
- Play multiple times to improve your ranking
- **Top 10 players** share the daily prize pool

### Prize Pool
- **75% of all entry fees** go to the daily prize pool
- **25%** goes to treasury for operations
- Pool accumulates throughout the day
- Distributed to top 10 at midnight UTC

## Prize Distribution

The daily pot is distributed to the top 10 players as follows:

| Rank | Percentage | Example (10 SOL pot) |
|------|------------|---------------------|
| 🥇 1st | 25% | 2.5 SOL |
| 🥈 2nd | 18% | 1.8 SOL |
| 🥉 3rd | 13% | 1.3 SOL |
| 4th | 10% | 1.0 SOL |
| 5th | 8% | 0.8 SOL |
| 6th | 7% | 0.7 SOL |
| 7th | 6% | 0.6 SOL |
| 8th | 5% | 0.5 SOL |
| 9th | 4% | 0.4 SOL |
| 10th | 4% | 0.4 SOL |
| **Total** | **100%** | **10 SOL** |

## Example Scenarios

### Scenario 1: Early Bird
- **8:00 AM UTC**: Player scores 5,000 points → Ranked #1
- **2:00 PM UTC**: Plays again, scores 7,500 points → Still #1 (best score updated)
- **11:59 PM UTC**: Finishes day at #2 (someone beat their score)
- **Reward**: 18% of daily pot (e.g., 1.8 SOL if pot is 10 SOL)

### Scenario 2: Grinder
- Plays 10 games throughout the day (max allowed per hour = 10)
- Scores: 3k, 4k, 4.5k, 5k, 5.2k, 5.5k, 6k, 6.2k, 6.5k, 7k
- **Best score**: 7,000 points
- **Final rank**: #5
- **Reward**: 8% of daily pot (e.g., 0.8 SOL if pot is 10 SOL)

### Scenario 3: Last Minute Clutch
- **11:00 PM UTC**: Player enters for first time
- Scores 8,500 points in one game
- Jumps to #1 with 1 hour left
- No one beats them
- **Reward**: 25% of daily pot (e.g., 2.5 SOL if pot is 10 SOL)

## Mathematics

### Daily Pot Calculation
```
Entry Fee: 0.01 SOL per game
Number of Games: 1,000 (example)
Total Collected: 10 SOL

Prize Pool = 10 × 0.75 = 7.5 SOL
Treasury = 10 × 0.25 = 2.5 SOL
```

### Individual Prizes (7.5 SOL pool)
```
1st place: 7.5 × 0.25 = 1.875 SOL
2nd place: 7.5 × 0.18 = 1.350 SOL
3rd place: 7.5 × 0.13 = 0.975 SOL
...
10th place: 7.5 × 0.04 = 0.300 SOL
```

### Expected Returns

If the daily pot is **10 SOL** and **100 players** compete:

- **1st place wins**: 2.5 SOL (from 0.01 SOL investment = **250x** return!)
- **Top 10**: 1.0 SOL average (100x return)
- **Everyone else**: 0 SOL from leaderboard (but earned $PEW tokens!)

## Features

### Real-Time Updates
- Live leaderboard showing current standings
- Your current rank highlighted
- Countdown to daily reset
- Prize amount preview based on current pot

### Best Score Tracking
- System tracks your personal best for the day
- Can play unlimited games (within rate limits)
- Each game either improves your rank or doesn't affect it
- Strategy: Keep playing to climb the leaderboard!

### Daily Reset
- Leaderboard clears at midnight UTC
- Fresh start for everyone
- Previous day's winners can claim prizes
- Archive of past leaderboards (optional)

## Technical Implementation

### Client-Side (src/utils/leaderboard.js)
```javascript
// Store leaderboard in localStorage
- getCurrentDay(): Returns YYYY-MM-DD
- updateLeaderboard(wallet, score, tokens): Updates player's score
- getTopPlayers(n): Returns top N players
- getPlayerRank(wallet): Returns player's rank
- calculatePrize(rank, pot): Calculates SOL prize for rank
```

### Daily Reset
```javascript
// Automatic at midnight UTC
if (getCurrentDay() !== lastResetDay) {
  archiveLeaderboard(lastDay);
  clearLeaderboard();
  startNewDay();
}
```

### Prize Distribution (On-Chain - Future)
```rust
// Solana program function
pub fn distribute_daily_prizes(ctx: Context<DistributePrizes>) {
  let daily_pot = ctx.accounts.daily_pot.amount;
  let leaderboard = ctx.accounts.leaderboard.top_players;

  for (rank, player) in leaderboard.iter().enumerate() {
    let prize = calculate_prize(rank + 1, daily_pot);
    transfer_sol(treasury -> player, prize)?;
  }
}
```

## Advantages Over Lottery

### Skill-Based ✅
- **Lottery**: Random chance, no skill involved
- **Leaderboard**: Skill determines winnings

### Predictable ✅
- **Lottery**: Unknown win chances, random outcomes
- **Leaderboard**: Clear prize structure, know your potential winnings

### Engaging ✅
- **Lottery**: One-time burn, then wait
- **Leaderboard**: Continuous competition, strategic timing

### Fair ✅
- **Lottery**: Whales can buy more chances
- **Leaderboard**: Rate limits ensure equal opportunity (10 games/hour max)

### Transparent ✅
- **Lottery**: Can't verify randomness easily
- **Leaderboard**: Public rankings, verifiable scores

## Strategies to Win

### 1. Early Bird Strategy
- Play early in the day to establish position
- Monitor leaderboard throughout the day
- Play again if someone beats your score
- Defend your position

### 2. Last Minute Strategy
- Wait until late in the day
- See what score you need to beat
- One perfect game at the end
- Risk: Less attempts if you fail

### 3. Grinder Strategy
- Play maximum games allowed (10/hour)
- Consistent improvement
- Weapon upgrades help
- Volume increases best score chance

### 4. Weapon Investment
- Use $PEW tokens to upgrade weapons early
- Higher weapon level = higher scores easier
- Better scores = better ranking
- ROI from prize winnings

## Rate Limiting Integration

To ensure fairness:
- **10 games per hour** maximum
- **60-second cooldown** between games
- Prevents bot spam
- Levels playing field

Even with limits:
- **240 games possible per day** (24 hours × 10 games/hour)
- Realistically: 50-100 games if playing actively
- Enough attempts to get a great score

## Future Enhancements

### Automated Prize Distribution
- Smart contract automatically distributes at midnight UTC
- Winners claim directly from contract
- Transparent, verifiable, instant

### NFT Trophies
- Daily winners receive NFT trophies
- Collectible proof of victory
- Leaderboard hall of fame

### Seasonal Competition
- Weekly/monthly aggregate leaderboards
- Bigger prize pools for top performers
- Championship tournaments

### Team Competitions
- Guild/clan system
- Combined scores
- Team prize pools

## Comparison: Old vs New

| Feature | Old (Lottery) | New (Leaderboard) |
|---------|--------------|-------------------|
| **Mechanism** | Burn tokens for random chance | Compete for best daily score |
| **Skill Factor** | 0% (pure luck) | 100% (skill-based) |
| **Predictability** | Unknown | Clear prize structure |
| **Engagement** | One-time | Continuous throughout day |
| **Fairness** | Whales can buy more chances | Rate limits ensure equality |
| **Token Burn** | Yes | No (only upgrades recycle) |
| **Prize Source** | Accumulated lottery pool | Daily entry fees |
| **Winners** | 1 random winner | Top 10 skilled players |
| **Transparency** | VRF required | Public leaderboard |

## Economic Impact

### Token Economy
- **Before**: Both upgrades and lottery burned tokens
- **After**: Only upgrades recycle tokens (sustainable!)
- **Result**: More sustainable long-term economy

### Prize Pool
- **Before**: Lottery pool could be depleted
- **After**: Daily pot resets, always has prizes
- **Result**: Consistent rewards for winners

### Player Retention
- **Before**: Lose tokens, maybe win nothing
- **After**: Compete for guaranteed prize share
- **Result**: Higher engagement, more retention

## Implementation Status

✅ **Completed**:
- Leaderboard data structure
- Daily reset mechanism
- Prize distribution calculation
- Real-time UI updates
- Countdown timer to reset
- Current rank display
- Best score tracking

⏳ **In Progress**:
- On-chain leaderboard storage
- Automated prize distribution
- Winner notification system

📅 **Planned**:
- Historical leaderboard archive UI
- Statistics dashboard
- Achievement system
- Social sharing features

---

**The daily leaderboard transforms PEW Shooter from a gambling game into a competitive esport!** 🏆

Players now compete on skill, not luck, making the game more engaging, fair, and rewarding for talented players.
