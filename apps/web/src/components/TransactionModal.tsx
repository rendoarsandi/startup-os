import React, { useState } from 'react';
import { X, Loader2, Sparkles, DollarSign, Calendar, Tag, Briefcase } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    merchant: '',
    amount: '',
    category: 'Food',
    date: new Date().toISOString().split('T')[0],
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: Math.round(parseFloat(formData.amount) * 100), // convert to cents
          accountId: 'manual-account', // placeholder
        }),
      });

      if (!response.ok) throw new Error('Failed to add transaction');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      if (onSuccess) onSuccess();
      onClose();
      // Reset form
      setFormData({
        merchant: '',
        amount: '',
        category: 'Food',
        date: new Date().toISOString().split('T')[0],
      });
    },
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-md glass-card p-7 shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-300 relative overflow-hidden">
        {/* Decorative corner glows */}
        <div className="absolute -top-12 -left-12 w-24 h-24 rounded-full bg-primary/10 blur-xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-24 h-24 rounded-full bg-secondary/10 blur-xl pointer-events-none" />

        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-inner">
              <Sparkles size={16} className="text-white" />
            </div>
            <h3 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              Add Transaction
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div className="space-y-1.5">
            <label className="text-[10px] text-white/40 uppercase tracking-widest font-black flex items-center gap-1.5">
              <Briefcase size={10} /> Merchant Name
            </label>
            <input 
              type="text" 
              required
              value={formData.merchant}
              onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
              className="glass-input"
              placeholder="e.g. Stripe, AWS, Apple Store"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-white/40 uppercase tracking-widest font-black flex items-center gap-1.5">
                <DollarSign size={10} /> Amount ($)
              </label>
              <input 
                type="number" 
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="glass-input"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-white/40 uppercase tracking-widest font-black flex items-center gap-1.5">
                <Tag size={10} /> Category
              </label>
              <div className="relative">
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="glass-input appearance-none cursor-pointer pr-8"
                >
                  <option value="Food">Food</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Transport">Transport</option>
                  <option value="Housing">Housing</option>
                  <option value="Entertainment">Entertainment</option>
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/30 text-xs">
                  ▼
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-white/40 uppercase tracking-widest font-black flex items-center gap-1.5">
              <Calendar size={10} /> Transaction Date
            </label>
            <input 
              type="date" 
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="glass-input cursor-pointer"
            />
          </div>

          <button 
            type="submit" 
            disabled={mutation.isPending}
            className="btn-primary w-full h-12 font-bold flex items-center justify-center gap-2 mt-2 relative z-10 cursor-pointer"
          >
            {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Record Transaction'}
          </button>
        </form>
      </div>
    </div>
  );
};
