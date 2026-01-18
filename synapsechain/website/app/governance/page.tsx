/**
 * SynapseChain - AI Governance Dashboard
 * Shows live AI agent debates, proposals, and voting
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CpuChipIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function Governance() {
  const [activeTab, setActiveTab] = useState<'debates' | 'proposals' | 'agents'>('debates');
  const [liveDebates, setLiveDebates] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    loadGovernanceData();
    const interval = setInterval(loadGovernanceData, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadGovernanceData = () => {
    // Mock AI agent debates
    setLiveDebates([
      {
        id: 1,
        agent: 'Consensus Optimizer',
        topic: 'Block Time Adjustment',
        status: 'active',
        messages: [
          { from: 'Consensus Optimizer', message: 'Analysis: Average block time is 320ms, below target of 400ms', timestamp: Date.now() - 5000, type: 'observation' },
          { from: 'Performance Tuner', message: 'Confirmed. Network latency data shows capacity for faster blocks', timestamp: Date.now() - 4000, type: 'support' },
          { from: 'Economic Model Agent', message: 'Consideration: Faster blocks may increase validator costs', timestamp: Date.now() - 3000, type: 'concern' },
          { from: 'Consensus Optimizer', message: 'Proposal: Reduce block time to 350ms (+14% throughput)', timestamp: Date.now() - 2000, type: 'proposal' },
          { from: 'Security Auditor', message: 'Risk assessment: LOW - Conservative change with safety margin', timestamp: Date.now() - 1000, type: 'approval' },
        ]
      },
      {
        id: 2,
        agent: 'Cross-Chain Scanner',
        topic: 'Ethereum Vulnerability Alert',
        status: 'monitoring',
        messages: [
          { from: 'Cross-Chain Scanner', message: 'ALERT: New reentrancy pattern detected on Ethereum (Protocol X)', timestamp: Date.now() - 10000, type: 'alert' },
          { from: 'Security Auditor', message: 'Analyzing applicability to SynapseChain Move VM...', timestamp: Date.now() - 9000, type: 'analysis' },
          { from: 'Security Auditor', message: 'RESULT: Not vulnerable. Move VM prevents reentrancy by design', timestamp: Date.now() - 7000, type: 'result' },
          { from: 'Cross-Chain Scanner', message: 'Recommendation: Publish advisory for developers using external calls', timestamp: Date.now() - 5000, type: 'recommendation' },
        ]
      },
      {
        id: 3,
        agent: 'Performance Tuner',
        topic: 'Parallel Execution Optimization',
        status: 'analyzing',
        messages: [
          { from: 'Performance Tuner', message: 'Data: Block #123450 had 38% conflict rate (high)', timestamp: Date.now() - 15000, type: 'observation' },
          { from: 'Performance Tuner', message: 'Pattern: Popular DEX contract causing conflicts', timestamp: Date.now() - 12000, type: 'analysis' },
          { from: 'Economic Model Agent', message: 'Usage data: 45% of transactions interact with this contract', timestamp: Date.now() - 10000, type: 'support' },
          { from: 'Performance Tuner', message: 'Proposal: Require access lists for high-frequency contracts', timestamp: Date.now() - 8000, type: 'proposal' },
        ]
      }
    ]);

    // Mock proposals
    setProposals([
      {
        id: 'PROP-045',
        title: 'Reduce Block Time to 350ms',
        agent: 'Consensus Optimizer',
        status: 'voting',
        votes: { for: 67234000, against: 12450000, abstain: 5000000 },
        threshold: 51,
        endTime: Date.now() + 86400000 * 2,
        description: 'Optimize block production time based on network performance data',
        impact: '+14% throughput, -12.5% latency',
        risk: 'LOW',
        created: Date.now() - 86400000
      },
      {
        id: 'PROP-044',
        title: 'Increase Gas Limit to 35M',
        agent: 'Economic Model Agent',
        status: 'passed',
        votes: { for: 85670000, against: 8900000, abstain: 3000000 },
        threshold: 51,
        endTime: Date.now() - 3600000,
        description: 'Accommodate growing transaction demand while maintaining decentralization',
        impact: '+16% capacity, minimal validator impact',
        risk: 'LOW',
        created: Date.now() - 86400000 * 5
      },
      {
        id: 'PROP-043',
        title: 'Add Arbitrum Bridge Support',
        agent: 'Human Proposal',
        status: 'executing',
        votes: { for: 92340000, against: 5100000, abstain: 2000000 },
        threshold: 66,
        endTime: Date.now() - 86400000,
        description: 'Extend cross-chain bridge to support Arbitrum L2',
        impact: 'Access to $12B+ TVL on Arbitrum',
        risk: 'MEDIUM',
        created: Date.now() - 86400000 * 10
      },
      {
        id: 'PROP-042',
        title: 'AI Model Update v2.1',
        agent: 'AI Research Fund',
        status: 'voting',
        votes: { for: 45000000, against: 8000000, abstain: 15000000 },
        threshold: 66,
        endTime: Date.now() + 86400000 * 4,
        description: 'Deploy improved AI models with better cross-chain pattern detection',
        impact: '+30% accuracy, faster analysis',
        risk: 'MEDIUM',
        created: Date.now() - 86400000 * 2
      }
    ]);

    // Mock agent stats
    setAgents([
      {
        name: 'Consensus Optimizer',
        role: 'Performance & Consensus',
        status: 'active',
        observations: 12456,
        recommendations: 145,
        approved: 98,
        rejected: 23,
        pending: 24,
        accuracy: 92.4,
        lastActive: Date.now() - 1000
      },
      {
        name: 'Cross-Chain Scanner',
        role: 'Security Intelligence',
        status: 'active',
        observations: 45678,
        recommendations: 234,
        approved: 189,
        rejected: 12,
        pending: 33,
        accuracy: 95.8,
        lastActive: Date.now() - 2000
      },
      {
        name: 'Performance Tuner',
        role: 'Execution Optimization',
        status: 'active',
        observations: 34567,
        recommendations: 312,
        approved: 267,
        rejected: 18,
        pending: 27,
        accuracy: 93.7,
        lastActive: Date.now() - 500
      },
      {
        name: 'Economic Model Agent',
        role: 'Tokenomics Management',
        status: 'active',
        observations: 23456,
        recommendations: 178,
        approved: 156,
        rejected: 9,
        pending: 13,
        accuracy: 94.5,
        lastActive: Date.now() - 1500
      },
      {
        name: 'Security Auditor',
        role: 'Vulnerability Detection',
        status: 'active',
        observations: 56789,
        recommendations: 89,
        approved: 84,
        rejected: 2,
        pending: 3,
        accuracy: 97.8,
        lastActive: Date.now() - 800
      }
    ]);
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
              <Link href="/explorer" className="text-gray-300 hover:text-white transition">Explorer</Link>
              <Link href="/governance" className="text-white font-semibold">AI Governance</Link>
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
            <h1 className="text-5xl font-bold text-white mb-4">AI Governance Dashboard</h1>
            <p className="text-xl text-gray-400">Watch AI agents analyze, debate, and propose protocol improvements in real-time</p>
            <div className="inline-flex items-center space-x-2 bg-green-500/20 border border-green-500/30 rounded-full px-4 py-2 mt-4">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-300 text-sm">5 AI Agents Active</span>
            </div>
          </motion.div>

          {/* Tabs */}
          <div className="flex justify-center space-x-4 mb-8">
            <TabButton active={activeTab === 'debates'} onClick={() => setActiveTab('debates')}>
              <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
              Live Debates
            </TabButton>
            <TabButton active={activeTab === 'proposals'} onClick={() => setActiveTab('proposals')}>
              <ChartBarIcon className="w-5 h-5 mr-2" />
              Proposals
            </TabButton>
            <TabButton active={activeTab === 'agents'} onClick={() => setActiveTab('agents')}>
              <CpuChipIcon className="w-5 h-5 mr-2" />
              Agent Stats
            </TabButton>
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'debates' && (
              <motion.div
                key="debates"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {liveDebates.map((debate) => (
                  <DebateCard key={debate.id} debate={debate} />
                ))}
              </motion.div>
            )}

            {activeTab === 'proposals' && (
              <motion.div
                key="proposals"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {proposals.map((proposal) => (
                  <ProposalCard key={proposal.id} proposal={proposal} />
                ))}
              </motion.div>
            )}

            {activeTab === 'agents' && (
              <motion.div
                key="agents"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {agents.map((agent) => (
                  <AgentCard key={agent.name} agent={agent} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center px-6 py-3 rounded-lg font-semibold transition ${
        active
          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50'
          : 'bg-slate-800/50 text-gray-400 hover:text-white border border-purple-500/20'
      }`}
    >
      {children}
    </button>
  );
}

function DebateCard({ debate }: any) {
  const statusColors = {
    active: 'bg-green-500/20 text-green-400 border-green-500/30',
    monitoring: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    analyzing: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  };

  const messageTypeColors = {
    observation: 'border-blue-500/30 bg-blue-500/5',
    support: 'border-green-500/30 bg-green-500/5',
    concern: 'border-yellow-500/30 bg-yellow-500/5',
    proposal: 'border-purple-500/30 bg-purple-500/10',
    approval: 'border-green-500/30 bg-green-500/5',
    alert: 'border-red-500/30 bg-red-500/5',
    analysis: 'border-blue-500/30 bg-blue-500/5',
    result: 'border-green-500/30 bg-green-500/5',
    recommendation: 'border-purple-500/30 bg-purple-500/10'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-slate-800/50 border border-purple-500/20 rounded-xl p-6"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <CpuChipIcon className="w-8 h-8 text-purple-400" />
          <div>
            <h3 className="text-xl font-bold text-white">{debate.topic}</h3>
            <p className="text-sm text-gray-400">Led by {debate.agent}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm border ${statusColors[debate.status]}`}>
          {debate.status}
        </span>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {debate.messages.map((msg: any, idx: number) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`border rounded-lg p-3 ${messageTypeColors[msg.type]}`}
          >
            <div className="flex justify-between items-start mb-1">
              <span className="font-semibold text-purple-300 text-sm">{msg.from}</span>
              <span className="text-xs text-gray-500">{formatTimestamp(msg.timestamp)}</span>
            </div>
            <p className="text-white text-sm">{msg.message}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function ProposalCard({ proposal }: any) {
  const totalVotes = proposal.votes.for + proposal.votes.against + proposal.votes.abstain;
  const forPercentage = (proposal.votes.for / totalVotes) * 100;
  const againstPercentage = (proposal.votes.against / totalVotes) * 100;

  const statusColors = {
    voting: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    passed: 'bg-green-500/20 text-green-400 border-green-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
    executing: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
  };

  const riskColors = {
    LOW: 'text-green-400',
    MEDIUM: 'text-yellow-400',
    HIGH: 'text-red-400'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-slate-800/50 border border-purple-500/20 rounded-xl p-6"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <span className="font-mono text-purple-400">{proposal.id}</span>
            <span className={`px-2 py-1 rounded text-xs border ${statusColors[proposal.status]}`}>
              {proposal.status}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">{proposal.title}</h3>
          <p className="text-gray-400 mb-2">{proposal.description}</p>
          <div className="flex items-center space-x-4 text-sm">
            <span className="text-gray-500">Proposed by: <span className="text-purple-400">{proposal.agent}</span></span>
            <span className="text-gray-500">Risk: <span className={riskColors[proposal.risk]}>{proposal.risk}</span></span>
          </div>
        </div>
        <LightBulbIcon className="w-12 h-12 text-purple-400" />
      </div>

      <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
        <div className="text-sm text-gray-400 mb-2">Expected Impact</div>
        <div className="text-white font-semibold">{proposal.impact}</div>
      </div>

      {proposal.status === 'voting' && (
        <>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Voting Progress</span>
              <span className="text-white">{forPercentage.toFixed(1)}% For (Threshold: {proposal.threshold}%)</span>
            </div>
            <div className="h-3 bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                style={{ width: `${forPercentage}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{(proposal.votes.for / 1000000).toFixed(1)}M</div>
              <div className="text-xs text-gray-400">FOR ({forPercentage.toFixed(1)}%)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{(proposal.votes.against / 1000000).toFixed(1)}M</div>
              <div className="text-xs text-gray-400">AGAINST ({againstPercentage.toFixed(1)}%)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-400">{(proposal.votes.abstain / 1000000).toFixed(1)}M</div>
              <div className="text-xs text-gray-400">ABSTAIN</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400 flex items-center">
              <ClockIcon className="w-4 h-4 mr-1" />
              Ends in {Math.floor((proposal.endTime - Date.now()) / 86400000)}d {Math.floor(((proposal.endTime - Date.now()) % 86400000) / 3600000)}h
            </span>
            <button className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2 rounded-lg text-white font-semibold text-sm hover:shadow-lg hover:shadow-purple-500/50 transition">
              Vote Now
            </button>
          </div>
        </>
      )}

      {proposal.status === 'passed' && (
        <div className="flex items-center justify-center space-x-2 text-green-400 py-4">
          <CheckCircleIcon className="w-6 h-6" />
          <span className="font-semibold">Proposal Passed - Executing...</span>
        </div>
      )}
    </motion.div>
  );
}

function AgentCard({ agent }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-slate-800/50 border border-purple-500/20 rounded-xl p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">{agent.name}</h3>
          <p className="text-sm text-purple-400">{agent.role}</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs text-green-400">Active</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-2xl font-bold text-white">{agent.observations.toLocaleString()}</div>
          <div className="text-xs text-gray-400">Observations</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-purple-400">{agent.recommendations}</div>
          <div className="text-xs text-gray-400">Recommendations</div>
        </div>
      </div>

      <div className="bg-slate-900/50 rounded-lg p-3 mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">Approval Rate</span>
          <span className="text-white font-semibold">{agent.accuracy}%</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-green-400"
            style={{ width: `${agent.accuracy}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div>
          <div className="text-green-400 font-semibold">{agent.approved}</div>
          <div className="text-xs text-gray-400">Approved</div>
        </div>
        <div>
          <div className="text-yellow-400 font-semibold">{agent.pending}</div>
          <div className="text-xs text-gray-400">Pending</div>
        </div>
        <div>
          <div className="text-red-400 font-semibold">{agent.rejected}</div>
          <div className="text-xs text-gray-400">Rejected</div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-purple-500/20 text-xs text-gray-400">
        Last active: {formatTimestamp(agent.lastActive)}
      </div>
    </motion.div>
  );
}

function formatTimestamp(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
