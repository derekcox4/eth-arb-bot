/**
 * NexusChain - Main Blockchain Implementation
 * Combines HotStuff consensus, Block-STM execution, and AI optimization
 */

import Block from './block.js';
import Transaction from './transaction.js';
import HotStuffConsensus, { Validator } from './consensus.js';
import BlockSTM from './blockstm.js';
import AIAgentManager from './aiagents.js';
import { hash, generateKeyPair, publicKeyToAddress } from './crypto.js';

export class NexusChain {
  constructor() {
    this.chain = [];
    this.pendingTransactions = [];
    this.state = {
      balances: {},
      nonces: {},
      contracts: {}
    };

    // Core components
    this.consensus = new HotStuffConsensus([], 400); // 400ms block time
    this.blockSTM = new BlockSTM();
    this.aiAgents = new AIAgentManager();

    // Network
    this.difficulty = 4;
    this.miningReward = 50;
    this.blockGasLimit = 30000000;

    // Statistics
    this.stats = {
      totalTransactions: 0,
      totalBlocks: 0,
      startTime: Date.now()
    };

    // Initialize with genesis block
    this.initializeGenesis();
  }

  /**
   * Initialize blockchain with genesis block
   */
  initializeGenesis() {
    const genesisBlock = Block.genesis();
    this.chain.push(genesisBlock);
    this.stats.totalBlocks = 1;

    console.log('🚀 NexusChain initialized with genesis block');
    console.log(`   Genesis hash: ${genesisBlock.hash}`);
  }

  /**
   * Add validator to the network
   */
  addValidator(stake = 10000) {
    const { publicKey, privateKey } = generateKeyPair();
    const address = publicKeyToAddress(publicKey);

    const validator = new Validator(address, publicKey, privateKey, stake);
    this.consensus.addValidator(validator);

    // Give validator some initial balance
    this.state.balances[address] = stake * 100;

    return validator;
  }

  /**
   * Create a new wallet
   */
  createWallet() {
    const { publicKey, privateKey } = generateKeyPair();
    const address = publicKeyToAddress(publicKey);

    return {
      address,
      publicKey,
      privateKey,
      balance: 0
    };
  }

  /**
   * Get balance of an address
   */
  getBalance(address) {
    return this.state.balances[address] || 0;
  }

  /**
   * Create and sign a transaction
   */
  createTransaction(sender, senderPrivateKey, to, value, data = [], accessList = []) {
    const nonce = this.state.nonces[sender.address] || 0;

    const tx = new Transaction({
      sender: sender.address,
      nonce,
      gasPrice: 1,
      gasLimit: 100000,
      to,
      value,
      data,
      accessList
    });

    tx.signTransaction(senderPrivateKey);
    return tx;
  }

  /**
   * Add transaction to pending pool
   */
  addTransaction(transaction) {
    if (!transaction.isValid()) {
      console.error('Invalid transaction rejected');
      return false;
    }

    // Check if sender has enough balance
    const senderBalance = this.getBalance(transaction.sender);
    const totalCost = transaction.value + transaction.estimateGas();

    if (senderBalance < totalCost) {
      console.error(`Insufficient balance: ${senderBalance} < ${totalCost}`);
      return false;
    }

    this.pendingTransactions.push(transaction);
    console.log(`📝 Transaction added to mempool: ${transaction.toString()}`);
    return true;
  }

  /**
   * Mine a new block (called by validator)
   */
  async mineBlock(validatorAddress) {
    if (this.pendingTransactions.length === 0) {
      console.log('No transactions to mine');
      return null;
    }

    console.log(`\n⛏️  Mining new block with ${this.pendingTransactions.length} transactions...`);

    // Select leader for this block
    const lastBlock = this.getLatestBlock();
    const leader = this.consensus.selectLeader(lastBlock.height + 1);

    if (!leader || leader.address !== validatorAddress) {
      console.log(`Not this validator's turn. Leader: ${leader?.address}`);
      return null;
    }

    // Execute transactions in parallel using Block-STM
    this.blockSTM.reset();
    const executionResult = await this.blockSTM.executeParallel(
      this.pendingTransactions,
      this.state
    );

    // Update state
    this.state = executionResult.state;

    // Create new block
    const newBlock = new Block({
      height: lastBlock.height + 1,
      previousHash: lastBlock.hash,
      stateRoot: hash(this.state),
      transactions: this.pendingTransactions,
      validatorAddress: leader.address
    });

    // Run HotStuff consensus
    const qc = await this.consensus.reachConsensus(newBlock);

    if (!qc) {
      console.log('❌ Failed to reach consensus');
      return null;
    }

    // Attach QC to block
    newBlock.qc = qc;

    // Add block to chain
    this.chain.push(newBlock);

    // Update statistics
    this.stats.totalBlocks++;
    this.stats.totalTransactions += this.pendingTransactions.length;

    // Update nonces
    for (const tx of this.pendingTransactions) {
      this.state.nonces[tx.sender] = (this.state.nonces[tx.sender] || 0) + 1;
    }

    // Clear pending transactions
    const minedTxCount = this.pendingTransactions.length;
    this.pendingTransactions = [];

    console.log(`✅ Block #${newBlock.height} mined successfully!`);
    console.log(`   Hash: ${newBlock.hash}`);
    console.log(`   Transactions: ${minedTxCount}`);
    console.log(`   Gas used: ${newBlock.getTotalGasUsed()}`);
    console.log(`   Execution speedup: ${executionResult.speedup.toFixed(2)}x`);
    console.log(`   Conflicts: ${executionResult.conflicts}`);

    return newBlock;
  }

  /**
   * Run AI agents for optimization
   */
  async runAIOptimization() {
    if (this.chain.length < 5) {
      console.log('Not enough blocks for AI analysis yet');
      return;
    }

    await this.aiAgents.runAgents(this, this.consensus, this.blockSTM);
  }

  /**
   * Get latest block
   */
  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  /**
   * Get recent blocks
   */
  getRecentBlocks(count) {
    return this.chain.slice(-count);
  }

  /**
   * Validate entire chain
   */
  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (!currentBlock.isValid(previousBlock)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get blockchain statistics
   */
  getStats() {
    const uptime = (Date.now() - this.stats.startTime) / 1000;
    const tps = this.stats.totalTransactions / uptime;

    return {
      totalBlocks: this.stats.totalBlocks,
      totalTransactions: this.stats.totalTransactions,
      pendingTransactions: this.pendingTransactions.length,
      chainLength: this.chain.length,
      latestBlock: this.getLatestBlock().height,
      uptime: uptime.toFixed(2) + 's',
      averageTPS: tps.toFixed(2),
      validators: this.consensus.getStats(),
      aiAgents: this.aiAgents.getStats(),
      isValid: this.isChainValid()
    };
  }

  /**
   * Print blockchain summary
   */
  printSummary() {
    console.log('\n========================================');
    console.log('NEXUSCHAIN SUMMARY');
    console.log('========================================');

    const stats = this.getStats();

    console.log(`\n📊 Chain Statistics:`);
    console.log(`   Total Blocks: ${stats.totalBlocks}`);
    console.log(`   Total Transactions: ${stats.totalTransactions}`);
    console.log(`   Pending Transactions: ${stats.pendingTransactions}`);
    console.log(`   Average TPS: ${stats.averageTPS}`);
    console.log(`   Uptime: ${stats.uptime}`);
    console.log(`   Chain Valid: ${stats.isValid ? '✅' : '❌'}`);

    console.log(`\n🔒 Consensus:`);
    console.log(`   Total Validators: ${stats.validators.totalValidators}`);
    console.log(`   Active Validators: ${stats.validators.activeValidators}`);
    console.log(`   Total Stake: ${stats.validators.totalStake}`);
    console.log(`   Block Time Target: ${stats.validators.blockTime}ms`);

    console.log(`\n🤖 AI Agents:`);
    stats.aiAgents.forEach(agent => {
      console.log(`   ${agent.name}:`);
      console.log(`      Observations: ${agent.observations}`);
      console.log(`      Recommendations: ${agent.recommendations} (${agent.pending} pending)`);
    });

    const proposals = this.aiAgents.getGovernanceProposals();
    if (proposals.length > 0) {
      console.log(`\n📋 Governance Proposals: ${proposals.length} pending`);
    }

    console.log('\n========================================\n');
  }

  /**
   * Export chain data
   */
  export() {
    return {
      chain: this.chain.map(block => block.serialize()),
      state: this.state,
      stats: this.getStats()
    };
  }
}

export default NexusChain;
