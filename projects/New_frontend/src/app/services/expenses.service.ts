/**
 * Expenses Service
 * Handles expense tracking and management
 */

import { apiClient } from './api.client';
import { API_ENDPOINTS } from '../config/api.config';

export interface Expense {
  id: number;
  chain_expense_id: number;
  group_id: number;
  amount: number;
  description: string;
  payer_address: string;
  split_type: string;
  created_at: string;
  settled: boolean;
  transaction_id: string | null;
}

export interface ExpenseSplit {
  wallet_address: string;
  amount: number;
}

export interface ExpenseWithSplits extends Expense {
  splits: ExpenseSplit[];
}

export interface ExpenseCreate {
  group_id: number;
  amount: number;
  description: string;
  split_type: 'equal' | 'custom' | 'percentage';
  splits?: ExpenseSplit[];
}

export interface ExpenseListResponse {
  expenses: Expense[];
  total: number;
  page: number;
  page_size: number;
}

export interface BalanceInfo {
  group_id: number;
  wallet_address: string;
  balance: number;
  balance_algos: number;
  status: 'owed' | 'owes' | 'settled';
}

export const expensesService = {
  /**
   * Create a new expense
   */
  async createExpense(expenseData: ExpenseCreate, privateKey: string) {
    return apiClient.post<Expense>(
      API_ENDPOINTS.EXPENSES.CREATE,
      expenseData,
      { privateKey }
    );
  },

  /**
   * List expenses with filters
   */
  async listExpenses(
    groupId: number,
    includeSettled: boolean = true,
    page: number = 1,
    pageSize: number = 20
  ) {
    return apiClient.get<ExpenseListResponse>(
      `${API_ENDPOINTS.EXPENSES.LIST}?group_id=${groupId}&include_settled=${includeSettled}&page=${page}&page_size=${pageSize}`
    );
  },

  /**
   * Get expense details
   */
  async getExpense(expenseId: number) {
    return apiClient.get<ExpenseWithSplits>(API_ENDPOINTS.EXPENSES.GET(expenseId));
  },

  /**
   * Get user balance in a group
   */
  async getUserBalance(groupId: number) {
    return apiClient.get<BalanceInfo>(API_ENDPOINTS.EXPENSES.BALANCE(groupId));
  },

  /**
   * Mark expense as settled
   */
  async markExpenseSettled(expenseId: number) {
    return apiClient.post(API_ENDPOINTS.EXPENSES.SETTLE(expenseId));
  },
};
