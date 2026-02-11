import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Users, DollarSign, Clock, ArrowRight, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent } from './ui/dialog';

interface SearchResult {
  id: string;
  type: 'split' | 'expense' | 'member' | 'page';
  title: string;
  subtitle?: string;
  icon: any;
  action: () => void;
}

interface GlobalSearchProps {
  groups: Array<{
    id: string;
    name: string;
    members: { id: string; address: string }[];
    expenses: Array<{
      id: string;
      description: string;
      amount: number;
      paidBy: string;
    }>;
  }>;
  onNavigate: (path: string) => void;
}

export function GlobalSearch({ groups, onNavigate }: GlobalSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);

  // Keyboard shortcut handler
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Search logic
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchQuery = query.toLowerCase();
    const foundResults: SearchResult[] = [];

    // Search splits
    groups.forEach(group => {
      if (group.name.toLowerCase().includes(searchQuery)) {
        foundResults.push({
          id: `split-${group.id}`,
          type: 'split',
          title: group.name,
          subtitle: `${group.members.length} members • ${group.expenses.length} expenses`,
          icon: Users,
          action: () => {
            onNavigate(`/split/${group.id}`);
            setOpen(false);
          }
        });
      }

      // Search expenses within splits
      group.expenses.forEach(expense => {
        if (expense.description.toLowerCase().includes(searchQuery)) {
          foundResults.push({
            id: `expense-${expense.id}`,
            type: 'expense',
            title: expense.description,
            subtitle: `${expense.amount.toFixed(2)} ALGO in ${group.name}`,
            icon: DollarSign,
            action: () => {
              onNavigate(`/split/${group.id}`);
              setOpen(false);
            }
          });
        }
      });
    });

    // Search pages
    const pages = [
      { name: 'Dashboard', path: '/dashboard', keywords: ['home', 'overview', 'main'] },
      { name: 'My Splits', path: '/my-splits', keywords: ['groups', 'splits', 'list'] },
      { name: 'Create Split', path: '/create-split', keywords: ['new', 'add', 'create'] },
      { name: 'History', path: '/history', keywords: ['transactions', 'past', 'records'] },
      { name: 'AI Insights', path: '/insights', keywords: ['analytics', 'ai', 'smart', 'trends'] }
    ];

    pages.forEach(page => {
      const matchesName = page.name.toLowerCase().includes(searchQuery);
      const matchesKeywords = page.keywords.some(kw => kw.includes(searchQuery));
      
      if (matchesName || matchesKeywords) {
        foundResults.push({
          id: `page-${page.path}`,
          type: 'page',
          title: page.name,
          subtitle: 'Navigate to page',
          icon: TrendingUp,
          action: () => {
            onNavigate(page.path);
            setOpen(false);
          }
        });
      }
    });

    setResults(foundResults.slice(0, 8)); // Limit to 8 results
  }, [query, groups, onNavigate]);

  const getTypeColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'split': return 'from-blue-500 to-cyan-500';
      case 'expense': return 'from-green-500 to-emerald-500';
      case 'member': return 'from-purple-500 to-pink-500';
      case 'page': return 'from-orange-500 to-red-500';
    }
  };

  const getTypeBadge = (type: SearchResult['type']) => {
    switch (type) {
      case 'split': return 'Split';
      case 'expense': return 'Expense';
      case 'member': return 'Member';
      case 'page': return 'Page';
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/40 dark:border-slate-700/40 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-white/70 dark:hover:bg-slate-800/70 transition-all"
      >
        <Search className="size-4" />
        <span>Search</span>
        <kbd className="hidden sm:inline px-2 py-0.5 bg-gray-200 dark:bg-slate-700 rounded text-xs font-mono">
          ⌘K
        </kbd>
      </button>

      {/* Search Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl p-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-white/40 dark:border-slate-700/40 overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-slate-700">
            <Search className="size-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search splits, expenses, or navigate..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
              autoFocus
            />
            <kbd className="px-2 py-1 bg-gray-200 dark:bg-slate-700 rounded text-xs font-mono text-gray-600 dark:text-gray-400">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto p-2">
            <AnimatePresence mode="popLayout">
              {results.length === 0 && query ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-8 text-center"
                >
                  <div className="inline-flex p-4 bg-gray-100 dark:bg-slate-700 rounded-full mb-3">
                    <Search className="size-6 text-gray-400" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">No results found for "{query}"</p>
                </motion.div>
              ) : results.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-8 text-center"
                >
                  <div className="inline-flex p-4 bg-gradient-to-br from-[#006266]/10 to-[#b2dfdb]/20 rounded-full mb-3">
                    <Search className="size-6 text-[#006266] dark:text-[#b2dfdb]" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">Start typing to search</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Search for splits, expenses, members, or pages
                  </p>
                </motion.div>
              ) : (
                results.map((result, index) => (
                  <motion.button
                    key={result.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    onClick={result.action}
                    className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-all group text-left"
                  >
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${getTypeColor(result.type)}`}>
                      <result.icon className="size-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {result.title}
                      </p>
                      {result.subtitle && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {result.subtitle}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-slate-700 rounded text-gray-600 dark:text-gray-400">
                        {getTypeBadge(result.type)}
                      </span>
                      <ArrowRight className="size-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </motion.button>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          {results.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-slate-700 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-slate-700 rounded">↑</kbd>
                  <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-slate-700 rounded">↓</kbd>
                  <span>to navigate</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-slate-700 rounded">↵</kbd>
                  <span>to select</span>
                </div>
              </div>
              <span>{results.length} results</span>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
