import { Trophy, Target, Users, Zap, Star, Award, Crown, Sparkles } from 'lucide-react';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  gradient: string;
  requirement: number;
  category: 'splits' | 'expenses' | 'settlements' | 'social' | 'streak';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export const achievements: Achievement[] = [
  {
    id: 'first-split',
    title: 'First Split',
    description: 'Created your first expense split',
    icon: Sparkles,
    gradient: 'from-blue-500 to-cyan-500',
    requirement: 1,
    category: 'splits',
    rarity: 'common'
  },
  {
    id: 'split-master',
    title: 'Split Master',
    description: 'Created 10 expense splits',
    icon: Target,
    gradient: 'from-purple-500 to-pink-500',
    requirement: 10,
    category: 'splits',
    rarity: 'rare'
  },
  {
    id: 'social-butterfly',
    title: 'Social Butterfly',
    description: 'Added 20 different members across splits',
    icon: Users,
    gradient: 'from-green-500 to-emerald-500',
    requirement: 20,
    category: 'social',
    rarity: 'rare'
  },
  {
    id: 'fast-settler',
    title: 'Fast Settler',
    description: 'Settled 5 expenses within 24 hours',
    icon: Zap,
    gradient: 'from-yellow-500 to-orange-500',
    requirement: 5,
    category: 'settlements',
    rarity: 'epic'
  },
  {
    id: 'expense-tracker',
    title: 'Expense Tracker',
    description: 'Added 50 expenses',
    icon: Star,
    gradient: 'from-red-500 to-rose-500',
    requirement: 50,
    category: 'expenses',
    rarity: 'epic'
  },
  {
    id: 'perfect-week',
    title: 'Perfect Week',
    description: 'Used AlgoSplit 7 days in a row',
    icon: Award,
    gradient: 'from-indigo-500 to-purple-500',
    requirement: 7,
    category: 'streak',
    rarity: 'epic'
  },
  {
    id: 'legendary-splitter',
    title: 'Legendary Splitter',
    description: 'Created 100 expense splits',
    icon: Crown,
    gradient: 'from-amber-500 via-yellow-500 to-orange-500',
    requirement: 100,
    category: 'splits',
    rarity: 'legendary'
  },
  {
    id: 'blockchain-champion',
    title: 'Blockchain Champion',
    description: 'Completed 100 on-chain settlements',
    icon: Trophy,
    gradient: 'from-cyan-500 via-teal-500 to-green-500',
    requirement: 100,
    category: 'settlements',
    rarity: 'legendary'
  }
];

export interface UserProgress {
  splitsCreated: number;
  expensesAdded: number;
  settlementsCompleted: number;
  uniqueMembers: number;
  currentStreak: number;
  fastSettlements: number;
}

export function calculateAchievements(progress: UserProgress) {
  return achievements.map(achievement => {
    let currentValue = 0;
    let isUnlocked = false;

    switch (achievement.category) {
      case 'splits':
        currentValue = progress.splitsCreated;
        break;
      case 'expenses':
        currentValue = progress.expensesAdded;
        break;
      case 'settlements':
        currentValue = progress.settlementsCompleted;
        break;
      case 'social':
        currentValue = progress.uniqueMembers;
        break;
      case 'streak':
        currentValue = progress.currentStreak;
        break;
    }

    isUnlocked = currentValue >= achievement.requirement;
    const percentage = Math.min((currentValue / achievement.requirement) * 100, 100);

    return {
      ...achievement,
      currentValue,
      isUnlocked,
      percentage
    };
  });
}

export function getRarityColor(rarity: Achievement['rarity']) {
  switch (rarity) {
    case 'common':
      return 'text-gray-600 dark:text-gray-400';
    case 'rare':
      return 'text-blue-600 dark:text-blue-400';
    case 'epic':
      return 'text-purple-600 dark:text-purple-400';
    case 'legendary':
      return 'text-amber-600 dark:text-amber-400';
  }
}

export function getRarityBorder(rarity: Achievement['rarity']) {
  switch (rarity) {
    case 'common':
      return 'border-gray-300 dark:border-gray-600';
    case 'rare':
      return 'border-blue-400 dark:border-blue-500';
    case 'epic':
      return 'border-purple-400 dark:border-purple-500';
    case 'legendary':
      return 'border-amber-400 dark:border-amber-500 shadow-amber-500/50';
  }
}
