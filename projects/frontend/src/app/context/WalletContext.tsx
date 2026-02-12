/**
 * Wallet Context
 * Real Pera Wallet integration for Algorand
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { PeraWalletConnect } from '@perawallet/connect';
import { Buffer } from 'buffer';
import { STORAGE_KEYS } from '../config/api.config';
import { authService } from '../services/auth.service';
import { toast } from 'sonner';

// Initialize Pera Wallet
const peraWallet = new PeraWalletConnect({
  shouldShowSignTxnToast: true,
  chainId: 416002, // TestNet - use 416001 for MainNet
});

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

  // Check for existing connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const accounts = await peraWallet.reconnectSession();
        if (accounts.length > 0) {
          const address = accounts[0];
          setWalletAddress(address);
          
          // Check if still authenticated
          const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
          if (token) {
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.log('No existing session');
      }
    };

    checkConnection();

    // Listen for disconnect events
    peraWallet.connector?.on('disconnect', () => {
      handleDisconnect();
    });
  }, []);

  const handleDisconnect = () => {
    setWalletAddress(null);
    setIsAuthenticated(false);
    authService.logout();
  };

  const connectWallet = async (providerId: string) => {
    setIsLoading(true);
    try {
      // Only Pera is supported for now
      if (providerId.toLowerCase() !== 'pera') {
        toast.info('Only Pera Wallet is supported in this demo. Opening Pera...');
      }

      // Connect to Pera Wallet
      const accounts = await peraWallet.connect();
      
      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const address = accounts[0];
      setWalletAddress(address);
      
      // Store wallet info
      localStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, address);
      localStorage.setItem(STORAGE_KEYS.WALLET_CONNECTED, 'true');

      try {
        // Get authentication challenge from backend
        const challengeResponse = await authService.getChallenge(address);
        
        if (challengeResponse.data) {
          const { nonce, message } = challengeResponse.data;

          // Sign the message with Pera Wallet
          const encoder = new TextEncoder();
          const messageBytes = encoder.encode(message);

          // For signing arbitrary data, we need to create a note transaction
          // This is a workaround as Pera doesn't support arbitrary message signing
          toast.info('Please approve the signature request in Pera Wallet');
          
          // Create a dummy transaction for signing (0 ALGO to self)
          const algosdk = await import('algosdk');
          const suggestedParams = {
            fee: 1000,
            minFee: 1000,
            firstValid: 1000,
            lastValid: 2000,
            firstRound: 1000,
            lastRound: 2000,
            genesisID: 'testnet-v1.0',
            genesisHash: new Uint8Array(Buffer.from('SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=', 'base64')),
            flatFee: true,
          } as any;

          const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            sender: address,
            receiver: address,
            amount: 0,
            note: messageBytes,
            suggestedParams,
          });

          const signedTxn = await peraWallet.signTransaction([[{ txn }]]);
          
          // Use the transaction signature as proof
          const signature = Buffer.from(signedTxn[0]).toString('base64');

          // Verify with backend
          const verifyResponse = await authService.verifySignature(address, signature, nonce);
          
          if (verifyResponse.data) {
            setIsAuthenticated(true);
            toast.success('🎉 Pera Wallet connected and authenticated!');
          } else {
            throw new Error('Authentication failed');
          }
        }
      } catch (authError) {
        console.warn('Signature auth failed, trying demo auth:', authError);
        // Use the backend's demo auth endpoint to get real JWT tokens
        try {
          const demoResponse = await authService.demoAuth(address);
          if (demoResponse.data) {
            setIsAuthenticated(true);
            toast.success('Pera Wallet connected! (Auth in demo mode)');
          } else {
            throw new Error('Demo auth failed');
          }
        } catch (demoError) {
          console.error('Demo auth also failed:', demoError);
          toast.error('Authentication failed - is the backend running?');
        }
      }

    } catch (error: any) {
      console.error('Wallet connection failed:', error);
      
      if (error?.message?.includes('User rejected')) {
        toast.error('Connection cancelled');
      } else {
        toast.error('Failed to connect to Pera Wallet');
      }
      
      await disconnectWallet();
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      await peraWallet.disconnect();
      handleDisconnect();
      toast.info('Wallet disconnected');
    } catch (error) {
      console.error('Disconnect failed:', error);
      handleDisconnect(); // Force disconnect locally
    }
  };

  const signMessage = async (message: Uint8Array): Promise<Uint8Array | null> => {
    try {
      if (!walletAddress) {
        throw new Error('No wallet connected');
      }

      // Create a note transaction for signing
      const algosdk = await import('algosdk');
      const suggestedParams = {
        fee: 1000,
        minFee: 1000,
        firstValid: 1000,
        lastValid: 2000,
        firstRound: 1000,
        lastRound: 2000,
        genesisID: 'testnet-v1.0',
        genesisHash: new Uint8Array(Buffer.from('SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=', 'base64')),
        flatFee: true,
      } as any;

      const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: walletAddress,
        receiver: walletAddress,
        amount: 0,
        note: message,
        suggestedParams,
      });

      const signedTxn = await peraWallet.signTransaction([[{ txn }]]);
      return signedTxn[0];
    } catch (error) {
      console.error('Message signing failed:', error);
      return null;
    }
  };

  const getPrivateKey = (): string | null => {
    // Pera Wallet never exposes private keys (secure!)
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
