import { motion } from 'motion/react';
import { Clock, Receipt, CheckCircle2, XCircle } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { getUserProfile } from '../utils/usernames';

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

interface HistoryPageProps {
  groups: Group[];
  connectedAddress: string;
}

export function HistoryPage({ groups, connectedAddress }: HistoryPageProps) {
  // Flatten all expenses with group context
  const allTransactions = groups.flatMap(group =>
    group.expenses.map(expense => ({
      ...expense,
      groupName: group.name,
      groupId: group.id,
      memberCount: group.members.length
    }))
  ).sort((a, b) => parseInt(b.id.split('-')[1]) - parseInt(a.id.split('-')[1]));

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Transaction History</h1>
        <p className="text-gray-600 dark:text-gray-400">View all your past expense settlements</p>
      </motion.div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-white/20 dark:border-slate-700/30 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#006266]/10 dark:bg-[#006266]/20 rounded-lg">
                <Receipt className="size-5 text-[#006266] dark:text-[#b2dfdb]" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{allTransactions.length}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-white/20 dark:border-slate-700/30 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Settled</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {allTransactions.filter(t => t.settledBy.includes(connectedAddress) || t.paidBy === connectedAddress).length}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-white/20 dark:border-slate-700/30 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <XCircle className="size-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {allTransactions.filter(t => !t.settledBy.includes(connectedAddress) && t.paidBy !== connectedAddress).length}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Transaction List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="space-y-3"
      >
        {allTransactions.length === 0 ? (
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-white/20 dark:border-slate-700/30 p-12 text-center">
            <div className="inline-flex p-4 bg-[#006266]/10 dark:bg-[#006266]/20 rounded-full mb-4">
              <Clock className="size-8 text-[#006266] dark:text-[#b2dfdb]" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No transactions yet</h3>
            <p className="text-gray-600 dark:text-gray-400">Your transaction history will appear here</p>
          </Card>
        ) : (
          allTransactions.map((transaction, index) => {
            const sharePerPerson = transaction.amount / transaction.memberCount;
            const isPaidByYou = transaction.paidBy === connectedAddress;
            const isSettledByYou = transaction.settledBy.includes(connectedAddress);
            const paidByProfile = getUserProfile(transaction.paidBy);

            return (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.35 + index * 0.03 }}
              >
                <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-white/20 dark:border-slate-700/30 p-6 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4 flex-1">
                      <div
                        className={`p-3 rounded-xl h-fit ${
                          isSettledByYou || isPaidByYou
                            ? 'bg-green-100 dark:bg-green-900/30'
                            : 'bg-red-100 dark:bg-red-900/30'
                        }`}
                      >
                        <Receipt className={`size-6 ${
                          isSettledByYou || isPaidByYou
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                          {transaction.description}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {transaction.groupName} • Paid by {paidByProfile.username}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="bg-white/50 dark:bg-slate-700/50 dark:text-gray-300 dark:border-slate-600">
                            {transaction.amount.toFixed(2)} ALGO total
                          </Badge>
                          <Badge variant="secondary" className="bg-[#006266]/10 dark:bg-[#006266]/20 text-[#006266] dark:text-[#b2dfdb] dark:border-[#006266]/30">
                            {sharePerPerson.toFixed(2)} ALGO per person
                          </Badge>
                          {isPaidByYou ? (
                            <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30">
                              You Paid
                            </Badge>
                          ) : isSettledByYou ? (
                            <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30">
                              Settled ✓
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30">
                              Pending
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-semibold ${
                        isPaidByYou ? 'text-green-600 dark:text-green-400' : isSettledByYou ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {isPaidByYou ? '+' : isSettledByYou ? '-' : ''}{sharePerPerson.toFixed(2)} ALGO
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {transaction.settledBy.length}/{transaction.memberCount} settled
                      </p>
                    </div>
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