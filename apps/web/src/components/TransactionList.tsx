import React from 'react';
import { ShoppingCart, Coffee, Home, Car, Utensils, MoreHorizontal } from 'lucide-react';
import { useTransactions } from '../hooks/useTransactions';

const categoryIcons: Record<string, React.ReactNode> = {
  'Food': <Utensils size={18} />,
  'Shopping': <ShoppingCart size={18} />,
  'Entertainment': <Coffee size={18} />,
  'Housing': <Home size={18} />,
  'Transport': <Car size={18} />,
};

export const TransactionList: React.FC = () => {
  const { transactions, isLoading } = useTransactions();

  if (isLoading) return <div className="p-8 text-center opacity-50">Loading transactions...</div>;

  return (
    <div className="space-y-4">
      {transactions.length === 0 ? (
        <div className="p-12 text-center glass-card opacity-50 border-dashed">
          <p className="text-sm font-medium">No transactions found.</p>
          <p className="text-xs mt-1">Start by adding your first transaction.</p>
        </div>
      ) : (
        transactions.map((tx) => (
          <div key={tx.id} className="flex items-center justify-between p-4 glass-card hover:bg-white/5 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white/70 group-hover:scale-110 transition-transform">
                {categoryIcons[tx.category] || <MoreHorizontal size={18} />}
              </div>
              <div>
                <h4 className="font-bold text-sm">{tx.merchant}</h4>
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-black">{tx.category}</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`font-bold text-sm ${tx.amount < 0 ? 'text-red-400' : 'text-green-400'}`}>
                {tx.amount < 0 ? '-' : '+'}${Math.abs(tx.amount / 100).toFixed(2)}
              </span>
              <p className="text-[10px] text-white/30">{new Date(tx.date).toLocaleDateString()}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
