import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, CheckCircle2, Sparkles } from 'lucide-react';

interface WalletConnectionPulseProps {
  isConnecting: boolean;
  isConnected: boolean;
}

export const WalletConnectionPulse: React.FC<WalletConnectionPulseProps> = ({ 
  isConnecting, 
  isConnected 
}) => {
  return (
    <AnimatePresence>
      {isConnecting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="relative"
          >
            {/* Outer pulse rings */}
            <motion.div
              className="absolute inset-0 rounded-full bg-[#006266]/30"
              animate={{
                scale: [1, 2, 2],
                opacity: [0.6, 0, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
            <motion.div
              className="absolute inset-0 rounded-full bg-[#006266]/30"
              animate={{
                scale: [1, 2, 2],
                opacity: [0.6, 0, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeOut",
                delay: 0.5,
              }}
            />
            <motion.div
              className="absolute inset-0 rounded-full bg-[#006266]/30"
              animate={{
                scale: [1, 2, 2],
                opacity: [0.6, 0, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeOut",
                delay: 1,
              }}
            />
            
            {/* Main card */}
            <motion.div
              className="relative bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-2xl border border-[#006266]/20"
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#006266]/20 to-[#00838f]/20 rounded-3xl blur-xl" />
              
              <div className="relative flex flex-col items-center gap-6">
                {/* Animated wallet icon */}
                <motion.div
                  className="relative w-24 h-24 bg-gradient-to-br from-[#006266] to-[#00838f] rounded-2xl flex items-center justify-center shadow-2xl"
                  animate={{
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Wallet className="w-12 h-12 text-white" />
                  
                  {/* Sparkles */}
                  <motion.div
                    className="absolute -top-2 -right-2"
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 180, 360],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  >
                    <Sparkles className="w-6 h-6 text-yellow-400" />
                  </motion.div>
                </motion.div>
                
                {/* Text */}
                <div className="text-center">
                  <motion.h3
                    className="text-2xl font-black text-gray-900 dark:text-white mb-2"
                    animate={{
                      opacity: [1, 0.7, 1],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    Connecting Wallet
                  </motion.h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Please approve the connection in your wallet
                  </p>
                </div>
                
                {/* Loading dots */}
                <div className="flex gap-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-[#006266] rounded-full"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.3, 1, 0.3],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
      
      {/* Success animation */}
      {isConnected && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100]"
        >
          <motion.div
            className="bg-white dark:bg-zinc-900 rounded-full p-8 shadow-2xl border-4 border-emerald-500"
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 0.5,
            }}
          >
            <CheckCircle2 className="w-16 h-16 text-emerald-500" />
          </motion.div>
          
          {/* Success pulse */}
          <motion.div
            className="absolute inset-0 rounded-full bg-emerald-500/30"
            animate={{
              scale: [1, 2],
              opacity: [0.6, 0],
            }}
            transition={{
              duration: 0.8,
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
