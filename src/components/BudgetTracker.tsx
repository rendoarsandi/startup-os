import React from 'react';
import { 
  Utensils, Car, Home, Zap, Gamepad2, 
  Activity, TrendingUp, User, Shield, DollarSign, Package, AlertCircle
} from 'lucide-react';
import { useBudgets } from '../hooks/useBudgets';
import { useTransactions } from '../hooks/useTransactions';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';

const categoryIcons: Record<string, React.ReactNode> = {
  Food: <Utensils size={16} className="text-cyan-400" />,
  Transport: <Car size={16} className="text-indigo-400" />,
  Housing: <Home size={16} className="text-violet-400" />,
  Utilities: <Zap size={16} className="text-amber-400" />,
  Entertainment: <Gamepad2 size={16} className="text-pink-400" />,
  Healthcare: <Activity size={16} className="text-emerald-400" />,
  Savings: <TrendingUp size={16} className="text-green-400" />,
  Personal: <User size={16} className="text-sky-400" />,
  Insurance: <Shield size={16} className="text-blue-400" />,
  Income: <DollarSign size={16} className="text-emerald-400" />,
  Other: <Package size={16} className="text-slate-400" />,
};

const categoryGlows: Record<string, string> = {
  Food: 'bg-cyan-500/5 border-cyan-500/10 text-cyan-400',
  Transport: 'bg-indigo-500/5 border-indigo-500/10 text-indigo-400',
  Housing: 'bg-violet-500/5 border-violet-500/10 text-violet-400',
  Utilities: 'bg-amber-500/5 border-amber-500/10 text-amber-400',
  Entertainment: 'bg-pink-500/5 border-pink-500/10 text-pink-400',
  Healthcare: 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400',
  Savings: 'bg-green-500/5 border-green-500/10 text-green-400',
  Personal: 'bg-sky-500/5 border-sky-500/10 text-sky-400',
  Insurance: 'bg-blue-500/5 border-blue-500/10 text-blue-400',
  Income: 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400',
  Other: 'bg-slate-500/5 border-slate-500/10 text-slate-400',
};

export function BudgetTracker() {
  const { budgets, loading: budgetsLoading } = useBudgets();
  const { transactions, isLoading: transactionsLoading } = useTransactions();

  if (budgetsLoading || transactionsLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[72px] rounded-xl bg-muted/30 border border-border/40 animate-pulse" />
        ))}
      </div>
    );
  }

  const budgetsArray = Array.isArray(budgets) ? budgets : [];

  if (budgetsArray.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-border rounded-xl">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
          <AlertCircle size={18} className="text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-sm font-semibold">No budgets set yet.</p>
        <p className="text-muted-foreground/60 text-[11px] mt-1 max-w-[220px] mx-auto">Set spending limits per category in your configuration panel.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {budgetsArray.map((budget) => {
        // Calculate spent amount from transactions (tx.amount is in cents)
        const categoryTransactions = transactions.filter(
          (t) => t.category === budget.category && t.amount < 0
        );
        const spent = categoryTransactions.reduce(
          (sum, t) => sum + Math.abs(t.amount), 
          0
        );
        const percentage = budget.amount > 0 
          ? Math.min(100, Math.round((spent / budget.amount) * 100)) 
          : 0;
        
        const isOver = percentage >= 90;
        const isWarning = percentage >= 70 && percentage < 90;

        let badgeVariant: 'success' | 'warning' | 'destructive' = 'success';
        let progressColorClass = '[&>div]:bg-emerald-500';
        let statusTextColor = 'text-emerald-400';

        if (isOver) {
          badgeVariant = 'destructive';
          progressColorClass = '[&>div]:bg-rose-500';
          statusTextColor = 'text-rose-400';
        } else if (isWarning) {
          badgeVariant = 'warning';
          progressColorClass = '[&>div]:bg-amber-500';
          statusTextColor = 'text-amber-400';
        }

        const iconBoxStyle = categoryGlows[budget.category] || categoryGlows.Other;

        return (
          <div 
            key={budget.id} 
            className="p-4 rounded-xl border border-border/50 bg-black/10 hover:bg-black/20 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${iconBoxStyle}`}>
                  {categoryIcons[budget.category] || <Package size={16} className="text-muted-foreground" />}
                </div>
                <div>
                  <span className="font-bold text-sm text-foreground">{budget.category}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge variant={badgeVariant} className="text-[9px] px-1 py-0.2">
                      {percentage}% SPENT
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className={`font-black text-sm ${statusTextColor}`}>
                  ${(spent / 100).toFixed(0)}
                </span>
                <span className="text-muted-foreground text-xs font-semibold"> / ${(budget.amount / 100).toFixed(0)}</span>
              </div>
            </div>

            <Progress 
              value={percentage} 
              className={`h-2 bg-muted/60 ${progressColorClass}`} 
            />
          </div>
        );
      })}
    </div>
  );
}
