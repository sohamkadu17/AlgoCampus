import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Users, 
  PiggyBank, 
  Calendar, 
  HeartHandshake,
  MoreHorizontal,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { GlassCard } from './GlassCard';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { UserAvatar, generateUsername } from './UserAvatar';

const data = [
  { name: 'Mon', amount: 40 },
  { name: 'Tue', amount: 30 },
  { name: 'Wed', amount: 65 },
  { name: 'Thu', amount: 45 },
  { name: 'Fri', amount: 90 },
  { name: 'Sat', amount: 70 },
  { name: 'Sun', amount: 85 },
];

interface DashboardProps {
  onAction: (action: string) => void;
  walletAddress?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ onAction, walletAddress = "0x...4a2b" }) => {
  const [isChartHovered, setIsChartHovered] = React.useState(false);

  const quickActions = [
    { id: 'pay', label: 'Pay', icon: ArrowUpRight, color: 'bg-blue-600', shadow: 'shadow-blue-500/20' },
    { id: 'request', label: 'Request', icon: ArrowDownLeft, color: 'bg-teal-600', shadow: 'shadow-teal-500/20' },
    { id: 'splits', label: 'Split', icon: Users, color: 'bg-indigo-600', shadow: 'shadow-indigo-500/20' },
    { id: 'savings', label: 'Save', icon: PiggyBank, color: 'bg-pink-600', shadow: 'shadow-pink-500/20' },
    { id: 'events', label: 'Events', icon: Calendar, color: 'bg-orange-600', shadow: 'shadow-orange-500/20' },
    { id: 'fundraising', label: 'Fund', icon: HeartHandshake, color: 'bg-emerald-600', shadow: 'shadow-emerald-500/20' },
  ];

  const transactions = [
    { id: 1, type: 'sent', user: '0x...8f9e', amount: '- 12.50', time: '2 mins ago', status: 'completed' },
    { id: 2, type: 'received', user: '0x...2c3d', amount: '+ 50.00', time: '1 hour ago', status: 'completed' },
    { id: 3, type: 'split', user: '0x...1a2b', amount: '- 15.00', time: '3 hours ago', status: 'pending' },
  ];

  return (
    <div className="space-y-8 relative">
      {/* Greeting & Quick Summary */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            Hey, {generateUsername(walletAddress)} <motion.span animate={{ rotate: [0, 20, 0] }} transition={{ repeat: Infinity, duration: 2 }}>👋</motion.span>
          </h2>
          <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium">Ready to settle your campus bills?</p>
        </div>
        <div className="p-2 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm">
           <Sparkles className="w-5 h-5 text-teal-500" />
        </div>
      </div>

      {/* Balance Card - Premium Version */}
      <motion.div
        whileHover={{ y: -5 }}
        className="group relative"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-teal-500 to-blue-700 blur-2xl opacity-20 group-hover:opacity-30 transition-opacity" />
        <div className="relative p-8 rounded-[2.5rem] bg-slate-900 dark:bg-zinc-900 text-white shadow-2xl overflow-hidden border border-white/10">
          <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
            <Users className="w-48 h-48 rotate-12" />
          </div>
          
          <div className="flex justify-between items-start mb-10">
            <div className="space-y-1">
              <span className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Main Balance</span>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black">10.50</span>
                <span className="text-xl font-bold text-teal-400">ALGO</span>
              </div>
              <p className="text-zinc-500 text-xs font-medium">≈ $24.82 USD</p>
            </div>
            <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-bold">
              Testnet
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-zinc-800 overflow-hidden">
                   <UserAvatar address={`user${i}`} size="sm" />
                </div>
              ))}
              <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-teal-500 flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
                +8
              </div>
            </div>
            <button className="bg-white text-slate-900 px-6 py-2.5 rounded-2xl text-xs font-black shadow-xl hover:scale-105 active:scale-95 transition-all">
              Top Up
            </button>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
        {quickActions.map((action, idx) => (
          <motion.button
            key={action.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => onAction(action.id)}
            className="flex flex-col items-center gap-2 group"
          >
            <div className={`w-14 h-14 rounded-2xl ${action.color} ${action.shadow} flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-active:scale-90 transition-all duration-300`}>
              <action.icon className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-slate-600 dark:text-zinc-400 group-hover:text-slate-900 dark:group-hover:text-zinc-100 transition-colors">{action.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Analytics Section */}
      <GlassCard 
        className="p-6 bg-white dark:bg-zinc-900 border-none shadow-xl shadow-slate-200/50 dark:shadow-none"
        onMouseEnter={() => setIsChartHovered(true)}
        onMouseLeave={() => setIsChartHovered(false)}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-black text-slate-900 dark:text-white">Spending</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">+12% from last week</p>
          </div>
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-zinc-800 p-1 rounded-xl">
             <button className="px-3 py-1.5 text-[10px] font-bold bg-white dark:bg-zinc-700 rounded-lg shadow-sm">Week</button>
             <button className="px-3 py-1.5 text-[10px] font-bold text-slate-400">Month</button>
          </div>
        </div>
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="#0ea5e9" 
                strokeWidth={4} 
                fillOpacity={1} 
                fill="url(#chartGradient)" 
                animationDuration={1500}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900 dark:bg-white p-2 rounded-lg shadow-xl border-none">
                        <p className="text-[10px] font-black text-white dark:text-slate-900">{payload[0].value} ALGO</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Recent Activity */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-black text-slate-900 dark:text-white text-lg">Activity</h3>
          <button className="text-teal-600 dark:text-teal-400 text-xs font-black hover:underline">See history</button>
        </div>
        <div className="space-y-3">
          {transactions.map((tx, idx) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + (idx * 0.1) }}
            >
              <GlassCard className="p-4 flex items-center justify-between bg-white dark:bg-zinc-900 border-none shadow-lg shadow-slate-100/50 dark:shadow-none hover:translate-x-1 transition-transform cursor-pointer">
                <div className="flex items-center gap-4">
                  <UserAvatar address={tx.user} size="md" />
                  <div>
                    <h4 className="font-black text-sm text-slate-900 dark:text-white">{generateUsername(tx.user)}</h4>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] text-slate-500 font-bold uppercase">{tx.time}</p>
                      {tx.status === 'pending' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-black text-sm ${tx.type === 'received' ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>
                    {tx.amount} <span className="text-[10px] text-slate-400">ALGO</span>
                  </p>
                  <ChevronRight className="w-4 h-4 text-slate-300 ml-auto mt-1" />
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
