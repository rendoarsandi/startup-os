import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLiveQuery } from '@tanstack/react-db';
import { transactionsCollection, upsertTransactions } from '../utils/db';

export interface Transaction {
  id: string;
  accountId: string;
  amount: number;
  category: string;
  merchant: string;
  description?: string;
  date: string;
}

export const useTransactions = (enabled = true) => {
  // 1. Fetch server transactions with TanStack Query
  const { data: serverTransactions = [], isLoading, refetch } = useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await fetch('/api/transactions');
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
    enabled,
  });

  // 2. Synchronize server data to TanStack DB
  useEffect(() => {
    if (serverTransactions && serverTransactions.length > 0) {
      upsertTransactions(serverTransactions);
    }
  }, [serverTransactions]);

  // 3. Reactively subscribe to TanStack DB using useLiveQuery
  const { data: transactions = [] } = useLiveQuery((q) =>
    q.from({ transaction: transactionsCollection })
  );

  const mappedTransactions = (transactions || [])
    .map((t: any) => t?.transaction)
    .filter(Boolean) as Transaction[];

  return { 
    transactions: mappedTransactions, 
    isLoading, 
    refetch 
  };
};
