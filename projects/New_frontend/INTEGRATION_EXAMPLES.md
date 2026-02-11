# 🔗 Integration Examples

Quick copy-paste examples to integrate premium features into existing AlgoSplit pages.

---

## Dashboard - Add Animated Counters

### Before:
```tsx
<p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
  {totalSpent.toFixed(2)} ALGO
</p>
```

### After:
```tsx
import { AnimatedCounter } from './AnimatedCounter';

<AnimatedCounter
  value={totalSpent}
  decimals={2}
  suffix=" ALGO"
  className="text-2xl font-bold text-gray-900 dark:text-gray-100"
/>
```

---

## Split Detail Page - Add Export Button

### Add to imports:
```tsx
import { ExportButton } from './ExportButton';
```

### Add to header (next to other action buttons):
```tsx
<div className="flex gap-2">
  <Button onClick={onAddExpense}>Add Expense</Button>
  <ExportButton
    splitName={group.name}
    transactions={group.expenses}
    members={group.members}
    variant="outline"
  />
</div>
```

---

## Split Detail Page - Show Settlement Optimization

### Add button:
```tsx
import { getSimplifiedSettlements } from '../utils/settlementOptimizer';
import { Zap } from 'lucide-react';

function SplitDetailPage({ group }) {
  const [showOptimized, setShowOptimized] = useState(false);
  
  const optimized = getSimplifiedSettlements(
    group.members.map(m => m.address),
    group.expenses
  );

  return (
    <>
      <Button
        onClick={() => setShowOptimized(true)}
        className="gap-2"
      >
        <Zap className="size-4" />
        Optimize Settlements ({optimized.savings} txs saved)
      </Button>

      {/* Modal to show optimized payments */}
      <Dialog open={showOptimized} onOpenChange={setShowOptimized}>
        <DialogContent>
          <DialogTitle>Optimized Settlement Plan</DialogTitle>
          <div className="space-y-3">
            {optimized.optimizedPayments.map((payment, i) => (
              <Card key={i} className="p-4 flex justify-between">
                <span>{getUserProfile(payment.from).username}</span>
                <span>→</span>
                <span>{getUserProfile(payment.to).username}</span>
                <Badge>{payment.amount.toFixed(2)} ALGO</Badge>
              </Card>
            ))}
          </div>
          <p className="text-sm text-gray-600">
            Reduced from {optimized.originalTransactionCount} to{' '}
            {optimized.optimizedTransactionCount} transactions
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

---

## TopBar - Add Global Search

### Add to imports:
```tsx
import { GlobalSearch } from './GlobalSearch';
```

### Add before wallet dropdown:
```tsx
<div className="flex items-center gap-3">
  <GlobalSearch
    groups={groups}
    onNavigate={(path) => {
      // Handle navigation
      if (path.startsWith('/split/')) {
        const groupId = path.replace('/split/', '');
        handleViewSplit(groupId);
      } else {
        handlePageChange(path.replace('/', ''));
      }
    }}
  />
  
  {/* Existing wallet dropdown */}
  <WalletDropdown ... />
</div>
```

---

## App.tsx - Add Toast Provider

### Wrap entire app:
```tsx
import { ToastProvider, useToast } from './context/ToastContext';

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        {/* Rest of your app */}
      </ToastProvider>
    </ThemeProvider>
  );
}
```

### Replace existing toast calls:
```tsx
// Before
toast.success('Split Created!');

// After  
const toast = useToast();
toast.success('Split Created!', 'Your new split is ready');
```

---

## Profile Page - Show Achievements

### Create ProfilePage.tsx:
```tsx
import { calculateAchievements, UserProgress } from '../utils/achievements';
import { AchievementBadge } from './AchievementBadge';

export function ProfilePage({ groups, connectedAddress }) {
  // Calculate user progress
  const userProgress: UserProgress = {
    splitsCreated: groups.length,
    expensesAdded: groups.reduce((sum, g) => sum + g.expenses.length, 0),
    settlementsCompleted: calculateSettlements(groups, connectedAddress),
    uniqueMembers: getUniqueMembers(groups).length,
    currentStreak: 7, // Calculate from usage data
    fastSettlements: 5 // Calculate from settlement times
  };

  const achievements = calculateAchievements(userProgress);
  const unlockedCount = achievements.filter(a => a.isUnlocked).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Achievements</h1>
        <p className="text-gray-600">
          {unlockedCount} of {achievements.length} unlocked
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {achievements.map((achievement, index) => (
          <AchievementBadge
            key={achievement.id}
            achievement={achievement}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## History Page - Add Export All Button

### Add to header:
```tsx
import { exportHistoryToCSV } from '../utils/exportUtils';
import { Download } from 'lucide-react';

<div className="flex justify-between items-center">
  <h1>Transaction History</h1>
  <Button
    onClick={() => {
      const transactions = groups.flatMap(g =>
        g.expenses.map(e => ({
          ...e,
          splitName: g.name,
          date: new Date().toLocaleDateString()
        }))
      );
      exportHistoryToCSV(transactions, connectedAddress);
    }}
    variant="outline"
    className="gap-2"
  >
    <Download className="size-4" />
    Export All
  </Button>
</div>
```

---

## Dashboard - Add AI Insights Preview

### Add insight card:
```tsx
import { Lightbulb, ArrowRight } from 'lucide-react';

<Card className="bg-gradient-to-br from-[#006266]/5 to-[#b2dfdb]/20 p-6">
  <div className="flex items-start gap-4">
    <div className="p-3 bg-gradient-to-br from-[#006266] to-[#00838f] rounded-xl">
      <Lightbulb className="size-6 text-white" />
    </div>
    <div className="flex-1">
      <h3 className="font-bold text-gray-900 mb-2">AI Insights Available</h3>
      <p className="text-sm text-gray-600 mb-3">
        Get smart analytics on your spending patterns and optimization tips.
      </p>
      <Button
        onClick={() => handlePageChange('insights')}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        View Insights
        <ArrowRight className="size-4" />
      </Button>
    </div>
  </div>
</Card>
```

---

## Payment Confirmation - Add Blockchain Toast

### After successful payment:
```tsx
import { useToast } from '../context/ToastContext';

const toast = useToast();

const handlePayment = async () => {
  toast.loading('Processing payment...');
  
  try {
    // Simulate blockchain transaction
    const txHash = await processBlockchainPayment(amount);
    
    // Show special blockchain confirmation
    toast.blockchainConfirm(
      txHash,
      'Payment Confirmed on Blockchain!'
    );
    
    onComplete();
  } catch (error) {
    toast.error('Payment Failed', error.message);
  }
};
```

---

## Create Split - Show Achievement Unlock

### When creating first split:
```tsx
import { useToast } from '../context/ToastContext';
import { Sparkles } from 'lucide-react';

const handleCreateSplit = (name, members) => {
  // Create the split
  onCreateSplit(name, members);
  
  // Check if this was their first split
  if (groups.length === 0) {
    toast.blockchainConfirm(
      'achievement-first-split',
      '🎉 Achievement Unlocked: First Split!'
    );
  }
};
```

---

## My Splits - Add Quick Actions with Search

### Add search integration:
```tsx
import { Search } from 'lucide-react';

<div className="flex gap-3 mb-6">
  <div className="relative flex-1">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
    <input
      type="text"
      placeholder="Search splits... (or press ⌘K)"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="w-full pl-10 pr-4 py-3 bg-white/60 dark:bg-slate-800/60 rounded-xl"
    />
  </div>
  <Button onClick={() => document.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'k', metaKey: true })
  )}>
    Open Quick Search
  </Button>
</div>
```

---

## Sidebar - Add Achievement Badge Count

### Show unlocked achievements:
```tsx
import { calculateAchievements } from '../utils/achievements';
import { CompactBadge } from './AchievementBadge';

// In Sidebar component
const achievements = calculateAchievements(userProgress);
const unlockedAchievements = achievements.filter(a => a.isUnlocked);

<div className="flex gap-1 mt-2">
  {unlockedAchievements.slice(0, 3).map(achievement => (
    <CompactBadge key={achievement.id} achievement={achievement} />
  ))}
  {unlockedAchievements.length > 3 && (
    <div className="text-xs text-gray-500">
      +{unlockedAchievements.length - 3}
    </div>
  )}
</div>
```

---

## FloatingActionButton - Add Export Quick Action

### Add export to FAB menu:
```tsx
import { Download } from 'lucide-react';

const fabActions = [
  { icon: Users, label: 'Create Split', action: onCreateSplit },
  { icon: DollarSign, label: 'Add Expense', action: onAddExpense },
  { icon: QrCode, label: 'Scan QR', action: onScanQR },
  { 
    icon: Download, 
    label: 'Export', 
    action: () => {
      // Export current view
      const currentSplit = getCurrentSplit();
      if (currentSplit) {
        exportSplitToCSV(
          currentSplit.name,
          currentSplit.expenses,
          currentSplit.members
        );
      }
    }
  },
];
```

---

## Network Status - Show Blockchain Confirmations

### Add live transaction counter:
```tsx
import { CountUp } from './AnimatedCounter';

<div className="flex items-center gap-2">
  <div className="size-2 rounded-full bg-green-500 animate-pulse" />
  <span className="text-xs">
    <CountUp end={totalTransactions} duration={2} /> transactions on-chain
  </span>
</div>
```

---

## Quick Tips

### 1. Performance: Memoize Expensive Calculations
```tsx
const achievements = useMemo(
  () => calculateAchievements(userProgress),
  [userProgress]
);
```

### 2. Accessibility: Add ARIA Labels
```tsx
<Button aria-label="Export split data">
  <Download />
</Button>
```

### 3. Error Boundaries: Wrap Features
```tsx
<ErrorBoundary fallback={<div>Feature unavailable</div>}>
  <AchievementBadge />
</ErrorBoundary>
```

### 4. Loading States: Show Skeletons
```tsx
{loading ? (
  <Skeleton className="h-20 w-full" />
) : (
  <AnimatedCounter value={balance} />
)}
```

---

## 🚀 All Features Combined - Super Dashboard

```tsx
export function SuperDashboard() {
  const toast = useToast();
  const [groups, setGroups] = useState([]);
  const [userProgress, setUserProgress] = useState<UserProgress>({});

  // Calculate everything
  const achievements = useMemo(
    () => calculateAchievements(userProgress),
    [userProgress]
  );
  
  const optimizedSettlements = useMemo(
    () => groups.map(g => getSimplifiedSettlements(
      g.members.map(m => m.address),
      g.expenses
    )),
    [groups]
  );

  const totalSavings = optimizedSettlements.reduce(
    (sum, opt) => sum + opt.savings, 0
  );

  return (
    <div className="space-y-6">
      {/* Animated Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <AnimatedCounter
            value={groups.length}
            suffix=" Splits"
          />
        </Card>
        <Card>
          <AnimatedCounter
            value={totalBalance}
            decimals={2}
            suffix=" ALGO"
          />
        </Card>
        <Card>
          <AnimatedCounter
            value={totalSavings}
            suffix=" txs saved"
          />
        </Card>
      </div>

      {/* AI Insights Preview */}
      <Card onClick={() => navigate('/insights')}>
        <Lightbulb /> View AI Insights
      </Card>

      {/* Recent Achievements */}
      <div className="grid grid-cols-2 gap-4">
        {achievements
          .filter(a => a.isUnlocked)
          .slice(0, 4)
          .map(a => <CompactBadge achievement={a} />)}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Button onClick={handleExport}>
          <Download /> Export All
        </Button>
        <GlobalSearch groups={groups} onNavigate={navigate} />
      </div>
    </div>
  );
}
```

---

**That's it! 🎉 Copy these examples directly into your components.**
