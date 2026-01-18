/**
 * NexusChain - Block Implementation
 * HotStuff consensus compatible block structure
 */

import { hash, merkleRoot } from './crypto.js';

export class QuorumCertificate {
  constructor(blockHash, height, validatorSignatures = []) {
    this.blockHash = blockHash;
    this.height = height;
    this.validatorSignatures = validatorSignatures; // Array of {validator, signature}
    this.timestamp = Date.now();
  }

  /**
   * Check if QC has enough signatures (2/3+ of validators)
   */
  hasQuorum(totalValidators) {
    return this.validatorSignatures.length >= Math.ceil((2 * totalValidators) / 3);
  }

  serialize() {
    return {
      blockHash: this.blockHash,
      height: this.height,
      validatorSignatures: this.validatorSignatures,
      timestamp: this.timestamp
    };
  }
}

export class Block {
  constructor({
    version = 1,
    height,
    timestamp = Date.now(),
    previousHash,
    stateRoot = '',
    transactions = [],
    validatorAddress,
    qc = null, // QuorumCertificate from HotStuff consensus
    evidence = [] // Byzantine behavior proofs
  }) {
    this.version = version;
    this.height = height;
    this.timestamp = timestamp;
    this.previousHash = previousHash;
    this.stateRoot = stateRoot;
    this.transactions = transactions;
    this.validatorAddress = validatorAddress;
    this.qc = qc;
    this.evidence = evidence;

    this.transactionRoot = this.calculateTransactionRoot();
    this.hash = this.calculateHash();
  }

  /**
   * Calculate Merkle root of transactions
   */
  calculateTransactionRoot() {
    if (this.transactions.length === 0) return hash('');
    const txHashes = this.transactions.map(tx => tx.hash || tx.calculateHash());
    return merkleRoot(txHashes);
  }

  /**
   * Calculate block hash
   */
  calculateHash() {
    const blockData = {
      version: this.version,
      height: this.height,
      timestamp: this.timestamp,
      previousHash: this.previousHash,
      stateRoot: this.stateRoot,
      transactionRoot: this.transactionRoot,
      validatorAddress: this.validatorAddress,
      qc: this.qc ? this.qc.serialize() : null
    };
    return hash(blockData);
  }

  /**
   * Create genesis block
   */
  static genesis() {
    const genesisBlock = new Block({
      height: 0,
      previousHash: '0'.repeat(64),
      stateRoot: hash('genesis'),
      transactions: [],
      validatorAddress: '0x0000000000000000000000000000000000000000',
      qc: null
    });
    return genesisBlock;
  }

  /**
   * Validate block structure
   */
  isValid(previousBlock = null) {
    // Genesis block is always valid
    if (this.height === 0) return true;

    // Must have previous block reference
    if (!previousBlock) return false;

    // Height must increment
    if (this.height !== previousBlock.height + 1) return false;

    // Previous hash must match
    if (this.previousHash !== previousBlock.hash) return false;

    // Timestamp must be after previous block
    if (this.timestamp <= previousBlock.timestamp) return false;

    // All transactions must be valid
    for (const tx of this.transactions) {
      if (!tx.isValid()) return false;
    }

    // Transaction root must be correct
    if (this.transactionRoot !== this.calculateTransactionRoot()) return false;

    // Hash must be correct
    if (this.hash !== this.calculateHash()) return false;

    return true;
  }

  /**
   * Get block size in bytes (approximate)
   */
  getSize() {
    return JSON.stringify(this.serialize()).length;
  }

  /**
   * Get total gas used in block
   */
  getTotalGasUsed() {
    return this.transactions.reduce((sum, tx) => sum + tx.estimateGas(), 0);
  }

  /**
   * Serialize block for storage/network
   */
  serialize() {
    return {
      version: this.version,
      height: this.height,
      timestamp: this.timestamp,
      previousHash: this.previousHash,
      stateRoot: this.stateRoot,
      transactionRoot: this.transactionRoot,
      transactions: this.transactions.map(tx => tx.serialize()),
      validatorAddress: this.validatorAddress,
      qc: this.qc ? this.qc.serialize() : null,
      evidence: this.evidence,
      hash: this.hash
    };
  }

  /**
   * Deserialize block from storage/network
   */
  static deserialize(data) {
    const transactions = data.transactions.map(txData => {
      const Transaction = require('./transaction.js').Transaction;
      return Transaction.deserialize(txData);
    });

    const qc = data.qc ? new QuorumCertificate(
      data.qc.blockHash,
      data.qc.height,
      data.qc.validatorSignatures
    ) : null;

    const block = new Block({
      version: data.version,
      height: data.height,
      timestamp: data.timestamp,
      previousHash: data.previousHash,
      stateRoot: data.stateRoot,
      transactions,
      validatorAddress: data.validatorAddress,
      qc,
      evidence: data.evidence
    });

    return block;
  }

  toString() {
    return `Block #${this.height} (${this.hash.slice(0, 8)}... ${this.transactions.length} txs, validator=${this.validatorAddress.slice(0, 8)}...)`;
  }
}

export default Block;
