import { useQuery } from '@tanstack/react-query'
import { listTransactions } from '../lib/server-functions'
export interface Transaction { id: string; accountId: string; amount: number; category: string; merchant: string; description?: string | null; date: string }
export function useTransactions(enabled = true) {
 const query = useQuery({ queryKey: ['transactions'], queryFn: () => listTransactions(), enabled });
 return { transactions: query.data ?? [], isLoading: query.isLoading, refetch: query.refetch, error: query.error }
}
