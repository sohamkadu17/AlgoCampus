import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
  Sparkles,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { GlassCard } from './GlassCard';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { UserAvatar, generateUsername } from './UserAvatar';
import { ALGORAND_CONFIG } from '../config/api.config';
import { useAppContext } from '../context/AppContext';

interface AlgoAccountInfo {
  amount: number; // in microAlgos
  assets: { 'asset-id': number; amount: number }[];
  'min-balance': number;
}

interface DashboardProps {
  onAction: (action: string) => void;
  walletAddress?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ onAction, walletAddress = "" }) => {
  const [isChartHovered, setIsChartHovered] = React.useState(false);
  const [balance, setBalance] = useState<number>(0); // in ALGOs
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [onChainTxns, setOnChainTxns] = useState<any[]>([]);

  const { groups, expenses, settlements, isLoadingGroups } = useAppContext();

  // Fetch real transactions from Algorand indexer
  const fetchTransactions = useCallback(async () => {
    if (!walletAddress) return;
    try {
      const indexerUrl = ALGORAND_CONFIG.INDEXER_SERVER || 'https://testnet-idx.algonode.cloud';
      const response = await fetch(
        `${indexerUrl}/v2/accounts/${walletAddress}/transactions?limit=20`,
        {
          headers: ALGORAND_CONFIG.INDEXER_TOKEN
            ? { 'X-Indexer-API-Token': ALGORAND_CONFIG.INDEXER_TOKEN }
            : {},
        }
      );
      if (response.ok) {
        const data = await response.json();
        setOnChainTxns(data.transactions || []);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  }, [walletAddress]);

  // Fetch real balance from Algorand testnet
  const fetchBalance = useCallback(async () => {
    if (!walletAddress) return;
    setIsLoadingBalance(true);
    try {
      const algodUrl = ALGORAND_CONFIG.ALGOD_SERVER;
      const response = await fetch(
        `${algodUrl}/v2/accounts/${walletAddress}`,
        {
          headers: ALGORAND_CONFIG.ALGOD_TOKEN
            ? { 'X-Algo-API-Token': ALGORAND_CONFIG.ALGOD_TOKEN }
            : {},
        }
      );
      if (response.ok) {
        const accountInfo: AlgoAccountInfo = await response.json();
        setBalance(accountInfo.amount / 1_000_000); // Convert microAlgos to ALGOs
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    } finally {
      setIsLoadingBalance(false);
      setLastRefresh(new Date());
    }
  }, [walletAddress]);

  // Auto-refresh balance and transactions
  useEffect(() => {
    fetchBalance();
    fetchTransactions();
    const interval = setInterval(() => {
      fetchBalance();
      fetchTransactions();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchBalance, fetchTransactions]);

  // Build spending chart data from real on-chain transactions (last 7 days)
  const chartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const weekData: { name: string; amount: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayName = days[date.getDay()];

      // Use on-chain txns for chart data (payment transactions sent by this wallet)
      const dayTxns = onChainTxns.filter((txn) => {
        const txnTime = new Date(txn['round-time'] * 1000);
        return (
          txnTime.getDate() === date.getDate() &&
          txnTime.getMonth() === date.getMonth() &&
          txnTime.getFullYear() === date.getFullYear() &&
          txn['tx-type'] === 'pay' &&
          txn.sender === walletAddress
        );
      });

      // Also check app-level expenses
      const dayExpenses = expenses.filter((exp) => {
        const expDate = new Date(exp.created_at);
        return (
          expDate.getDate() === date.getDate() &&
          expDate.getMonth() === date.getMonth() &&
          expDate.getFullYear() === date.getFullYear()
        );
      });

      const txnTotal = dayTxns.reduce((sum, txn) => sum + (txn['payment-transaction']?.amount || 0) / 1_000_000, 0);
      const expTotal = dayExpenses.reduce((sum, exp) => sum + exp.amount / 1_000_000, 0);
      const total = txnTotal + expTotal;

      weekData.push({ name: dayName, amount: parseFloat(total.toFixed(2)) });
    }

    return weekData;
  }, [expenses, onChainTxns, walletAddress]);

  // Calculate spending trend
  const spendingTrend = useMemo(() => {
    const thisWeek = chartData.reduce((sum, d) => sum + d.amount, 0);
    // If no data, show 0
    if (thisWeek === 0) return '0%';
    return `${thisWeek.toFixed(1)} ALGO this week`;
  }, [chartData]);

  // Build recent activity from real on-chain transactions, settlements, and expenses
  const recentActivity = useMemo(() => {
    type ActivityItem = {
      id: string;
      type: 'sent' | 'received' | 'split';
      user: string;
      amount: string;
      time: string;
      status: 'completed' | 'pending';
    };

    const items: ActivityItem[] = [];

    // Add on-chain payment transactions
    onChainTxns
      .filter((txn) => txn['tx-type'] === 'pay')
      .slice(0, 10)
      .forEach((txn) => {
        const isSender = txn.sender === walletAddress;
        const payTxn = txn['payment-transaction'];
        if (!payTxn) return;
        const algoAmount = (payTxn.amount / 1_000_000).toFixed(2);
        const otherAddress = isSender ? payTxn.receiver : txn.sender;
        
        items.push({
          id: `tx-${txn.id}`,
          type: isSender ? 'sent' : 'received',
          user: otherAddress,
          amount: `${isSender ? '-' : '+'} ${algoAmount}`,
          time: formatRelativeTime(new Date(txn['round-time'] * 1000).toISOString()),
          status: 'completed',
        });
      });

    // Add settlements as activity
    settlements.slice(0, 5).forEach((s) => {
      const isSender = s.from_address === walletAddress;
      items.push({
        id: `s-${s.id}`,
        type: isSender ? 'sent' : 'received',
        user: isSender ? s.to_address : s.from_address,
        amount: `${isSender ? '-' : '+'} ${(s.amount / 1_000_000).toFixed(2)}`,
        time: formatRelativeTime(s.created_at),
        status: s.status === 'completed' ? 'completed' : 'pending',
      });
    });

    // Add recent expenses as splits
    expenses.slice(0, 5).forEach((e) => {
      items.push({
        id: `e-${e.id}`,
        type: 'split',
        user: e.payer_address,
        amount: `- ${(e.amount / 1_000_000).toFixed(2)}`,
        time: formatRelativeTime(e.created_at),
        status: e.settled ? 'completed' : 'pending',
      });
    });

    // Deduplicate by id, sort most recent first, take top 5
    const seen = new Set<string>();
    return items.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    }).slice(0, 5);
  }, [settlements, expenses, walletAddress, onChainTxns]);

  // USD estimate (rough ALGO/USD rate)
  const usdEstimate = (balance * 0.18).toFixed(2); // ~$0.18 per ALGO

  const quickActions = [
    { id: 'pay', label: 'Pay', icon: ArrowUpRight, color: 'bg-blue-600', shadow: 'shadow-blue-500/20' },
    { id: 'request', label: 'Request', icon: ArrowDownLeft, color: 'bg-teal-600', shadow: 'shadow-teal-500/20' },
    { id: 'splits', label: 'Split', icon: Users, color: 'bg-indigo-600', shadow: 'shadow-indigo-500/20' },
    { id: 'savings', label: 'Save', icon: PiggyBank, color: 'bg-pink-600', shadow: 'shadow-pink-500/20' },
    { id: 'events', label: 'Events', icon: Calendar, color: 'bg-orange-600', shadow: 'shadow-orange-500/20' },
    { id: 'fundraising', label: 'Fund', icon: HeartHandshake, color: 'bg-emerald-600', shadow: 'shadow-emerald-500/20' },
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
        <button 
          onClick={fetchBalance}
          disabled={isLoadingBalance}
          className="p-2 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm hover:scale-105 active:scale-95 transition-all"
          title="Refresh balance"
        >
          {isLoadingBalance ? (
            <Loader2 className="w-5 h-5 text-teal-500 animate-spin" />
          ) : (
            <Sparkles className="w-5 h-5 text-teal-500" />
          )}
        </button>
      </div>

      {/* Balance Card - Real Data */}
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
                <span className="text-5xl font-black">
                  {isLoadingBalance && balance === 0 ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    balance.toFixed(2)
                  )}
                </span>
                <span className="text-xl font-bold text-teal-400">ALGO</span>
              </div>
              <p className="text-zinc-500 text-xs font-medium">≈ ${usdEstimate} USD</p>
            </div>
            <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-bold">
              {ALGORAND_CONFIG.NETWORK === 'testnet' ? 'Testnet' : 'Mainnet'}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              {groups.slice(0, 4).map((g, i) => (
                <div key={g.id} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-zinc-800 overflow-hidden">
                   <UserAvatar address={g.admin_address || `group${i}`} size="sm" />
                </div>
              ))}
              {groups.length > 4 && (
                <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-teal-500 flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
                  +{groups.length - 4}
                </div>
              )}
              {groups.length === 0 && (
                <span className="text-zinc-500 text-xs">No groups yet</span>
              )}
            </div>
            <button 
              onClick={fetchBalance}
              className="bg-white text-slate-900 px-6 py-2.5 rounded-2xl text-xs font-black shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              {isLoadingBalance ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              Refresh
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
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{spendingTrend}</p>
          </div>
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-zinc-800 p-1 rounded-xl">
             <button className="px-3 py-1.5 text-[10px] font-bold bg-white dark:bg-zinc-700 rounded-lg shadow-sm">Week</button>
             <button className="px-3 py-1.5 text-[10px] font-bold text-slate-400">Month</button>
          </div>
        </div>
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
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
          <button onClick={() => onAction('splits')} className="text-teal-600 dark:text-teal-400 text-xs font-black hover:underline">See history</button>
        </div>
        {recentActivity.length === 0 ? (
          <GlassCard className="p-6 text-center bg-white dark:bg-zinc-900 border-none shadow-lg shadow-slate-100/50 dark:shadow-none">
            <p className="text-slate-400 text-sm font-medium">No recent activity yet.</p>
            <p className="text-slate-300 text-xs mt-1">Create a split or send a payment to get started!</p>
          </GlassCard>
        ) : (
        <div className="space-y-3">
          {recentActivity.map((tx, idx) => (
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
        )}
      </div>
    </div>
  );
};

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString();
}
