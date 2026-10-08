import { useQuery } from '@tanstack/react-query'
import { listInvoices } from '../lib/server-functions'
export function useInvoices(enabled = true) {
 const query = useQuery({ queryKey: ['invoices'], queryFn: () => listInvoices(), enabled });
 return { invoices: query.data ?? [], isLoading: query.isLoading, refetch: query.refetch, error: query.error }
}
