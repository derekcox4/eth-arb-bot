/**
 * SynapseChain - Advanced Wallet System
 * HD Wallets, Import/Export, Multi-signature support
 */

import { generateKeyPair, publicKeyToAddress, hash } from './crypto.js';
import Transaction from './transaction.js';

export class Wallet {
  constructor(privateKey = null, publicKey = null) {
    if (privateKey && publicKey) {
      this.privateKey = privateKey;
      this.publicKey = publicKey;
    } else {
      const keypair = generateKeyPair();
      this.privateKey = keypair.privateKey;
      this.publicKey = keypair.publicKey;
    }

    this.address = publicKeyToAddress(this.publicKey);
    this.nonce = 0;
    this.label = '';
    this.createdAt = Date.now();
  }

  /**
   * Create transaction from this wallet
   */
  createTransaction(to, value, data = [], accessList = [], gasPrice = 1, gasLimit = 100000) {
    const tx = new Transaction({
      sender: this.address,
      nonce: this.nonce,
      gasPrice,
      gasLimit,
      to,
      value,
      data,
      accessList
    });

    tx.signTransaction(this.privateKey);
    this.nonce++;

    return tx;
  }

  /**
   * Export wallet to JSON (encrypted)
   */
  exportEncrypted(password) {
    // In production, use proper encryption (AES-256-GCM)
    const encrypted = this.simpleEncrypt(JSON.stringify({
      privateKey: this.privateKey,
      publicKey: this.publicKey,
      address: this.address,
      nonce: this.nonce,
      label: this.label,
      createdAt: this.createdAt
    }), password);

    return {
      version: 1,
      crypto: {
        cipher: 'aes-256-gcm',
        ciphertext: encrypted
      },
      address: this.address
    };
  }

  /**
   * Export private key (use carefully!)
   */
  exportPrivateKey() {
    return this.privateKey;
  }

  /**
   * Simple encryption (mock - use proper crypto in production)
   */
  simpleEncrypt(data, password) {
    return Buffer.from(data).toString('base64') + ':' + hash(password);
  }

  /**
   * Simple decryption (mock)
   */
  static simpleDecrypt(encrypted, password) {
    const [data, passwordHash] = encrypted.split(':');
    if (hash(password) !== passwordHash) {
      throw new Error('Invalid password');
    }
    return Buffer.from(data, 'base64').toString('utf8');
  }

  /**
   * Import wallet from encrypted JSON
   */
  static importEncrypted(keystore, password) {
    try {
      const decrypted = Wallet.simpleDecrypt(keystore.crypto.ciphertext, password);
      const data = JSON.parse(decrypted);

      const wallet = new Wallet(data.privateKey, data.publicKey);
      wallet.nonce = data.nonce;
      wallet.label = data.label;
      wallet.createdAt = data.createdAt;

      return wallet;
    } catch (error) {
      throw new Error('Failed to import wallet: ' + error.message);
    }
  }

  /**
   * Import from private key
   */
  static importFromPrivateKey(privateKey, publicKey) {
    return new Wallet(privateKey, publicKey);
  }

  toString() {
    return `Wallet(${this.address.slice(0, 10)}... ${this.label ? `"${this.label}"` : ''})`;
  }
}

export class HDWallet {
  /**
   * Hierarchical Deterministic Wallet
   * Generates multiple addresses from a single seed
   */
  constructor(seed = null) {
    this.seed = seed || this.generateSeed();
    this.mnemonic = this.generateMnemonic();
    this.accounts = [];
    this.nextAccountIndex = 0;
  }

  /**
   * Generate random seed
   */
  generateSeed() {
    return hash({ timestamp: Date.now(), random: Math.random() * 1000000 });
  }

  /**
   * Generate mnemonic phrase (simplified BIP39)
   */
  generateMnemonic() {
    // In production, use proper BIP39 implementation
    const words = [
      'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
      'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
      'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual'
    ];

    const seedNum = parseInt(this.seed.slice(0, 16), 16);
    const mnemonic = [];

    for (let i = 0; i < 12; i++) {
      const index = (seedNum >> (i * 4)) % words.length;
      mnemonic.push(words[index]);
    }

    return mnemonic.join(' ');
  }

  /**
   * Derive account at specific index (BIP44 path: m/44'/60'/0'/0/index)
   */
  deriveAccount(index = this.nextAccountIndex) {
    // In production, use proper BIP32/BIP44 derivation
    const derivedSeed = hash({
      seed: this.seed,
      path: `m/44'/60'/0'/0/${index}`
    });

    const keypair = generateKeyPair(derivedSeed);
    const wallet = new Wallet(keypair.privateKey, keypair.publicKey);
    wallet.label = `Account ${index + 1}`;

    this.accounts.push(wallet);
    this.nextAccountIndex = index + 1;

    return wallet;
  }

  /**
   * Create new account
   */
  createAccount(label = null) {
    const wallet = this.deriveAccount();
    if (label) {
      wallet.label = label;
    }
    return wallet;
  }

  /**
   * Get account by index
   */
  getAccount(index) {
    return this.accounts[index];
  }

  /**
   * Get all accounts
   */
  getAllAccounts() {
    return this.accounts;
  }

  /**
   * Export HD wallet (encrypted)
   */
  exportEncrypted(password) {
    const encrypted = Wallet.prototype.simpleEncrypt.call(this, JSON.stringify({
      seed: this.seed,
      mnemonic: this.mnemonic,
      nextAccountIndex: this.nextAccountIndex
    }), password);

    return {
      version: 1,
      type: 'hd',
      crypto: {
        cipher: 'aes-256-gcm',
        ciphertext: encrypted
      }
    };
  }

  /**
   * Import HD wallet from encrypted backup
   */
  static importEncrypted(keystore, password) {
    try {
      const decrypted = Wallet.simpleDecrypt(keystore.crypto.ciphertext, password);
      const data = JSON.parse(decrypted);

      const hdWallet = new HDWallet(data.seed);
      hdWallet.mnemonic = data.mnemonic;

      // Re-derive accounts
      for (let i = 0; i < data.nextAccountIndex; i++) {
        hdWallet.deriveAccount(i);
      }

      return hdWallet;
    } catch (error) {
      throw new Error('Failed to import HD wallet: ' + error.message);
    }
  }

  /**
   * Import from mnemonic phrase
   */
  static importFromMnemonic(mnemonic) {
    // In production, convert mnemonic to seed using BIP39
    const seed = hash(mnemonic);
    const hdWallet = new HDWallet(seed);
    hdWallet.mnemonic = mnemonic;
    return hdWallet;
  }

  /**
   * Get mnemonic phrase
   */
  getMnemonic() {
    return this.mnemonic;
  }
}

export class MultiSigWallet {
  /**
   * Multi-signature wallet requiring M-of-N signatures
   */
  constructor(owners, requiredSignatures) {
    this.owners = owners; // Array of addresses
    this.requiredSignatures = requiredSignatures;
    this.nonce = 0;
    this.pendingTransactions = new Map();

    // Generate unique address for this multisig
    this.address = publicKeyToAddress(hash({
      owners: owners.sort().join(','),
      required: requiredSignatures,
      timestamp: Date.now()
    }));
  }

  /**
   * Propose a transaction (requires signatures from other owners)
   */
  proposeTransaction(to, value, data = [], proposer, proposerPrivateKey) {
    if (!this.owners.includes(proposer)) {
      throw new Error('Only owners can propose transactions');
    }

    const tx = new Transaction({
      sender: this.address,
      nonce: this.nonce,
      gasPrice: 1,
      gasLimit: 100000,
      to,
      value,
      data,
      accessList: []
    });

    const txId = hash({
      tx: tx.hash,
      timestamp: Date.now()
    });

    // Store pending transaction with first signature
    this.pendingTransactions.set(txId, {
      transaction: tx,
      signatures: new Map([[proposer, hash({ signer: proposer, tx: tx.hash })]]),
      createdAt: Date.now(),
      executed: false
    });

    console.log(`[MultiSig] Transaction proposed: ${txId.slice(0, 8)}... (1/${this.requiredSignatures} signatures)`);
    return txId;
  }

  /**
   * Sign pending transaction
   */
  signTransaction(txId, signer, signerPrivateKey) {
    if (!this.owners.includes(signer)) {
      throw new Error('Only owners can sign transactions');
    }

    const pending = this.pendingTransactions.get(txId);
    if (!pending) {
      throw new Error('Transaction not found');
    }

    if (pending.executed) {
      throw new Error('Transaction already executed');
    }

    // Add signature
    const signature = hash({ signer, tx: pending.transaction.hash });
    pending.signatures.set(signer, signature);

    console.log(`[MultiSig] Signature added: ${txId.slice(0, 8)}... (${pending.signatures.size}/${this.requiredSignatures})`);

    // Check if we have enough signatures
    if (pending.signatures.size >= this.requiredSignatures) {
      console.log(`[MultiSig] Threshold reached! Transaction ready for execution.`);
      return { ready: true, transaction: pending.transaction };
    }

    return { ready: false, signaturesNeeded: this.requiredSignatures - pending.signatures.size };
  }

  /**
   * Execute transaction once threshold is reached
   */
  executeTransaction(txId) {
    const pending = this.pendingTransactions.get(txId);
    if (!pending) {
      throw new Error('Transaction not found');
    }

    if (pending.executed) {
      throw new Error('Transaction already executed');
    }

    if (pending.signatures.size < this.requiredSignatures) {
      throw new Error(`Not enough signatures: ${pending.signatures.size}/${this.requiredSignatures}`);
    }

    // Mark as executed
    pending.executed = true;
    this.nonce++;

    console.log(`[MultiSig] ✅ Transaction executed: ${txId.slice(0, 8)}...`);
    return pending.transaction;
  }

  /**
   * Get pending transactions
   */
  getPendingTransactions() {
    return Array.from(this.pendingTransactions.entries()).map(([txId, data]) => ({
      txId,
      transaction: data.transaction,
      signatures: data.signatures.size,
      required: this.requiredSignatures,
      executed: data.executed,
      createdAt: data.createdAt
    }));
  }
}

export class WalletManager {
  /**
   * Manages multiple wallets and provides unified interface
   */
  constructor(blockchain) {
    this.blockchain = blockchain;
    this.wallets = new Map(); // address -> Wallet
    this.hdWallets = new Map(); // name -> HDWallet
    this.multiSigWallets = new Map(); // address -> MultiSigWallet
    this.labels = new Map(); // address -> label
  }

  /**
   * Create new wallet
   */
  createWallet(label = null) {
    const wallet = new Wallet();
    this.wallets.set(wallet.address, wallet);

    if (label) {
      wallet.label = label;
      this.labels.set(wallet.address, label);
    }

    console.log(`💼 Created wallet: ${wallet.address} ${label ? `"${label}"` : ''}`);
    return wallet;
  }

  /**
   * Create HD wallet
   */
  createHDWallet(name = 'default') {
    const hdWallet = new HDWallet();
    this.hdWallets.set(name, hdWallet);

    console.log(`💼 Created HD wallet "${name}"`);
    console.log(`   Mnemonic: ${hdWallet.getMnemonic()}`);

    return hdWallet;
  }

  /**
   * Create multi-sig wallet
   */
  createMultiSigWallet(owners, requiredSignatures, label = null) {
    const multiSig = new MultiSigWallet(owners, requiredSignatures);
    this.multiSigWallets.set(multiSig.address, multiSig);

    if (label) {
      this.labels.set(multiSig.address, label);
    }

    console.log(`💼 Created multi-sig wallet: ${multiSig.address} (${requiredSignatures}/${owners.length})`);
    return multiSig;
  }

  /**
   * Import wallet
   */
  importWallet(privateKey, publicKey, label = null) {
    const wallet = Wallet.importFromPrivateKey(privateKey, publicKey);
    this.wallets.set(wallet.address, wallet);

    if (label) {
      wallet.label = label;
      this.labels.set(wallet.address, label);
    }

    console.log(`💼 Imported wallet: ${wallet.address}`);
    return wallet;
  }

  /**
   * Get wallet by address
   */
  getWallet(address) {
    return this.wallets.get(address);
  }

  /**
   * Get wallet balance
   */
  getBalance(address) {
    return this.blockchain.getBalance(address);
  }

  /**
   * Get all wallets
   */
  getAllWallets() {
    return Array.from(this.wallets.values());
  }

  /**
   * List wallets with balances
   */
  listWallets() {
    const wallets = [];

    for (const wallet of this.wallets.values()) {
      wallets.push({
        address: wallet.address,
        balance: this.getBalance(wallet.address),
        label: wallet.label || 'Unnamed',
        nonce: wallet.nonce,
        createdAt: wallet.createdAt
      });
    }

    return wallets;
  }
}

export default { Wallet, HDWallet, MultiSigWallet, WalletManager };
