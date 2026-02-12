import React from 'react';
import { motion } from 'motion/react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, variant = 'rectangular' }) => {
  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      className={`bg-slate-200 dark:bg-zinc-800 ${
        variant === 'circular' ? 'rounded-full' : 'rounded-xl'
      } ${className}`}
    />
  );
};

export const DashboardSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-48 w-full rounded-[2.5rem]" />
    <div className="grid grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="flex flex-col items-center gap-2">
          <Skeleton className="w-14 h-14 rounded-2xl" />
          <Skeleton className="w-12 h-3" />
        </div>
      ))}
    </div>
    <Skeleton className="h-40 w-full" />
    <div className="space-y-4">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
    </div>
  </div>
);
