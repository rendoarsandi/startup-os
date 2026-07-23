import React, { useState } from 'react';
import { ShoppingBag, Clock, Ticket, Cpu } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { InventorySection } from './coo/InventorySection';
import { ProjectsSection } from './coo/ProjectsSection';
import { TicketsSection } from './coo/TicketsSection';
import { AutopilotSection } from './coo/AutopilotSection';

export const COOOperations: React.FC<{
  activeTab?: 'inventory' | 'projects' | 'tickets' | 'autopilot';
  onTabChange?: (tab: 'inventory' | 'projects' | 'tickets' | 'autopilot') => void;
}> = ({ activeTab: propActiveTab, onTabChange }) => {
  const [localActiveTab, setLocalActiveTab] = useState<'inventory' | 'projects' | 'tickets' | 'autopilot'>('inventory');

  const activeTab = propActiveTab || localActiveTab;
  const setActiveTab = (tab: 'inventory' | 'projects' | 'tickets' | 'autopilot') => {
    if (onTabChange) onTabChange(tab);
    else setLocalActiveTab(tab);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/50 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Operations & Resource Hub (COO)</h2>
          <p className="text-xs text-muted-foreground">Manage physical inventory, sprint deliverables, customer support, and system automations.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="inventory" className="text-xs flex items-center justify-center space-x-2">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Inventory</span>
          </TabsTrigger>
          <TabsTrigger value="projects" className="text-xs flex items-center justify-center space-x-2">
            <Clock className="w-3.5 h-3.5" />
            <span>Projects & Tasks</span>
          </TabsTrigger>
          <TabsTrigger value="tickets" className="text-xs flex items-center justify-center space-x-2">
            <Ticket className="w-3.5 h-3.5" />
            <span>Support Tickets</span>
          </TabsTrigger>
          <TabsTrigger value="autopilot" className="text-xs flex items-center justify-center space-x-2">
            <Cpu className="w-3.5 h-3.5" />
            <span>Autopilot</span>
          </TabsTrigger>
        </TabsList>

        <div className="pt-6">
          <TabsContent value="inventory"><InventorySection /></TabsContent>
          <TabsContent value="projects"><ProjectsSection /></TabsContent>
          <TabsContent value="tickets"><TicketsSection /></TabsContent>
          <TabsContent value="autopilot"><AutopilotSection /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
