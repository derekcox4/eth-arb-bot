import { LAMPORTS_PER_SOL } from '@solana/web3.js';

export const GameConfig = {
  // Token branding
  tokenName: 'PEW',
  tokenSymbol: '$PEW',

  // Game economics
  entryFee: 0.01, // SOL (roughly $1 when SOL is $100)
  entryFeeLamports: 0.01 * LAMPORTS_PER_SOL,
  maxTokensPerGame: 1000, // Maximum tokens you can earn per game
  maxSupply: 10000000, // 10 million total token supply

  // Upgrade costs (in tokens) - these get recycled back to treasury
  upgradeCosts: {
    2: 100,
    3: 250,
    4: 500,
    5: 1000
  },

  // Rate limiting (anti-abuse)
  maxGamesPerHour: 10, // Maximum games a wallet can play per hour
  rateLimitWindow: 3600000, // 1 hour in milliseconds
  minTimeBetweenGames: 60000, // 1 minute cooldown between games

  // Daily Leaderboard & Prize Distribution
  dailyResetTime: '00:00', // UTC midnight
  leaderboardSize: 10, // Top 10 players
  prizeDistribution: {
    // Percentage of daily pot for each position
    1: 25,   // 1st place: 25%
    2: 18,   // 2nd place: 18%
    3: 13,   // 3rd place: 13%
    4: 10,   // 4th place: 10%
    5: 8,    // 5th place: 8%
    6: 7,    // 6th place: 7%
    7: 6,    // 7th place: 6%
    8: 5,    // 8th place: 5%
    9: 4,    // 9th place: 4%
    10: 4    // 10th place: 4%
    // Total: 100%
  },
  potAllocationFromEntry: 0.75, // 75% of entry fee goes to daily pot, 25% to treasury

  // Placeholder addresses (replace with real ones after deployment)
  tokenMint: 'TokenMintAddressWillBeGeneratedOnDeployment111111',
  treasuryWallet: 'TreasuryWalletAddressWillBeGeneratedOnDeploy111',

  // Game settings
  gameWidth: 800,
  gameHeight: 600,

  // Token decimals
  tokenDecimals: 9
};
