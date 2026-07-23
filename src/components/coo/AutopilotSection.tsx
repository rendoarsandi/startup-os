import React, { useState } from 'react';
import { Cpu, Play, Plus, Loader2, Trash2, CheckCircle2 } from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

export interface Employee {
  id: string;
  name: string;
  role: string;
}

export const AutopilotSection: React.FC = () => {
  const queryClient = useQueryClient();
  const [isRuleOpen, setIsRuleOpen] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [ruleTriggerType, setRuleTriggerType] = useState<'runway_low' | 'low_stock' | 'high_priority_ticket' | 'mrr_surge'>('runway_low');
  const [ruleTriggerValue, setRuleTriggerValue] = useState('6');
  const [ruleActionType, setRuleActionType] = useState<'ai_audit' | 'auto_task' | 'ai_reply' | 'webhook_alert'>('ai_audit');
  const [ruleActionTarget, setRuleActionTarget] = useState('');
  const [executionLogs, setExecutionLogs] = useState<any[]>([]);
  const [isRunningChecks, setIsRunningChecks] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { data: employees = [] } = useQuery<Employee[]>({ queryKey: ['employees'] });

  const { data: autopilotRulesList = [], isLoading } = useQuery<any[]>({
    queryKey: ['autopilotRules'],
    queryFn: async () => {
      const res = await fetch('/api/operations/autopilot');
      if (!res.ok) throw new Error('Failed to fetch autopilot rules');
      return res.json();
    }
  });

  const saveRuleMutation = useMutation({
    mutationFn: async (ruleData: any) => {
      const res = await fetch('/api/operations/autopilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleData)
      });
      if (!res.ok) throw new Error('Failed to save autopilot rule');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['autopilotRules'] });
      setIsRuleOpen(false);
      setRuleName('');
      setRuleTriggerValue('6');
      setRuleActionTarget('');
    }
  });

  const toggleRuleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const res = await fetch(`/api/operations/autopilot/${id}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active })
      });
      if (!res.ok) throw new Error('Failed to toggle rule');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['autopilotRules'] });
    }
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/operations/autopilot/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete rule');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['autopilotRules'] });
    }
  });

  const handleRuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) return;
    setIsSaving(true);
    try {
      await saveRuleMutation.mutateAsync({
        name: ruleName,
        triggerType: ruleTriggerType,
        triggerValue: ruleTriggerValue,
        actionType: ruleActionType,
        actionTarget: ruleActionTarget,
        active: true
      });
    } catch (err) {}
    setIsSaving(false);
  };

  const handleRunChecks = async () => {
    setIsRunningChecks(true);
    try {
      const res = await fetch('/api/operations/autopilot/run-checks', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.logs) {
          setExecutionLogs(data.logs);
        }
      }
    } catch (err) {}
    setIsRunningChecks(false);
    queryClient.invalidateQueries({ queryKey: ['autopilotRules'] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg text-foreground">Autopilot Autonomous Rules Engine</h3>
          <p className="text-xs text-muted-foreground">Configure autonomous rules triggered by operational, financial, or support conditions.</p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={handleRunChecks} disabled={isRunningChecks} variant="outline" className="text-xs">
            {isRunningChecks ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Play className="w-3.5 h-3.5 mr-1" />}
            Run Autonomous Checks
          </Button>
          <Button onClick={() => setIsRuleOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
            <Plus className="w-3.5 h-3.5 mr-1" /> Create Rule
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 border border-border/50 bg-card rounded-xl">
          <h4 className="font-semibold text-sm text-foreground mb-4">Active Rules ({autopilotRulesList.length})</h4>
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : autopilotRulesList.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">No rules configured yet.</p>
          ) : (
            <div className="space-y-3">
              {autopilotRulesList.map((rule: any) => (
                <div key={rule.id} className="p-4 border rounded-xl bg-muted/30 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Cpu className="w-4 h-4 text-indigo-500" />
                      <p className="font-medium text-sm text-foreground">{rule.name}</p>
                      <Badge variant="outline" className={rule.active ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-500/10 text-slate-500"}>
                        {rule.active ? "Active" : "Disabled"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Trigger: <span className="font-mono">{rule.triggerType}</span> | Action: <span className="font-mono">{rule.actionType}</span></p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="ghost" className="text-xs" onClick={() => toggleRuleMutation.mutate({ id: rule.id, active: !rule.active })}>
                      {rule.active ? "Pause" : "Enable"}
                    </Button>
                    <Button size="sm" variant="ghost" className="text-xs text-rose-500 hover:text-rose-600" onClick={() => deleteRuleMutation.mutate(rule.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6 border border-border/50 bg-card rounded-xl">
          <h4 className="font-semibold text-sm text-foreground mb-4">Execution Audit Trail</h4>
          {executionLogs.length === 0 ? (
            <div className="text-xs text-muted-foreground py-8 text-center border border-dashed rounded-lg">
              No recent audit logs. Click "Run Autonomous Checks" to execute rules engine.
            </div>
          ) : (
            <div className="space-y-3">
              {executionLogs.map((log, idx) => (
                <div key={idx} className="p-3 border rounded-lg bg-muted/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-xs text-foreground flex items-center">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-1.5" />
                      {log.name}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{log.actionTaken}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Dialog open={isRuleOpen} onOpenChange={setIsRuleOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Autonomous Rule</DialogTitle></DialogHeader>
          <form onSubmit={handleRuleSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium mb-1">Rule Name *</label>
              <Input placeholder="Auto-restock Low Stock SKUs" value={ruleName} onChange={e => setRuleName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Trigger Condition</label>
              <Select value={ruleTriggerType} onValueChange={(v: any) => setRuleTriggerType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="runway_low">Cash Runway &lt; X months</SelectItem>
                  <SelectItem value="low_stock">Inventory Stock &lt; X items</SelectItem>
                  <SelectItem value="high_priority_ticket">High Priority Support Ticket Received</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Threshold Value</label>
              <Input placeholder="6" value={ruleTriggerValue} onChange={e => setRuleTriggerValue(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Autonomous Action</label>
              <Select value={ruleActionType} onValueChange={(v: any) => setRuleActionType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ai_audit">Trigger AI CFO Burn Audit</SelectItem>
                  <SelectItem value="auto_task">Automatically Generate Purchase Task</SelectItem>
                  <SelectItem value="ai_reply">AI Auto-reply to Support Ticket</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {ruleActionType === 'auto_task' && (
              <div>
                <label className="block text-xs font-medium mb-1">Assign Task To</label>
                <Select value={ruleActionTarget} onValueChange={setRuleActionTarget}>
                  <SelectTrigger><SelectValue placeholder="Select Employee" /></SelectTrigger>
                  <SelectContent>
                    {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Save Autonomous Rule
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
