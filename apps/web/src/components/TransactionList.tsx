import React, { useState, useMemo } from 'react';
import { 
  Utensils, ShoppingBag, Gamepad2, Home, Car, MoreHorizontal, 
  ArrowUpRight, ArrowDownLeft, Calendar, ArrowUpDown, Search, Sparkles
} from 'lucide-react';
import { useTransactions } from '../hooks/useTransactions';
import type { Transaction } from '../hooks/useTransactions';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import type { SortingState } from '@tanstack/react-table';

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

const columnHelper = createColumnHelper<Transaction>();

export const TransactionList: React.FC = () => {
  const { transactions, isLoading } = useTransactions();
  const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }]);
  const [search, setSearch] = useState('');

  // Local Search Filtering
  const filteredData = useMemo(() => {
    return transactions.filter(tx => 
      tx.merchant.toLowerCase().includes(search.toLowerCase()) ||
      tx.category.toLowerCase().includes(search.toLowerCase())
    );
  }, [transactions, search]);

  const columns = useMemo(() => [
    columnHelper.accessor('category', {
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="flex items-center gap-1 hover:text-foreground transition-colors uppercase text-[10px] tracking-wider font-black text-muted-foreground/70"
        >
          Category
          <ArrowUpDown size={10} className="ml-1 text-muted-foreground/40" />
        </button>
      ),
      cell: (info) => {
        const category = info.getValue();
        const categoryStyle = categoryClasses[category] || 'bg-slate-500/5 border-slate-500/10 text-slate-400';
        const icon = categoryIcons[category] || <MoreHorizontal size={14} className="text-slate-400" />;
        return (
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-transform duration-200 hover:scale-105 ${categoryStyle}`}>
              {icon}
            </div>
            <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0 ${categoryStyle}`}>
              {category}
            </Badge>
          </div>
        );
      }
    }),
    columnHelper.accessor('merchant', {
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="flex items-center gap-1 hover:text-foreground transition-colors uppercase text-[10px] tracking-wider font-black text-muted-foreground/70"
        >
          Merchant
          <ArrowUpDown size={10} className="ml-1 text-muted-foreground/40" />
        </button>
      ),
      cell: (info) => (
        <span className="font-bold text-sm text-foreground transition-colors">
          {info.getValue()}
        </span>
      )
    }),
    columnHelper.accessor('date', {
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="flex items-center gap-1 hover:text-foreground transition-colors uppercase text-[10px] tracking-wider font-black text-muted-foreground/70"
        >
          Date
          <ArrowUpDown size={10} className="ml-1 text-muted-foreground/40" />
        </button>
      ),
      cell: (info) => {
        const date = info.getValue();
        return (
          <span className="text-[10px] text-muted-foreground flex items-center gap-1.5 font-medium">
            <Calendar size={11} className="text-muted-foreground/60" />
            {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        );
      }
    }),
    columnHelper.accessor('amount', {
      header: ({ column }) => (
        <div className="text-right w-full">
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors uppercase text-[10px] tracking-wider font-black text-muted-foreground/70"
          >
            Amount
            <ArrowUpDown size={10} className="ml-1 text-muted-foreground/40" />
          </button>
        </div>
      ),
      cell: (info) => {
        const amount = info.getValue();
        const isExpense = amount < 0;
        return (
          <div className="flex items-center justify-end gap-3 text-right">
            <div>
              <span className={`font-black text-sm tracking-tight ${isExpense ? 'text-rose-400' : 'text-emerald-400'}`}>
                {isExpense ? '-' : '+'}${Math.abs(amount / 100).toFixed(2)}
              </span>
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black mt-0.5">
                {isExpense ? 'debit' : 'credit'}
              </p>
            </div>
            <div className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all ${
              isExpense ? 'bg-rose-500/5 border-rose-500/10 text-rose-400' : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400'
            }`}>
              {isExpense ? <ArrowDownLeft size={13} /> : <ArrowUpRight size={13} />}
            </div>
          </div>
        );
      }
    })
  ], []);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

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
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={14} />
        <Input
          type="text"
          placeholder="Filter transactions by merchant or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10 border-border bg-black/10 focus-visible:ring-primary/30 text-xs font-medium"
        />
        {search && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-primary/80 animate-fade-in">
            <Sparkles size={10} className="animate-pulse" /> {filteredData.length} matches
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className="border border-border/50 rounded-xl overflow-hidden bg-black/5 backdrop-blur-md">
        {filteredData.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-semibold text-muted-foreground">No transactions found.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Try modifying your search or add custom transactions.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id} className="border-b border-border/40 bg-white/[0.02]">
                    {headerGroup.headers.map(header => (
                      <th key={header.id} className="p-3.5 first:pl-4 last:pr-4 font-black">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-border/30">
                {table.getRowModel().rows.map(row => (
                  <tr 
                    key={row.id} 
                    className="hover:bg-white/[0.01] transition-colors duration-150 group"
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="p-3.5 first:pl-4 last:pr-4 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
