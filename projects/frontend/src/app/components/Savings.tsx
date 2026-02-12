import React from 'react';
import { motion } from 'motion/react';
import { 
  PiggyBank, 
  Lock, 
  Unlock, 
  TrendingUp, 
  Plus, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { GlassCard } from './GlassCard';

export const Savings: React.FC = () => {
  const vaults = [
    { id: 1, name: "New Laptop", current: "800.00", target: "1200.00", icon: "💻", color: "from-blue-500 to-indigo-600", progress: 66 },
    { id: 2, name: "Summer Fest", current: "150.00", target: "200.00", icon: "🎟️", color: "from-teal-500 to-emerald-600", progress: 75 },
    { id: 3, name: "Emergency Fund", current: "45.00", target: "500.00", icon: "🚨", color: "from-rose-500 to-orange-600", progress: 9 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Savings Vault</h2>
          <p className="text-sm text-slate-500">Lock funds and earn rewards.</p>
        </div>
        <button className="p-2 bg-teal-600 text-white rounded-xl shadow-lg shadow-teal-600/20">
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Total Savings Overview */}
      <GlassCard className="p-6 bg-white dark:bg-zinc-900 border-teal-500/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-500/10 text-teal-600 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold text-slate-600 dark:text-zinc-400">Total Secured</span>
          </div>
          <span className="text-emerald-500 text-xs font-bold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +4.2% APY
          </span>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold">995.00</span>
          <span className="text-lg font-medium mb-1 opacity-60">ALGO</span>
        </div>
        <div className="mt-6 flex gap-3">
          <button className="flex-1 bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold py-3 rounded-2xl text-sm">
            Deposit
          </button>
          <button className="flex-1 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 font-bold py-3 rounded-2xl text-sm">
            Withdraw
          </button>
        </div>
      </GlassCard>

      {/* Active Vaults */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-900 dark:text-white px-1">Active Vaults</h3>
        {vaults.map((vault) => (
          <GlassCard key={vault.id} className="p-4 bg-white dark:bg-zinc-900">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${vault.color} flex items-center justify-center text-xl`}>
                  {vault.icon}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{vault.name}</h4>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Locked until Sept 20</p>
                </div>
              </div>
              <Lock className="w-4 h-4 text-slate-400" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-end text-xs">
                <span className="font-bold text-slate-900 dark:text-white">{vault.current} ALGO</span>
                <span className="text-slate-400">Target: {vault.target}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${vault.progress}%` }}
                  className={`h-full bg-gradient-to-r ${vault.color}`}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] font-medium text-slate-400">
                <span>{vault.progress}% Completed</span>
                <button className="text-teal-600 font-bold">Add Funds</button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Why lock? */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex gap-4">
        <div className="p-2 bg-amber-500 text-white rounded-xl self-start">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-amber-900 dark:text-amber-400">Lock & Earn</h4>
          <p className="text-xs text-amber-800/70 dark:text-amber-400/70">
            Locked funds earn up to 12% annual rewards through Algorand Governance.
          </p>
        </div>
      </div>
    </div>
  );
};
