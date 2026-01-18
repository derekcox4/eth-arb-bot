/**
 * SynapseChain - REST API & WebSocket Server
 * Provides real-time blockchain data to frontend applications
 */

import express from 'express';
import { createServer } from 'http';
import { Server as SocketIO } from 'socket.io';
import cors from 'cors';
import SynapseChain from './blockchain.js';
import CrossChainBridge from './bridge.js';
import { WalletManager } from './wallet.js';

const app = express();
const httpServer = createServer(app);
const io = new SocketIO(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Initialize blockchain
const blockchain = new SynapseChain();
const bridge = new CrossChainBridge(blockchain);
const walletManager = new WalletManager(blockchain);

// Initialize validators and start mining
const initializeBlockchain = async () => {
  console.log('🚀 Initializing SynapseChain API Server...');

  // Add validators
  for (let i = 0; i < 4; i++) {
    const validator = blockchain.addValidator(10000 + i * 2000);
    bridge.addValidator(validator);
  }

  // Start block production
  setInterval(async () => {
    try {
      const validators = blockchain.consensus.validators;
      if (validators.length > 0) {
        const randomValidator = validators[Math.floor(Math.random() * validators.length)];
        await blockchain.mineBlock(randomValidator.address);
      }
    } catch (error) {
      // Silent fail - expected when not validator's turn
    }
  }, 500); // Try to mine every 500ms

  // Run AI optimization periodically
  setInterval(async () => {
    await blockchain.runAIOptimization();
  }, 30000); // Every 30 seconds

  console.log('✅ SynapseChain API Server initialized');
};

// REST API Endpoints

// Chain info
app.get('/api/chain/info', (req, res) => {
  const stats = blockchain.getStats();
  res.json({
    name: 'SynapseChain',
    chainId: 1,
    ...stats
  });
});

// Latest blocks
app.get('/api/blocks', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const blocks = blockchain.getRecentBlocks(limit);

  res.json({
    blocks: blocks.map(block => ({
      height: block.height,
      hash: block.hash,
      timestamp: block.timestamp,
      transactions: block.transactions.length,
      validator: block.validatorAddress,
      gasUsed: block.getTotalGasUsed(),
      qcSignatures: block.qc ? block.qc.validatorSignatures.length : 0
    }))
  });
});

// Block by height
app.get('/api/block/:height', (req, res) => {
  const height = parseInt(req.params.height);
  if (height >= 0 && height < blockchain.chain.length) {
    const block = blockchain.chain[height];
    res.json(block.serialize());
  } else {
    res.status(404).json({ error: 'Block not found' });
  }
});

// Latest transactions
app.get('/api/transactions', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const allTxs = [];

  // Collect transactions from recent blocks
  const recentBlocks = blockchain.getRecentBlocks(20);
  for (const block of recentBlocks) {
    allTxs.push(...block.transactions.map(tx => ({
      ...tx.serialize(),
      blockHeight: block.height,
      blockHash: block.hash,
      timestamp: block.timestamp
    })));
  }

  res.json({
    transactions: allTxs.slice(0, limit)
  });
});

// Transaction by hash
app.get('/api/transaction/:hash', (req, res) => {
  const hash = req.params.hash;

  for (const block of blockchain.chain) {
    for (const tx of block.transactions) {
      if (tx.hash === hash) {
        return res.json({
          ...tx.serialize(),
          blockHeight: block.height,
          blockHash: block.hash,
          timestamp: block.timestamp
        });
      }
    }
  }

  res.status(404).json({ error: 'Transaction not found' });
});

// Address balance
app.get('/api/address/:address/balance', (req, res) => {
  const address = req.params.address;
  const balance = blockchain.getBalance(address);

  res.json({
    address,
    balance,
    nonce: blockchain.state.nonces[address] || 0
  });
});

// Pending transactions
app.get('/api/mempool', (req, res) => {
  res.json({
    transactions: blockchain.pendingTransactions.map(tx => tx.serialize()),
    count: blockchain.pendingTransactions.length
  });
});

// Validators
app.get('/api/validators', (req, res) => {
  const validators = blockchain.consensus.validators.map(v => ({
    address: v.address,
    stake: v.stake,
    active: v.active
  }));

  res.json({ validators });
});

// AI Agents
app.get('/api/ai/agents', (req, res) => {
  const agents = blockchain.aiAgents.getStats();
  res.json({ agents });
});

// Governance proposals
app.get('/api/governance/proposals', (req, res) => {
  const proposals = blockchain.aiAgents.getGovernanceProposals();
  res.json({ proposals });
});

// Bridge statistics
app.get('/api/bridge/stats', (req, res) => {
  const stats = bridge.getStats();
  res.json(stats);
});

// Bridge recent transfers
app.get('/api/bridge/transfers', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const transfers = bridge.getRecentBridges(limit);
  res.json({ transfers });
});

// Submit transaction
app.post('/api/transaction/submit', (req, res) => {
  try {
    const { sender, to, value, data, signature } = req.body;

    // Create transaction (simplified - in production, verify signature)
    const wallet = walletManager.getWallet(sender);
    if (!wallet) {
      return res.status(400).json({ error: 'Wallet not found' });
    }

    const tx = wallet.createTransaction(to, value, data || []);
    const success = blockchain.addTransaction(tx);

    if (success) {
      // Emit to WebSocket clients
      io.emit('new-transaction', tx.serialize());

      res.json({
        success: true,
        txHash: tx.hash
      });
    } else {
      res.status(400).json({ error: 'Transaction rejected' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// WebSocket real-time updates
io.on('connection', (socket) => {
  console.log('📡 Client connected:', socket.id);

  // Send initial stats
  socket.emit('chain-stats', blockchain.getStats());

  // Subscribe to new blocks
  socket.on('subscribe-blocks', () => {
    console.log('Client subscribed to blocks:', socket.id);
  });

  // Subscribe to new transactions
  socket.on('subscribe-transactions', () => {
    console.log('Client subscribed to transactions:', socket.id);
  });

  // Subscribe to AI agents
  socket.on('subscribe-ai', () => {
    console.log('Client subscribed to AI updates:', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('📡 Client disconnected:', socket.id);
  });
});

// Broadcast new blocks to WebSocket clients
const originalMineBlock = blockchain.mineBlock.bind(blockchain);
blockchain.mineBlock = async function (...args) {
  const block = await originalMineBlock(...args);
  if (block) {
    io.emit('new-block', {
      height: block.height,
      hash: block.hash,
      timestamp: block.timestamp,
      transactions: block.transactions.length,
      validator: block.validatorAddress
    });

    // Update chain stats
    io.emit('chain-stats', blockchain.getStats());
  }
  return block;
};

// Broadcast AI recommendations
setInterval(() => {
  const proposals = blockchain.aiAgents.getGovernanceProposals();
  io.emit('governance-update', { proposals });
}, 5000);

// Start server
const PORT = process.env.PORT || 3001;

initializeBlockchain().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🌐 SynapseChain API Server running on http://localhost:${PORT}`);
    console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}`);
    console.log(${'='.repeat(60)}\n`);
    console.log('API Endpoints:');
    console.log(`  GET  /api/chain/info`);
    console.log(`  GET  /api/blocks`);
    console.log(`  GET  /api/block/:height`);
    console.log(`  GET  /api/transactions`);
    console.log(`  GET  /api/transaction/:hash`);
    console.log(`  GET  /api/address/:address/balance`);
    console.log(`  GET  /api/validators`);
    console.log(`  GET  /api/ai/agents`);
    console.log(`  GET  /api/governance/proposals`);
    console.log(`  GET  /api/bridge/stats`);
    console.log(`  POST /api/transaction/submit`);
    console.log(${'='.repeat(60)}\n`);
  });
});

export default app;
