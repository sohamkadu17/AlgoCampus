/**
 * API Configuration
 * Base URL and configuration for backend API
 */

export const API_CONFIG = {
  // Backend API base URL
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  
  // API version
  VERSION: 'v1',
  
  // Timeout for API requests (in milliseconds)
  TIMEOUT: 30000,
  
  // Enable debug logging
  DEBUG: import.meta.env.DEV,
};

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    CHALLENGE: '/api/v1/auth/challenge',
    VERIFY: '/api/v1/auth/verify',
    DEMO: '/api/v1/auth/demo', // Demo auth without signature verification
    REFRESH: '/api/v1/auth/refresh',
    ME: '/api/v1/auth/me',
  },
  
  // Groups
  GROUPS: {
    LIST: '/api/v1/groups',
    CREATE: '/api/v1/groups',
    GET: (id: number) => `/api/v1/groups/${id}`,
    JOIN: '/api/v1/groups/join',
    MEMBERS: (id: number) => `/api/v1/groups/${id}/members`,
  },
  
  // Expenses
  EXPENSES: {
    LIST: '/api/v1/expenses',
    CREATE: '/api/v1/expenses',
    GET: (id: number) => `/api/v1/expenses/${id}`,
    GROUP_EXPENSES: (groupId: number) => `/api/v1/expenses?group_id=${groupId}`,
    BALANCE: (groupId: number) => `/api/v1/expenses/group/${groupId}/balance`,
    SETTLE: (id: number) => `/api/v1/expenses/${id}/settle`,
  },
  
  // Settlements
  SETTLEMENTS: {
    LIST: '/api/v1/settlements',
    INITIATE: '/api/v1/settlements/initiate',
    EXECUTE: (id: number) => `/api/v1/settlements/execute/${id}`,
    CALCULATE: (groupId: number) => `/api/v1/settlements/calculate/${groupId}`,
    GET: (id: number) => `/api/v1/settlements/${id}`,
  },
  
  // Analytics
  ANALYTICS: {
    USER_STATS: '/api/v1/analytics/user/stats',
    GROUP_STATS: (groupId: number) => `/api/v1/analytics/group/${groupId}/stats`,
    SPENDING_TRENDS: '/api/v1/analytics/spending/trends',
  },
};

/**
 * Algorand Network Configuration
 */
export const ALGORAND_CONFIG = {
  NETWORK: import.meta.env.VITE_ALGORAND_NETWORK || 'testnet',
  ALGOD_SERVER: import.meta.env.VITE_ALGOD_SERVER || 'https://testnet-api.algonode.cloud',
  ALGOD_PORT: import.meta.env.VITE_ALGOD_PORT || '',
  ALGOD_TOKEN: import.meta.env.VITE_ALGOD_TOKEN || '',
  INDEXER_SERVER: import.meta.env.VITE_INDEXER_SERVER || 'https://testnet-idx.algonode.cloud',
  INDEXER_PORT: import.meta.env.VITE_INDEXER_PORT || '',
  INDEXER_TOKEN: import.meta.env.VITE_INDEXER_TOKEN || '',
};

/**
 * Storage Keys
 */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'algocampus_access_token',
  REFRESH_TOKEN: 'algocampus_refresh_token',
  WALLET_ADDRESS: 'algocampus_wallet_address',
  WALLET_CONNECTED: 'algocampus_wallet_connected',
};
