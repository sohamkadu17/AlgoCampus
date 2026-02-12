import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  Users, 
  PiggyBank, 
  Calendar, 
  HeartHandshake,
  Bell,
  Search,
  LogOut,
  Settings,
  User,
  Menu,
  X,
  Copy,
  Check,
  Sparkles
} from 'lucide-react';
import { UserAvatar, generateUsername } from './UserAvatar';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { AnimatedBackground } from './AnimatedBackground';
import { ThemeToggle } from './ThemeToggle';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenWallet: () => void;
  walletConnected: boolean;
  walletAddress?: string;
  onDisconnect: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  setActiveTab, 
  onOpenWallet,
  walletConnected,
  walletAddress = "0x...4a2b",
  onDisconnect
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const { theme, setTheme } = useTheme();

  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'splits', icon: Users, label: 'Splits' },
    { id: 'savings', icon: PiggyBank, label: 'Vault' },
    { id: 'events', icon: Calendar, label: 'Events' },
    { id: 'fundraising', icon: HeartHandshake, label: 'Fund' },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-zinc-950/50 text-slate-900 dark:text-zinc-100 flex overflow-hidden transition-colors duration-500">
      <AnimatedBackground />
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200/50 dark:border-zinc-800/50 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl p-6 z-50 transition-colors duration-500">
        <div className="flex items-center gap-3 mb-10 px-2">
          <motion.div 
            className="relative"
            whileHover={{ scale: 1.05 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#006266]/30 to-[#00838f]/30 blur-lg rounded-xl" />
            <div className="relative w-10 h-10 bg-gradient-to-tr from-[#006266] to-[#00838f] rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="text-white w-6 h-6" />
            </div>
          </motion.div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-[#006266] to-[#00838f] bg-clip-text text-transparent">
            CampusPay
          </span>
        </div>

        <nav className="flex-1 space-y-2">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
                activeTab === tab.id 
                  ? "bg-[#006266]/10 dark:bg-[#006266]/20 text-[#006266] dark:text-[#B2DFDB] font-bold" 
                  : "text-slate-500 dark:text-zinc-400 hover:bg-slate-100/70 dark:hover:bg-zinc-800/70"
              }`}
            >
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="desktopActive" 
                  className="absolute inset-0 bg-[#006266]/10 dark:bg-[#006266]/20 rounded-2xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <tab.icon className={`w-5 h-5 z-10 ${activeTab === tab.id ? "scale-110" : "group-hover:scale-110 transition-transform"}`} />
              <span className="z-10">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-auto w-2 h-2 rounded-full bg-[#006266] dark:bg-[#B2DFDB] z-10" 
                />
              )}
            </motion.button>
          ))}
        </nav>

        <div className="mt-auto space-y-4 pt-6 border-t border-slate-100 dark:border-zinc-800">
          <div className="flex justify-center">
            <ThemeToggle />
          </div>
          {walletConnected ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-white/70 dark:bg-zinc-800/70 backdrop-blur-xl border border-slate-100 dark:border-zinc-800"
            >
              <div className="flex items-center gap-3 mb-2">
                <UserAvatar address={walletAddress} size="sm" />
                <div className="overflow-hidden">
                  <p className="text-xs font-bold truncate">{generateUsername(walletAddress)}</p>
                  <p className="text-[10px] text-slate-500 truncate">{walletAddress}</p>
                </div>
              </div>
              <motion.button 
                onClick={onDisconnect}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-2 flex items-center justify-center gap-2 py-2 text-[10px] font-bold text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
              >
                <LogOut className="w-3 h-3" /> Disconnect
              </motion.button>
            </motion.div>
          ) : (
            <motion.button 
              onClick={onOpenWallet}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-[#006266] to-[#00838f] hover:from-[#004d4f] hover:to-[#006266] text-white font-bold py-3 rounded-2xl shadow-lg shadow-[#006266]/20 transition-all"
            >
              Connect Wallet
            </motion.button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen relative">
        {/* Top Header (Mobile & Desktop) */}
        <header className="sticky top-0 z-40 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-zinc-800/50 px-4 py-3 lg:px-8 lg:py-4 flex items-center justify-between transition-colors duration-500">
          <div className="lg:hidden flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#006266]/30 to-[#00838f]/30 blur-md rounded-lg" />
              <div className="relative w-8 h-8 bg-gradient-to-tr from-[#006266] to-[#00838f] rounded-lg flex items-center justify-center shadow-lg">
                <Sparkles className="text-white w-5 h-5" />
              </div>
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-[#006266] to-[#00838f] bg-clip-text text-transparent">
              CampusPay
            </span>
          </div>

          <div className="hidden lg:flex items-center relative max-w-md w-full ml-4">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input 
               type="text" 
               placeholder="Search splits, events, friends (Ctrl+K)" 
               className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-100/70 dark:bg-zinc-900/70 backdrop-blur-xl border-none outline-none focus:ring-2 focus:ring-[#006266]/50 text-sm transition-all"
             />
          </div>
          
          <div className="flex items-center gap-2 lg:gap-4">
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-full hover:bg-slate-100/70 dark:hover:bg-zinc-900/70 transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-zinc-950" />
            </motion.button>
            
            <div className="h-8 w-[1px] bg-slate-200 dark:border-zinc-800 mx-1 hidden lg:block" />
            
            {walletConnected ? (
              <div className="flex items-center gap-3">
                <div 
                  onClick={handleCopy}
                  className="hidden sm:flex flex-col items-end cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <p className="text-xs font-bold leading-tight">{generateUsername(walletAddress)}</p>
                  <div className="flex items-center gap-1">
                    <p className="text-[10px] text-slate-500 font-medium">{walletAddress.substring(0,6)}...{walletAddress.substring(38)}</p>
                    {copied ? <Check className="w-2.5 h-2.5 text-emerald-500" /> : <Copy className="w-2.5 h-2.5 text-slate-400" />}
                  </div>
                </div>
                <UserAvatar address={walletAddress} size="md" />
              </div>
            ) : (
              <motion.button 
                onClick={onOpenWallet}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-5 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-[#006266] to-[#00838f] text-white hover:from-[#004d4f] hover:to-[#006266] shadow-lg shadow-[#006266]/20 transition-all"
              >
                Connect
              </motion.button>
            )}
            
            <div className="lg:hidden">
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Content Scroll Area */}
        <main className="flex-1 overflow-y-auto pb-24 lg:pb-8">
          <div className="max-w-2xl mx-auto px-4 lg:px-8 py-6 lg:py-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl border-t border-slate-200/50 dark:border-zinc-800/50 transition-colors duration-500">
          <div className="max-w-md mx-auto px-4 py-2 flex items-center justify-between">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center gap-1 group relative p-2"
              >
                <div className={`transition-all duration-300 ${
                  activeTab === tab.id 
                    ? "text-[#006266] dark:text-[#B2DFDB] scale-110" 
                    : "text-slate-400 dark:text-zinc-500 group-hover:text-slate-600 dark:group-hover:text-zinc-300"
                }`}>
                  <tab.icon className="w-6 h-6" />
                </div>
                <span className={`text-[10px] font-bold transition-colors ${
                  activeTab === tab.id 
                    ? "text-[#006266] dark:text-[#B2DFDB]" 
                    : "text-slate-400 dark:text-zinc-500"
                }`}>
                  {tab.label}
                </span>
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="mobileActive"
                    className="absolute -top-1 left-0 right-0 h-1 bg-gradient-to-r from-[#006266] to-[#00838f] rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
};