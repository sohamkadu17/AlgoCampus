import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, FileText, FileSpreadsheet, Check } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from './ui/dropdown-menu';
import { exportSplitToCSV, exportToPDF, exportAsJSON } from '../utils/exportUtils';

interface ExportButtonProps {
  splitName: string;
  transactions: Array<{
    id: string;
    description: string;
    amount: number;
    paidBy: string;
    date?: string;
    splitName?: string;
  }>;
  members: Array<{ address: string; name?: string }>;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export function ExportButton({
  splitName,
  transactions,
  members,
  variant = 'outline',
  size = 'default'
}: ExportButtonProps) {
  const [exported, setExported] = useState<string | null>(null);

  const handleExport = (type: 'csv' | 'pdf' | 'json') => {
    try {
      switch (type) {
        case 'csv':
          exportSplitToCSV(splitName, transactions, members);
          break;
        case 'pdf':
          exportToPDF(splitName, transactions, members);
          break;
        case 'json':
          const data = { splitName, transactions, members, exportDate: new Date().toISOString() };
          exportAsJSON(data, `${splitName.replace(/\s/g, '_')}_backup`);
          break;
      }
      
      setExported(type);
      setTimeout(() => setExported(null), 2000);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className="gap-2">
          <Download className="size-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-56 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-white/40 dark:border-slate-700/40"
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <DropdownMenuItem
            onClick={() => handleExport('csv')}
            className="cursor-pointer gap-3 py-3"
          >
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <FileSpreadsheet className="size-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-gray-100">Export as CSV</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Excel compatible</p>
            </div>
            <AnimatePresence>
              {exported === 'csv' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Check className="size-4 text-green-600" />
                </motion.div>
              )}
            </AnimatePresence>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleExport('pdf')}
            className="cursor-pointer gap-3 py-3"
          >
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <FileText className="size-4 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-gray-100">Export as PDF</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Print-ready report</p>
            </div>
            <AnimatePresence>
              {exported === 'pdf' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Check className="size-4 text-green-600" />
                </motion.div>
              )}
            </AnimatePresence>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => handleExport('json')}
            className="cursor-pointer gap-3 py-3"
          >
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FileText className="size-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-gray-100">Backup as JSON</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">For data backup</p>
            </div>
            <AnimatePresence>
              {exported === 'json' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Check className="size-4 text-green-600" />
                </motion.div>
              )}
            </AnimatePresence>
          </DropdownMenuItem>
        </motion.div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
