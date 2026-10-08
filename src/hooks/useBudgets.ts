import * as api from '../lib/server-functions'
import { useQuery } from '@tanstack/react-query';

interface Budget {
  id: string;
  category: string;
  amount: number;
  period: string;
}

export function useBudgets() {
  const { data: budgets = [], isLoading: loading, refetch } = useQuery<Budget[]>({
    queryKey: ['budgets'],
    queryFn: async () => {
      const res = await api.listBudgets();

      return res;
    },
  });

  return { budgets, loading, refetch };
}
