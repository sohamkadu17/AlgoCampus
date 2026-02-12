import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Split, QrCode, Receipt, X } from 'lucide-react';

interface FloatingActionButtonProps {
  onCreateSplit: () => void;
}

export function FloatingActionButton({ onCreateSplit }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      icon: Split,
      label: 'Create Split',
      color: 'from-[#006266] to-[#00838f]',
      onClick: () => {
        onCreateSplit();
        setIsOpen(false);
      }
    },
    {
      icon: QrCode,
      label: 'Scan QR',
      color: 'from-purple-500 to-pink-500',
      onClick: () => {
        // UI only
        setIsOpen(false);
      }
    },
    {
      icon: Receipt,
      label: 'Add Expense',
      color: 'from-blue-500 to-cyan-500',
      onClick: () => {
        // UI only
        setIsOpen(false);
      }
    }
  ];

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {/* Action Items */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-20 right-0 flex flex-col gap-3 mb-2"
          >
            {actions.map((action, index) => (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ 
                  opacity: 1, 
                  y: 0, 
                  scale: 1,
                  transition: { delay: index * 0.05 }
                }}
                exit={{ 
                  opacity: 0, 
                  y: 20, 
                  scale: 0.8,
                  transition: { delay: (actions.length - index - 1) * 0.05 }
                }}
                whileHover={{ scale: 1.05, x: -4 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-3 cursor-pointer group"
                onClick={action.onClick}
              >
                {/* Label */}
                <div className="px-4 py-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-xl shadow-lg border border-white/40 dark:border-slate-700/40">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                    {action.label}
                  </span>
                </div>
                
                {/* Icon Button */}
                <motion.div 
                  className={`size-14 rounded-full bg-gradient-to-br ${action.color} flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-shadow`}
                >
                  <action.icon className="size-6 text-white" />
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="size-16 rounded-full bg-gradient-to-br from-[#006266] to-[#00838f] flex items-center justify-center shadow-2xl hover:shadow-[#006266]/50 transition-all duration-300 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-white/20 rounded-full opacity-0 hover:opacity-100 transition-opacity" />
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="size-7 text-white relative z-10" />
            </motion.div>
          ) : (
            <motion.div
              key="plus"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Plus className="size-7 text-white relative z-10" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
