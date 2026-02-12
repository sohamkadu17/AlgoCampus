import { motion } from 'motion/react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Lightbulb, Sparkles, DollarSign, Users, Calendar, AlertCircle } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

interface AIInsightsPageProps {
  groups: Array<{
    id: string;
    name: string;
    members: { id: string; address: string }[];
    expenses: Array<{
      id: string;
      description: string;
      amount: number;
      paidBy: string;
      settledBy: string[];
    }>;
  }>;
  connectedAddress: string;
}

export function AIInsightsPage({ groups, connectedAddress }: AIInsightsPageProps) {
  // Calculate monthly trends
  const monthlyData = [
    { month: 'Jan', spending: 450, splits: 5, savings: 120 },
    { month: 'Feb', spending: 680, splits: 8, savings: 180 },
    { month: 'Mar', spending: 520, splits: 6, savings: 140 },
    { month: 'Apr', spending: 780, splits: 10, savings: 220 },
    { month: 'May', spending: 920, splits: 12, savings: 280 },
    { month: 'Jun', spending: 1100, splits: 15, savings: 350 }
  ];

  // Category breakdown
  const categoryData = [
    { name: 'Food & Dining', value: 1200, color: '#06b6d4' },
    { name: 'Transportation', value: 450, color: '#8b5cf6' },
    { name: 'Entertainment', value: 680, color: '#ec4899' },
    { name: 'Utilities', value: 320, color: '#f59e0b' },
    { name: 'Others', value: 550, color: '#10b981' }
  ];

  // AI Insights
  const insights = [
    {
      type: 'positive',
      icon: TrendingUp,
      title: 'Spending Trend',
      message: 'Your group expenses increased by 23% this month, but you\'re splitting costs efficiently.',
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-100 dark:bg-green-900/30'
    },
    {
      type: 'warning',
      icon: AlertCircle,
      title: 'Settlement Delay',
      message: 'You have 3 pending settlements from last week. Settling soon improves your credit score.',
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-100 dark:bg-orange-900/30'
    },
    {
      type: 'tip',
      icon: Lightbulb,
      title: 'Smart Tip',
      message: 'Creating recurring splits for roommate expenses can save you 15 minutes per week.',
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
      type: 'savings',
      icon: DollarSign,
      title: 'Potential Savings',
      message: 'Optimizing your settlement flow reduced transaction count by 40% this month.',
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-100 dark:bg-purple-900/30'
    }
  ];

  // Stats
  const totalSpent = groups.reduce((sum, group) => 
    sum + group.expenses.reduce((expSum, exp) => expSum + exp.amount, 0), 0
  );
  
  const totalSplits = groups.length;
  const avgPerSplit = totalSplits > 0 ? totalSpent / totalSplits : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-[#006266] to-[#00838f] dark:from-[#b2dfdb] dark:to-[#80cbc4] rounded-xl">
            <Sparkles className="size-6 text-white dark:text-[#006266]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">AI Insights</h1>
            <p className="text-gray-600 dark:text-gray-400">Smart analytics for your spending patterns</p>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: DollarSign, label: 'Total Spent', value: `${totalSpent.toFixed(2)} ALGO`, color: 'from-blue-500 to-cyan-500' },
          { icon: Users, label: 'Active Splits', value: totalSplits, color: 'from-purple-500 to-pink-500' },
          { icon: Calendar, label: 'Avg per Split', value: `${avgPerSplit.toFixed(2)} ALGO`, color: 'from-green-500 to-emerald-500' }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
          >
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-white/40 dark:border-slate-700/40 p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                  <stat.icon className="size-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-white/40 dark:border-slate-700/40 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <TrendingUp className="size-5 text-[#006266] dark:text-[#b2dfdb]" />
              Monthly Spending Trend
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-700" />
                <XAxis dataKey="month" stroke="#6b7280" className="dark:stroke-gray-400" />
                <YAxis stroke="#6b7280" className="dark:stroke-gray-400" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="spending" stroke="#006266" strokeWidth={3} dot={{ fill: '#006266', r: 4 }} />
                <Line type="monotone" dataKey="savings" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-white/40 dark:border-slate-700/40 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Sparkles className="size-5 text-[#006266] dark:text-[#b2dfdb]" />
              Category Breakdown
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      </div>

      {/* AI Insights Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Smart Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight, index) => (
            <motion.div
              key={insight.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-white/40 dark:border-slate-700/40 p-5">
                <div className="flex gap-4">
                  <div className={`p-3 rounded-xl ${insight.bg} h-fit`}>
                    <insight.icon className={`size-5 ${insight.color}`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-1">{insight.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{insight.message}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <Card className="bg-gradient-to-br from-[#006266]/5 to-[#b2dfdb]/20 dark:from-[#006266]/10 dark:to-[#b2dfdb]/30 border-[#006266]/20 dark:border-[#b2dfdb]/20 p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-[#006266] to-[#00838f] dark:from-[#b2dfdb] dark:to-[#80cbc4] rounded-xl">
              <Lightbulb className="size-6 text-white dark:text-[#006266]" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">AI Recommendation</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                Based on your spending patterns, we recommend setting up recurring splits for your regular group expenses. 
                This could save you up to 2 hours per month and reduce missed payments by 60%.
              </p>
              <Badge className="bg-[#006266] dark:bg-[#b2dfdb] text-white dark:text-[#006266]">
                Potential Time Savings: 2hrs/month
              </Badge>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
