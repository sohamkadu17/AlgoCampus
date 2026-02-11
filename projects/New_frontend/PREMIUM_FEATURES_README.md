# 🚀 AlgoSplit Premium Features Guide

## Overview
This document explains all the premium features added to AlgoSplit, including their usage, integration, and customization options.

---

## 📋 Table of Contents
1. [Global Toast Notification System](#1-global-toast-notification-system)
2. [Animated Balance Counter](#2-animated-balance-counter)
3. [Achievement / Badge System](#3-achievement--badge-system)
4. [AI Insights Page](#4-ai-insights-page)
5. [Settlement Optimization Engine](#5-settlement-optimization-engine)
6. [Global Search Modal](#6-global-search-modal)
7. [Export Functionality](#7-export-functionality)

---

## 1. Global Toast Notification System

### Location
- `src/app/context/ToastContext.tsx`

### Features
- ✅ Success notifications (green)
- ✅ Error notifications (red)
- ✅ Info notifications (blue)
- ✅ Loading notifications (gray with spinner)
- ✅ Blockchain confirmation with special animation

### Usage

```tsx
import { useToast } from './context/ToastContext';

function MyComponent() {
  const toast = useToast();
  
  // Success toast
  toast.success('Split Created!', 'Your new split is ready');
  
  // Error toast
  toast.error('Payment Failed', 'Please try again');
  
  // Info toast
  toast.info('New Feature', 'Check out AI Insights');
  
  // Loading toast
  toast.loading('Processing transaction...');
  
  // Blockchain confirmation
  toast.blockchainConfirm('TXHASH123ABC...', 'Payment Confirmed');
}
```

### Styling
- Glassmorphism design
- Dark mode compatible
- Auto-dismiss after 3-5 seconds
- Position: top-right
- Custom icons per type

---

## 2. Animated Balance Counter

### Location
- `src/app/components/AnimatedCounter.tsx`

### Features
- Spring-based smooth counting animation
- Configurable duration and decimals
- Supports prefix/suffix (e.g., "$", "ALGO")
- Two variants: `AnimatedCounter` and `CountUp`

### Usage

```tsx
import { AnimatedCounter, CountUp } from './components/AnimatedCounter';

// Full-featured version
<AnimatedCounter
  value={1250.50}
  decimals={2}
  duration={1.5}
  prefix="$"
  suffix=" ALGO"
  className="text-2xl font-bold"
/>

// Simple count-up
<CountUp
  end={100}
  start={0}
  duration={2}
  decimals={0}
  className="text-xl"
/>
```

### Integration Example
Replace static numbers in Dashboard stats cards:

```tsx
<div className="text-2xl font-bold">
  <AnimatedCounter
    value={totalBalance}
    decimals={2}
    suffix=" ALGO"
  />
</div>
```

---

## 3. Achievement / Badge System

### Location
- `src/app/utils/achievements.ts` - Achievement definitions and logic
- `src/app/components/AchievementBadge.tsx` - UI components

### Features
- 8 predefined achievements
- 4 rarity levels (Common, Rare, Epic, Legendary)
- Progress tracking per achievement
- Categories: splits, expenses, settlements, social, streak
- Animated unlock states

### Achievement List
1. **First Split** (Common) - Create your first split
2. **Split Master** (Rare) - Create 10 splits
3. **Social Butterfly** (Rare) - Add 20 different members
4. **Fast Settler** (Epic) - Settle 5 expenses in 24h
5. **Expense Tracker** (Epic) - Add 50 expenses
6. **Perfect Week** (Epic) - Use app 7 days straight
7. **Legendary Splitter** (Legendary) - Create 100 splits
8. **Blockchain Champion** (Legendary) - Complete 100 settlements

### Usage

```tsx
import { calculateAchievements, UserProgress } from './utils/achievements';
import { AchievementBadge, CompactBadge } from './components/AchievementBadge';

// Track user progress
const userProgress: UserProgress = {
  splitsCreated: 5,
  expensesAdded: 12,
  settlementsCompleted: 8,
  uniqueMembers: 15,
  currentStreak: 3,
  fastSettlements: 2
};

// Calculate achievements
const achievements = calculateAchievements(userProgress);

// Display in grid
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {achievements.map((achievement, index) => (
    <AchievementBadge
      key={achievement.id}
      achievement={achievement}
      index={index}
    />
  ))}
</div>

// Compact badges for profile
{achievements
  .filter(a => a.isUnlocked)
  .map(a => <CompactBadge key={a.id} achievement={a} />)}
```

### Adding Custom Achievements
Edit `src/app/utils/achievements.ts`:

```typescript
{
  id: 'early-bird',
  title: 'Early Bird',
  description: 'Used AlgoSplit before 6 AM',
  icon: Sun,
  gradient: 'from-yellow-400 to-orange-500',
  requirement: 1,
  category: 'streak',
  rarity: 'rare'
}
```

---

## 4. AI Insights Page

### Location
- `src/app/components/AIInsightsPage.tsx`

### Features
- Monthly spending trend chart (Line Chart)
- Category breakdown pie chart
- 4 smart insights cards
- Quick stats overview
- AI recommendation banner

### Route
`/insights` or navigate via sidebar "AI Insights" button

### Data Source
Currently uses mock data. Replace with real data:

```tsx
// Calculate real monthly trends
const monthlyData = generateMonthlyTrends(groups, connectedAddress);

// Real category breakdown
const categoryData = calculateCategories(groups);
```

### Customization
Charts use **Recharts** library. Customize colors:

```tsx
<Line
  type="monotone"
  dataKey="spending"
  stroke="#006266"  // Change this
  strokeWidth={3}
/>
```

### Adding New Insights
Edit the `insights` array:

```tsx
{
  type: 'custom',
  icon: TrendingUp,
  title: 'Your Title',
  message: 'Your insight message',
  color: 'text-teal-600 dark:text-teal-400',
  bg: 'bg-teal-100 dark:bg-teal-900/30'
}
```

---

## 5. Settlement Optimization Engine

### Location
- `src/app/utils/settlementOptimizer.ts`

### Features
- Minimizes number of transactions
- Greedy algorithm for debt settlement
- Calculates optimal payment flow
- Shows transaction reduction (e.g., "Saved 8 transactions")

### Functions

#### `optimizeSettlements(balances: Balance[]): OptimizedPayment[]`
Takes a list of balances and returns optimized payment list.

#### `calculateBalances(members: string[], expenses: Expense[]): Balance[]`
Calculates who owes whom based on expenses.

#### `getSimplifiedSettlements(members, expenses)`
One-stop function that returns everything:
- Balances
- Optimized payments
- Transaction count comparison
- Savings

### Usage Example

```tsx
import { getSimplifiedSettlements } from './utils/settlementOptimizer';

const result = getSimplifiedSettlements(
  group.members.map(m => m.address),
  group.expenses
);

console.log(`Original: ${result.originalTransactionCount} transactions`);
console.log(`Optimized: ${result.optimizedTransactionCount} transactions`);
console.log(`Savings: ${result.savings} transactions`);

// Display optimized payments
result.optimizedPayments.map(payment => (
  <div>
    {payment.from} → {payment.to}: {payment.amount} ALGO
  </div>
));
```

### Integration in Split Details
Add a "Optimize Settlements" button:

```tsx
<Button onClick={showOptimizedSettlements}>
  ⚡ Optimize Settlements
</Button>
```

Display the optimized payment plan in a modal.

---

## 6. Global Search Modal

### Location
- `src/app/components/GlobalSearch.tsx`

### Features
- Keyboard shortcut: `Cmd/Ctrl + K`
- Searches splits, expenses, members, pages
- Real-time filtering
- Keyboard navigation (↑↓ arrows)
- Type badges and icons

### Usage in TopBar

```tsx
import { GlobalSearch } from './components/GlobalSearch';

<GlobalSearch
  groups={groups}
  onNavigate={(path) => setCurrentPage(path)}
/>
```

### Search Categories
1. **Splits** - Search by split name
2. **Expenses** - Search by expense description
3. **Pages** - Navigate to any page
4. **Members** - (Can be added) Search by username

### Customization

Add more searchable content:

```tsx
// Add members search
members.forEach(member => {
  if (member.username.toLowerCase().includes(searchQuery)) {
    foundResults.push({
      id: `member-${member.address}`,
      type: 'member',
      title: member.username,
      subtitle: member.address,
      icon: User,
      action: () => viewMemberProfile(member)
    });
  }
});
```

### Keyboard Shortcuts
- `Cmd/Ctrl + K` - Open search
- `ESC` - Close search
- `↑` / `↓` - Navigate results
- `Enter` - Select result

---

## 7. Export Functionality

### Location
- `src/app/utils/exportUtils.ts` - Core export functions
- `src/app/components/ExportButton.tsx` - UI component

### Features
- Export to CSV (Excel compatible)
- Export to PDF (print-ready)
- Export to JSON (backup)
- Transaction summaries
- Member lists included

### Usage

#### Add Export Button to Split Details

```tsx
import { ExportButton } from './components/ExportButton';

<ExportButton
  splitName={group.name}
  transactions={group.expenses}
  members={group.members}
  variant="outline"
  size="default"
/>
```

#### Manual Export Functions

```tsx
import {
  exportSplitToCSV,
  exportToPDF,
  exportHistoryToCSV,
  exportAsJSON
} from './utils/exportUtils';

// Export split to CSV
exportSplitToCSV(
  'Goa Trip',
  transactions,
  members
);

// Export to PDF
exportToPDF(
  'Goa Trip',
  transactions,
  members
);

// Export history
exportHistoryToCSV(
  allTransactions,
  connectedAddress
);

// Backup as JSON
exportAsJSON({
  splits: groups,
  exportDate: new Date()
}, 'algosplit_backup');
```

### CSV Format
```csv
Date,Description,Amount (ALGO),Paid By,Status
2024-02-11,Dinner,45.00,ALGO123...,Settled
```

### PDF Features
- Professional header with AlgoSplit branding
- Split summary (total, members, date)
- Transaction table
- Member list
- Footer with timestamp

### Integration Points

1. **Split Detail Page** - Add export button
2. **History Page** - "Export All" button
3. **Dashboard** - Bulk export option

---

## 🎨 Styling Guidelines

### All Components Follow
- ✅ Glassmorphism design
- ✅ Dark mode support
- ✅ Smooth animations (500ms transitions)
- ✅ Color palette consistency
  - Primary: `#006266`
  - Light accent: `#b2dfdb`
  - Dark background: `slate-950, slate-900, slate-800`
- ✅ Backdrop blur effects
- ✅ Rounded corners (xl, 2xl)
- ✅ Shadow layering

### Animation Standards
- Entry animations: `initial={{ opacity: 0, y: 20 }}`
- Hover effects: `whileHover={{ y: -4, scale: 1.02 }}`
- Tap effects: `whileTap={{ scale: 0.98 }}`
- Duration: 0.3-0.5s for micro-interactions

---

## 📱 Mobile Responsiveness

All components are fully responsive:

```tsx
// Grid responsive breakpoints
grid-cols-1 md:grid-cols-2 lg:grid-cols-3

// Text size scaling
text-2xl md:text-3xl lg:text-4xl

// Hide on mobile
hidden sm:flex

// Mobile-first padding
p-4 md:p-6 lg:p-8
```

---

## 🔧 Customization Tips

### Change Primary Color
Replace `#006266` throughout:
- Search for `006266`
- Replace with your hex color
- Update dark mode variant (`#b2dfdb`)

### Add New Achievement
1. Add to `achievements` array in `achievements.ts`
2. Choose gradient from Tailwind palette
3. Set requirement and category
4. Icon from `lucide-react`

### Customize Toast Position
Edit `ToastContext.tsx`:
```tsx
<Toaster position="bottom-right" /> // Change position
```

### Modify Chart Colors
Edit chart components in `AIInsightsPage.tsx`:
```tsx
<Line stroke="#YOUR_COLOR" />
<Cell fill="#YOUR_COLOR" />
```

---

## 🚀 Performance Notes

### Optimizations Included
- Lazy calculation of achievements (only when needed)
- Memoized settlement optimization
- Debounced search input (can add)
- Chart data caching (can add)

### Best Practices
```tsx
// Memoize expensive calculations
const achievements = useMemo(
  () => calculateAchievements(userProgress),
  [userProgress]
);

// Lazy load charts
const LazyCharts = lazy(() => import('./Charts'));
```

---

## 📦 Folder Structure

```
src/app/
├── components/
│   ├── AchievementBadge.tsx       # Achievement UI
│   ├── AIInsightsPage.tsx         # AI Insights page
│   ├── AnimatedCounter.tsx        # Count-up animations
│   ├── ExportButton.tsx           # Export dropdown
│   └── GlobalSearch.tsx           # Search modal
├── context/
│   └── ToastContext.tsx           # Toast notification system
├── utils/
│   ├── achievements.ts            # Achievement logic
│   ├── exportUtils.ts             # Export functions
│   └── settlementOptimizer.ts     # Settlement algorithm
```

---

## 🎯 Quick Integration Checklist

### To Add Toast Notifications
- [x] Wrap app in `ToastProvider`
- [x] Use `useToast()` hook in components
- [x] Replace existing alerts with toast calls

### To Show Animated Balances
- [x] Import `AnimatedCounter`
- [x] Replace static numbers
- [x] Add duration prop (1-2s recommended)

### To Enable Achievements
- [x] Track user actions (splits created, etc.)
- [x] Store progress in state/localStorage
- [x] Calculate achievements on profile page
- [x] Display with `AchievementBadge`

### To Add Exports
- [x] Import `ExportButton`
- [x] Add to split detail page
- [x] Pass transaction data
- [x] Style to match design

### To Optimize Settlements
- [x] Import `getSimplifiedSettlements`
- [x] Calculate on split detail view
- [x] Show "Optimize" button
- [x] Display optimized payment plan

### To Enable Search
- [x] Add `GlobalSearch` to TopBar
- [x] Pass groups data
- [x] Connect navigation handler
- [x] Test Cmd+K shortcut

### To Show AI Insights
- [x] Add "AI Insights" to sidebar
- [x] Create `/insights` route
- [x] Render `AIInsightsPage`
- [x] Connect real data (optional)

---

## 🐛 Troubleshooting

### Toast not showing?
- Ensure `ToastProvider` wraps your app
- Check z-index (should be high)
- Verify Sonner is installed

### Counter not animating?
- Check `motion` package is installed
- Ensure value prop changes
- Add key prop to force re-render

### Export failing?
- Check browser allows downloads
- Verify transaction data structure
- Test in different browsers

### Search not opening?
- Test keyboard shortcut works
- Check `Dialog` component renders
- Verify z-index layering

---

## 📝 License & Credits

Built for AlgoSplit - Premium Web3 expense splitting on Algorand.

**Libraries Used:**
- Motion (Framer Motion) - Animations
- Recharts - Charts
- Sonner - Toast notifications
- Lucide React - Icons
- Radix UI - Base components

---

## 🆘 Support

For issues or questions:
1. Check this documentation
2. Review component source code
3. Test in isolation
4. Check console for errors

**Happy Building! 🚀**
