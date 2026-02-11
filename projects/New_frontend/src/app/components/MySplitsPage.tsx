import { motion } from 'motion/react';
import { Split, Users, Receipt, ArrowRight, Search } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { useState } from 'react';

interface Group {
  id: string;
  name: string;
  members: { id: string; address: string }[];
  expenses: {
    id: string;
    description: string;
    amount: number;
    paidBy: string;
    settledBy: string[];
  }[];
}

interface MySplitsPageProps {
  groups: Group[];
  connectedAddress: string;
  onViewSplit: (groupId: string) => void;
  onCreateSplit: () => void;
}

export function MySplitsPage({ groups, connectedAddress, onViewSplit, onCreateSplit }: MySplitsPageProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getYourShareForGroup = (group: Group) => {
    return group.expenses.reduce((sum, exp) => {
      const sharePerPerson = exp.amount / group.members.length;
      const isSettledByYou = exp.settledBy.includes(connectedAddress);
      const isPaidByYou = exp.paidBy === connectedAddress;
      if (!isPaidByYou && !isSettledByYou) {
        return sum + sharePerPerson;
      }
      return sum;
    }, 0);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">My Splits</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage all your expense groups in one place</p>
      </motion.div>

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex gap-4"
      >
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400 dark:text-gray-500" />
          <Input
            placeholder="Search splits..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 bg-white/80 dark:bg-slate-800/80 border-gray-200 dark:border-slate-700 rounded-xl dark:text-gray-100 dark:placeholder:text-gray-500"
          />
        </div>
        <Button
          onClick={onCreateSplit}
          className="bg-[#006266] hover:bg-[#004d4f] dark:bg-[#b2dfdb] dark:text-[#006266] dark:hover:bg-[#80cbc4] text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
        >
          Create New Split
        </Button>
      </motion.div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-white/20 dark:border-slate-700/30 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#006266]/10 dark:bg-[#006266]/20 rounded-lg">
                <Split className="size-5 text-[#006266] dark:text-[#b2dfdb]" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Splits</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{groups.length}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-white/20 dark:border-slate-700/30 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Users className="size-5 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Members</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {new Set(groups.flatMap(g => g.members.map(m => m.id))).size}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-white/20 dark:border-slate-700/30 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Receipt className="size-5 text-purple-600 dark:text-purple-300" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {groups.reduce((sum, g) => sum + g.expenses.length, 0)}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Splits List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="space-y-3"
      >
        {filteredGroups.length === 0 ? (
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-white/20 dark:border-slate-700/30 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="inline-flex p-4 bg-[#006266]/10 dark:bg-[#006266]/20 rounded-full mb-4">
                <Split className="size-8 text-[#006266] dark:text-[#b2dfdb]" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {searchQuery ? 'No splits found' : 'No splits yet'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Create your first split to start managing expenses with friends!'}
              </p>
              {!searchQuery && (
                <Button
                  onClick={onCreateSplit}
                  className="bg-[#006266] hover:bg-[#004d4f] dark:bg-[#b2dfdb] dark:text-[#006266] dark:hover:bg-[#80cbc4] text-white rounded-xl"
                >
                  Create Your First Split
                </Button>
              )}
            </div>
          </Card>
        ) : (
          filteredGroups.map((group, index) => {
            const totalAmount = group.expenses.reduce((sum, exp) => sum + exp.amount, 0);
            const yourShare = getYourShareForGroup(group);
            const settledExpenses = group.expenses.filter(exp =>
              exp.settledBy.includes(connectedAddress) || exp.paidBy === connectedAddress
            ).length;

            return (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.45 + index * 0.05 }}
                whileHover={{ scale: 1.01 }}
              >
                <Card
                  className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-white/20 dark:border-slate-700/30 p-6 cursor-pointer hover:shadow-xl transition-all duration-300"
                  onClick={() => onViewSplit(group.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-gradient-to-br from-[#006266]/10 to-[#b2dfdb]/20 rounded-lg">
                          <Split className="size-5 text-[#006266] dark:text-[#b2dfdb]" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{group.name}</h3>
                      </div>
                      
                      <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <div className="flex items-center gap-1.5">
                          <Users className="size-4" />
                          <span>{group.members.length} members</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1.5">
                          <Receipt className="size-4" />
                          <span>{group.expenses.length} expenses</span>
                        </div>
                        <span>•</span>
                        <span>{totalAmount.toFixed(2)} ALGO total</span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {yourShare > 0 && (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            You owe {yourShare.toFixed(2)} ALGO
                          </Badge>
                        )}
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {settledExpenses}/{group.expenses.length} settled
                        </Badge>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full hover:bg-[#006266]/5 dark:hover:bg-[#006266]/10"
                    >
                      <ArrowRight className="size-5 text-[#006266] dark:text-[#b2dfdb]" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })
        )}
      </motion.div>
    </div>
  );
}