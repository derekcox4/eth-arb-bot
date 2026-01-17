/**
 * NexusChain - Transaction Implementation
 * Supports parallel execution with access lists
 */

import { hash, sign, verify } from './crypto.js';

export class Transaction {
  constructor({
    sender,
    nonce,
    gasPrice,
    gasLimit,
    to,
    value,
    data = [],
    accessList = [],
    signature = null
  }) {
    this.sender = sender;
    this.nonce = nonce;
    this.gasPrice = gasPrice;
    this.gasLimit = gasLimit;
    this.to = to;
    this.value = value;
    this.data = data; // Move bytecode or contract call data
    this.accessList = accessList; // Addresses accessed for parallel execution
    this.signature = signature;
    this.hash = null;
  }

  /**
   * Calculate transaction hash
   */
  calculateHash() {
    const txData = {
      sender: this.sender,
      nonce: this.nonce,
      gasPrice: this.gasPrice,
      gasLimit: this.gasLimit,
      to: this.to,
      value: this.value,
      data: this.data,
      accessList: this.accessList
    };
    return hash(txData);
  }

  /**
   * Sign transaction with private key
   */
  signTransaction(privateKey) {
    const txData = {
      sender: this.sender,
      nonce: this.nonce,
      gasPrice: this.gasPrice,
      gasLimit: this.gasLimit,
      to: this.to,
      value: this.value,
      data: this.data,
      accessList: this.accessList
    };
    this.signature = sign(txData, privateKey);
    this.hash = this.calculateHash();
  }

  /**
   * Verify transaction signature
   */
  verifySignature(publicKey) {
    const txData = {
      sender: this.sender,
      nonce: this.nonce,
      gasPrice: this.gasPrice,
      gasLimit: this.gasLimit,
      to: this.to,
      value: this.value,
      data: this.data,
      accessList: this.accessList
    };
    return verify(txData, this.signature, publicKey);
  }

  /**
   * Check if transaction conflicts with another (for Block-STM)
   */
  conflictsWith(otherTx) {
    // Simple conflict detection: overlapping access lists
    const myAccess = new Set([this.sender, this.to, ...this.accessList]);
    const otherAccess = new Set([otherTx.sender, otherTx.to, ...otherTx.accessList]);

    for (const addr of myAccess) {
      if (otherAccess.has(addr)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Estimate gas usage (simplified)
   */
  estimateGas() {
    let gas = 21000; // Base transaction cost
    gas += this.data.length * 16; // Data cost
    gas += this.accessList.length * 2400; // Access list cost
    return Math.min(gas, this.gasLimit);
  }

  /**
   * Serialize transaction for network transmission
   */
  serialize() {
    return {
      sender: this.sender,
      nonce: this.nonce,
      gasPrice: this.gasPrice,
      gasLimit: this.gasLimit,
      to: this.to,
      value: this.value,
      data: this.data,
      accessList: this.accessList,
      signature: this.signature,
      hash: this.hash
    };
  }

  /**
   * Deserialize transaction from network data
   */
  static deserialize(data) {
    const tx = new Transaction(data);
    tx.hash = data.hash;
    return tx;
  }

  /**
   * Check if transaction is valid (basic checks)
   */
  isValid() {
    // Must have signature
    if (!this.signature) return false;

    // Must have valid sender
    if (!this.sender || !this.sender.startsWith('0x')) return false;

    // Gas price must be positive
    if (this.gasPrice <= 0) return false;

    // Value must be non-negative
    if (this.value < 0) return false;

    // Nonce must be non-negative
    if (this.nonce < 0) return false;

    return true;
  }

  toString() {
    return `Tx(${this.hash?.slice(0, 8)}... ${this.sender.slice(0, 8)}→${this.to?.slice(0, 8) || 'contract'} value=${this.value})`;
  }
}

export default Transaction;
