import React, { useState } from 'react';
import { ShoppingBag, Plus, Loader2, AlertTriangle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  qty: number;
  rate: number;
  warehouse: string;
  reorderLevel: number;
  createdAt: string;
}

export const InventorySection: React.FC = () => {
  const queryClient = useQueryClient();
  const [itemSku, setItemSku] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemQty, setItemQty] = useState('');
  const [itemRate, setItemRate] = useState('');
  const [itemWarehouse, setItemWarehouse] = useState('Main Warehouse');
  const [isSaving, setIsSaving] = useState(false);

  const { data: inventory = [], isLoading } = useQuery<InventoryItem[]>({
    queryKey: ['inventory'],
    queryFn: async () => {
      const res = await fetch('/api/operations/inventory');
      if (!res.ok) throw new Error('Failed to fetch inventory');
      return res.json();
    }
  });

  const adjustStockMutation = useMutation({
    mutationFn: async (stockData: any) => {
      const res = await fetch('/api/operations/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stockData)
      });
      if (!res.ok) throw new Error('Failed to adjust stock');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setItemSku('');
      setItemName('');
      setItemQty('');
      setItemRate('');
    }
  });

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemSku.trim() || !itemQty) return;
    setIsSaving(true);
    const rateCents = Math.round(parseFloat(itemRate) * 100) || 0;
    try {
      await adjustStockMutation.mutateAsync({
        sku: itemSku.toUpperCase(),
        name: itemName || "Stock Adjustment Item",
        qty: parseInt(itemQty, 10),
        rate: rateCents,
        warehouse: itemWarehouse
      });
    } catch (err) {}
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 p-6 border border-border/50 bg-card rounded-xl">
          <div className="flex items-center space-x-2 mb-4">
            <ShoppingBag className="w-5 h-5 text-indigo-500" />
            <h3 className="font-semibold text-foreground">Adjust / Receive Stock</h3>
          </div>
          <form onSubmit={handleAdjustSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">SKU *</label>
              <Input
                placeholder="e.g. HW-MBP-16"
                value={itemSku}
                onChange={e => setItemSku(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Item Name</label>
              <Input
                placeholder="MacBook Pro 16 Inch"
                value={itemName}
                onChange={e => setItemName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Quantity *</label>
                <Input
                  type="number"
                  placeholder="10"
                  value={itemQty}
                  onChange={e => setItemQty(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Unit Rate ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="2499.00"
                  value={itemRate}
                  onChange={e => setItemRate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Warehouse Location</label>
              <Input
                placeholder="Main Warehouse"
                value={itemWarehouse}
                onChange={e => setItemWarehouse(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Submit Stock Receipt
            </Button>
          </form>
        </Card>

        <Card className="lg:col-span-2 p-6 border border-border/50 bg-card rounded-xl">
          <h3 className="font-semibold text-foreground mb-4">Live Inventory Register</h3>
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-6">No inventory items recorded.</TableCell>
                    </TableRow>
                  ) : (
                    inventory.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs font-semibold">{item.sku}</TableCell>
                        <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{item.warehouse}</TableCell>
                        <TableCell className="text-right font-semibold">{item.qty}</TableCell>
                        <TableCell className="text-right font-mono text-xs">${(item.rate / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-center">
                          {item.qty <= (item.reorderLevel || 10) ? (
                            <Badge variant="outline" className="bg-rose-500/10 text-rose-500 border-rose-500/20 text-xs">
                              <AlertTriangle className="w-3 h-3 mr-1 inline" /> Reorder
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs">
                              In Stock
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
