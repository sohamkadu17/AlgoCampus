import { motion } from 'motion/react';

export function BackgroundDecorations() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Animated gradient orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-[#006266]/20 to-[#00838f]/10 dark:from-[#006266]/30 dark:to-[#00838f]/20 rounded-full blur-3xl"
      />
      
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          x: [0, -30, 0],
          y: [0, 50, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-1/4 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-[#b2dfdb]/30 to-[#80cbc4]/20 dark:from-[#b2dfdb]/20 dark:to-[#80cbc4]/10 rounded-full blur-3xl"
      />
      
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          x: [0, -20, 0],
          y: [0, -40, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute bottom-20 left-1/4 w-80 h-80 bg-gradient-to-br from-[#006266]/15 to-[#004d4f]/10 dark:from-[#006266]/25 dark:to-[#004d4f]/15 rounded-full blur-3xl"
      />

      {/* Floating shapes */}
      <motion.div
        animate={{
          rotate: [0, 360],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-1/3 left-1/3 w-20 h-20 border-2 border-[#006266]/10 dark:border-[#006266]/20 rounded-2xl"
      />
      
      <motion.div
        animate={{
          rotate: [360, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute bottom-1/3 right-1/4 w-16 h-16 border-2 border-[#b2dfdb]/20 dark:border-[#b2dfdb]/30 rounded-full"
      />

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(#006266 1px, transparent 1px), linear-gradient(90deg, #006266 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />
    </div>
  );
}