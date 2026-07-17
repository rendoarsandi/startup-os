import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLiveQuery } from '@tanstack/react-db';
import { invoicesCollection, upsertInvoices } from '../utils/db';
import type { Invoice } from '../utils/db';

export const useInvoices = (enabled = true) => {
  // 1. Fetch server invoices with TanStack Query
  const { data: serverInvoices = [], isLoading, refetch } = useQuery<Invoice[]>({
    queryKey: ['invoices'],
    queryFn: async () => {
      const response = await fetch('/api/cfo/invoices');
      if (!response.ok) throw new Error('Failed to fetch invoices');
      return response.json();
    },
    enabled,
  });

  // 2. Synchronize server data to TanStack DB
  useEffect(() => {
    if (serverInvoices && serverInvoices.length > 0) {
      upsertInvoices(serverInvoices);
    }
  }, [serverInvoices]);

  // 3. Reactively subscribe to TanStack DB using useLiveQuery
  const { data: invoices = [] } = useLiveQuery((q) =>
    q.from({ invoice: invoicesCollection })
  );

  const mappedInvoices = (invoices || [])
    .map((i: any) => i?.invoice)
    .filter(Boolean) as Invoice[];

  return {
    invoices: mappedInvoices,
    isLoading,
    refetch,
  };
};
