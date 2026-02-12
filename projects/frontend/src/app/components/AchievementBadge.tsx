import { motion } from 'motion/react';
import { Lock } from 'lucide-react';
import { Achievement, getRarityColor, getRarityBorder } from '../utils/achievements';
import { Card } from './ui/card';

interface AchievementBadgeProps {
  achievement: Achievement & { 
    currentValue: number; 
    isUnlocked: boolean; 
    percentage: number 
  };
  index?: number;
}

export function AchievementBadge({ achievement, index = 0 }: AchievementBadgeProps) {
  const Icon = achievement.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      whileHover={{ y: -4, scale: 1.02 }}
    >
      <Card className={`
        relative overflow-hidden p-6 
        bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl 
        border-2 ${achievement.isUnlocked ? getRarityBorder(achievement.rarity) : 'border-gray-300 dark:border-slate-600'}
        ${achievement.isUnlocked ? 'shadow-lg' : 'opacity-60'}
        transition-all duration-300
      `}>
        {/* Gradient overlay when unlocked */}
        {achievement.isUnlocked && (
          <div className={`absolute inset-0 bg-gradient-to-br ${achievement.gradient} opacity-5`} />
        )}

        <div className="relative z-10 flex items-start gap-4">
          {/* Icon */}
          <div className={`
            p-3 rounded-xl relative
            ${achievement.isUnlocked 
              ? `bg-gradient-to-br ${achievement.gradient}` 
              : 'bg-gray-200 dark:bg-slate-700'
            }
          `}>
            {achievement.isUnlocked ? (
              <Icon className="size-6 text-white" />
            ) : (
              <Lock className="size-6 text-gray-400" />
            )}
            
            {/* Sparkle effect for legendary */}
            {achievement.isUnlocked && achievement.rarity === 'legendary' && (
              <motion.div
                className="absolute inset-0 rounded-xl"
                animate={{
                  boxShadow: [
                    '0 0 0px rgba(251, 191, 36, 0)',
                    '0 0 20px rgba(251, 191, 36, 0.4)',
                    '0 0 0px rgba(251, 191, 36, 0)',
                  ]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
            )}
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-bold text-gray-900 dark:text-gray-100">
                {achievement.title}
              </h3>
              <span className={`text-xs font-semibold uppercase px-2 py-1 rounded-full ${getRarityColor(achievement.rarity)} bg-current/10`}>
                {achievement.rarity}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {achievement.description}
            </p>

            {/* Progress bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{achievement.currentValue} / {achievement.requirement}</span>
                <span>{Math.round(achievement.percentage)}%</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${achievement.isUnlocked ? `bg-gradient-to-r ${achievement.gradient}` : 'bg-gray-400'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${achievement.percentage}%` }}
                  transition={{ duration: 1, delay: 0.2 + index * 0.05 }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Unlock animation */}
        {achievement.isUnlocked && achievement.rarity === 'legendary' && (
          <motion.div
            className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/20 to-transparent rounded-full blur-2xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        )}
      </Card>
    </motion.div>
  );
}

// Compact badge for inline display
export function CompactBadge({ achievement }: { achievement: Achievement & { isUnlocked: boolean } }) {
  const Icon = achievement.icon;
  
  if (!achievement.isUnlocked) return null;

  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${achievement.gradient} shadow-lg cursor-pointer`}
      title={achievement.title}
    >
      <Icon className="size-4 text-white" />
    </motion.div>
  );
}
