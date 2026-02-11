/**
 * Feature Showcase Component
 * Use this page to preview all premium features
 * Route: /showcase (for development/testing)
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Download, Search, Trophy, TrendingUp, Zap } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { AnimatedCounter, CountUp } from './AnimatedCounter';
import { AchievementBadge, CompactBadge } from './AchievementBadge';
import { ExportButton } from './ExportButton';
import { calculateAchievements, UserProgress } from '../utils/achievements';
import { getSimplifiedSettlements } from '../utils/settlementOptimizer';

export function FeatureShowcase() {
  const [counter, setCounter] = useState(0);

  // Mock data for demonstration
  const mockProgress: UserProgress = {
    splitsCreated: 8,
    expensesAdded: 25,
    settlementsCompleted: 12,
    uniqueMembers: 18,
    currentStreak: 5,
    fastSettlements: 3
  };

  const achievements = calculateAchievements(mockProgress);
  
  const mockTransactions = [
    {
      id: 'exp-1',
      description: 'Team Dinner',
      amount: 150,
      paidBy: 'ALGO123ABC',
      date: '2024-02-10'
    },
    {
      id: 'exp-2',
      description: 'Taxi Ride',
      amount: 25,
      paidBy: 'ALGO456DEF',
      date: '2024-02-11'
    }
  ];

  const mockMembers = [
    { address: 'ALGO123ABC', name: 'Alice' },
    { address: 'ALGO456DEF', name: 'Bob' }
  ];

  const mockBalances = [
    { address: 'ALGO123ABC', amount: 50 },
    { address: 'ALGO456DEF', amount: -50 }
  ];

  const optimized = getSimplifiedSettlements(
    mockMembers.map(m => m.address),
    mockTransactions
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e0f2f1] via-white to-[#b2dfdb]/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-[#006266] to-[#00838f] rounded-xl">
              <Sparkles className="size-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
              Premium Features Showcase
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Interactive preview of all premium components
          </p>
        </motion.div>

        {/* Feature 1: Animated Counters */}
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-white/40 dark:border-slate-700/40 p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            1. Animated Balance Counter
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Balance</p>
              <AnimatedCounter
                value={1250.50}
                decimals={2}
                suffix=" ALGO"
                className="text-3xl font-bold text-gray-900 dark:text-gray-100"
              />
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Splits</p>
              <CountUp
                end={counter}
                duration={1.5}
                className="text-3xl font-bold text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Members</p>
              <AnimatedCounter
                value={42}
                decimals={0}
                className="text-3xl font-bold text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          
          <div className="mt-4 flex gap-2">
            <Button onClick={() => setCounter(prev => prev + 1)}>
              Increment Counter
            </Button>
            <Button onClick={() => setCounter(0)} variant="outline">
              Reset
            </Button>
          </div>
        </Card>

        {/* Feature 2: Achievement System */}
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-white/40 dark:border-slate-700/40 p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            2. Achievement / Badge System
          </h2>
          
          {/* Progress Summary */}
          <div className="mb-6 p-4 bg-gradient-to-r from-[#006266]/5 to-[#b2dfdb]/10 dark:from-[#006266]/10 dark:to-[#b2dfdb]/20 rounded-xl">
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Current Progress</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Splits Created:</span>{' '}
                <strong className="text-gray-900 dark:text-gray-100">{mockProgress.splitsCreated}</strong>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Expenses Added:</span>{' '}
                <strong className="text-gray-900 dark:text-gray-100">{mockProgress.expensesAdded}</strong>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Settlements:</span>{' '}
                <strong className="text-gray-900 dark:text-gray-100">{mockProgress.settlementsCompleted}</strong>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Members:</span>{' '}
                <strong className="text-gray-900 dark:text-gray-100">{mockProgress.uniqueMembers}</strong>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Streak:</span>{' '}
                <strong className="text-gray-900 dark:text-gray-100">{mockProgress.currentStreak} days</strong>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Fast Settles:</span>{' '}
                <strong className="text-gray-900 dark:text-gray-100">{mockProgress.fastSettlements}</strong>
              </div>
            </div>
          </div>

          {/* Achievements Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {achievements.slice(0, 4).map((achievement, index) => (
              <AchievementBadge
                key={achievement.id}
                achievement={achievement}
                index={index}
              />
            ))}
          </div>

          {/* Compact Badges */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">Compact view:</span>
            {achievements.filter(a => a.isUnlocked).slice(0, 5).map(a => (
              <CompactBadge key={a.id} achievement={a} />
            ))}
          </div>
        </Card>

        {/* Feature 3: Settlement Optimizer */}
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-white/40 dark:border-slate-700/40 p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Zap className="size-6 text-[#006266] dark:text-[#b2dfdb]" />
            3. Settlement Optimization Engine
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Before */}
            <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-xl">
              <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Before Optimization</h3>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
                {optimized.originalTransactionCount}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">transactions needed</p>
            </div>

            {/* After */}
            <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">After Optimization</h3>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                {optimized.optimizedTransactionCount}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                transactions ({optimized.savings} saved!)
              </p>
            </div>
          </div>

          {/* Optimized Payments */}
          <div className="mt-6">
            <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Optimized Payment Plan:</h3>
            <div className="space-y-2">
              {optimized.optimizedPayments.map((payment, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-[#006266]/5 to-[#b2dfdb]/10 dark:from-[#006266]/10 dark:to-[#b2dfdb]/20 rounded-xl"
                >
                  <span className="font-mono text-sm text-gray-900 dark:text-gray-100">
                    {payment.from.substring(0, 8)}...
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">→</span>
                  <span className="font-mono text-sm text-gray-900 dark:text-gray-100">
                    {payment.to.substring(0, 8)}...
                  </span>
                  <span className="font-bold text-[#006266] dark:text-[#b2dfdb]">
                    {payment.amount.toFixed(2)} ALGO
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Feature 4: Export Functions */}
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-white/40 dark:border-slate-700/40 p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Download className="size-6 text-[#006266] dark:text-[#b2dfdb]" />
            4. Export Functionality
          </h2>
          
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Export transactions and split data in multiple formats
            </p>
            
            <div className="flex gap-3">
              <ExportButton
                splitName="Demo Split"
                transactions={mockTransactions}
                members={mockMembers}
                variant="default"
              />
              <ExportButton
                splitName="Demo Split"
                transactions={mockTransactions}
                members={mockMembers}
                variant="outline"
              />
            </div>

            <div className="p-4 bg-gray-50 dark:bg-slate-900/50 rounded-xl">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Export formats available:</p>
              <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                <li>✓ CSV - Excel compatible spreadsheet</li>
                <li>✓ PDF - Professional print-ready report</li>
                <li>✓ JSON - Complete data backup</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Feature 5: AI Insights Preview */}
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-white/40 dark:border-slate-700/40 p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <TrendingUp className="size-6 text-[#006266] dark:text-[#b2dfdb]" />
            5. AI Insights Page
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Complete analytics page with charts and smart recommendations
          </p>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">This Month</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">$1,250</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Trend</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">+23%</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Savings</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">8 txs</p>
            </div>
          </div>

          <Button onClick={() => window.location.href = '#'} className="w-full">
            View Full AI Insights Page
          </Button>
        </Card>

        {/* Feature 6: Global Search */}
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-white/40 dark:border-slate-700/40 p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Search className="size-6 text-[#006266] dark:text-[#b2dfdb]" />
            6. Global Search Modal
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Quick navigation with keyboard shortcut
          </p>

          <div className="p-6 bg-gradient-to-br from-[#006266]/5 to-[#b2dfdb]/10 dark:from-[#006266]/10 dark:to-[#b2dfdb]/20 rounded-xl">
            <div className="flex items-center justify-center gap-2 mb-4">
              <kbd className="px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border-2 border-gray-300 dark:border-slate-600 text-sm font-mono">
                ⌘
              </kbd>
              <span className="text-2xl text-gray-400">+</span>
              <kbd className="px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border-2 border-gray-300 dark:border-slate-600 text-sm font-mono">
                K
              </kbd>
            </div>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Press Cmd+K (or Ctrl+K) to open global search
            </p>
          </div>
        </Card>

        {/* Footer */}
        <Card className="bg-gradient-to-br from-[#006266] to-[#00838f] dark:from-[#b2dfdb] dark:to-[#80cbc4] p-8 text-white dark:text-[#006266]">
          <h2 className="text-2xl font-bold mb-2">All Features Integrated! 🎉</h2>
          <p className="opacity-90 mb-4">
            These premium features are ready to use throughout your AlgoSplit application.
            Check the documentation files for integration examples.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="bg-white/20 border-white/30 hover:bg-white/30">
              View Documentation
            </Button>
            <Button variant="outline" className="bg-white/20 border-white/30 hover:bg-white/30">
              Integration Examples
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
