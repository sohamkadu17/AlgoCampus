import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Shield, 
  Info, 
  ArrowRight, 
  CheckCircle2,
  ChevronRight,
  Smartphone,
  Cpu,
  Globe
} from 'lucide-react';
import { GlassCard } from './GlassCard';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (type: string) => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose, onConnect }) => {
  const [step, setStep] = React.useState<'select' | 'connecting' | 'success'>('select');
  const [selectedWallet, setSelectedWallet] = React.useState<string | null>(null);

  const wallets = [
    { id: 'pera', name: 'Pera Wallet', desc: 'Secure Algorand mobile wallet', icon: Smartphone, color: 'bg-amber-500', shadow: 'shadow-amber-500/20' },
    { id: 'defly', name: 'Defly Wallet', desc: 'DeFi focused Algorand wallet', icon: Cpu, color: 'bg-teal-600', shadow: 'shadow-teal-500/20' },
    { id: 'wc', name: 'WalletConnect', desc: 'Connect with any compatible wallet', icon: Globe, color: 'bg-blue-500', shadow: 'shadow-blue-500/20' },
  ];

  const handleSelect = (id: string) => {
    setSelectedWallet(id);
    setStep('connecting');
    setTimeout(() => {
      setStep('success');
      setTimeout(() => {
        onConnect(id);
        // Reset state after a delay for next open
        setTimeout(() => {
          setStep('select');
          setSelectedWallet(null);
        }, 500);
      }, 1200);
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ y: "100%", opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: "100%", opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm bg-white dark:bg-zinc-950 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden border border-slate-200 dark:border-zinc-800"
          >
            {/* Background decorative elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-teal-500/10 blur-3xl rounded-full" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/10 blur-3xl rounded-full" />

            <AnimatePresence mode="wait">
              {step === 'select' && (
                <motion.div
                  key="select"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-2xl font-black tracking-tight">Connect</h3>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select your wallet</p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-2xl transition-all active:scale-90">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {wallets.map((wallet) => (
                      <button
                        key={wallet.id}
                        onClick={() => handleSelect(wallet.id)}
                        className="w-full p-5 rounded-3xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 flex items-center justify-between group hover:border-teal-500/50 hover:shadow-xl hover:shadow-teal-500/5 transition-all duration-300 active:scale-[0.98]"
                      >
                        <div className="flex items-center gap-5">
                          <div className={`w-14 h-14 rounded-2xl ${wallet.color} ${wallet.shadow} flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform duration-500`}>
                            <wallet.icon className="w-7 h-7" />
                          </div>
                          <div className="text-left">
                            <h4 className="font-black text-slate-900 dark:text-white">{wallet.name}</h4>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{wallet.desc}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
                      </button>
                    ))}
                  </div>

                  <div className="mt-8 p-5 bg-teal-500/5 rounded-3xl border border-teal-500/10 flex gap-4">
                    <Shield className="w-6 h-6 text-teal-600 flex-shrink-0" />
                    <div className="space-y-1">
                      <h5 className="text-xs font-black text-teal-900 dark:text-teal-400 uppercase tracking-widest">Bank-Grade Security</h5>
                      <p className="text-[10px] font-bold text-teal-800/60 dark:text-teal-400/60 leading-relaxed">
                        Your keys are never shared. We only ask for permission to sign transactions.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 'connecting' && (
                <motion.div
                  key="connecting"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  className="py-12 flex flex-col items-center text-center space-y-6"
                >
                  <div className="relative">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-24 h-24 rounded-full border-4 border-slate-100 dark:border-zinc-800 border-t-teal-500"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Smartphone className="w-8 h-8 text-teal-500" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight">Connecting...</h3>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Check your wallet app</p>
                  </div>
                </motion.div>
              )}

              {step === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-12 flex flex-col items-center text-center space-y-6"
                >
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12, stiffness: 200 }}
                    className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-2xl shadow-emerald-500/40"
                  >
                    <CheckCircle2 className="w-12 h-12" />
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight">Connected!</h3>
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mt-2">Welcome to CampusPay</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
