/**
 * Settlements Service
 * Handles debt settlement operations
 */

import { apiClient } from './api.client';
import { API_ENDPOINTS } from '../config/api.config';

export interface Settlement {
  id: number;
  chain_settlement_id: number | null;
  expense_id: number | null;
  from_address: string;
  to_address: string;
  amount: number;
  transaction_id: string | null;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  completed_at: string | null;
}

export interface SettlementInitiate {
  expense_id?: number;
  from_address: string;
  to_address: string;
  amount: number;
}

export interface SettlementPlan {
  settlements: SettlementInitiate[];
  total_transactions: number;
  total_amount: number;
}

export interface SettlementStatus {
  settlement_id: number;
  chain_settlement_id: number;
  from_address: string;
  to_address: string;
  amount: number;
  amount_algos: number;
  status: string;
  chain_executed: boolean;
  created_at: string;
  executed_at: string | null;
}

export const settlementsService = {
  /**
   * Initiate a settlement
   */
  async initiateSettlement(settlementData: SettlementInitiate, privateKey: string) {
    return apiClient.post<Settlement>(
      API_ENDPOINTS.SETTLEMENTS.INITIATE,
      settlementData,
      { privateKey }
    );
  },

  /**
   * Execute a settlement (atomic transaction)
   */
  async executeSettlement(settlementId: number, privateKey: string) {
    return apiClient.post<Settlement>(
      API_ENDPOINTS.SETTLEMENTS.EXECUTE(settlementId),
      {},
      { privateKey }
    );
  },

  /**
   * Calculate optimal settlement plan for a group
   */
  async calculateOptimalSettlements(groupId: number) {
    return apiClient.get<SettlementPlan>(
      API_ENDPOINTS.SETTLEMENTS.CALCULATE(groupId)
    );
  },

  /**
   * List settlements for the current user
   */
  async listSettlements(
    groupId?: number,
    status?: string,
    limit: number = 50
  ) {
    let url = `${API_ENDPOINTS.SETTLEMENTS.LIST}?limit=${limit}`;
    if (groupId) url += `&group_id=${groupId}`;
    if (status) url += `&status=${status}`;

    return apiClient.get<Settlement[]>(url);
  },

  /**
   * Get settlement status
   */
  async getSettlementStatus(settlementId: number) {
    return apiClient.get<SettlementStatus>(
      API_ENDPOINTS.SETTLEMENTS.GET(settlementId)
    );
  },
};
