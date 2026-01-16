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
  minBurnForLottery: 50, // Minimum tokens to burn for lottery entry

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

  // Placeholder addresses (replace with real ones after deployment)
  tokenMint: 'TokenMintAddressWillBeGeneratedOnDeployment111111',
  treasuryWallet: 'TreasuryWalletAddressWillBeGeneratedOnDeploy111',

  // Chainlink VRF (for provably fair lottery)
  vrfCoordinator: 'VRFCoordinatorAddressWillBeSet11111111111111',
  vrfSubscriptionId: 0, // Set after VRF subscription created

  // Game settings
  gameWidth: 800,
  gameHeight: 600,

  // Token decimals
  tokenDecimals: 9
};
