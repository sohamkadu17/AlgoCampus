/**
 * App Context
 * Manages application state for groups, expenses, and settlements
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWalletContext } from './WalletContext';
import { groupsService, Group } from '../services/groups.service';
import { expensesService, Expense, BalanceInfo } from '../services/expenses.service';
import { settlementsService, Settlement } from '../services/settlements.service';
import { toast } from 'sonner';

interface AppContextType {
  // Groups
  groups: Group[];
  selectedGroup: Group | null;
  isLoadingGroups: boolean;
  fetchGroups: () => Promise<void>;
  selectGroup: (group: Group | null) => void;
  createGroup: (name: string, description: string) => Promise<Group | null>;

  // Expenses
  expenses: Expense[];
  userBalance: BalanceInfo | null;
  isLoadingExpenses: boolean;
  fetchExpenses: (groupId: number) => Promise<void>;
  fetchUserBalance: (groupId: number) => Promise<void>;
  addExpense: (expenseData: any) => Promise<Expense | null>;

  // Settlements
  settlements: Settlement[];
  isLoadingSettlements: boolean;
  fetchSettlements: (groupId?: number) => Promise<void>;
  initiateSettlement: (settlementData: any) => Promise<Settlement | null>;
  executeSettlement: (settlementId: number) => Promise<Settlement | null>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppContextProvider');
  }
  return context;
};

interface AppContextProviderProps {
  children: ReactNode;
}

export function AppContextProvider({ children }: AppContextProviderProps) {
  const { isAuthenticated, getPrivateKey } = useWalletContext();

  // State
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [userBalance, setUserBalance] = useState<BalanceInfo | null>(null);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(false);

  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [isLoadingSettlements, setIsLoadingSettlements] = useState(false);

  // Fetch groups on authentication
  useEffect(() => {
    if (isAuthenticated) {
      fetchGroups();
    }
  }, [isAuthenticated]);

  // Fetch expenses when group is selected
  useEffect(() => {
    if (selectedGroup) {
      fetchExpenses(selectedGroup.id);
      fetchUserBalance(selectedGroup.id);
    }
  }, [selectedGroup]);

  // Groups methods
  const fetchGroups = async () => {
    setIsLoadingGroups(true);
    try {
      const response = await groupsService.listGroups();
      if (response.data) {
        setGroups(response.data);
      } else if (response.error) {
        toast.error(`Failed to load groups: ${response.error}`);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error('Failed to load groups');
    } finally {
      setIsLoadingGroups(false);
    }
  };

  const selectGroup = (group: Group | null) => {
    setSelectedGroup(group);
  };

  const createGroup = async (name: string, description: string): Promise<Group | null> => {
    const privateKey = getPrivateKey();
    if (!privateKey) {
      toast.error('Private key required to create group');
      return null;
    }

    try {
      const response = await groupsService.createGroup({ name, description }, privateKey);
      if (response.data) {
        setGroups([...groups, response.data]);
        toast.success('Group created successfully!');
        return response.data;
      } else if (response.error) {
        toast.error(`Failed to create group: ${response.error}`);
        return null;
      }
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Failed to create group');
      return null;
    }
    return null;
  };

  // Expenses methods
  const fetchExpenses = async (groupId: number) => {
    setIsLoadingExpenses(true);
    try {
      const response = await expensesService.listExpenses(groupId);
      if (response.data) {
        setExpenses(response.data.expenses);
      } else if (response.error) {
        toast.error(`Failed to load expenses: ${response.error}`);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast.error('Failed to load expenses');
    } finally {
      setIsLoadingExpenses(false);
    }
  };

  const fetchUserBalance = async (groupId: number) => {
    try {
      const response = await expensesService.getUserBalance(groupId);
      if (response.data) {
        setUserBalance(response.data);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const addExpense = async (expenseData: any): Promise<Expense | null> => {
    const privateKey = getPrivateKey();
    if (!privateKey) {
      toast.error('Private key required to add expense');
      return null;
    }

    try {
      const response = await expensesService.createExpense(expenseData, privateKey);
      if (response.data) {
        setExpenses([response.data, ...expenses]);
        toast.success('Expense added successfully!');
        
        // Refresh balance
        if (selectedGroup) {
          fetchUserBalance(selectedGroup.id);
        }
        
        return response.data;
      } else if (response.error) {
        toast.error(`Failed to add expense: ${response.error}`);
        return null;
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Failed to add expense');
      return null;
    }
    return null;
  };

  // Settlements methods
  const fetchSettlements = async (groupId?: number) => {
    setIsLoadingSettlements(true);
    try {
      const response = await settlementsService.listSettlements(groupId);
      if (response.data) {
        setSettlements(response.data);
      } else if (response.error) {
        toast.error(`Failed to load settlements: ${response.error}`);
      }
    } catch (error) {
      console.error('Error fetching settlements:', error);
      toast.error('Failed to load settlements');
    } finally {
      setIsLoadingSettlements(false);
    }
  };

  const initiateSettlement = async (settlementData: any): Promise<Settlement | null> => {
    const privateKey = getPrivateKey();
    if (!privateKey) {
      toast.error('Private key required to initiate settlement');
      return null;
    }

    try {
      const response = await settlementsService.initiateSettlement(settlementData, privateKey);
      if (response.data) {
        setSettlements([response.data, ...settlements]);
        toast.success('Settlement initiated!');
        return response.data;
      } else if (response.error) {
        toast.error(`Failed to initiate settlement: ${response.error}`);
        return null;
      }
    } catch (error) {
      console.error('Error initiating settlement:', error);
      toast.error('Failed to initiate settlement');
      return null;
    }
    return null;
  };

  const executeSettlement = async (settlementId: number): Promise<Settlement | null> => {
    const privateKey = getPrivateKey();
    if (!privateKey) {
      toast.error('Private key required to execute settlement');
      return null;
    }

    try {
      const response = await settlementsService.executeSettlement(settlementId, privateKey);
      if (response.data) {
        // Update settlement in list
        setSettlements(settlements.map(s => 
          s.id === settlementId ? response.data! : s
        ));
        toast.success('Settlement executed successfully!');
        
        // Refresh balance
        if (selectedGroup) {
          fetchUserBalance(selectedGroup.id);
        }
        
        return response.data;
      } else if (response.error) {
        toast.error(`Failed to execute settlement: ${response.error}`);
        return null;
      }
    } catch (error) {
      console.error('Error executing settlement:', error);
      toast.error('Failed to execute settlement');
      return null;
    }
    return null;
  };

  const contextValue: AppContextType = {
    groups,
    selectedGroup,
    isLoadingGroups,
    fetchGroups,
    selectGroup,
    createGroup,

    expenses,
    userBalance,
    isLoadingExpenses,
    fetchExpenses,
    fetchUserBalance,
    addExpense,

    settlements,
    isLoadingSettlements,
    fetchSettlements,
    initiateSettlement,
    executeSettlement,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}
