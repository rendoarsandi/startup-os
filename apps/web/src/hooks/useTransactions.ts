import { useQuery } from '@tanstack/react-query';

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
  const { data: transactions = [], isLoading, refetch } = useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await fetch('/api/transactions');
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
    enabled,
  });

  return { transactions, isLoading, refetch };
};
