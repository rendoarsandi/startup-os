import React, { useState } from 'react';
import { Loader2, Sparkles, DollarSign, Calendar, Tag, Briefcase } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md border-border bg-card shadow-2xl relative overflow-hidden">
        {/* Decorative corner glows */}
        <div className="absolute -top-12 -left-12 w-24 h-24 rounded-full bg-primary/10 blur-xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-24 h-24 rounded-full bg-secondary/10 blur-xl pointer-events-none" />

        <DialogHeader className="mb-4 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center">
              <Sparkles size={14} className="text-primary" />
            </div>
            <DialogTitle className="text-lg font-bold tracking-tight">
              Add Transaction
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div className="space-y-1.5">
            <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-black flex items-center gap-1.5 pl-0.5">
              <Briefcase size={10} /> Merchant Name
            </label>
            <Input 
              type="text" 
              required
              value={formData.merchant}
              onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
              placeholder="e.g. Stripe, AWS, Apple Store"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-black flex items-center gap-1.5 pl-0.5">
                <DollarSign size={10} /> Amount ($)
              </label>
              <Input 
                type="number" 
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-black flex items-center gap-1.5 pl-0.5">
                <Tag size={10} /> Category
              </label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Food">Food</SelectItem>
                  <SelectItem value="Shopping">Shopping</SelectItem>
                  <SelectItem value="Transport">Transport</SelectItem>
                  <SelectItem value="Housing">Housing</SelectItem>
                  <SelectItem value="Entertainment">Entertainment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-black flex items-center gap-1.5 pl-0.5">
              <Calendar size={10} /> Transaction Date
            </label>
            <Input 
              type="date" 
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="cursor-pointer"
            />
          </div>

          <Button 
            type="submit" 
            disabled={mutation.isPending}
            className="w-full mt-2 h-11 font-bold"
          >
            {mutation.isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
            {mutation.isPending ? 'Recording...' : 'Record Transaction'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
