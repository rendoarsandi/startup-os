import React from 'react';
import { Loader2, Sparkles, DollarSign, Calendar, Tag, Briefcase } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
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
  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const response = await fetch('/api/accounts');
      if (!response.ok) throw new Error('Failed to load accounts');
      return response.json() as Promise<{ id: string }[]>;
    },
  });

  const mutation = useMutation({
    mutationFn: async (value: { merchant: string; amount: string; category: string; date: string }) => {
      const accountId = accounts[0]?.id;
      if (!accountId) throw new Error('Create an account before adding a transaction');
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant: value.merchant,
          category: value.category,
          date: value.date,
          amount: Math.round(parseFloat(value.amount) * 100), // convert to cents
          accountId,
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
      // Reset the form
      form.reset();
    },
  });

  // Initialize TanStack Form
  const form = useForm({
    defaultValues: {
      merchant: '',
      amount: '',
      category: 'Food',
      date: new Date().toISOString().split('T')[0],
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(value);
    },
  });

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

        <form 
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }} 
          className="space-y-4 relative z-10"
        >
          {/* Merchant Field */}
          <form.Field
            name="merchant"
            validators={{
              onChange: ({ value }) => !value ? 'Merchant name is required' : undefined,
            }}
            children={(field) => (
              <div className="space-y-1.5">
                <label htmlFor={field.name} className="text-[10px] text-muted-foreground uppercase tracking-widest font-black flex items-center gap-1.5 pl-0.5">
                  <Briefcase size={10} /> Merchant Name
                </label>
                <Input 
                  id={field.name}
                  type="text" 
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="e.g. Stripe, AWS, Apple Store"
                />
                {field.state.meta.errors.length > 0 ? (
                  <p className="text-[10px] text-rose-400 font-bold tracking-tight mt-1">
                    {field.state.meta.errors.join(', ')}
                  </p>
                ) : null}
              </div>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            {/* Amount Field */}
            <form.Field
              name="amount"
              validators={{
                onChange: ({ value }) => {
                  if (!value) return 'Amount is required';
                  const parsed = parseFloat(value);
                  if (isNaN(parsed) || parsed <= 0) return 'Must be a positive number';
                  return undefined;
                }
              }}
              children={(field) => (
                <div className="space-y-1.5">
                  <label htmlFor={field.name} className="text-[10px] text-muted-foreground uppercase tracking-widest font-black flex items-center gap-1.5 pl-0.5">
                    <DollarSign size={10} /> Amount ($)
                  </label>
                  <Input 
                    id={field.name}
                    type="number" 
                    step="0.01"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="0.00"
                  />
                  {field.state.meta.errors.length > 0 ? (
                    <p className="text-[10px] text-rose-400 font-bold tracking-tight mt-1">
                      {field.state.meta.errors.join(', ')}
                    </p>
                  ) : null}
                </div>
              )}
            />

            {/* Category Field */}
            <form.Field
              name="category"
              validators={{
                onChange: ({ value }) => !value ? 'Category is required' : undefined,
              }}
              children={(field) => (
                <div className="space-y-1.5">
                  <label htmlFor={field.name} className="text-[10px] text-muted-foreground uppercase tracking-widest font-black flex items-center gap-1.5 pl-0.5">
                    <Tag size={10} /> Category
                  </label>
                  <Select 
                    value={field.state.value} 
                    onValueChange={(value) => field.handleChange(value)}
                  >
                    <SelectTrigger id={field.name}>
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
                  {field.state.meta.errors.length > 0 ? (
                    <p className="text-[10px] text-rose-400 font-bold tracking-tight mt-1">
                      {field.state.meta.errors.join(', ')}
                    </p>
                  ) : null}
                </div>
              )}
            />
          </div>

          {/* Date Field */}
          <form.Field
            name="date"
            validators={{
              onChange: ({ value }) => !value ? 'Date is required' : undefined,
            }}
            children={(field) => (
              <div className="space-y-1.5">
                <label htmlFor={field.name} className="text-[10px] text-muted-foreground uppercase tracking-widest font-black flex items-center gap-1.5 pl-0.5">
                  <Calendar size={10} /> Transaction Date
                </label>
                <Input 
                  id={field.name}
                  type="date" 
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className="cursor-pointer"
                />
                {field.state.meta.errors.length > 0 ? (
                  <p className="text-[10px] text-rose-400 font-bold tracking-tight mt-1">
                    {field.state.meta.errors.join(', ')}
                  </p>
                ) : null}
              </div>
            )}
          />

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
