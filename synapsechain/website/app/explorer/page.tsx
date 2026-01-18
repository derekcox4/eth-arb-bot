/**
 * SynapseChain - Block Explorer
 * Real-time blockchain explorer with search, blocks, transactions, and validators
 */

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MagnifyingGlassIcon, CubeIcon, BoltIcon, UserGroupIcon, ClockIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function Explorer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentBlocks, setRecentBlocks] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalBlocks: 0,
    totalTransactions: 0,
    avgBlockTime: 0,
    tps: 0,
    validators: 0
  });

  // Mock data loading (replace with actual API calls)
  useEffect(() => {
    loadBlockchainData();
    const interval = setInterval(loadBlockchainData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadBlockchainData = async () => {
    // Mock data - replace with actual API
    setRecentBlocks([
      { height: 123456, hash: '0x7a8b9c...', timestamp: Date.now(), txCount: 145, validator: '0xabcd...', gasUsed: 29500000, speedup: '18.2x' },
      { height: 123455, hash: '0x6a7b8c...', timestamp: Date.now() - 400, txCount: 132, validator: '0x1234...', gasUsed: 28900000, speedup: '17.8x' },
      { height: 123454, hash: '0x5a6b7c...', timestamp: Date.now() - 800, txCount: 158, validator: '0x5678...', gasUsed: 29800000, speedup: '19.1x' },
      { height: 123453, hash: '0x4a5b6c...', timestamp: Date.now() - 1200, txCount: 141, validator: '0x9abc...', gasUsed: 28700000, speedup: '17.5x' },
      { height: 123452, hash: '0x3a4b5c...', timestamp: Date.now() - 1600, txCount: 167, validator: '0xdef0...', gasUsed: 29900000, speedup: '19.5x' },
    ]);

    setRecentTransactions([
      { hash: '0xabc123...', from: '0x1a2b3c...', to: '0x4d5e6f...', value: '1000 SYN', timestamp: Date.now(), status: 'success' },
      { hash: '0xdef456...', from: '0x7g8h9i...', to: '0x0j1k2l...', value: '500 SYN', timestamp: Date.now() - 200, status: 'success' },
      { hash: '0xghi789...', from: '0x3m4n5o...', to: '0x6p7q8r...', value: '2500 SYN', timestamp: Date.now() - 400, status: 'success' },
      { hash: '0xjkl012...', from: '0x9s0t1u...', to: '0x2v3w4x...', value: '750 SYN', timestamp: Date.now() - 600, status: 'success' },
      { hash: '0xmno345...', from: '0x5y6z7a...', to: '0x8b9c0d...', value: '1250 SYN', timestamp: Date.now() - 800, status: 'success' },
    ]);

    setStats({
      totalBlocks: 123456,
      totalTransactions: 18234567,
      avgBlockTime: 385,
      tps: 352,
      validators: 127
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search logic
    console.log('Searching for:', searchQuery);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-slate-900/80 backdrop-blur-md border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg" />
              <span className="text-2xl font-bold text-white">SynapseChain</span>
            </Link>
            <div className="hidden md:flex space-x-8">
              <Link href="/explorer" className="text-white font-semibold">Explorer</Link>
              <Link href="/governance" className="text-gray-300 hover:text-white transition">AI Governance</Link>
              <Link href="/bridge" className="text-gray-300 hover:text-white transition">Bridge</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl font-bold text-white mb-4">Block Explorer</h1>
            <p className="text-xl text-gray-400">Real-time blockchain data and analytics</p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12"
          >
            <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Address / Txn Hash / Block / Token"
                  className="w-full bg-slate-800 border border-purple-500/30 rounded-xl pl-14 pr-4 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
              </div>
            </form>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12"
          >
            <StatCard icon={<CubeIcon className="w-6 h-6" />} label="Total Blocks" value={stats.totalBlocks.toLocaleString()} />
            <StatCard icon={<BoltIcon className="w-6 h-6" />} label="Transactions" value={stats.totalTransactions.toLocaleString()} />
            <StatCard icon={<ClockIcon className="w-6 h-6" />} label="Block Time" value={`${stats.avgBlockTime}ms`} />
            <StatCard icon={<BoltIcon className="w-6 h-6" />} label="TPS" value={stats.tps.toString()} />
            <StatCard icon={<UserGroupIcon className="w-6 h-6" />} label="Validators" value={stats.validators.toString()} />
          </motion.div>

          {/* Recent Blocks and Transactions */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Recent Blocks */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-slate-800/50 border border-purple-500/20 rounded-xl p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <CubeIcon className="w-6 h-6 mr-2" />
                  Recent Blocks
                </h2>
                <Link href="/blocks" className="text-purple-400 hover:text-purple-300 text-sm">View All</Link>
              </div>

              <div className="space-y-4">
                {recentBlocks.map((block, index) => (
                  <motion.div
                    key={block.height}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="bg-slate-900/50 border border-purple-500/10 rounded-lg p-4 hover:border-purple-500/30 transition"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <Link href={`/block/${block.height}`} className="text-purple-400 hover:text-purple-300 font-semibold">
                          #{block.height}
                        </Link>
                        <div className="text-xs text-gray-500 mt-1">{formatTimestamp(block.timestamp)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-semibold">{block.txCount} txs</div>
                        <div className="text-xs text-green-400">{block.speedup} speedup</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <div className="text-gray-400">
                        Validator: <span className="text-purple-400">{block.validator}</span>
                      </div>
                      <div className="text-gray-400">
                        Gas: {(block.gasUsed / 1000000).toFixed(1)}M
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Recent Transactions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-slate-800/50 border border-purple-500/20 rounded-xl p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <BoltIcon className="w-6 h-6 mr-2" />
                  Recent Transactions
                </h2>
                <Link href="/txs" className="text-purple-400 hover:text-purple-300 text-sm">View All</Link>
              </div>

              <div className="space-y-4">
                {recentTransactions.map((tx, index) => (
                  <motion.div
                    key={tx.hash}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="bg-slate-900/50 border border-purple-500/10 rounded-lg p-4 hover:border-purple-500/30 transition"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <Link href={`/tx/${tx.hash}`} className="text-purple-400 hover:text-purple-300 font-mono text-sm">
                          {tx.hash}
                        </Link>
                        <div className="text-xs text-gray-500 mt-1">{formatTimestamp(tx.timestamp)}</div>
                      </div>
                      <div className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded">
                        {tx.status}
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <div className="text-gray-400">
                        <span className="text-purple-400 font-mono text-xs">{tx.from}</span>
                        <span className="mx-2">→</span>
                        <span className="text-purple-400 font-mono text-xs">{tx.to}</span>
                      </div>
                      <div className="text-white font-semibold">{tx.value}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: any) {
  return (
    <div className="bg-slate-800/50 border border-purple-500/20 rounded-xl p-4">
      <div className="flex items-center space-x-2 text-purple-400 mb-2">
        {icon}
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

function formatTimestamp(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}
