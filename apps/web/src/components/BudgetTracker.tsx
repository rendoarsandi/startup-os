import { useBudgets } from '../hooks/useBudgets';
import { useTransactions } from '../hooks/useTransactions';

const categoryIcons: Record<string, string> = {
  Food: '🍔',
  Transport: '🚗',
  Housing: '🏠',
  Utilities: '💡',
  Entertainment: '🎮',
  Healthcare: '🏥',
  Savings: '💰',
  Personal: '👤',
  Insurance: '🛡️',
  Income: '💵',
  Other: '📦',
};

export function BudgetTracker() {
  const { budgets, loading: budgetsLoading } = useBudgets();
  const { transactions, isLoading: transactionsLoading } = useTransactions();

  if (budgetsLoading || transactionsLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  const budgetsArray = Array.isArray(budgets) ? budgets : [];

  if (budgetsArray.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-white/30 text-sm">No budgets set yet.</p>
        <p className="text-white/20 text-xs mt-1">Set spending limits per category to track your goals.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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

        return (
          <div key={budget.id} className="group">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="text-lg">{categoryIcons[budget.category] || '📦'}</span>
                <span className="font-semibold text-sm">{budget.category}</span>
              </div>
              <div className="text-right">
                <span className={`text-xs font-bold ${isOver ? 'text-red-400' : isWarning ? 'text-orange-400' : 'text-green-400'}`}>
                  ${(spent / 100).toFixed(0)}
                </span>
                <span className="text-white/30 text-xs"> / ${(budget.amount / 100).toFixed(0)}</span>
              </div>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${
                  isOver ? 'bg-gradient-to-r from-red-500 to-red-400' : 
                  isWarning ? 'bg-gradient-to-r from-orange-500 to-orange-400' : 
                  'bg-gradient-to-r from-primary to-secondary'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
