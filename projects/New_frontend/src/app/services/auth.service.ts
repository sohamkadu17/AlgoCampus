/**/**



































































































};  },    apiClient.clearTokens();  logout() {   */   * Logout and clear tokens  /**  },    return response;    }      apiClient.setRefreshToken(response.data.refresh_token);      apiClient.setAccessToken(response.data.access_token);    if (response.data) {    // Store new tokens if successful    );      { requiresAuth: false }      { refresh_token: refreshToken },      API_ENDPOINTS.AUTH.REFRESH,    const response = await apiClient.post<TokenResponse>(  async refreshToken(refreshToken: string) {   */   * Refresh access token  /**  },    return apiClient.get<User>(API_ENDPOINTS.AUTH.ME);  async getCurrentUser() {   */   * Get current user info  /**  },    return response;    }      apiClient.setRefreshToken(response.data.refresh_token);      apiClient.setAccessToken(response.data.access_token);    if (response.data) {    // Store tokens if successful    );      { requiresAuth: false }      },        nonce,        signature,        wallet_address: walletAddress,      {      API_ENDPOINTS.AUTH.VERIFY,    const response = await apiClient.post<TokenResponse>(  ) {    nonce: string    signature: string,    walletAddress: string,  async verifySignature(   */   * Verify wallet signature and get tokens  /**  },    );      { requiresAuth: false }      { wallet_address: walletAddress },      API_ENDPOINTS.AUTH.CHALLENGE,    return apiClient.post<ChallengeResponse>(  async getChallenge(walletAddress: string) {   */   * Get authentication challenge for wallet  /**export const authService = {}  last_login: string | null;  created_at: string;  wallet_address: string;export interface User {}  expires_in: number;  token_type: string;  refresh_token: string;  access_token: string;export interface TokenResponse {}  expires_at: string;  message: string;  nonce: string;export interface ChallengeResponse {import { API_ENDPOINTS } from '../config/api.config';import { apiClient } from './api.client'; */ * Handles wallet-based authentication with signature verification * Authentication Service * Authentication Service
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
