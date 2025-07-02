import React, { createContext, useContext, useState } from 'react';

interface Transaction {
  id: string;
  date: string;
  totalAmount: number;
  category: string;
  transactionType: 'income' | 'expense' | 'transfer';
  amount: number;
}

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Transaction) => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1',
      date: 'June 26, 2025',
      totalAmount: 150.0,
      category: 'Food',
      transactionType: 'expense',
      amount: 150.0,
    },
    {
      id: '2',
      date: 'June 26, 2025',
      totalAmount: 50.0,
      category: 'Coffee',
      transactionType: 'expense',
      amount: 50.0,
    },
    {
      id: '3',
      date: 'June 26, 2025',
      totalAmount: 200.0,
      category: 'Freelance',
      transactionType: 'income',
      amount: 200.0,
    },
    {
      id: '4',
      date: 'June 25, 2025',
      totalAmount: 2500.0,
      category: 'Salary',
      transactionType: 'income',
      amount: 2500.0,
    },
    {
      id: '5',
      date: 'June 25, 2025',
      totalAmount: 75.5,
      category: 'Shopping',
      transactionType: 'expense',
      amount: 75.5,
    },
    {
      id: '6',
      date: 'June 24, 2025',
      totalAmount: 300.0,
      category: 'Groceries',
      transactionType: 'expense',
      amount: 300.0,
    },
    {
      id: '7',
      date: 'June 23, 2025',
      totalAmount: 120.0,
      category: 'Transportation',
      transactionType: 'expense',
      amount: 120.0,
    },
  ]);

  const addTransaction = (transaction: Transaction) => {
    setTransactions((prev) => [transaction, ...prev]);
  };

  return (
    <TransactionContext.Provider value={{ transactions, addTransaction }}>
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};
