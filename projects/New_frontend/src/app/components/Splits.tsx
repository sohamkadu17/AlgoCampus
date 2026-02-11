import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Users, 
  ChevronRight, 
  CheckCircle2, 
  Clock,
  ArrowRight,
  X,
  CreditCard,
  QrCode,
  Share2,
  Trash2,
  Loader2
} from 'lucide-react';
import { GlassCard } from './GlassCard';
import { UserAvatar, generateUsername } from './UserAvatar';
import { QRCodeSVG } from 'qrcode.react';
import { useAppContext } from '../context/AppContext';
import { toast } from 'sonner';

export const Splits: React.FC = () => {
  const [view, setView] = useState<'list' | 'create' | 'details'>('list');
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  
  const {
    groups,
    selectedGroup,
    isLoadingGroups,
    fetchGroups,
    selectGroup,
    createGroup,
    expenses,
    userBalance,isLoadingExpenses,
    fetchExpenses,
  } = useAppContext();

  // Load groups on mount
  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    const newGroup = await createGroup(groupName, groupDescription);
    if (newGroup) {
      setGroupName('');
      setGroupDescription('');
      setView('list');
    }
  };

  const handleViewGroup = (group: any) => {
    selectGroup(group);
    setView('details');
  };

  const handleBackToList = () => {
    selectGroup(null);
    setView('list');
  };

  const formatAlgoAmount = (microAlgos: number): string => {
    return (microAlgos / 1_000_000).toFixed(2);
  };

  return (
    <div className="space-y-6 relative">
      <AnimatePresence mode="wait">
        {view === 'list' && (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black tracking-tight">Splits</h2>
              <button 
                onClick={() => setView('create')}
                className="p-3 bg-teal-600 text-white rounded-2xl shadow-xl shadow-teal-500/30 hover:scale-110 active:scale-95 transition-all"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>

            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Find a group..." 
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-teal-500/50 shadow-sm transition-all"
              />
            </div>

            {isLoadingGroups ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <div className="inline-block p-6 rounded-3xl bg-slate-100 dark:bg-zinc-900">
                  <Users className="w-12 h-12 text-slate-400" />
                </div>
                <div>
                  <h3 className="font-black text-xl text-slate-900 dark:text-white">No groups yet</h3>
                  <p className="text-slate-500 text-sm">Create your first split group to get started</p>
                </div>
                <button 
                  onClick={() => setView('create')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white font-bold rounded-2xl shadow-lg shadow-teal-500/30"
                >
                  <Plus className="w-5 h-5" /> Create Group
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {groups.map((group, idx) => (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <GlassCard 
                      className="p-5 bg-white dark:bg-zinc-900 border-none shadow-lg hover:shadow-xl transition-all cursor-pointer group"
                      onClick={() => handleViewGroup(group)}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg group-hover:rotate-3 transition-transform">
                            <Users className="w-7 h-7" />
                          </div>
                          <div>
                            <h4 className="font-black text-lg text-slate-900 dark:text-white">{group.name}</h4>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                              Group #{group.chain_group_id}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            group.active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-500/10 text-slate-600'
                          }`}>
                            {group.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-zinc-800">
                        <p className="text-xs text-slate-500">{group.description || 'No description'}</p>
                        <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 text-xs font-black">
                          Details <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {view === 'create' && (
          <motion.div
            key="create"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-4">
              <button onClick={() => setView('list')} className="p-3 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-2xl transition-colors">
                <ChevronRight className="w-6 h-6 rotate-180" />
              </button>
              <h2 className="text-2xl font-black">Create Group</h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Group Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Dinner at Campus Cafe" 
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 outline-none focus:ring-4 focus:ring-teal-500/10 transition-all text-lg font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Description (Optional)</label>
                <textarea 
                  placeholder="Add a description for this group..."
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  rows={3}
                  className="w-full p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 outline-none focus:ring-4 focus:ring-teal-500/10 transition-all font-bold resize-none"
                />
              </div>

              <div className="p-6 rounded-[2rem] bg-teal-500/5 border border-teal-500/10 space-y-2">
                <h4 className="text-sm font-black text-teal-700 dark:text-teal-400">Note</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  After creating the group, you can invite members by sharing the invite link or QR code.
                  This will create the group on the Algorand blockchain.
                </p>
              </div>

              <button 
                onClick={handleCreateGroup}
                disabled={isLoadingGroups || !groupName.trim()}
                className="w-full bg-slate-900 dark:bg-white text-white  dark:text-slate-900 font-black py-5 rounded-[2rem] shadow-2xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingGroups ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Creating...
                  </>
                ) : (
                  <>
                    Create Group <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {view === 'details' && selectedGroup && (
          <motion.div
            key="details"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between">
              <button onClick={handleBackToList} className="p-3 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-2xl transition-colors">
                <ChevronRight className="w-6 h-6 rotate-180" />
              </button>
              <div className="flex gap-2">
                <button className="p-3 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-2xl transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="text-center space-y-2">
               <div className="inline-block p-4 rounded-3xl bg-indigo-500/10 text-indigo-600 mb-2">
                  <Users className="w-8 h-8" />
               </div>
               <h2 className="text-3xl font-black">{selectedGroup.name}</h2>
               <p className="text-slate-500 font-bold">{selectedGroup.description || 'No description'}</p>
               <p className="text-xs text-slate-400 font-black uppercase tracking-widest">
                 Group #{selectedGroup.chain_group_id}
               </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-[2rem] bg-slate-100 dark:bg-zinc-900 border-none space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                <p className="text-2xl font-black">{selectedGroup.active ? 'Active' : 'Inactive'}</p>
              </div>
              <div className="p-6 rounded-[2rem] bg-teal-600 text-white shadow-xl shadow-teal-500/20 space-y-1">
                <p className="text-[10px] font-black text-teal-100 uppercase tracking-widest">Your Balance</p>
                <p className="text-2xl font-black">
                  {userBalance ? formatAlgoAmount(Math.abs(userBalance.balance)) : '0.00'} 
                  <span className="text-xs font-medium"> ALGO</span>
                </p>
                {userBalance && (
                  <p className="text-xs font-bold">
                    {userBalance.status === 'owed' ? 'Owed to you' : userBalance.status === 'owes' ? 'You owe' : 'Settled'}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                 <h3 className="font-black text-lg">Expenses</h3>
                 <button 
                   onClick={() => toast.info('Add expense dialog coming soon!')}
                   className="bg-teal-600/10 text-teal-600 p-2 rounded-xl"
                 >
                   <Plus className="w-5 h-5" />
                 </button>
              </div>
              
              {isLoadingExpenses ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                </div>
              ) : expenses.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <CreditCard className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-sm text-slate-500 font-bold">No expenses yet</p>
                  <p className="text-xs text-slate-400">Add your first expense to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expenses.map((exp) => (
                    <GlassCard key={exp.id} className="p-4 flex items-center justify-between bg-white dark:bg-zinc-900 border-none shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-slate-500" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm">{exp.description}</h4>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">
                            Paid by {exp.payer_address.slice(0, 6)}...{exp.payer_address.slice(-4)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-sm">
                          {formatAlgoAmount(exp.amount)} <span className="text-[10px] text-slate-400">ALGO</span>
                        </p>
                        <span className={`text-[10px] font-black uppercase ${
                          exp.settled ? 'text-emerald-600' : 'text-orange-600'
                        }`}>
                          {exp.settled ? '✓ Settled' : 'Pending'}
                        </span>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              )}
            </div>

            {userBalance && userBalance.status === 'owes' && (
              <button 
                className="w-full bg-teal-600 text-white font-black py-5 rounded-[2.5rem] shadow-2xl shadow-teal-500/20 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all"
                onClick={() => toast.info('Settlement execution coming soon!')}
              >
                <CheckCircle2 className="w-6 h-6" /> Settle Balance
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
