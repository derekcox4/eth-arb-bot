import { LAMPORTS_PER_SOL } from '@solana/web3.js';

export const GameConfig = {
  // Game economics
  entryFee: 0.01, // SOL (roughly $1 when SOL is $100)
  entryFeeLamports: 0.01 * LAMPORTS_PER_SOL,
  maxTokensPerGame: 1000, // Maximum tokens you can earn per game
  maxSupply: 10000000, // 10 million total token supply
  minBurnForLottery: 50, // Minimum tokens to burn for lottery entry

  // Upgrade costs (in tokens)
  upgradeCosts: {
    2: 100,
    3: 250,
    4: 500,
    5: 1000
  },

  // Placeholder addresses (replace with real ones after deployment)
  tokenMint: 'TokenMintAddressWillBeGeneratedOnDeployment111111',
  treasuryWallet: 'TreasuryWalletAddressWillBeGeneratedOnDeploy111',

  // Game settings
  gameWidth: 800,
  gameHeight: 600,

  // Token decimals
  tokenDecimals: 9
};
