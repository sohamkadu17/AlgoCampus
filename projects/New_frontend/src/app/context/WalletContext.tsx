/**
 * Wallet Context
 * Simplified wallet management without external dependencies
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { STORAGE_KEYS } from '../config/api.config';
import { authService } from '../services/auth.service';
import { toast } from 'sonner';

interface WalletContextType {
  isConnected: boolean;
  walletAddress: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  connectWallet: (providerId: string) => Promise<void>;
  disconnectWallet: () => Promise<void>;
  signMessage: (message: Uint8Array) => Promise<Uint8Array | null>;
  getPrivateKey: () => string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWalletContext = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used within WalletContextProvider');
  }
  return context;
};

interface WalletContextProviderProps {
  children: ReactNode;
}

export function WalletContextProvider({ children }: WalletContextProviderProps) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check for existing authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const savedAddress = localStorage.getItem(STORAGE_KEYS.WALLET_ADDRESS);
      
      if (token && savedAddress) {
        setWalletAddress(savedAddress);
        setIsAuthenticated(true);
      }
    };

    checkAuth();
  }, []);

  const connectWallet = async (providerId: string) => {
    setIsLoading(true);
    try {
      // For demo: simulate wallet connection
      // In production, integrate with Pera, Defly, etc.
      toast.info(`Connecting to ${providerId} wallet...`);
      
      // Simulate wallet connection - replace with actual wallet integration
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For now, use a demo address
      const demoAddress = 'DEMO' + Math.random().toString(36).substring(2, 15).toUpperCase();
      
      setWalletAddress(demoAddress);
      localStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, demoAddress);
      localStorage.setItem(STORAGE_KEYS.WALLET_CONNECTED, 'true');
      
      // Simulate authentication
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'demo_token');
      setIsAuthenticated(true);
      
      toast.success('Wallet connected! (Demo mode)');
    } catch (error) {
      console.error('Wallet connection failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to connect wallet');
      await disconnectWallet();
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      setWalletAddress(null);
      setIsAuthenticated(false);
      authService.logout();
      toast.info('Wallet disconnected');
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  };

  const signMessage = async (message: Uint8Array): Promise<Uint8Array | null> => {
    try {
      // Demo implementation
      console.log('Signing message:', message);
      return message;
    } catch (error) {
      console.error('Message signing failed:', error);
      return null;
    }
  };

  const getPrivateKey = (): string | null => {
    return null;
  };

  const contextValue: WalletContextType = {
    isConnected: !!walletAddress,
    walletAddress,
    isAuthenticated,
    isLoading,
    connectWallet,
    disconnectWallet,
    signMessage,
    getPrivateKey,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}
