import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, LogOut, Moon, Sun, Check } from 'lucide-react';
import { getUserProfile } from '../utils/usernames';
import { useTheme } from '../context/ThemeContext';

interface TopBarProps {
  connectedAddress: string;
  onDisconnect: () => void;
}

export function TopBar({ connectedAddress, onDisconnect }: TopBarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const profile = getUserProfile(connectedAddress);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(connectedAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-16 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-white/30 dark:border-slate-700/30 px-6 flex items-center justify-between relative z-20">
      {/* Left side - empty for now, can add breadcrumbs later */}
      <div className="flex-1" />

      {/* Right side - Wallet info */}
      <div className="flex items-center gap-3">
        {/* Network Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#006266]/10 dark:bg-[#006266]/20 rounded-lg border border-[#006266]/20">
          <div className="size-2 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50" />
          <span className="text-xs font-medium text-[#006266] dark:text-[#b2dfdb]">Algorand Testnet</span>
        </div>

        {/* Wallet Dropdown */}
        <div className="relative">
          <motion.button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-white/40 dark:border-slate-700/40 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <div className={`size-9 rounded-full bg-gradient-to-br ${profile.avatar.gradient} flex items-center justify-center text-white text-sm font-bold ring-2 ring-white dark:ring-slate-800`}>
              {profile.avatar.initials}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{profile.username}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                {connectedAddress.substring(0, 6)}...{connectedAddress.substring(connectedAddress.length - 4)}
              </p>
            </div>
          </motion.button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {dropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setDropdownOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-full mt-2 w-64 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-slate-700/30 shadow-2xl overflow-hidden z-40"
                >
                  {/* Wallet Info Section */}
                  <div className="p-4 border-b border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`size-12 rounded-full bg-gradient-to-br ${profile.avatar.gradient} flex items-center justify-center text-white font-bold ring-2 ring-white dark:ring-slate-800`}>
                        {profile.avatar.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 dark:text-gray-100">{profile.username}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-mono truncate">
                          {connectedAddress}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="p-2">
                    <motion.button
                      onClick={handleCopyAddress}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      {copied ? (
                        <Check className="size-4 text-green-500" />
                      ) : (
                        <Copy className="size-4 text-gray-600 dark:text-gray-400" />
                      )}
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {copied ? 'Copied!' : 'Copy Address'}
                      </span>
                    </motion.button>

                    <motion.button
                      onClick={() => {
                        toggleTheme();
                        setDropdownOpen(false);
                      }}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      {theme === 'light' ? (
                        <Moon className="size-4 text-gray-600 dark:text-gray-400" />
                      ) : (
                        <Sun className="size-4 text-gray-600 dark:text-gray-400" />
                      )}
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                      </span>
                    </motion.button>

                    <div className="my-2 h-px bg-gray-100 dark:bg-slate-700" />

                    <motion.button
                      onClick={() => {
                        onDisconnect();
                        setDropdownOpen(false);
                      }}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group"
                    >
                      <LogOut className="size-4 text-gray-600 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-red-400">
                        Disconnect Wallet
                      </span>
                    </motion.button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
