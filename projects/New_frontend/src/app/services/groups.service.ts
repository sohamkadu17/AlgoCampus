/**
 * Groups Service
 * Handles group management operations
 */

import { apiClient } from './api.client';
import { API_ENDPOINTS } from '../config/api.config';

export interface Group {
  id: number;
  chain_group_id: number;
  name: string;
  description: string;
  admin_address: string;
  created_at: string;
  updated_at: string;
  active: boolean;
}

export interface GroupCreate {
  name: string;
  description?: string;
}

export interface GroupWithMembers extends Group {
  members: string[];
}

export const groupsService = {
  /**
   * List all groups for the current user
   */
  async listGroups(activeOnly: boolean = true) {
    return apiClient.get<Group[]>(
      `${API_ENDPOINTS.GROUPS.LIST}?active_only=${activeOnly}`
    );
  },

  /**
   * Create a new group
   */
  async createGroup(groupData: GroupCreate, privateKey: string) {
    return apiClient.post<Group>(
      API_ENDPOINTS.GROUPS.CREATE,
      groupData,
      { privateKey }
    );
  },

  /**
   * Get group details with members
   */
  async getGroup(groupId: number) {
    return apiClient.get<GroupWithMembers>(API_ENDPOINTS.GROUPS.GET(groupId));
  },

  /**
   * Join a group via QR invite
   */
  async joinGroup(inviteHash: string, privateKey: string) {
    return apiClient.post<Group>(
      API_ENDPOINTS.GROUPS.JOIN,
      { invite_hash: inviteHash },
      { privateKey }
    );
  },

  /**
   * Add member to group (admin only)
   */
  async addMember(groupId: number, memberAddress: string, privateKey: string) {
    return apiClient.post(
      API_ENDPOINTS.GROUPS.MEMBERS(groupId),
      { wallet_address: memberAddress },
      { privateKey }
    );
  },

  /**
   * Remove member from group (admin only)
   */
  async removeMember(groupId: number, memberAddress: string, privateKey: string) {
    return apiClient.delete(
      `${API_ENDPOINTS.GROUPS.MEMBERS(groupId)}/${memberAddress}`,
      { privateKey }
    );
  },
};
