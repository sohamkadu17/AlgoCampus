import { motion } from 'motion/react';
import { ArrowLeft, Users, Receipt, UserPlus, Plus, Sparkles } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { AddMemberDialog } from './AddMemberDialog';
import { AddExpenseDialog } from './AddExpenseDialog';
import { getUserProfile } from '../utils/usernames';

interface Member {
  id: string;
  address: string;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  settledBy: string[];
}

interface Group {
  id: string;
  name: string;
  members: Member[];
  expenses: Expense[];
}

interface SplitDetailPageProps {
  group: Group;
  currentUserAddress: string;
  onBack: () => void;
  onAddMember: (address: string) => void;
  onAddExpense: (description: string, amount: number, paidBy: string) => void;
  onPayShare: (expenseId: string) => void;
}

export function SplitDetailPage({
  group,
  currentUserAddress,
  onBack,
  onAddMember,
  onAddExpense,
  onPayShare
}: SplitDetailPageProps) {
  const totalExpenses = group.expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="rounded-xl hover:bg-[#006266]/5"
          >
            <ArrowLeft className="size-5 text-[#006266]" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
            <p className="text-gray-600">
              {group.members.length} member{group.members.length !== 1 ? 's' : ''} • {totalExpenses.toFixed(2)} ALGO total
            </p>
          </div>
        </div>
      </motion.div>

      {/* Members Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="bg-white/60 backdrop-blur-sm border-white/20 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Users className="size-5 text-[#006266]" />
              <h2 className="text-xl font-semibold text-gray-900">Members</h2>
            </div>
            <AddMemberDialog onAddMember={onAddMember} groupId={group.id} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {group.members.map((member, index) => {
              const isYou = member.address === currentUserAddress;
              const profile = getUserProfile(member.address);
              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 p-4 bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-sm rounded-xl hover:shadow-lg transition-all duration-300 border border-white/40"
                >
                  <motion.div 
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                    className={`size-12 rounded-full bg-gradient-to-br ${profile.avatar.gradient} flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-white`}
                  >
                    {profile.avatar.initials}
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 mb-0.5">{profile.username}</p>
                    <p className="font-mono text-xs text-gray-600 truncate">
                      {member.address.substring(0, 8)}...{member.address.substring(member.address.length - 6)}
                    </p>
                    {isYou && (
                      <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-gradient-to-r from-[#006266] to-[#00838f] text-white text-xs rounded-full">
                        <Sparkles className="size-3" />
                        <span className="font-semibold">You</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Card>
      </motion.div>

      {/* Expenses Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="size-5 text-[#006266]" />
            <h2 className="text-xl font-semibold text-gray-900">Expenses</h2>
          </div>
          <AddExpenseDialog onAddExpense={onAddExpense} members={group.members} />
        </div>

        {group.expenses.length === 0 ? (
          <Card className="bg-white/60 backdrop-blur-sm border-white/20 p-12 text-center">
            <div className="inline-flex p-4 bg-[#006266]/10 rounded-full mb-4">
              <Receipt className="size-8 text-[#006266]" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No expenses yet</h3>
            <p className="text-gray-600 mb-6">Add your first expense to start splitting costs</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {group.expenses.map((expense, index) => {
              const sharePerPerson = expense.amount / group.members.length;
              const isPaidByCurrentUser = expense.paidBy === currentUserAddress;
              const isSettledByCurrentUser = expense.settledBy.includes(currentUserAddress);
              const paidByMember = group.members.find(m => m.id === expense.paidBy);
              const paidByProfile = paidByMember ? getUserProfile(paidByMember.address) : null;

              return (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ scale: 1.01, y: -2 }}
                >
                  <Card className="bg-white/70 backdrop-blur-sm border-white/30 p-6 hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[#006266]/5 to-[#b2dfdb]/10 blur-3xl rounded-full" />
                    <div className="flex items-start justify-between gap-4 relative z-10">
                      <div className="flex gap-4 flex-1">
                        <div className="p-3 bg-gradient-to-br from-[#006266]/10 to-[#b2dfdb]/20 rounded-xl h-fit shadow-lg">
                          <Receipt className="size-6 text-[#006266]" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-2">{expense.description}</h3>
                          {paidByProfile && (
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-sm text-gray-600">Paid by</span>
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/60 rounded-lg">
                                <div className={`size-5 rounded-full bg-gradient-to-br ${paidByProfile.avatar.gradient} flex items-center justify-center text-white text-xs font-bold`}>
                                  {paidByProfile.avatar.initials}
                                </div>
                                <span className="font-semibold text-gray-900">{paidByProfile.username}</span>
                              </div>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="bg-white/70 shadow-sm">
                              {expense.amount.toFixed(2)} ALGO total
                            </Badge>
                            <Badge variant="secondary" className="bg-gradient-to-r from-[#006266]/10 to-[#00838f]/10 text-[#006266] shadow-sm">
                              {sharePerPerson.toFixed(2)} ALGO per person
                            </Badge>
                            <Badge variant="outline" className="bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200 shadow-sm">
                              {expense.settledBy.length}/{group.members.length} settled
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {isPaidByCurrentUser ? (
                          <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 shadow-lg">
                            You Paid
                          </Badge>
                        ) : isSettledByCurrentUser ? (
                          <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 shadow-lg">
                            Paid ✓
                          </Badge>
                        ) : (
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              size="sm"
                              onClick={() => onPayShare(expense.id)}
                              className="bg-gradient-to-r from-[#006266] to-[#00838f] hover:from-[#004d4f] hover:to-[#006266] text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                              Pay {sharePerPerson.toFixed(2)} ALGO
                            </Button>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}