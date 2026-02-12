import { createContext, useContext, ReactNode } from 'react';
import { toast, Toaster } from 'sonner';
import { CheckCircle2, AlertCircle, Info, Loader2, Sparkles } from 'lucide-react';

interface ToastContextType {
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
  loading: (message: string) => void;
  blockchainConfirm: (txHash: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const success = (message: string, description?: string) => {
    toast.custom((t) => (
      <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-white/40 dark:border-slate-700/40 rounded-2xl p-4 shadow-2xl min-w-[300px] flex items-start gap-3">
        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
          <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{message}</p>
          {description && <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>}
        </div>
      </div>
    ));
  };

  const error = (message: string, description?: string) => {
    toast.custom((t) => (
      <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-white/40 dark:border-slate-700/40 rounded-2xl p-4 shadow-2xl min-w-[300px] flex items-start gap-3">
        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
          <AlertCircle className="size-5 text-red-600 dark:text-red-400" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{message}</p>
          {description && <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>}
        </div>
      </div>
    ));
  };

  const info = (message: string, description?: string) => {
    toast.custom((t) => (
      <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-white/40 dark:border-slate-700/40 rounded-2xl p-4 shadow-2xl min-w-[300px] flex items-start gap-3">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
          <Info className="size-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{message}</p>
          {description && <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>}
        </div>
      </div>
    ));
  };

  const loading = (message: string) => {
    toast.custom((t) => (
      <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-white/40 dark:border-slate-700/40 rounded-2xl p-4 shadow-2xl min-w-[300px] flex items-start gap-3">
        <div className="p-2 bg-gray-100 dark:bg-gray-900/30 rounded-xl">
          <Loader2 className="size-5 text-gray-600 dark:text-gray-400 animate-spin" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900 dark:text-gray-100">{message}</p>
        </div>
      </div>
    ));
  };

  const blockchainConfirm = (txHash: string, message = 'Transaction Confirmed!') => {
    toast.custom((t) => (
      <div className="bg-gradient-to-br from-[#006266]/10 to-[#b2dfdb]/20 dark:from-[#006266]/20 dark:to-[#b2dfdb]/30 backdrop-blur-xl border-2 border-[#006266]/20 dark:border-[#b2dfdb]/20 rounded-2xl p-4 shadow-2xl min-w-[350px]">
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 bg-gradient-to-br from-[#006266] to-[#00838f] dark:from-[#b2dfdb] dark:to-[#80cbc4] rounded-xl">
            <Sparkles className="size-5 text-white dark:text-[#006266]" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-900 dark:text-gray-100 mb-1">{message}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 font-mono break-all">
              {txHash}
            </p>
          </div>
        </div>
        <div className="h-1 bg-gradient-to-r from-[#006266] via-[#00838f] to-[#b2dfdb] dark:from-[#b2dfdb] dark:via-[#80cbc4] dark:to-[#4db6ac] rounded-full animate-pulse" />
      </div>
    ), { duration: 5000 });
  };

  return (
    <ToastContext.Provider value={{ success, error, info, loading, blockchainConfirm }}>
      <Toaster position="top-right" expand={false} richColors />
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
