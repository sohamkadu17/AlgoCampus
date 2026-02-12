import React from 'react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className, 
  onClick,
  hoverable = false 
}) => {
  return (
    <motion.div 
      onClick={onClick}
      whileHover={hoverable ? { y: -4 } : undefined}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        "bg-white/30 dark:bg-[#006266]/10 backdrop-blur-lg border border-white/20 dark:border-[#006266]/20 rounded-3xl overflow-hidden shadow-lg transition-all duration-300",
        hoverable && "hover:bg-white/40 dark:hover:bg-[#006266]/15 hover:shadow-2xl hover:shadow-[#006266]/10 hover:border-[#006266]/30 cursor-pointer",
        className
      )}
    >
      {children}
    </motion.div>
  );
};