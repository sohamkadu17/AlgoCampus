export interface Balance {
  address: string;
  amount: number; // positive = owed to them, negative = they owe
}

export interface OptimizedPayment {
  from: string;
  to: string;
  amount: number;
}

/**
 * Optimizes debt settlement using a greedy algorithm
 * Minimizes the number of transactions needed to settle all debts
 */
export function optimizeSettlements(balances: Balance[]): OptimizedPayment[] {
  // Filter out zero balances
  const nonZeroBalances = balances.filter(b => Math.abs(b.amount) > 0.01);
  
  if (nonZeroBalances.length === 0) return [];

  // Separate debtors and creditors
  const creditors = nonZeroBalances
    .filter(b => b.amount > 0)
    .map(b => ({ ...b }))
    .sort((a, b) => b.amount - a.amount);
    
  const debtors = nonZeroBalances
    .filter(b => b.amount < 0)
    .map(b => ({ address: b.address, amount: Math.abs(b.amount) }))
    .sort((a, b) => b.amount - a.amount);

  const payments: OptimizedPayment[] = [];

  let i = 0, j = 0;

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    const settlementAmount = Math.min(creditor.amount, debtor.amount);

    payments.push({
      from: debtor.address,
      to: creditor.address,
      amount: parseFloat(settlementAmount.toFixed(2))
    });

    creditor.amount -= settlementAmount;
    debtor.amount -= settlementAmount;

    if (creditor.amount < 0.01) i++;
    if (debtor.amount < 0.01) j++;
  }

  return payments;
}

/**
 * Calculate balances for a group based on expenses
 */
export function calculateBalances(
  members: string[],
  expenses: Array<{
    amount: number;
    paidBy: string;
    settledBy: string[];
  }>
): Balance[] {
  const balanceMap = new Map<string, number>();

  // Initialize all members with 0 balance
  members.forEach(member => balanceMap.set(member, 0));

  // Process each expense
  expenses.forEach(expense => {
    const sharePerPerson = expense.amount / members.length;
    const payer = expense.paidBy;

    // Payer gets credit for full amount
    balanceMap.set(payer, (balanceMap.get(payer) || 0) + expense.amount);

    // Each member (including payer) owes their share
    members.forEach(member => {
      balanceMap.set(member, (balanceMap.get(member) || 0) - sharePerPerson);
    });
  });

  return Array.from(balanceMap.entries()).map(([address, amount]) => ({
    address,
    amount: parseFloat(amount.toFixed(2))
  }));
}

/**
 * Get simplified settlements for a group
 */
export function getSimplifiedSettlements(
  members: string[],
  expenses: Array<{
    amount: number;
    paidBy: string;
    settledBy: string[];
  }>
): {
  balances: Balance[];
  optimizedPayments: OptimizedPayment[];
  originalTransactionCount: number;
  optimizedTransactionCount: number;
  savings: number;
} {
  const balances = calculateBalances(members, expenses);
  const optimizedPayments = optimizeSettlements(balances);

  // Original would be everyone paying back the person who paid
  const originalTransactionCount = expenses.reduce((count, expense) => {
    return count + (members.length - 1); // Everyone except payer pays back
  }, 0);

  const optimizedTransactionCount = optimizedPayments.length;
  const savings = originalTransactionCount - optimizedTransactionCount;

  return {
    balances,
    optimizedPayments,
    originalTransactionCount,
    optimizedTransactionCount,
    savings
  };
}

/**
 * Format payment for display
 */
export function formatPayment(payment: OptimizedPayment, getUserName?: (address: string) => string): string {
  const fromName = getUserName ? getUserName(payment.from) : payment.from.substring(0, 6);
  const toName = getUserName ? getUserName(payment.to) : payment.to.substring(0, 6);
  
  return `${fromName} pays ${toName} ${payment.amount.toFixed(2)} ALGO`;
}
