import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Loader2, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';

type PaymentStatus = 'signing' | 'broadcasting' | 'confirmed';

interface PaymentConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  onComplete: () => void;
}

export function PaymentConfirmationModal({
  open,
  onOpenChange,
  amount,
  onComplete
}: PaymentConfirmationModalProps) {
  const [status, setStatus] = useState<PaymentStatus>('signing');
  const [txnHash, setTxnHash] = useState('');

  useEffect(() => {
    if (open) {
      setStatus('signing');
      setTxnHash('');

      // Simulate transaction flow
      const timer1 = setTimeout(() => {
        setStatus('broadcasting');
      }, 1500);

      const timer2 = setTimeout(() => {
        setStatus('confirmed');
        // Generate mock transaction hash
        const mockHash = Array(52)
          .fill(0)
          .map(() => Math.random().toString(36)[2])
          .join('')
          .toUpperCase();
        setTxnHash(mockHash);
      }, 3500);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [open]);

  const handleClose = () => {
    onComplete();
    onOpenChange(false);
  };

  const steps = [
    { id: 'signing', label: 'Signing Transaction', icon: Loader2 },
    { id: 'broadcasting', label: 'Broadcasting to Network', icon: Loader2 },
    { id: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
  ];

  const getStepState = (stepId: PaymentStatus): 'active' | 'completed' | 'pending' => {
    const currentIndex = steps.findIndex(s => s.id === status);
    const stepIndex = steps.findIndex(s => s.id === stepId);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <Dialog open={open} onOpenChange={status === 'confirmed' ? handleClose : undefined}>
      <DialogContent className="max-w-md bg-white/90 backdrop-blur-xl border-white/20 shadow-2xl">
        <DialogDescription className="sr-only">
          Processing payment transaction on Algorand blockchain
        </DialogDescription>
        <div className="space-y-6 py-4">
          {/* Amount Display */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <p className="text-sm text-gray-600 mb-2">Payment Amount</p>
            <p className="text-4xl font-bold text-[#006266]">{amount.toFixed(2)} ALGO</p>
          </motion.div>

          {/* Progress Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => {
              const state = getStepState(step.id as PaymentStatus);
              const Icon = step.icon;

              return (
                <motion.div
                  key={step.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center gap-4"
                >
                  <div
                    className={`relative flex items-center justify-center size-10 rounded-full transition-all duration-500 ${
                      state === 'completed'
                        ? 'bg-green-500'
                        : state === 'active'
                        ? 'bg-[#006266]'
                        : 'bg-gray-200'
                    }`}
                  >
                    <AnimatePresence mode="wait">
                      {state === 'active' ? (
                        <motion.div
                          key="active"
                          initial={{ scale: 0, rotate: 0 }}
                          animate={{ scale: 1, rotate: 360 }}
                          exit={{ scale: 0 }}
                          transition={{ duration: 0.5 }}
                        >
                          <Icon className="size-5 text-white animate-spin" />
                        </motion.div>
                      ) : state === 'completed' ? (
                        <motion.div
                          key="completed"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <CheckCircle2 className="size-5 text-white" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="pending"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="size-2 bg-gray-400 rounded-full"
                        />
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="flex-1">
                    <p
                      className={`font-medium transition-colors duration-300 ${
                        state === 'completed' || state === 'active'
                          ? 'text-gray-900'
                          : 'text-gray-400'
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Success Message */}
          <AnimatePresence>
            {status === 'confirmed' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="space-y-4"
              >
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="inline-flex p-3 bg-green-500 rounded-full mb-3"
                  >
                    <CheckCircle2 className="size-8 text-white" />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">Payment Successful!</h3>
                  <p className="text-sm text-gray-600">Payment recorded on Algorand</p>
                </div>

                {/* Transaction Hash */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-600 mb-2">Transaction Hash</p>
                  <p className="font-mono text-xs text-gray-800 break-all">{txnHash}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl gap-2"
                    onClick={() => window.open(`https://testnet.algoexplorer.io/tx/${txnHash}`, '_blank')}
                  >
                    <ExternalLink className="size-4" />
                    View on Explorer
                  </Button>
                  <Button
                    className="flex-1 bg-[#006266] hover:bg-[#004d4f] text-white rounded-xl"
                    onClick={handleClose}
                  >
                    Done
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}