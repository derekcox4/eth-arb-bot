import { Connection, Keypair, PublicKey, clusterApiUrl } from '@solana/web3.js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Initialize liquidity pool for BOBO token
 *
 * This script provides instructions for creating a liquidity pool on Raydium or Orca
 * For actual pool creation, you'll need to use their SDKs or UIs
 */
async function initLiquidityPool() {
  try {
    console.log('💧 Liquidity Pool Initialization Guide\n');

    // Load deployment info
    if (!fs.existsSync('deployment-info.json')) {
      console.error('❌ deployment-info.json not found. Run "npm run deploy-token" first.');
      process.exit(1);
    }

    const deploymentInfo = JSON.parse(fs.readFileSync('deployment-info.json', 'utf8'));

    console.log('📋 Token Information:');
    console.log('   Token Mint:', deploymentInfo.tokenMint);
    console.log('   Treasury:', deploymentInfo.treasuryWallet);
    console.log('   Total Supply:', deploymentInfo.maxSupply.toLocaleString(), '$BOBO\n');

    console.log('🏊 Options for Creating Liquidity:');
    console.log('\n1️⃣  RAYDIUM (Recommended)');
    console.log('   - Visit: https://raydium.io/liquidity/create/');
    console.log('   - Connect wallet with tokens');
    console.log('   - Select SOL-BOBO pair');
    console.log('   - Suggested initial liquidity: 10 SOL + 100,000 BOBO');
    console.log('   - This creates a tradable market\n');

    console.log('2️⃣  ORCA');
    console.log('   - Visit: https://www.orca.so/');
    console.log('   - Navigate to Pools');
    console.log('   - Create new pool with SOL-BOBO pair');
    console.log('   - Suggested: 5 SOL + 50,000 BOBO\n');

    console.log('3️⃣  JUPITER (Aggregator)');
    console.log('   - Jupiter will automatically find your pool once created');
    console.log('   - Players can trade BOBO on https://jup.ag/\n');

    console.log('💡 Liquidity Recommendations:');
    console.log('   - Start with 1-2% of total supply');
    console.log('   - Example: 100,000 BOBO + 10 SOL (if SOL = $100, creates ~$2000 liquidity)');
    console.log('   - This allows price discovery and trading');
    console.log('   - Lock liquidity to build trust (optional)\n');

    console.log('📊 Expected Tokenomics:');
    console.log('   - Max Supply: 10,000,000 $BOBO (capped)');
    console.log('   - Initial Circulation: ~100,000 (1% in LP)');
    console.log('   - Max earn/game: 1,000 tokens');
    console.log('   - Token utility: Weapon upgrades + Lottery\n');

    console.log('⚠️  Important Notes:');
    console.log('   - Supply is CAPPED - no more tokens can be minted');
    console.log('   - Players earn tokens from treasury reserve');
    console.log('   - Burned tokens are removed from circulation forever');
    console.log('   - Consider using a multisig for treasury management\n');

    // Calculate some example scenarios
    const lpTokens = 100000;
    const lpSol = 10;
    const initialPrice = lpSol / lpTokens;

    console.log('💰 Example Price Scenarios (10 SOL + 100k BOBO):');
    console.log(`   Initial Price: ${initialPrice} SOL per BOBO ($${(initialPrice * 100).toFixed(4)} if SOL=$100)`);
    console.log(`   After 50k tokens earned: ~$${((lpSol / (lpTokens - 50000)) * 100).toFixed(4)} per BOBO`);
    console.log(`   After 100k tokens burned: ~$${((lpSol / (lpTokens - 100000)) * 100).toFixed(4)} per BOBO`);
    console.log('   (Actual prices depend on buy/sell pressure)\n');

    console.log('✅ Once pool is created, update your game UI to show:');
    console.log('   - Current BOBO price');
    console.log('   - Trading links (Jupiter, Raydium)');
    console.log('   - Liquidity depth\n');

    console.log('🔗 Useful Links:');
    console.log('   Raydium: https://raydium.io/');
    console.log('   Orca: https://www.orca.so/');
    console.log('   Jupiter: https://jup.ag/');
    console.log('   Solscan: https://solscan.io/token/' + deploymentInfo.tokenMint);
    console.log('   Birdeye: https://birdeye.so/token/' + deploymentInfo.tokenMint + '?chain=solana\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

initLiquidityPool();
