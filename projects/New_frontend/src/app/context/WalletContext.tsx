/**
 * Wallet Context
 * Provides wallet connection and Algorand integration using @txnlab/use-wallet
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { WalletProvider, useWallet, PROVIDER_ID } from '@txnlab/use-wallet';
import algosdk from 'algosdk';
import { ALGORAND_CONFIG, STORAGE_KEYS } from '../config/api.config';
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

// Inner component that uses useWallet hook
function WalletContextProviderInner({ children }: WalletContextProviderProps) {
  const wallet = useWallet();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check for existing authentication
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const savedAddress = localStorage.getItem(STORAGE_KEYS.WALLET_ADDRESS);
      
      if (token && savedAddress) {
        // Verify token is still valid
        const response = await authService.getCurrentUser();
        if (response.data) {
          setIsAuthenticated(true);
        } else {
          // Token expired, clear storage
          authService.logout();
        }
      }
    };

    checkAuth();
  }, []);

  // Handle wallet connection and authentication
  const connectWallet = async (providerId: string) => {
    setIsLoading(true);
    try {
      // Map provider ID to use-wallet format
      const providerMap: Record<string, string> = {
        'pera': PROVIDER_ID.PERA,
        'defly': PROVIDER_ID.DEFLY,
        'exodus': PROVIDER_ID.EXODUS,
      };

      const mappedProvider = providerMap[providerId.toLowerCase()] || providerId;

      // Connect wallet
      await wallet.connect(mappedProvider as any);

      // Get active account
      if (wallet.activeAccount) {
        const address = wallet.activeAccount.address;

        // Get authentication challenge
        const challengeResponse = await authService.getChallenge(address);
        if (challengeResponse.error) {
          throw new Error(challengeResponse.error);
        }

        const { nonce, message } = challengeResponse.data!;

        // Sign the challenge message
        const encoder = new TextEncoder();
        const messageBytes = encoder.encode(message);

        const signedMessage = await wallet.signMessage(messageBytes);
        if (!signedMessage) {
          throw new Error('Failed to sign message');
        }

        // Convert signature to base64
        const signature = Buffer.from(signedMessage).toString('base64');

        // Verify signature with backend
        const verifyResponse = await authService.verifySignature(address, signature, nonce);
        if (verifyResponse.error) {
          throw new Error(verifyResponse.error);
        }

        // Store wallet address
        localStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, address);
        localStorage.setItem(STORAGE_KEYS.WALLET_CONNECTED, 'true');

        setIsAuthenticated(true);
        toast.success('Wallet connected successfully!');
      }
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
      await wallet.disconnect();
      authService.logout();
      setIsAuthenticated(false);
      toast.info('Wallet disconnected');
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  };

  const signMessage = async (message: Uint8Array): Promise<Uint8Array | null> => {
    try {
      if (!wallet.activeAccount) {
        throw new Error('No active wallet');
      }

      const signedMessage = await wallet.signMessage(message);
      return signedMessage || null;
    } catch (error) {
      console.error('Message signing failed:', error);
      return null;
    }
  };

  const getPrivateKey = (): string | null => {
    // WARNING: This is insecure and should only be used for development/testing
    // In production, use WalletConnect or other secure signing methods
    const privateKey = localStorage.getItem('TEMP_PRIVATE_KEY');
    return privateKey;
  };

  const contextValue: WalletContextType = {
    isConnected: !!wallet.activeAccount,
    walletAddress: wallet.activeAccount?.address || null,
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

// Main provider component that wraps with WalletProvider
export function WalletContextProvider({ children }: WalletContextProviderProps) {
  // Configure Algorand network
  const algod = new algosdk.Algodv2(
    ALGORAND_CONFIG.ALGOD_TOKEN,
    ALGORAND_CONFIG.ALGOD_SERVER,
    ALGORAND_CONFIG.ALGOD_PORT
  );

  // Configure wallet providers
  const providers = [
    { id: PROVIDER_ID.PERA, clientStatic: algod },
    { id: PROVIDER_ID.DEFLY, clientStatic: algod },
    { id: PROVIDER_ID.EXODUS, clientStatic: algod },
  ];

  return (
    <WalletProvider
      value={{
        algod,
        providers,
        network: ALGORAND_CONFIG.NETWORK as 'mainnet' | 'testnet' | 'betanet',
      }}
    >
      <WalletContextProviderInner>
        {children}
      </WalletContextProviderInner>
    </WalletProvider>
  );
}
