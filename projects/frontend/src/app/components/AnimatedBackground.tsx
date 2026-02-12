import React from 'react';
import { motion } from 'motion/react';

export const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Light Mode: Soft layered gradient background */}
      {/* Dark Mode: Deep teal gradient */}
      
      {/* Base Gradient Layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#E6F4F3] via-[#F4FDFC] to-[#E6F4F3] dark:from-[#041F1E] dark:via-[#052C2B] dark:to-[#003D3B] transition-colors duration-500" />
      
      {/* Decorative Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#006266" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      
      {/* Soft Radial Glow behind content */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#006266]/10 dark:bg-[#006266]/20 blur-[150px] rounded-full" />
      
      {/* Primary Teal Blob - Floating Shape 1 */}
      <motion.div
        animate={{
          x: [0, 80, -40, 0],
          y: [0, -60, 40, 0],
          scale: [1, 1.15, 0.9, 1],
          rotate: [0, 45, -45, 0],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] bg-[#006266]/8 dark:bg-[#006266]/15 blur-[100px] rounded-full"
      />

      {/* Soft Mint Blob - Floating Shape 2 */}
      <motion.div
        animate={{
          x: [0, -100, 60, 0],
          y: [0, 120, -60, 0],
          scale: [1.1, 0.95, 1.05, 1.1],
          rotate: [0, -60, 60, 0],
        }}
        transition={{
          duration: 32,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -bottom-1/4 -right-1/4 w-[700px] h-[700px] bg-[#B2DFDB]/12 dark:bg-[#80CBC4]/10 blur-[120px] rounded-full"
      />

      {/* Subtle Teal Accent - Floating Shape 3 */}
      <motion.div
        animate={{
          x: [0, 60, -80, 0],
          y: [0, 80, -100, 0],
          scale: [0.9, 1.05, 0.85, 0.9],
        }}
        transition={{
          duration: 36,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/2 left-1/3 w-[500px] h-[500px] bg-[#006266]/6 dark:bg-[#006266]/12 blur-[130px] rounded-full"
      />

      {/* Pulsing Glow Accent */}
      <motion.div
        animate={{
          opacity: [0.2, 0.4, 0.2],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#006266]/8 dark:bg-[#006266]/15 blur-[100px] rounded-full"
      />
      
      {/* Additional decorative orbs */}
      <motion.div
        animate={{
          x: [0, 30, -30, 0],
          y: [0, -40, 20, 0],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/3 right-1/3 w-64 h-64 bg-[#00838f]/10 dark:bg-[#00838f]/15 blur-[80px] rounded-full"
      />
      
      <motion.div
        animate={{
          x: [0, -40, 40, 0],
          y: [0, 50, -30, 0],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-[#B2DFDB]/8 dark:bg-[#4DB6AC]/10 blur-[90px] rounded-full"
      />
      
      {/* Subtle Vignette Effect for Dark Mode */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/5 dark:to-black/30 pointer-events-none" />
      
      {/* Inner Glow for Dark Mode */}
      <div className="absolute inset-0 bg-gradient-radial from-[#006266]/0 via-transparent to-transparent dark:from-[#006266]/5 pointer-events-none" />
      
      {/* Subtle animated dots pattern */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-[#006266] rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
    </div>
  );
};