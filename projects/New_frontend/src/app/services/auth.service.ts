/**
 * Authentication Service
 * Handles wallet-based authentication and JWT management
 */

import { apiClient } from './api.client';
import { API_ENDPOINTS } from '../config/api.config';

export interface ChallengeResponse {
  nonce: string;
  message: string;
  expires_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface User {
  wallet_address: string;
  created_at: string;
  last_login?: string;
}

export const authService = {
  /**
   * Get authentication challenge for wallet
   */
  async getChallenge(walletAddress: string) {
    return apiClient.post<ChallengeResponse>(
      API_ENDPOINTS.AUTH.CHALLENGE,
      { wallet_address: walletAddress },
      { requiresAuth: false }
    );
  },

  /**
   * Verify wallet signature and get JWT tokens
   */
  async verifySignature(
    walletAddress: string,
    signature: string,
    nonce: string
  ) {
    const response = await apiClient.post<TokenResponse>(
      API_ENDPOINTS.AUTH.VERIFY,
      {
        wallet_address: walletAddress,
        signature,
        nonce,
      },
      { requiresAuth: false }
    );

    if (response.data) {
      // Store tokens
      apiClient.setAccessToken(response.data.access_token);
      apiClient.setRefreshToken(response.data.refresh_token);
    }

    return response;
  },

  /**
   * Get current authenticated user
   */
  async getCurrentUser() {
    return apiClient.get<User>(API_ENDPOINTS.AUTH.ME);
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string) {
    const response = await apiClient.post<TokenResponse>(
      API_ENDPOINTS.AUTH.REFRESH,
      { refresh_token: refreshToken },
      { requiresAuth: false }
    );

    if (response.data) {
      apiClient.setAccessToken(response.data.access_token);
      apiClient.setRefreshToken(response.data.refresh_token);
    }

    return response;
  },

  /**
   * Logout and clear tokens
   */
  logout() {
    apiClient.clearTokens();
  },
};
