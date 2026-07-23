import React, { useState } from 'react';
import { Ticket, Plus, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

export interface SupportTicket {
  id: string;
  customerName: string;
  subject: string;
  description: string;
  status: 'open' | 'replied' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

export const TicketsSection: React.FC = () => {
  const queryClient = useQueryClient();
  const [tCustomer, setTCustomer] = useState('');
  const [tSubject, setTSubject] = useState('');
  const [tDesc, setTDesc] = useState('');
  const [tPriority, setTPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [isSaving, setIsSaving] = useState(false);

  const { data: tickets = [], isLoading } = useQuery<SupportTicket[]>({
    queryKey: ['tickets'],
    queryFn: async () => {
      const res = await fetch('/api/operations/tickets');
      if (!res.ok) throw new Error('Failed to fetch tickets');
      return res.json();
    }
  });

  const createTicketMutation = useMutation({
    mutationFn: async (ticketData: any) => {
      const res = await fetch('/api/operations/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketData)
      });
      if (!res.ok) throw new Error('Failed to create ticket');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setTCustomer('');
      setTSubject('');
      setTDesc('');
    }
  });

  const ticketStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/operations/tickets/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to update ticket');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    }
  });

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tCustomer.trim() || !tSubject.trim()) return;
    setIsSaving(true);
    try {
      await createTicketMutation.mutateAsync({
        customerName: tCustomer,
        subject: tSubject,
        description: tDesc,
        priority: tPriority
      });
    } catch (err) {}
    setIsSaving(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1 p-6 border border-border/50 bg-card rounded-xl">
        <div className="flex items-center space-x-2 mb-4">
          <Ticket className="w-5 h-5 text-indigo-500" />
          <h3 className="font-semibold text-foreground">Log Support Ticket</h3>
        </div>
        <form onSubmit={handleTicketSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Customer / Account *</label>
            <Input placeholder="Acme Corp" value={tCustomer} onChange={e => setTCustomer(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Subject *</label>
            <Input placeholder="Webhook latency spike" value={tSubject} onChange={e => setTSubject(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Priority</label>
            <Select value={tPriority} onValueChange={(val: any) => setTPriority(val)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
            <Input placeholder="Details of issue..." value={tDesc} onChange={e => setTDesc(e.target.value)} />
          </div>
          <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            Log Ticket
          </Button>
        </form>
      </Card>

      <Card className="lg:col-span-2 p-6 border border-border/50 bg-card rounded-xl">
        <h3 className="font-semibold text-foreground mb-4">Support & Incident Tickets</h3>
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-center">Priority</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-6">No support tickets logged.</TableCell>
                  </TableRow>
                ) : (
                  tickets.map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.customerName}</TableCell>
                      <TableCell>
                        <p className="font-medium text-foreground text-xs">{t.subject}</p>
                        <p className="text-muted-foreground text-[11px] line-clamp-1">{t.description}</p>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={`text-xs ${
                          t.priority === 'high' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                          t.priority === 'medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                          'bg-slate-500/10 text-slate-500 border-slate-500/20'
                        }`}>
                          {t.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Select value={t.status} onValueChange={status => ticketStatusMutation.mutate({ id: t.id, status })}>
                          <SelectTrigger className="h-6 text-[10px] w-[100px] bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="replied">Replied</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                          </SelectContent>
                        </Select>
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
  );
};
