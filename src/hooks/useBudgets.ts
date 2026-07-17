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
      const res = await fetch('/api/budgets');
      if (!res.ok) throw new Error('Failed to fetch budgets');
      return res.json();
    },
  });

  return { budgets, loading, refetch };
}
