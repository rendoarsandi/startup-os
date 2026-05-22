import React from 'react';
import { 
  Utensils, Car, Home, Zap, Gamepad2, 
  Activity, TrendingUp, User, Shield, DollarSign, Package, AlertCircle
} from 'lucide-react';
import { useBudgets } from '../hooks/useBudgets';
import { useTransactions } from '../hooks/useTransactions';

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
  Food: 'shadow-cyan-500/10 bg-cyan-500/5 border-cyan-500/10',
  Transport: 'shadow-indigo-500/10 bg-indigo-500/5 border-indigo-500/10',
  Housing: 'shadow-violet-500/10 bg-violet-500/5 border-violet-500/10',
  Utilities: 'shadow-amber-500/10 bg-amber-500/5 border-amber-500/10',
  Entertainment: 'shadow-pink-500/10 bg-pink-500/5 border-pink-500/10',
  Healthcare: 'shadow-emerald-500/10 bg-emerald-500/5 border-emerald-500/10',
  Savings: 'shadow-green-500/10 bg-green-500/5 border-green-500/10',
  Personal: 'shadow-sky-500/10 bg-sky-500/5 border-sky-500/10',
  Insurance: 'shadow-blue-500/10 bg-blue-500/5 border-blue-500/10',
  Income: 'shadow-emerald-500/10 bg-emerald-500/5 border-emerald-500/10',
  Other: 'shadow-slate-500/10 bg-slate-500/5 border-slate-500/10',
};

export function BudgetTracker() {
  const { budgets, loading: budgetsLoading } = useBudgets();
  const { transactions, isLoading: transactionsLoading } = useTransactions();

  if (budgetsLoading || transactionsLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[72px] rounded-2xl bg-white/5 border border-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  const budgetsArray = Array.isArray(budgets) ? budgets : [];

  if (budgetsArray.length === 0) {
    return (
      <div className="text-center py-12 glass-card border-dashed border-white/10">
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
          <AlertCircle size={20} className="text-white/30" />
        </div>
        <p className="text-white/50 text-sm font-semibold">No budgets set yet.</p>
        <p className="text-white/30 text-xs mt-1 max-w-[200px] mx-auto">Set spending limits per category in your configuration panel.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {budgetsArray.map((budget) => {
        // Calculate deterministic spent amount from transactions (tx.amount is in cents)
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

        // Custom styling for active gauges
        // Emerald for safe, Coral/Orange for warning, Hot Pink/Red for over budget
        let progressGradient = 'from-emerald-500 to-teal-400';
        let progressGlow = 'rgba(16, 185, 129, 0.4)';
        let statusTextColor = 'text-emerald-400';

        if (isOver) {
          progressGradient = 'from-pink-500 to-rose-500';
          progressGlow = 'rgba(236, 72, 153, 0.4)';
          statusTextColor = 'text-pink-400';
        } else if (isWarning) {
          progressGradient = 'from-orange-500 to-amber-400';
          progressGlow = 'rgba(249, 115, 22, 0.4)';
          statusTextColor = 'text-orange-400';
        }

        const iconBoxStyle = categoryGlows[budget.category] || categoryGlows.Other;

        return (
          <div 
            key={budget.id} 
            className="p-4 rounded-xl bg-white/[0.01] border border-white/[0.05] hover:bg-white/[0.03] hover:border-white/[0.08] transition-all duration-300 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shadow-inner ${iconBoxStyle}`}>
                  {categoryIcons[budget.category] || <Package size={16} className="text-white/60" />}
                </div>
                <div>
                  <span className="font-bold text-sm tracking-tight text-white/90">{budget.category}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[10px] font-black uppercase tracking-wider ${statusTextColor}`}>
                      {percentage}% SPENT
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className={`font-black text-sm ${statusTextColor}`}>
                  ${(spent / 100).toFixed(0)}
                </span>
                <span className="text-white/30 text-xs font-semibold"> / ${(budget.amount / 100).toFixed(0)}</span>
              </div>
            </div>

            {/* Premium Glowing Progress Gauge */}
            <div className="relative h-2 w-full rounded-full bg-white/5 overflow-hidden">
              <div 
                className={`h-full rounded-full bg-gradient-to-r ${progressGradient} transition-all duration-700`}
                style={{ 
                  width: `${percentage}%`,
                  boxShadow: `0 0 10px ${progressGlow}`
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
