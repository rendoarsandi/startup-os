import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    merchant: '',
    amount: '',
    category: 'Food',
    date: new Date().toISOString().split('T')[0],
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: Math.round(parseFloat(formData.amount) * 100), // convert to cents
          accountId: 'manual-account', // placeholder
        }),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Failed to add transaction', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md glass-card p-8 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-bold">Add Transaction</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] text-white/40 uppercase tracking-widest font-black">Merchant</label>
            <input 
              type="text" 
              required
              value={formData.merchant}
              onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
              className="w-full bg-white/5 border border-border rounded-xl p-4 focus:outline-none focus:border-primary/50 transition-all"
              placeholder="e.g. Apple Store"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] text-white/40 uppercase tracking-widest font-black">Amount ($)</label>
              <input 
                type="number" 
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full bg-white/5 border border-border rounded-xl p-4 focus:outline-none focus:border-primary/50 transition-all"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-white/40 uppercase tracking-widest font-black">Category</label>
              <select 
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-white/5 border border-border rounded-xl p-4 focus:outline-none focus:border-primary/50 transition-all appearance-none"
              >
                <option value="Food">Food</option>
                <option value="Shopping">Shopping</option>
                <option value="Transport">Transport</option>
                <option value="Housing">Housing</option>
                <option value="Entertainment">Entertainment</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-white/40 uppercase tracking-widest font-black">Date</label>
            <input 
              type="date" 
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full bg-white/5 border border-border rounded-xl p-4 focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary w-full h-14 font-bold flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Confirm Transaction'}
          </button>
        </form>
      </div>
    </div>
  );
};
