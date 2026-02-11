import { motion } from 'motion/react';
import { Wallet, Shield } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';

interface WalletConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: () => void;
}

export function WalletConnectModal({ open, onOpenChange, onConnect }: WalletConnectModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-white/20 dark:border-slate-700/20 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl text-gray-900 dark:text-gray-100">Login with Wallet</DialogTitle>
          <DialogDescription className="text-center text-gray-600 dark:text-gray-400">
            Connect your Algorand wallet to get started
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-6">
          {/* Pera Wallet Option */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={onConnect}
              className="w-full bg-[#006266] hover:bg-[#004d4f] dark:bg-[#b2dfdb] dark:text-[#006266] dark:hover:bg-[#80cbc4] text-white py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3"
            >
              <div className="p-2 bg-white/20 dark:bg-[#006266]/20 rounded-lg">
                <Wallet className="size-6" />
              </div>
              <span className="text-lg">Connect Pera Wallet</span>
            </Button>
          </motion.div>

          {/* Security Note */}
          <div className="bg-[#006266]/5 dark:bg-[#006266]/10 border border-[#006266]/10 dark:border-[#006266]/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Shield className="size-5 text-[#006266] dark:text-[#b2dfdb] mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-semibold text-[#006266] dark:text-[#b2dfdb]">Your wallet is your identity.</span>
                <br />
                We never store passwords.
              </p>
            </div>
          </div>

          {/* Help Link */}
          <div className="text-center">
            <a
              href="https://perawallet.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-[#006266] dark:hover:text-[#b2dfdb] transition-colors"
            >
              Don't have a wallet? Get Pera Wallet →
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}