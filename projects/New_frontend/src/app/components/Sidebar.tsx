import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, Split, Plus, Clock, Sparkles, Menu, ChevronLeft, Lightbulb } from 'lucide-react';
import { cn } from './ui/utils';
import { getUserProfile } from '../utils/usernames';

type Page = 'dashboard' | 'splits' | 'create' | 'history' | 'insights';

interface SidebarProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  connectedAddress: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ currentPage, onPageChange, connectedAddress, isCollapsed, onToggleCollapse }: SidebarProps) {
  const profile = getUserProfile(connectedAddress);
  
  const menuItems = [
    { id: 'dashboard' as Page, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'splits' as Page, label: 'My Splits', icon: Split },
    { id: 'create' as Page, label: 'Create Split', icon: Plus },
    { id: 'history' as Page, label: 'History', icon: Clock },
    { id: 'insights' as Page, label: 'AI Insights', icon: Lightbulb },
  ];

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ 
        x: 0, 
        opacity: 1,
        width: isCollapsed ? '5rem' : '18rem'
      }}
      transition={{ duration: 0.3 }}
      className="h-screen fixed left-0 top-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-r border-white/30 dark:border-slate-700/30 shadow-2xl z-30"
    >
      <div className="p-4 flex flex-col h-full relative">
        {/* Decorative gradient */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#006266]/5 to-transparent pointer-events-none" />
        
        {/* Header with Logo and Toggle */}
        <div className="flex items-center justify-between mb-8 relative">
          {!isCollapsed && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[#006266]/30 to-[#00838f]/30 blur-xl rounded-full" />
                <div className="relative p-2 bg-gradient-to-br from-[#006266] to-[#00838f] rounded-xl shadow-lg">
                  <Sparkles className="size-5 text-white" />
                </div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-[#006266] to-[#00838f] bg-clip-text text-transparent">
                AlgoSplit
              </span>
            </motion.div>
          )}
          
          {isCollapsed && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative mx-auto"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#006266]/30 to-[#00838f]/30 blur-xl rounded-full" />
              <div className="relative p-2 bg-gradient-to-br from-[#006266] to-[#00838f] rounded-xl shadow-lg">
                <Sparkles className="size-5 text-white" />
              </div>
            </motion.div>
          )}

          <motion.button
            onClick={onToggleCollapse}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={cn(
              "p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors",
              isCollapsed && "mx-auto mt-4"
            )}
          >
            {isCollapsed ? (
              <Menu className="size-5 text-gray-700 dark:text-gray-300" />
            ) : (
              <ChevronLeft className="size-5 text-gray-700 dark:text-gray-300" />
            )}
          </motion.button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <div key={item.id} className="relative group">
                <motion.button
                  onClick={() => onPageChange(item.id)}
                  whileHover={{ x: isCollapsed ? 0 : 6, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 relative overflow-hidden',
                    isCollapsed && 'justify-center',
                    isActive
                      ? 'bg-gradient-to-r from-[#006266] to-[#00838f] text-white shadow-lg shadow-[#006266]/30'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-[#006266]/5 hover:to-[#00838f]/5 hover:text-[#006266] dark:hover:text-[#b2dfdb]'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-[#006266] to-[#00838f]"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <item.icon className={cn("size-5 relative z-10", isActive && "drop-shadow-sm")} />
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.span 
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="font-medium relative z-10 whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>

                {/* Tooltip on hover when collapsed */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
                    <div className="bg-gray-900 dark:bg-slate-700 text-white text-sm px-3 py-2 rounded-lg shadow-xl whitespace-nowrap">
                      {item.label}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900 dark:border-r-slate-700" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Connected Wallet Card - Only show when expanded */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="mt-auto relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#006266]/10 to-[#b2dfdb]/20 blur-xl rounded-2xl" />
              <div className="relative bg-gradient-to-br from-white/90 to-white/50 dark:from-slate-800/90 dark:to-slate-800/50 backdrop-blur-sm rounded-2xl p-4 border-2 border-white/40 dark:border-slate-700/40 shadow-xl">
                <div className="flex items-start gap-3">
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                    className={`size-12 rounded-full bg-gradient-to-br ${profile.avatar.gradient} flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-white dark:ring-slate-800`}
                  >
                    {profile.avatar.initials}
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 dark:text-gray-100 mb-0.5">{profile.username}</p>
                    <p className="font-mono text-xs text-gray-600 dark:text-gray-400 truncate mb-2">
                      {connectedAddress.substring(0, 8)}...{connectedAddress.substring(connectedAddress.length - 6)}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <div className="size-2 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50" />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Testnet</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed state - just avatar */}
        {isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-auto"
          >
            <motion.div
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className={`size-12 mx-auto rounded-full bg-gradient-to-br ${profile.avatar.gradient} flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-white dark:ring-slate-800`}
            >
              {profile.avatar.initials}
            </motion.div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}