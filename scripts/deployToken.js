import { Connection, Keypair, PublicKey, clusterApiUrl } from '@solana/web3.js';
import {
  createMint,
  getMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  setAuthority,
  AuthorityType
} from '@solana/spl-token';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Deploy BOBO token with capped supply
 * This script creates an SPL token with a maximum supply cap
 */
async function deployToken() {
  try {
    console.log('🚀 Starting BOBO Token Deployment...\n');

    // Connect to Solana devnet (change to mainnet-beta for production)
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

    // Load deployer wallet from environment or generate new one
    let payer;
    if (process.env.DEPLOYER_PRIVATE_KEY) {
      const secretKey = Uint8Array.from(JSON.parse(process.env.DEPLOYER_PRIVATE_KEY));
      payer = Keypair.fromSecretKey(secretKey);
    } else {
      payer = Keypair.generate();
      console.log('⚠️  No DEPLOYER_PRIVATE_KEY found, generated new keypair');
      console.log('Public Key:', payer.publicKey.toString());
      console.log('Save this private key to .env:');
      console.log(`DEPLOYER_PRIVATE_KEY=[${Array.from(payer.secretKey)}]\n`);
    }

    // Check balance
    const balance = await connection.getBalance(payer.publicKey);
    console.log('💰 Deployer balance:', balance / 1e9, 'SOL');

    if (balance < 0.1 * 1e9) {
      console.log('⚠️  Low balance! Visit https://faucet.solana.com to get devnet SOL');
      console.log('   Address:', payer.publicKey.toString());
    }

    // Create token mint with capped supply
    console.log('\n📝 Creating BOBO token mint...');
    const decimals = 9;
    const mint = await createMint(
      connection,
      payer,
      payer.publicKey, // mint authority
      payer.publicKey, // freeze authority
      decimals
    );

    console.log('✅ Token Mint Created:', mint.toString());

    // Create token account for treasury
    console.log('\n📦 Creating treasury token account...');
    const treasuryTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mint,
      payer.publicKey
    );

    console.log('✅ Treasury Token Account:', treasuryTokenAccount.address.toString());

    // Mint maximum supply (10 million tokens)
    const maxSupply = 10_000_000;
    const amountToMint = maxSupply * Math.pow(10, decimals);

    console.log(`\n🪙 Minting ${maxSupply.toLocaleString()} BOBO tokens...`);
    await mintTo(
      connection,
      payer,
      mint,
      treasuryTokenAccount.address,
      payer,
      amountToMint
    );

    console.log('✅ Tokens minted to treasury');

    // Remove mint authority to cap supply forever
    console.log('\n🔒 Removing mint authority to cap supply...');
    await setAuthority(
      connection,
      payer,
      mint,
      payer.publicKey,
      AuthorityType.MintTokens,
      null // Setting to null removes the authority
    );

    console.log('✅ Mint authority removed - supply is now permanently capped!');

    // Verify mint info
    const mintInfo = await getMint(connection, mint);
    console.log('\n📊 Token Info:');
    console.log('   Mint Address:', mint.toString());
    console.log('   Decimals:', mintInfo.decimals);
    console.log('   Supply:', Number(mintInfo.supply) / Math.pow(10, decimals));
    console.log('   Mint Authority:', mintInfo.mintAuthority ? mintInfo.mintAuthority.toString() : 'NONE (Capped)');

    // Save deployment info
    const deploymentInfo = {
      network: 'devnet',
      tokenMint: mint.toString(),
      treasuryWallet: payer.publicKey.toString(),
      treasuryTokenAccount: treasuryTokenAccount.address.toString(),
      decimals: decimals,
      maxSupply: maxSupply,
      deployedAt: new Date().toISOString()
    };

    fs.writeFileSync(
      'deployment-info.json',
      JSON.stringify(deploymentInfo, null, 2)
    );

    console.log('\n✅ Deployment info saved to deployment-info.json');
    console.log('\n🎉 BOBO Token deployment complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Update src/config/gameConfig.js with the token mint address');
    console.log('2. Update src/config/gameConfig.js with the treasury wallet address');
    console.log('3. Run "npm run init-pool" to create a liquidity pool (optional)');
    console.log('4. Fund the treasury wallet with SOL for lottery prizes\n');

  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

deployToken();
