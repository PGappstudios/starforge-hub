import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface Transaction {
  id: string;
  type: 'earned' | 'spent';
  amount: number;
  description: string;
  timestamp: Date;
}

interface CreditsContextType {
  credits: number;
  transactions: Transaction[];
  addCredits: (amount: number, description: string) => Promise<boolean>;
  spendCredits: (amount: number, description: string) => Promise<boolean>;
  canAfford: (amount: number) => boolean;
  resetCredits: () => void;
  refreshCredits: () => Promise<boolean>;
}

const CreditsContext = createContext<CreditsContextType | undefined>(undefined);

const TRANSACTIONS_KEY = 'starseeker-transactions';

interface CreditsProviderProps {
  children: ReactNode;
}

export const CreditsProvider: React.FC<CreditsProviderProps> = ({ children }) => {
  const { user, checkAuthStatus } = useAuth();
  const [credits, setCredits] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Sync credits with user data
  useEffect(() => {
    if (user?.credits !== undefined && user.credits !== null) {
      setCredits(user.credits);
    }
  }, [user?.credits]);

  useEffect(() => {
    const storedTransactions = localStorage.getItem(TRANSACTIONS_KEY);
    if (storedTransactions) {
      try {
        const parsedTransactions = JSON.parse(storedTransactions).map((t: any) => ({
          ...t,
          timestamp: new Date(t.timestamp)
        }));
        setTransactions(parsedTransactions);
      } catch (error) {
        console.error('Error parsing stored transactions:', error);
        setTransactions([]);
      }
    }
  }, []);

  const saveTransactionsToStorage = (newTransactions: Transaction[]) => {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(newTransactions));
  };

  const addTransaction = (type: 'earned' | 'spent', amount: number, description: string): Transaction => {
    return {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type,
      amount,
      description,
      timestamp: new Date()
    };
  };

  const addCredits = async (amount: number, description: string): Promise<boolean> => {
    if (amount <= 0 || !user) return false;

    try {
      const response = await fetch('/api/user/credits/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
        credentials: 'include',
      });

      if (response.ok) {
        const transaction = addTransaction('earned', amount, description);
        const newTransactions = [transaction, ...transactions].slice(0, 100);
        setTransactions(newTransactions);
        saveTransactionsToStorage(newTransactions);
        
        // Refresh auth to get updated credits
        await checkAuthStatus();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding credits:', error);
      return false;
    }
  };

  const spendCredits = async (amount: number, description: string): Promise<boolean> => {
    if (amount <= 0 || credits < amount || !user) {
      return false;
    }

    try {
      const response = await fetch('/api/user/credits/spend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
        credentials: 'include',
      });

      if (response.ok) {
        const transaction = addTransaction('spent', amount, description);
        const newTransactions = [transaction, ...transactions].slice(0, 100);
        setTransactions(newTransactions);
        saveTransactionsToStorage(newTransactions);
        
        // Refresh auth to get updated credits
        await checkAuthStatus();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error spending credits:', error);
      return false;
    }
  };

  const canAfford = (amount: number): boolean => {
    return credits >= amount;
  };

  const resetCredits = () => {
    setTransactions([]);
    localStorage.removeItem(TRANSACTIONS_KEY);
  };

  const refreshCredits = async (): Promise<boolean> => {
    try {
      await checkAuthStatus();
      return true;
    } catch (error) {
      console.error('Error refreshing credits:', error);
      return false;
    }
  };

  return (
    <CreditsContext.Provider value={{
      credits,
      transactions,
      addCredits,
      spendCredits,
      canAfford,
      resetCredits,
      refreshCredits
    }}>
      {children}
    </CreditsContext.Provider>
  );
};

export const useCredits = (): CreditsContextType => {
  const context = useContext(CreditsContext);
  if (context === undefined) {
    throw new Error('useCredits must be used within a CreditsProvider');
  }
  return context;
};