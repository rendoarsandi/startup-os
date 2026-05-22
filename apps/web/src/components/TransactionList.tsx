import React from 'react';
import { 
  Utensils, ShoppingBag, Gamepad2, Home, Car, MoreHorizontal, 
  ArrowUpRight, ArrowDownLeft, Calendar
} from 'lucide-react';
import { useTransactions } from '../hooks/useTransactions';

const categoryIcons: Record<string, React.ReactNode> = {
  Food: <Utensils size={16} className="text-cyan-400" />,
  Shopping: <ShoppingBag size={16} className="text-violet-400" />,
  Entertainment: <Gamepad2 size={16} className="text-pink-400" />,
  Housing: <Home size={16} className="text-indigo-400" />,
  Transport: <Car size={16} className="text-amber-400" />,
};

const categoryClasses: Record<string, string> = {
  Food: 'bg-cyan-500/5 border-cyan-500/10 text-cyan-400',
  Shopping: 'bg-violet-500/5 border-violet-500/10 text-violet-400',
  Entertainment: 'bg-pink-500/5 border-pink-500/10 text-pink-400',
  Housing: 'bg-indigo-500/5 border-indigo-500/10 text-indigo-400',
  Transport: 'bg-amber-500/5 border-amber-500/10 text-amber-400',
};

export const TransactionList: React.FC = () => {
  const { transactions, isLoading } = useTransactions();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-white/5 border border-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {transactions.length === 0 ? (
        <div className="p-12 text-center glass-card border-dashed border-white/10 opacity-60">
          <p className="text-sm font-semibold text-white/50">No transactions recorded yet.</p>
          <p className="text-xs text-white/30 mt-1">Start by adding custom manual transactions or link with Plaid.</p>
        </div>
      ) : (
        transactions.map((tx) => {
          const isExpense = tx.amount < 0;
          const categoryStyle = categoryClasses[tx.category] || 'bg-slate-500/5 border-slate-500/10 text-slate-400';
          const icon = categoryIcons[tx.category] || <MoreHorizontal size={16} className="text-slate-400" />;

          return (
            <div 
              key={tx.id} 
              className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.01] border border-white/[0.05] hover:bg-white/[0.03] hover:border-white/[0.08] transition-all duration-300 group"
            >
              <div className="flex items-center gap-3.5">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-transform duration-300 group-hover:scale-105 ${categoryStyle}`}>
                  {icon}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white/90 group-hover:text-white transition-colors">
                    {tx.merchant}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${categoryStyle}`}>
                      {tx.category}
                    </span>
                    <span className="text-[9px] text-white/30 flex items-center gap-1">
                      <Calendar size={10} />
                      {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right flex items-center gap-3">
                <div>
                  <span className={`font-black text-sm tracking-tight ${isExpense ? 'text-pink-400' : 'text-emerald-400'}`}>
                    {isExpense ? '-' : '+'}${Math.abs(tx.amount / 100).toFixed(2)}
                  </span>
                  <p className="text-[9px] text-white/30 uppercase tracking-widest font-black mt-0.5">
                    {isExpense ? 'debit' : 'credit'}
                  </p>
                </div>
                <div className={`w-7 h-7 rounded-lg border flex items-center justify-center opacity-30 group-hover:opacity-75 transition-opacity ${
                  isExpense ? 'bg-pink-500/5 border-pink-500/10 text-pink-400' : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400'
                }`}>
                  {isExpense ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};
