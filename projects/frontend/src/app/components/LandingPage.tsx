import { motion } from 'motion/react';
import { Wallet, Shield, Zap, Users, ArrowRight, Sparkles, TrendingUp, Moon, Sun } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from '../context/ThemeContext';

interface LandingPageProps {
  onConnectWallet: () => void;
}

export function LandingPage({ onConnectWallet }: LandingPageProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e0f2f1] via-white to-[#b2dfdb]/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative overflow-hidden transition-colors duration-500">
      {/* Theme Toggle Button */}
      <motion.button
        onClick={toggleTheme}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed top-6 right-6 z-50 p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-full border border-white/40 dark:border-slate-700/40 shadow-lg hover:shadow-xl transition-all"
      >
        {theme === 'light' ? (
          <Moon className="size-5 text-gray-700" />
        ) : (
          <Sun className="size-5 text-yellow-400" />
        )}
      </motion.button>

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-[#006266]/20 to-[#00838f]/10 dark:from-[#006266]/40 dark:to-[#00838f]/20 rounded-full blur-3xl"
        />
        
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
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
            y: [0, -20, 0],
            x: [0, 20, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-20 left-1/4 w-80 h-80 bg-gradient-to-br from-[#006266]/15 to-[#004d4f]/10 dark:from-[#006266]/30 dark:to-[#004d4f]/20 rounded-full blur-3xl"
        />
      </div>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Logo with glow effect */}
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-3 mb-8 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#006266]/20 to-[#00838f]/20 dark:from-[#006266]/40 dark:to-[#00838f]/40 blur-2xl rounded-full" />
            <div className="relative p-3 bg-gradient-to-br from-[#006266] to-[#00838f] dark:from-[#b2dfdb] dark:to-[#80cbc4] rounded-2xl shadow-2xl">
              <Sparkles className="size-8 text-white dark:text-[#006266]" />
            </div>
            <h1 className="relative text-4xl font-bold text-[#006266] dark:text-[#b2dfdb]">AlgoSplit</h1>
          </motion.div>

          {/* Headline with gradient */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-5xl sm:text-7xl font-bold text-gray-900 dark:text-gray-100 mb-6 leading-tight"
          >
            Split Campus Expenses.
            <br />
            <span className="bg-gradient-to-r from-[#006266] to-[#00838f] dark:from-[#b2dfdb] dark:to-[#80cbc4] bg-clip-text text-transparent">
              Securely.
            </span>
          </motion.h2>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            No passwords. No intermediaries. Powered by Algorand.
          </motion.p>

          {/* CTA Buttons with enhanced styling */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col items-center gap-4"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={onConnectWallet}
                size="lg"
                className="bg-gradient-to-r from-[#006266] to-[#00838f] hover:from-[#004d4f] hover:to-[#006266] dark:from-[#b2dfdb] dark:to-[#80cbc4] dark:hover:from-[#80cbc4] dark:hover:to-[#4db6ac] text-white dark:text-[#006266] px-10 py-7 text-lg rounded-2xl shadow-2xl hover:shadow-[#006266]/50 dark:hover:shadow-[#b2dfdb]/50 transition-all duration-300 relative group"
              >
                <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <Wallet className="mr-2 size-5 relative z-10" />
                <span className="relative z-10">Connect Wallet</span>
                <ArrowRight className="ml-2 size-5 group-hover:translate-x-1 transition-transform relative z-10" />
              </Button>
            </motion.div>
            <a
              href="https://perawallet.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-[#006266] dark:hover:text-[#b2dfdb] transition-colors flex items-center gap-1"
            >
              <Sparkles className="size-3" />
              New to crypto? Create a wallet in 2 minutes →
            </a>
          </motion.div>
        </motion.div>

        {/* Preview Cards with enhanced design */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
        >
          {[
            { icon: Users, title: 'Split', desc: 'Create groups instantly', color: 'from-blue-500 to-cyan-500' },
            { icon: Zap, title: 'Pay', desc: 'One-click settlements', color: 'from-purple-500 to-pink-500' },
            { icon: Shield, title: 'Confirm', desc: 'Blockchain verified', color: 'from-green-500 to-teal-500' }
          ].map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
              whileHover={{ y: -12, scale: 1.03 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity blur-xl -z-10" 
                   style={{ background: `linear-gradient(to right, var(--tw-gradient-stops))` }} />
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-2 border-white/40 dark:border-slate-700/40 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-10 dark:opacity-20 blur-2xl" 
                     style={{ background: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }} />
                <div className={`inline-flex p-4 bg-gradient-to-br ${item.color} rounded-2xl mb-4 shadow-lg relative z-10`}>
                  <item.icon className="size-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 relative z-10">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-lg relative z-10">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Trust Indicators with icons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="mt-28 text-center"
        >
          <div className="inline-flex items-center gap-2 mb-8 px-6 py-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-full border border-white/30 dark:border-slate-700/30">
            <TrendingUp className="size-4 text-[#006266] dark:text-[#b2dfdb]" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Trusted by campus communities</p>
          </div>
          <div className="flex justify-center items-center gap-10 flex-wrap">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3 px-6 py-3 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-700/30 shadow-lg"
            >
              <Shield className="size-6 text-[#006266] dark:text-[#b2dfdb]" />
              <span className="font-medium text-gray-700 dark:text-gray-300">Blockchain Secured</span>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3 px-6 py-3 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-700/30 shadow-lg"
            >
              <Zap className="size-6 text-[#006266] dark:text-[#b2dfdb]" />
              <span className="font-medium text-gray-700 dark:text-gray-300">Instant Settlements</span>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3 px-6 py-3 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-700/30 shadow-lg"
            >
              <Users className="size-6 text-[#006266] dark:text-[#b2dfdb]" />
              <span className="font-medium text-gray-700 dark:text-gray-300">Built for Students</span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}