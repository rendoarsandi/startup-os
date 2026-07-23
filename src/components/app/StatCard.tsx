import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { useMutation } from '@tanstack/react-query';

export const StatCard = ({ title, value, change, isPositive }: { title: string; value: string; change: string; isPositive: boolean }) => (
  <Card className="p-5 hover:border-primary/30 transition-all cursor-default">
    <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2">{title}</p>
    <div className="flex items-end justify-between">
      <h4 className="text-xl font-black text-foreground">{value}</h4>
      <Badge variant={isPositive ? 'success' : 'destructive'} className="text-[9px] font-black py-0.5 tracking-wider">
        {change}
      </Badge>
    </div>
  </Card>
);

export const InsightItem = ({ type, message }: { type: 'opportunity' | 'warning' | 'success'; message: string }) => {
  const badgeVariants = {
    opportunity: 'success' as const,
    warning: 'warning' as const,
    success: 'success' as const,
  };

  return (
    <div className="p-4 rounded-xl border border-border bg-black/10 flex gap-4 items-center shadow-sm">
      <Badge variant={badgeVariants[type]} className="w-2.5 h-2.5 rounded-full p-0 shrink-0" />
      <p className="text-xs font-semibold text-foreground/80">{message}</p>
    </div>
  );
};

export function SyncBankButton({ onSyncSuccess }: { onSyncSuccess: () => void }) {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [metrics, setMetrics] = useState<{ accountsSynced: number; newTransactionsSynced: number } | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/plaid/sync-transactions', { method: 'POST' });
      if (!res.ok) throw new Error('Sync failed');
      return res.json();
    },
    onSuccess: (data) => {
      setMetrics(data);
      setSyncStatus('success');
      onSyncSuccess();
      setTimeout(() => {
        setSyncStatus('idle');
        setMetrics(null);
      }, 3000);
    },
    onError: () => {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  });

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => {
          if (syncStatus === 'idle') {
            setSyncStatus('syncing');
            mutation.mutate();
          }
        }}
        disabled={syncStatus === 'syncing'}
        className="h-7 text-[9px] font-bold uppercase tracking-wider"
      >
        <span className={`inline-block text-xs transition-transform duration-1000 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`}>
          🔄
        </span>
        {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Bank'}
      </Button>

      {syncStatus === 'success' && metrics && (
        <Card className="absolute right-0 top-8 z-30 w-56 p-3.5 border border-emerald-500/25 bg-card text-left animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="text-emerald-400 font-bold text-xs flex items-center gap-1.5">
            <span>✓</span> Bank Sync Complete
          </p>
          <p className="text-[9px] text-muted-foreground mt-1.5 leading-normal font-semibold">
            Successfully updated {metrics.accountsSynced} accounts. Imported {metrics.newTransactionsSynced} new transactions.
          </p>
        </Card>
      )}

      {syncStatus === 'error' && (
        <Card className="absolute right-0 top-8 z-30 w-48 p-3.5 border border-destructive/20 bg-card text-left animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="text-destructive font-bold text-xs flex items-center gap-1.5">
            <span>✕</span> Sync Failed
          </p>
          <p className="text-[9px] text-muted-foreground mt-1.5 leading-normal font-semibold">
            Please check connection or try again.
          </p>
        </Card>
      )}
    </div>
  );
}
