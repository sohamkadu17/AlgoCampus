import React, { useMemo } from 'react';
import { motion } from 'motion/react';

const gradients = [
  'from-teal-400 to-blue-500',
  'from-purple-400 to-indigo-500',
  'from-pink-400 to-rose-500',
  'from-amber-400 to-orange-500',
  'from-emerald-400 to-teal-500',
  'from-blue-400 to-indigo-500',
];

const adjectives = ['Teal', 'Cyan', 'Indigo', 'Emerald', 'Sapphire', 'Amber', 'Crimson'];
const animals = ['Whale', 'Shark', 'Falcon', 'Wolf', 'Lion', 'Eagle', 'Panda'];

export const generateUsername = (address: string) => {
  if (!address) return "Student";
  const index = address.charCodeAt(address.length - 1) % adjectives.length;
  const animIndex = address.charCodeAt(0) % animals.length;
  return `${adjectives[index]}${animals[animIndex]}`;
};

interface UserAvatarProps {
  address?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ 
  address = "0x0000", 
  size = 'md',
  className = ""
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-14 h-14 text-sm',
    xl: 'w-20 h-20 text-lg',
  };

  const gradient = useMemo(() => {
    const charCode = address.charCodeAt(address.length - 1);
    return gradients[charCode % gradients.length];
  }, [address]);

  const initials = useMemo(() => {
    const username = generateUsername(address);
    return username.substring(0, 2).toUpperCase();
  }, [address]);

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        relative rounded-full flex items-center justify-center font-bold text-white shadow-lg
        bg-gradient-to-tr ${gradient} ${sizeClasses[size]} ${className}
      `}
    >
      {initials}
      <div className="absolute inset-0 rounded-full border border-white/20" />
    </motion.div>
  );
};
