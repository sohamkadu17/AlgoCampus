# AlgoCampus Frontend-Backend Integration Guide

## Overview

This document explains how the AlgoCampus New_frontend is integrated with the backend API and Algorand blockchain.

## Architecture

```
New_frontend (React + Vite)
    ├── Wallet Context (Algorand wallet connection)
    ├── App Context (Application state management)
    └── API Services (Backend communication)
            ↓
Backend API (FastAPI)
    ├── Authentication (JWT + Wallet signatures)
    ├── Groups Management
    ├── Expenses Tracking
    └── Settlements Execution
            ↓
Algorand Blockchain
    ├── GroupManager Smart Contract
    ├── ExpenseTracker Smart Contract
    └── SettlementExecutor Smart Contract
```

## Setup Instructions

### 1. Environment Configuration

Create a `.env` file in the `projects/New_frontend` directory:

```env
# Backend API
VITE_API_BASE_URL=http://localhost:8000

# Algorand Network
VITE_ALGORAND_NETWORK=testnet
VITE_ALGOD_SERVER=https://testnet-api.algonode.cloud
VITE_ALGOD_PORT=
VITE_ALGOD_TOKEN=

VITE_INDEXER_SERVER=https://testnet-idx.algonode.cloud
VITE_INDEXER_PORT=
VITE_INDEXER_TOKEN=
```

### 2. Install Dependencies

```bash
cd projects/New_frontend
npm install
```

### 3. Start the Development Server

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

### 4. Start the Backend Server

In a separate terminal:

```bash
cd backend
# Make sure smart contract app IDs are configured in backend/app/config.py
uvicorn app.main:app --reload --port 8000
```

## API Integration Details

### Authentication Flow

1. **Wallet Connection**
   - User selects wallet provider (Pera, Defly, etc.)
   - Frontend uses `@txnlab/use-wallet` to connect
   
2. **Challenge Request**
   - Frontend requests authentication challenge from backend
   - Endpoint: `POST /api/v1/auth/challenge`
   
3. **Signature Verification**
   - User signs challenge message with wallet
   - Frontend sends signature to backend
   - Endpoint: `POST /api/v1/auth/verify`
   
4. **Token Management**
   - Backend returns JWT access & refresh tokens
   - Frontend stores tokens in localStorage
   - Tokens automatically included in subsequent API calls

### Wallet Context

Located: `src/app/context/WalletContext.tsx`

Provides:
- `isConnected`: Wallet connection status
- `walletAddress`: User's Algorand address
- `isAuthenticated`: Backend authentication status
- `connectWallet(providerId)`: Connect to wallet provider
- `disconnectWallet()`: Disconnect and clear auth
- `signMessage(message)`: Sign arbitrary messages
- `getPrivateKey()`: Get private key (dev only - insecure!)

Usage:
```typescript
import { useWalletContext } from '../context/WalletContext';

const { walletAddress, isAuthenticated, connectWallet } = useWalletContext();
```

### App Context

Located: `src/app/context/AppContext.tsx`

Manages application state and API calls:

#### Groups
- `groups`: Array of user's groups
- `selectedGroup`: Currently selected group
- `fetchGroups()`: Load groups from API
- `createGroup(name, description)`: Create new group on-chain
- `selectGroup(group)`: Set active group

#### Expenses
- `expenses`: Expenses for selected group
- `userBalance`: User's balance in selected group
- `fetchExpenses(groupId)`: Load group expenses
- `addExpense(expenseData)`: Create new expense
- `fetchUserBalance(groupId)`: Get user balance

#### Settlements
- `settlements`: User's settlements
- `fetchSettlements(groupId?)`: Load settlements
- `initiateSettlement(data)`: Create settlement intent
- `executeSettlement(id)`: Execute settlement payment

Usage:
```typescript
import { useAppContext } from '../context/AppContext';

const { groups, createGroup, isLoadingGroups } = useAppContext();
```

### API Services

Located: `src/app/services/`

#### API Client (`api.client.ts`)
- Centralized HTTP client
- Automatic token injection
- Token refresh on 401 errors
- Request/response logging in dev mode

#### Auth Service (`auth.service.ts`)
```typescript
import { authService } from '../services/auth.service';

// Get authentication challenge
const { data } = await authService.getChallenge(walletAddress);

// Verify signature
await authService.verifySignature(walletAddress, signature, nonce);

// Logout
authService.logout();
```

#### Groups Service (`groups.service.ts`)
```typescript
import { groupsService } from '../services/groups.service';

// Create group (requires private key for signing)
const { data } = await groupsService.createGroup(
  { name: 'My Group', description: '...' },
  privateKey
);

// List groups
const { data } = await groupsService.listGroups();

// Get group details
const { data } = await groupsService.getGroup(groupId);
```

#### Expenses Service (`expenses.service.ts`)
```typescript
import { expensesService } from '../services/expenses.service';

// Create expense
const { data } = await expensesService.createExpense(
  {
    group_id: 1,
    amount: 50000000, // 50 ALGO in microAlgos
    description: 'Dinner',
    split_type: 'equal'
  },
  privateKey
);

// Get user balance
const { data } = await expensesService.getUserBalance(groupId);
```

#### Settlements Service (`settlements.service.ts`)
```typescript
import { settlementsService } from '../services/settlements.service';

// Calculate optimal settlements
const { data } = await settlementsService.calculateOptimalSettlements(groupId);

// Initiate settlement
const { data } = await settlementsService.initiateSettlement(
  {
    from_address: debtorAddress,
    to_address: creditorAddress,
    amount: 25000000 // 25 ALGO
  },
  privateKey
);

// Execute settlement (atomic transaction)
await settlementsService.executeSettlement(settlementId, privateKey);
```

## Component Updates

### Updated Components

1. **App.tsx**
   - Now uses `WalletContext` instead of mock wallet state
   - Real authentication flow with signature verification
   
2. **Splits.tsx**
   - Integrated with `AppContext` for groups management
   - Displays real groups from blockchain
   - Shows real expenses and user balances
   - Create group flow creates on-chain groups

3. **main.tsx**
   - Wraps app with `WalletContextProvider` and `AppContextProvider`

### Components Needing Updates

The following components still use mock data and need integration:

1. **Dashboard.tsx** - Display real user stats and recent activity
2. **AddExpenseDialog.tsx** - Connect to expense creation API
3. **CreateSplitPage.tsx** - Use real group creation
4. **SplitDetailPage.tsx** - Show real expense and settlement data
5. **HistoryPage.tsx** - Display real transaction history

## Private Key Handling (IMPORTANT)

### Current Implementation (Development Only)

The current implementation uses a header-based private key approach:

```typescript
// X-Private-Key header is sent with transaction requests
const { data } = await expensesService.createExpense(expenseData, privateKey);
```

**⚠️ WARNING**: This is **INSECURE** and should **ONLY** be used for development/hackathon purposes.

### Production Recommendations

For production, implement one of the following:

1. **WalletConnect Signing** (Recommended)
   ```typescript
   // Use the wallet to sign transactions
   const signedTxn = await wallet.signTransaction(unsignedTxn);
   // Send signed transaction to backend
   ```

2. **Hardware Wallet Integration**
   - Support Ledger/Trezor for key storage
   
3. **Backend-Side Signing with Secure Key Management**
   - Use AWS KMS / Azure Key Vault
   - Multi-signature requirements for sensitive operations

## Error Handling

All API services return a consistent response format:

```typescript
interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}
```

Example usage:
```typescript
const response = await groupsService.createGroup(data, privateKey);

if (response.error) {
  toast.error(`Failed: ${response.error}`);
  return;
}

// Success - response.data contains the created group
const group = response.data;
```

## Conversion Utilities

### MicroAlgos ↔ ALGO

```typescript
// Convert microAlgos to ALGO
const formatAlgoAmount = (microAlgos: number): string => {
  return (microAlgos / 1_000_000).toFixed(2);
};

// Convert ALGO to microAlgos
const toMicroAlgos = (algos: number): number => {
  return Math.floor(algos * 1_000_000);
};

// Usage
const amount = formatAlgoAmount(50000000); // "50.00"
const microAmount = toMicroAlgos(50); // 50000000
```

## Testing the Integration

### 1. Test Wallet Connection

1. Click "Connect Wallet" button
2. Select Pera/Defly wallet
3. Approve connection in wallet app
4. Sign authentication challenge
5. Verify wallet address displays in UI

### 2. Test Group Creation

1. Navigate to Splits page
2. Click "Create Group" button
3. Enter group name and description
4. Click "Create Group"
5. Transaction will be sent to blockchain
6. Group should appear in list after confirmation

### 3. Test Expense Addition

1. Select a group from Splits list
2. Click "+ " button in expenses section
3. Enter expense details
4. Submit expense
5. Expense creates on-chain and appears in list

### 4. Test Balance Checking

1. View a group with expenses
2. Check "Your Balance" card
3. Shows amount owed/owing in ALGO
4. Status indicates "owed", "owes", or "settled"

## Troubleshooting

### Wallet Connection Issues

**Problem**: Wallet doesn't connect
- Ensure wallet app is installed and updated
- Check network matches (testnet/mainnet)
- Clear browser localStorage and retry

**Problem**: "Invalid signature" error
- Ensure challenge message is signed correctly
- Check wallet address matches the one used for challenge

### API Errors

**Problem**: 401 Unauthorized
- Token expired - should auto-refresh
- If persists, disconnect and reconnect wallet

**Problem**: 422 Unprocessable Entity
- Check request body format
- Verify all required fields are provided
- Check amount is in microAlgos (not ALGO)

**Problem**: 502 Bad Gateway / Transaction Failed
- Blockchain network issues
- Insufficient balance for transaction
- Check Algorand node status

### CORS Errors

If you see CORS errors:
1. Ensure backend is running on correct port (8000)
2. Check `VITE_API_BASE_URL` in `.env`
3. Verify backend CORS settings allow frontend origin

## Next Steps

1. **Complete Component Integration**
   - Update remaining components to use real APIs
   - Remove all mock data

2. **Add Expense Dialog**
   - Create form for expense input
   - Implement split calculation UI
   - Connect to `expensesService.createExpense()`

3. **Settlement Execution UI**
   - Show optimal settlement plan
   - Implement one-click settlement execution
   - Display atomic transaction status

4. **Transaction History**
   - Query transaction indexer
   - Display full transaction details
   - Link to AlgoExplorer for verification

5. **Error Handling Improvements**
   - Add retry logic for failed transactions
   - Better error messages for users
   - Transaction simulation before execution

6. **Loading States**
   - Add skeleton loaders
   - Progress indicators for blockchain operations
   - Optimistic UI updates

7. **Security Enhancements**
   - Implement proper wallet signing (remove private key headers)
   - Add transaction preview before signing
   - Rate limiting on frontend

## Support

For issues or questions:
- Check backend logs: `backend/logs/`
- Check browser console for frontend errors
- Review Algorand transaction on AlgoExplorer
- Ensure all environment variables are set correctly

## Resources

- [Algorand Developer Docs](https://developer.algorand.org/)
- [@txnlab/use-wallet Docs](https://github.com/TxnLab/use-wallet)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [AlgoExplorer (Testnet)](https://testnet.algoexplorer.io/)
