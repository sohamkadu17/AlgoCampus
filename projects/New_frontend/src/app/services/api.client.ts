/**
 * API Client
 * Handles all HTTP requests to the backend with token management
 */

import { API_CONFIG, STORAGE_KEYS } from '../config/api.config';

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  requiresAuth?: boolean;
  privateKey?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get access token from storage
   */
  private getAccessToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  /**
   * Set access token in storage
   */
  setAccessToken(token: string): void {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  }

  /**
   * Get refresh token from storage
   */
  private getRefreshToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  /**
   * Set refresh token in storage
   */
  setRefreshToken(token: string): void {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  }

  /**
   * Clear all tokens from storage
   */
  clearTokens(): void {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.WALLET_ADDRESS);
    localStorage.removeItem(STORAGE_KEYS.WALLET_CONNECTED);
  }

  /**
   * Make an API request
   */
  async request<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      body,
      headers = {},
      requiresAuth = true,
      privateKey,
    } = options;

    // Build full URL
    const url = `${this.baseUrl}${endpoint}`;

    // Build headers
    const finalHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    // Add authorization header if required
    if (requiresAuth) {
      const token = this.getAccessToken();
      if (token) {
        finalHeaders['Authorization'] = `Bearer ${token}`;
      }
    }

    // Add private key header if provided (for signing transactions)
    if (privateKey) {
      finalHeaders['X-Private-Key'] = privateKey;
    }

    try {
      if (API_CONFIG.DEBUG) {
        console.log(`[API] ${method} ${endpoint}`, { body, headers: finalHeaders });
      }

      const response = await fetch(url, {
        method,
        headers: finalHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json().catch(() => null);

      if (API_CONFIG.DEBUG) {
        console.log(`[API] Response ${response.status}:`, data);
      }

      if (!response.ok) {
        // Handle 401 Unauthorized - try to refresh token
        if (response.status === 401 && requiresAuth) {
          const refreshed = await this.refreshAccessToken();
          if (refreshed) {
            // Retry the original request
            return this.request<T>(endpoint, options);
          } else {
            // Refresh failed, clear tokens
            this.clearTokens();
          }
        }

        return {
          error: data?.detail || data?.message || 'Request failed',
          status: response.status,
        };
      }

      return {
        data,
        status: response.status,
      };
    } catch (error) {
      console.error('[API] Request failed:', error);
      return {
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
      };
    }
  }

  /**
   * Refresh access token
   */
  private async refreshAccessToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      this.setAccessToken(data.access_token);
      this.setRefreshToken(data.refresh_token);

      return true;
    } catch (error) {
      console.error('[API] Token refresh failed:', error);
      return false;
    }
  }

  /**
   * GET request
   */
  async get<T = any>(
    endpoint: string,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = any>(
    endpoint: string,
    body?: any,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  /**
   * PUT request
   */
  async put<T = any>(
    endpoint: string,
    body?: any,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    endpoint: string,
    body?: any,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(
    endpoint: string,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_CONFIG.BASE_URL);
