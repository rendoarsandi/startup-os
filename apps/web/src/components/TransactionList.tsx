import React from 'react';
import { 
  Utensils, ShoppingBag, Gamepad2, Home, Car, MoreHorizontal, 
  ArrowUpRight, ArrowDownLeft, Calendar
} from 'lucide-react';
import { useTransactions } from '../hooks/useTransactions';
import { Badge } from './ui/badge';

const categoryIcons: Record<string, React.ReactNode> = {
  Food: <Utensils size={14} className="text-cyan-400" />,
  Shopping: <ShoppingBag size={14} className="text-violet-400" />,
  Entertainment: <Gamepad2 size={14} className="text-pink-400" />,
  Housing: <Home size={14} className="text-indigo-400" />,
  Transport: <Car size={14} className="text-amber-400" />,
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
          <div key={i} className="h-16 rounded-xl bg-muted/30 border border-border/40 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {transactions.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-border rounded-xl">
          <p className="text-sm font-semibold text-muted-foreground">No transactions recorded yet.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Start by adding custom manual transactions or link with Plaid.</p>
        </div>
      ) : (
        transactions.map((tx) => {
          const isExpense = tx.amount < 0;
          const categoryStyle = categoryClasses[tx.category] || 'bg-slate-500/5 border-slate-500/10 text-slate-400';
          const icon = categoryIcons[tx.category] || <MoreHorizontal size={14} className="text-slate-400" />;

          return (
            <div 
              key={tx.id} 
              className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-black/10 hover:bg-black/20 hover:border-border/80 transition-all duration-200 group"
            >
              <div className="flex items-center gap-3.5">
                <div className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-transform duration-200 group-hover:scale-105 ${categoryStyle}`}>
                  {icon}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                    {tx.merchant}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0 ${categoryStyle}`}>
                      {tx.category}
                    </Badge>
                    <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                      <Calendar size={10} />
                      {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right flex items-center gap-3">
                <div>
                  <span className={`font-black text-sm tracking-tight ${isExpense ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {isExpense ? '-' : '+'}${Math.abs(tx.amount / 100).toFixed(2)}
                  </span>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black mt-0.5">
                    {isExpense ? 'debit' : 'credit'}
                  </p>
                </div>
                <div className={`w-7 h-7 rounded-lg border flex items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity ${
                  isExpense ? 'bg-rose-500/5 border-rose-500/10 text-rose-400' : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400'
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
