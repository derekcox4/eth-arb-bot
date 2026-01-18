/**
 * SynapseChain - Cross-Chain Bridge System
 * Enables asset transfers between SynapseChain and other blockchains
 */

import { hash, generateKeyPair, verifySignature } from './crypto.js';
import Transaction from './transaction.js';

export class BridgeMessage {
  constructor({
    sourceChain,
    destinationChain,
    sender,
    recipient,
    asset,
    amount,
    nonce,
    timestamp = Date.now()
  }) {
    this.sourceChain = sourceChain;
    this.destinationChain = destinationChain;
    this.sender = sender;
    this.recipient = recipient;
    this.asset = asset;
    this.amount = amount;
    this.nonce = nonce;
    this.timestamp = timestamp;
    this.hash = this.calculateHash();
    this.signatures = [];
    this.status = 'pending'; // pending, validated, completed, failed
  }

  calculateHash() {
    return hash({
      sourceChain: this.sourceChain,
      destinationChain: this.destinationChain,
      sender: this.sender,
      recipient: this.recipient,
      asset: this.asset,
      amount: this.amount,
      nonce: this.nonce,
      timestamp: this.timestamp
    });
  }

  addValidatorSignature(validator, signature) {
    this.signatures.push({ validator, signature });
  }

  hasQuorum(totalValidators) {
    // Require 2/3+ validators to sign
    return this.signatures.length >= Math.ceil((2 * totalValidators) / 3);
  }
}

export class CrossChainBridge {
  constructor(synapseChain) {
    this.synapseChain = synapseChain;
    this.supportedChains = new Map();
    this.pendingMessages = new Map(); // hash -> BridgeMessage
    this.completedMessages = new Map();
    this.lockedAssets = new Map(); // chain -> asset -> amount

    // Bridge validators (subset of chain validators)
    this.validators = [];

    // Asset mappings
    this.assetMappings = new Map(); // SYN asset -> external chain asset

    this.stats = {
      totalBridged: 0,
      totalVolume: 0,
      bridgesByChain: {}
    };

    this.initializeSupportedChains();
  }

  /**
   * Initialize supported blockchain integrations
   */
  initializeSupportedChains() {
    // Ethereum
    this.addSupportedChain({
      name: 'Ethereum',
      chainId: 1,
      type: 'EVM',
      rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/',
      bridgeContract: '0x...', // Would be deployed bridge contract
      confirmations: 12,
      gasToken: 'ETH'
    });

    // Binance Smart Chain
    this.addSupportedChain({
      name: 'BSC',
      chainId: 56,
      type: 'EVM',
      rpcUrl: 'https://bsc-dataseed.binance.org/',
      bridgeContract: '0x...',
      confirmations: 15,
      gasToken: 'BNB'
    });

    // Polygon
    this.addSupportedChain({
      name: 'Polygon',
      chainId: 137,
      type: 'EVM',
      rpcUrl: 'https://polygon-rpc.com/',
      bridgeContract: '0x...',
      confirmations: 128,
      gasToken: 'MATIC'
    });

    // Solana
    this.addSupportedChain({
      name: 'Solana',
      chainId: 'solana-mainnet',
      type: 'Solana',
      rpcUrl: 'https://api.mainnet-beta.solana.com',
      bridgeProgram: '...', // Solana program address
      confirmations: 32,
      gasToken: 'SOL'
    });

    // Avalanche
    this.addSupportedChain({
      name: 'Avalanche',
      chainId: 43114,
      type: 'EVM',
      rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
      bridgeContract: '0x...',
      confirmations: 1,
      gasToken: 'AVAX'
    });

    console.log(`🌉 Bridge initialized with ${this.supportedChains.size} supported chains`);
  }

  addSupportedChain(chainConfig) {
    this.supportedChains.set(chainConfig.chainId, chainConfig);
    this.stats.bridgesByChain[chainConfig.name] = {
      inbound: 0,
      outbound: 0,
      volume: 0
    };
  }

  /**
   * Initiate bridge transfer FROM external chain TO SynapseChain
   */
  async bridgeIn(sourceChain, sender, recipient, asset, amount, txHash) {
    console.log(`\n🌉 Bridge IN: ${amount} ${asset} from ${sourceChain} to SynapseChain`);

    const chainConfig = this.supportedChains.get(sourceChain);
    if (!chainConfig) {
      throw new Error(`Unsupported chain: ${sourceChain}`);
    }

    // Step 1: Verify transaction on source chain
    const verified = await this.verifyExternalTransaction(
      chainConfig,
      txHash,
      sender,
      amount
    );

    if (!verified) {
      throw new Error('Could not verify transaction on source chain');
    }

    // Step 2: Create bridge message
    const message = new BridgeMessage({
      sourceChain: chainConfig.name,
      destinationChain: 'SynapseChain',
      sender,
      recipient,
      asset,
      amount,
      nonce: this.pendingMessages.size
    });

    this.pendingMessages.set(message.hash, message);

    // Step 3: Collect validator signatures
    await this.collectValidatorSignatures(message);

    // Step 4: Mint assets on SynapseChain if quorum reached
    if (message.hasQuorum(this.validators.length)) {
      await this.mintBridgedAssets(recipient, asset, amount);
      message.status = 'completed';
      this.completedMessages.set(message.hash, message);
      this.pendingMessages.delete(message.hash);

      // Update stats
      this.stats.totalBridged++;
      this.stats.totalVolume += amount;
      this.stats.bridgesByChain[chainConfig.name].inbound++;
      this.stats.bridgesByChain[chainConfig.name].volume += amount;

      console.log(`✅ Bridge IN completed: ${message.hash.slice(0, 8)}...`);
      return message;
    }

    throw new Error('Failed to reach validator quorum');
  }

  /**
   * Initiate bridge transfer FROM SynapseChain TO external chain
   */
  async bridgeOut(destinationChain, sender, recipient, asset, amount) {
    console.log(`\n🌉 Bridge OUT: ${amount} ${asset} from SynapseChain to ${destinationChain}`);

    const chainConfig = this.supportedChains.get(destinationChain);
    if (!chainConfig) {
      throw new Error(`Unsupported chain: ${destinationChain}`);
    }

    // Step 1: Verify sender has sufficient balance on SynapseChain
    const balance = this.synapseChain.getBalance(sender);
    if (balance < amount) {
      throw new Error(`Insufficient balance: ${balance} < ${amount}`);
    }

    // Step 2: Lock assets on SynapseChain
    await this.lockAssets(sender, asset, amount);

    // Step 3: Create bridge message
    const message = new BridgeMessage({
      sourceChain: 'SynapseChain',
      destinationChain: chainConfig.name,
      sender,
      recipient,
      asset,
      amount,
      nonce: this.pendingMessages.size
    });

    this.pendingMessages.set(message.hash, message);

    // Step 4: Collect validator signatures
    await this.collectValidatorSignatures(message);

    // Step 5: Submit to destination chain if quorum reached
    if (message.hasQuorum(this.validators.length)) {
      await this.submitToExternalChain(chainConfig, message);
      message.status = 'completed';
      this.completedMessages.set(message.hash, message);
      this.pendingMessages.delete(message.hash);

      // Update stats
      this.stats.totalBridged++;
      this.stats.totalVolume += amount;
      this.stats.bridgesByChain[chainConfig.name].outbound++;
      this.stats.bridgesByChain[chainConfig.name].volume += amount;

      console.log(`✅ Bridge OUT completed: ${message.hash.slice(0, 8)}...`);
      return message;
    }

    throw new Error('Failed to reach validator quorum');
  }

  /**
   * Verify transaction on external blockchain (mock implementation)
   */
  async verifyExternalTransaction(chainConfig, txHash, sender, amount) {
    console.log(`   Verifying transaction ${txHash.slice(0, 8)}... on ${chainConfig.name}`);

    // In production, this would:
    // 1. Connect to external chain RPC
    // 2. Fetch transaction by hash
    // 3. Verify it's confirmed (confirmations >= required)
    // 4. Verify sender and amount match
    // 5. Verify it's sent to our bridge contract

    // Mock verification - always succeeds for demo
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log(`   ✅ Transaction verified on ${chainConfig.name}`);
    return true;
  }

  /**
   * Collect signatures from bridge validators
   */
  async collectValidatorSignatures(message) {
    console.log(`   Collecting validator signatures...`);

    for (const validator of this.validators) {
      // Each validator verifies and signs the message
      const signature = await this.requestValidatorSignature(validator, message);
      if (signature) {
        message.addValidatorSignature(validator.address, signature);
      }
    }

    console.log(`   Collected ${message.signatures.length}/${this.validators.length} signatures`);
  }

  /**
   * Request signature from a validator
   */
  async requestValidatorSignature(validator, message) {
    // In production, validators would independently verify the bridge message
    // and sign it with their private key

    // Mock signature for demo
    await new Promise(resolve => setTimeout(resolve, 10));
    return hash({ validator: validator.address, message: message.hash });
  }

  /**
   * Mint bridged assets on SynapseChain
   */
  async mintBridgedAssets(recipient, asset, amount) {
    console.log(`   Minting ${amount} ${asset} to ${recipient.slice(0, 8)}...`);

    // Update recipient balance
    if (!this.synapseChain.state.balances[recipient]) {
      this.synapseChain.state.balances[recipient] = 0;
    }
    this.synapseChain.state.balances[recipient] += amount;

    console.log(`   ✅ Minted ${amount} ${asset}`);
  }

  /**
   * Lock assets on SynapseChain before bridging out
   */
  async lockAssets(sender, asset, amount) {
    console.log(`   Locking ${amount} ${asset} from ${sender.slice(0, 8)}...`);

    // Deduct from sender balance
    this.synapseChain.state.balances[sender] -= amount;

    // Track locked assets
    const key = `${asset}`;
    if (!this.lockedAssets.has(key)) {
      this.lockedAssets.set(key, 0);
    }
    this.lockedAssets.set(key, this.lockedAssets.get(key) + amount);

    console.log(`   ✅ Locked ${amount} ${asset}`);
  }

  /**
   * Submit transaction to external blockchain (mock implementation)
   */
  async submitToExternalChain(chainConfig, message) {
    console.log(`   Submitting to ${chainConfig.name}...`);

    // In production, this would:
    // 1. Format transaction for destination chain
    // 2. Submit to bridge contract with validator signatures
    // 3. Wait for confirmation
    // 4. Return transaction hash

    // Mock submission
    await new Promise(resolve => setTimeout(resolve, 100));
    const mockTxHash = hash({ chain: chainConfig.name, message: message.hash });
    console.log(`   ✅ Submitted to ${chainConfig.name}: ${mockTxHash.slice(0, 8)}...`);
  }

  /**
   * Add bridge validator
   */
  addValidator(validator) {
    this.validators.push(validator);
    console.log(`[Bridge] Added validator ${validator.address.slice(0, 8)}...`);
  }

  /**
   * Get bridge statistics
   */
  getStats() {
    return {
      supportedChains: Array.from(this.supportedChains.values()).map(c => c.name),
      totalBridged: this.stats.totalBridged,
      totalVolume: this.stats.totalVolume,
      pendingMessages: this.pendingMessages.size,
      completedMessages: this.completedMessages.size,
      validators: this.validators.length,
      bridgesByChain: this.stats.bridgesByChain
    };
  }

  /**
   * Get all pending bridge messages
   */
  getPendingMessages() {
    return Array.from(this.pendingMessages.values());
  }

  /**
   * Get recent completed bridges
   */
  getRecentBridges(limit = 10) {
    const completed = Array.from(this.completedMessages.values());
    return completed.slice(-limit).reverse();
  }
}

export default CrossChainBridge;
