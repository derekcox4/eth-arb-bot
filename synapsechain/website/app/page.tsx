/**
 * SynapseChain - Landing Page
 * Modern, animated landing page inspired by Ethereum, Solana, and Celestia
 */

'use client';

import { motion } from 'framer-motion';
import { ArrowRightIcon, CpuChipIcon, BoltIcon, ShieldCheckIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-slate-900/80 backdrop-blur-md border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg" />
              <span className="text-2xl font-bold text-white">SynapseChain</span>
            </div>
            <div className="hidden md:flex space-x-8">
              <Link href="/explorer" className="text-gray-300 hover:text-white transition">Explorer</Link>
              <Link href="/governance" className="text-gray-300 hover:text-white transition">AI Governance</Link>
              <Link href="/bridge" className="text-gray-300 hover:text-white transition">Bridge</Link>
              <Link href="/docs" className="text-gray-300 hover:text-white transition">Docs</Link>
              <Link href="/whitepaper" className="text-gray-300 hover:text-white transition">White Paper</Link>
            </div>
            <button className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2 rounded-lg text-white font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition">
              Launch App
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center space-x-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-2 mb-8">
              <BoltIcon className="w-5 h-5 text-purple-400" />
              <span className="text-purple-300 text-sm">Testnet Live • Mainnet Q3 2026</span>
            </div>

            <h1 className="text-6xl md:text-7xl font-bold text-white mb-6">
              The First
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> AI-Optimized </span>
              Blockchain
            </h1>

            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              SynapseChain continuously learns from the entire blockchain ecosystem,
              optimizing itself through autonomous AI agents. Experience 200,000+ TPS
              with sub-second finality.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
              <button className="bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-4 rounded-lg text-white font-semibold text-lg hover:shadow-2xl hover:shadow-purple-500/50 transition transform hover:scale-105">
                Get Started
                <ArrowRightIcon className="inline w-5 h-5 ml-2" />
              </button>
              <button className="border border-purple-500/30 px-8 py-4 rounded-lg text-white font-semibold text-lg hover:bg-purple-500/10 transition">
                View Explorer
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <StatsCard number="200,000+" label="TPS" />
              <StatsCard number="150ms" label="Finality" />
              <StatsCard number="5" label="Chains Bridged" />
              <StatsCard number="$0.0001" label="Avg Fee" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold text-white mb-4">Revolutionary Features</h2>
            <p className="text-xl text-gray-400">The future of blockchain technology</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<CpuChipIcon className="w-12 h-12" />}
              title="Autonomous AI Agents"
              description="Five specialized AI agents continuously monitor, analyze, and optimize the blockchain. Learn from other chains' vulnerabilities before they affect you."
              color="purple"
            />
            <FeatureCard
              icon={<BoltIcon className="w-12 h-12" />}
              title="Block-STM Execution"
              description="Parallel transaction processing with automatic conflict detection. Achieve 17-20x speedup over sequential execution."
              color="pink"
            />
            <FeatureCard
              icon={<ShieldCheckIcon className="w-12 h-12" />}
              title="HotStuff BFT Consensus"
              description="Industry-leading consensus with 150-250ms finality. Linear message complexity scales to thousands of validators."
              color="blue"
            />
            <FeatureCard
              icon={<GlobeAltIcon className="w-12 h-12" />}
              title="Native Cross-Chain Bridge"
              description="Connect to Ethereum, BSC, Polygon, Solana, and Avalanche. Validator-secured transfers with AI anomaly detection."
              color="green"
            />
            <FeatureCard
              icon={<CpuChipIcon className="w-12 h-12" />}
              title="Move-Inspired VM"
              description="Resource-oriented programming prevents reentrancy attacks, integer overflows, and other common vulnerabilities."
              color="yellow"
            />
            <FeatureCard
              icon={<BoltIcon className="w-12 h-12" />}
              title="AI Governance"
              description="Data-driven protocol optimization. AI proposes, humans approve. Transparent, adaptive, and continuously improving."
              color="red"
            />
          </div>
        </div>
      </section>

      {/* AI Agents Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-5xl font-bold text-white mb-4 text-center">Meet the AI Agents</h2>
            <p className="text-xl text-gray-400 mb-16 text-center">The brains behind SynapseChain's continuous evolution</p>

            <div className="grid md:grid-cols-2 gap-8">
              <AIAgentCard
                name="Consensus Optimizer"
                role="Performance Tuning"
                description="Monitors block production times, analyzes validator performance, and suggests parameter adjustments for optimal throughput."
                observations={1234}
                recommendations={45}
              />
              <AIAgentCard
                name="Cross-Chain Scanner"
                role="Security Intelligence"
                description="Scans Ethereum, Solana, BSC, Polygon, and Avalanche for vulnerabilities and innovations. Prevents exploits before they happen."
                observations={5678}
                recommendations={23}
              />
              <AIAgentCard
                name="Performance Tuner"
                role="Execution Optimization"
                description="Analyzes Block-STM conflict rates and transaction patterns to maximize parallel execution efficiency."
                observations={3456}
                recommendations={67}
              />
              <AIAgentCard
                name="Economic Model Agent"
                role="Tokenomics Management"
                description="Balances gas pricing, validator rewards, and network sustainability through predictive modeling."
                observations={2345}
                recommendations={34}
              />
            </div>

            <div className="mt-12 text-center">
              <Link href="/governance" className="inline-flex items-center text-purple-400 hover:text-purple-300 text-lg font-semibold">
                View Live AI Debates
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Performance Comparison */}
      <section className="py-20 px-4 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl font-bold text-white mb-16 text-center">Industry-Leading Performance</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="pb-4 text-gray-400">Blockchain</th>
                  <th className="pb-4 text-gray-400">TPS</th>
                  <th className="pb-4 text-gray-400">Finality</th>
                  <th className="pb-4 text-gray-400">Cost</th>
                  <th className="pb-4 text-gray-400">AI-Optimized</th>
                </tr>
              </thead>
              <tbody className="text-white">
                <tr className="border-b border-gray-800 bg-purple-500/10">
                  <td className="py-4 font-bold">SynapseChain</td>
                  <td className="py-4 text-green-400 font-semibold">200,000+</td>
                  <td className="py-4 text-green-400 font-semibold">150-250ms</td>
                  <td className="py-4 text-green-400 font-semibold">$0.0001</td>
                  <td className="py-4 text-green-400 font-semibold">✓</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-4">Ethereum</td>
                  <td className="py-4">15</td>
                  <td className="py-4">12 min</td>
                  <td className="py-4">$5-50</td>
                  <td className="py-4">✗</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-4">Solana</td>
                  <td className="py-4">1,133</td>
                  <td className="py-4">2.5s</td>
                  <td className="py-4">$0.00025</td>
                  <td className="py-4">✗</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-4">Polygon</td>
                  <td className="py-4">65</td>
                  <td className="py-4">5-10min</td>
                  <td className="py-4">$0.01-0.10</td>
                  <td className="py-4">✗</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-4">Avalanche</td>
                  <td className="py-4">4,500</td>
                  <td className="py-4">1-2s</td>
                  <td className="py-4">$0.10-2</td>
                  <td className="py-4">✗</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-12"
          >
            <h2 className="text-4xl font-bold text-white mb-4">Join the Future of Blockchain</h2>
            <p className="text-xl text-gray-300 mb-8">
              Be part of the first blockchain that continuously learns and improves through AI.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button className="bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-4 rounded-lg text-white font-semibold text-lg hover:shadow-2xl hover:shadow-purple-500/50 transition">
                Start Building
              </button>
              <button className="border border-purple-500/30 px-8 py-4 rounded-lg text-white font-semibold text-lg hover:bg-purple-500/10 transition">
                Read White Paper
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 px-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg" />
              <span className="text-xl font-bold text-white">SynapseChain</span>
            </div>
            <p className="text-gray-400">The first AI-optimized blockchain with autonomous cross-chain learning.</p>
          </div>
          <div>
            <h3 className="font-bold text-white mb-4">Product</h3>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/explorer">Block Explorer</Link></li>
              <li><Link href="/bridge">Bridge</Link></li>
              <li><Link href="/wallet">Wallet</Link></li>
              <li><Link href="/governance">Governance</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-white mb-4">Developers</h3>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/docs">Documentation</Link></li>
              <li><Link href="/api">API Reference</Link></li>
              <li><Link href="/sdk">SDK</Link></li>
              <li><Link href="/github">GitHub</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-white mb-4">Community</h3>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/discord">Discord</Link></li>
              <li><Link href="/twitter">Twitter</Link></li>
              <li><Link href="/telegram">Telegram</Link></li>
              <li><Link href="/blog">Blog</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-800 text-center text-gray-400">
          <p>© 2026 SynapseChain Foundation. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function StatsCard({ number, label }: { number: string; label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center"
    >
      <div className="text-4xl font-bold text-white mb-2">{number}</div>
      <div className="text-gray-400">{label}</div>
    </motion.div>
  );
}

function FeatureCard({ icon, title, description, color }: any) {
  const colorClasses = {
    purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-400',
    pink: 'from-pink-500/20 to-pink-600/20 border-pink-500/30 text-pink-400',
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-400',
    green: 'from-green-500/20 to-green-600/20 border-green-500/30 text-green-400',
    yellow: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30 text-yellow-400',
    red: 'from-red-500/20 to-red-600/20 border-red-500/30 text-red-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.05 }}
      className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-6 hover:shadow-xl transition`}
    >
      <div className={colorClasses[color]}>{icon}</div>
      <h3 className="text-xl font-bold text-white mt-4 mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </motion.div>
  );
}

function AIAgentCard({ name, role, description, observations, recommendations }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-slate-800/50 border border-purple-500/20 rounded-xl p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-2xl font-bold text-white">{name}</h3>
          <p className="text-purple-400">{role}</p>
        </div>
        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
          <CpuChipIcon className="w-8 h-8 text-white" />
        </div>
      </div>
      <p className="text-gray-400 mb-4">{description}</p>
      <div className="flex justify-between text-sm">
        <div>
          <div className="text-gray-500">Observations</div>
          <div className="text-white font-semibold">{observations.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-gray-500">Recommendations</div>
          <div className="text-purple-400 font-semibold">{recommendations}</div>
        </div>
      </div>
    </motion.div>
  );
}
