import React, { useState } from 'react';
import { Card, CardTitle } from './ui/card';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { 
  Percent, Users, Target, MousePointerClick, 
  Sparkles, Activity
} from 'lucide-react';

interface FunnelStep {
  stage: string;
  count: number;
  rate: number; // percentage of previous stage
  overallRate: number; // percentage of top stage
  icon: React.ReactNode;
}

interface ChannelData {
  name: string;
  spend: number; // in USD
  impressions: number;
  clicks: number;
  signups: number;
  customers: number;
}

export const FunnelAnalysis: React.FC = () => {
  // Base conversion variables for simulation
  const [ctrSim, setCtrSim] = useState<number>(2.4); // Click Through Rate (%)
  const [cvrSim, setCvrSim] = useState<number>(3.2); // Sign-up to Paid Customer Conversion Rate (%)
  const [avgOrderVal, setAvgOrderVal] = useState<number>(89); // Average Order Value ($)
  const [monthlySpend, setMonthlySpend] = useState<number>(12500); // Ad budget ($)

  // Funnel steps
  const baseFunnel: FunnelStep[] = [
    { stage: "Impressions", count: 250000, rate: 100, overallRate: 100, icon: <Activity size={15} /> },
    { stage: "Clicks", count: 6000, rate: 2.4, overallRate: 2.4, icon: <MousePointerClick size={15} /> },
    { stage: "Signups", count: 1800, rate: 30.0, overallRate: 0.72, icon: <Users size={15} /> },
    { stage: "Trial Starts", count: 540, rate: 30.0, overallRate: 0.22, icon: <Target size={15} /> },
    { stage: "Paid Upgrades", count: 172, rate: 31.8, overallRate: 0.07, icon: <Percent size={15} /> }
  ];

  // Calculate simulated metrics
  const simulatedClicks = Math.round((baseFunnel[0].count * ctrSim) / 100);
  const simulatedSignups = Math.round(simulatedClicks * 0.3); // 30% signup rate from click
  const simulatedTrials = Math.round(simulatedSignups * 0.3); // 30% trial rate from signup
  const simulatedCustomers = Math.round((simulatedTrials * cvrSim) / 100);
  const simulatedRevenue = simulatedCustomers * avgOrderVal;
  const simulatedRoas = monthlySpend > 0 ? (simulatedRevenue / monthlySpend).toFixed(2) : '0';
  const simulatedCac = simulatedCustomers > 0 ? (monthlySpend / simulatedCustomers).toFixed(2) : '0';

  const chartData = [
    { stage: 'Awareness (Impressions)', value: baseFunnel[0].count, fill: '#3b82f6' },
    { stage: 'Interest (Clicks)', value: simulatedClicks, fill: '#6366f1' },
    { stage: 'Consideration (Signups)', value: simulatedSignups, fill: '#8b5cf6' },
    { stage: 'Intent (Trial Starts)', value: simulatedTrials, fill: '#a855f7' },
    { stage: 'Decision (Paid Upgrades)', value: simulatedCustomers, fill: '#ec4899' },
  ];

  // Channel metrics table data
  const channels: ChannelData[] = [
    { name: "Google Paid Search", spend: 4500, impressions: 85000, clicks: 2300, signups: 690, customers: 78 },
    { name: "Meta Social Ads", spend: 5000, impressions: 112000, clicks: 2100, signups: 630, customers: 64 },
    { name: "LinkedIn Account-Based", spend: 2000, impressions: 18000, clicks: 420, signups: 126, customers: 18 },
    { name: "Newsletter Sponsorship", spend: 750, impressions: 25000, clicks: 750, signups: 260, customers: 10 },
    { name: "Organic & Referral (SEO)", spend: 250, impressions: 10000, clicks: 430, signups: 94, customers: 2 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <header>
        <h2 className="text-3xl font-bold mb-1.5 text-foreground tracking-tight">
          Funnel Analysis & Forecasting
        </h2>
        <p className="text-muted-foreground text-sm font-medium">Verify drop-off rates across stages and simulate ROAS impact from conversion changes.</p>
      </header>

      {/* Main Funnel Metrics and Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG/CSS Funnel Visualizer */}
        <Card className="lg:col-span-2 p-6 flex flex-col justify-between">
          <div>
            <CardTitle className="text-sm font-bold mb-1">Visual Acquisition Funnel</CardTitle>
            <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-black mb-6">Pipeline conversion visualization</p>
          </div>

          <div className="space-y-4">
            {chartData.map((step, index) => {
              const baseCount = chartData[0].value;
              const ratio = baseCount > 0 ? (step.value / baseCount) * 100 : 0;
              // Make width decrease down the funnel, but not drop to absolute 0
              const widthPct = Math.max(10, 100 - index * 18);
              return (
                <div key={step.stage} className="flex flex-col items-center">
                  <div 
                    style={{ width: `${widthPct}%`, backgroundColor: `${step.fill}15`, borderColor: step.fill }}
                    className="h-12 border rounded-xl flex items-center justify-between px-4 transition-all duration-300 relative overflow-hidden group hover:bg-black/15 shadow-sm"
                  >
                    {/* Inner progress bar highlighting conversion percentage */}
                    <div 
                      style={{ width: `${ratio}%`, backgroundColor: step.fill }} 
                      className="absolute left-0 top-0 bottom-0 opacity-[0.06] transition-all duration-300"
                    />
                    
                    <div className="flex items-center gap-2.5 z-10">
                      <div style={{ color: step.fill }} className="w-5 h-5 rounded-md bg-black/25 flex items-center justify-center font-bold text-xs shrink-0">
                        {index + 1}
                      </div>
                      <span className="text-xs font-bold text-foreground">{step.stage}</span>
                    </div>

                    <div className="flex items-center gap-3 z-10">
                      <span className="text-xs font-mono font-black text-foreground">{step.value.toLocaleString()}</span>
                      <Badge variant="outline" style={{ borderColor: `${step.fill}30`, color: step.fill }} className="text-[9px] font-black uppercase tracking-wider bg-black/10 py-0.5">
                        {ratio.toFixed(2)}%
                      </Badge>
                    </div>
                  </div>

                  {/* Dropdown transition indicator */}
                  {index < chartData.length - 1 && (
                    <div className="flex flex-col items-center my-0.5">
                      <div className="w-0.5 h-4 bg-muted-foreground/30 border-dashed border-l" />
                      <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest bg-black/15 px-2 py-0.5 rounded border border-border/80">
                        Conversion Outflow: {((chartData[index+1].value / step.value) * 100).toFixed(1)}%
                      </div>
                      <div className="w-0.5 h-4 bg-muted-foreground/30 border-dashed border-l" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Funnel Forecaster Simulator */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                <Sparkles size={14} />
              </div>
              <CardTitle className="text-sm font-bold">ROAS Simulator</CardTitle>
            </div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-black mt-1 mb-5">Predict outcomes based on growth rates</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-muted-foreground uppercase">Ad Budget Spend ($)</span>
                <span className="text-primary font-black">${monthlySpend.toLocaleString()}</span>
              </div>
              <Slider 
                min={1000}
                max={50000}
                step={500}
                value={[monthlySpend]}
                onValueChange={(val) => setMonthlySpend(val[0])}
                className="py-1"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-muted-foreground uppercase">Click-Through Rate (CTR)</span>
                <span className="text-indigo-400 font-black">{ctrSim}%</span>
              </div>
              <Slider 
                min={0.5}
                max={10}
                step={0.1}
                value={[ctrSim]}
                onValueChange={(val) => setCtrSim(val[0])}
                className="py-1"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-muted-foreground uppercase">Paid CVR (Trials to Paid)</span>
                <span className="text-purple-400 font-black">{cvrSim}%</span>
              </div>
              <Slider 
                min={0.5}
                max={15}
                step={0.1}
                value={[cvrSim]}
                onValueChange={(val) => setCvrSim(val[0])}
                className="py-1"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-muted-foreground uppercase">Average Customer AOV ($)</span>
                <span className="text-pink-400 font-black">${avgOrderVal}</span>
              </div>
              <Slider 
                min={10}
                max={500}
                step={5}
                value={[avgOrderVal]}
                onValueChange={(val) => setAvgOrderVal(val[0])}
                className="py-1"
              />
            </div>

            <div className="border-t border-border pt-4 mt-2 space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Simulated Customers</span>
                <span className="text-xs font-mono font-black text-foreground">{simulatedCustomers} / mo</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Acquisition Cost (CAC)</span>
                <span className="text-xs font-mono font-black text-foreground">${simulatedCac} USD</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Simulated Revenue</span>
                <span className="text-xs font-mono font-black text-foreground">${simulatedRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Forecasted ROAS</span>
                <Badge variant={Number(simulatedRoas) >= 2 ? 'success' : 'destructive'} className="text-[10px] font-black uppercase tracking-wider py-0.5 px-2">
                  {simulatedRoas}x Return
                </Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Channel Analytics Table */}
      <Card className="p-6">
        <div>
          <CardTitle className="text-sm font-bold">Marketing Acquisition Channels</CardTitle>
          <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-black mb-5">Lead source conversions</p>
        </div>

        <div className="border border-border rounded-lg overflow-hidden bg-black/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Channel Name</TableHead>
                <TableHead className="text-right w-24">Spend ($)</TableHead>
                <TableHead className="text-right w-28">Clicks</TableHead>
                <TableHead className="text-right w-24">Signups</TableHead>
                <TableHead className="text-right w-28">Customers</TableHead>
                <TableHead className="text-right w-24">CPC ($)</TableHead>
                <TableHead className="text-right w-24">CAC ($)</TableHead>
                <TableHead className="text-center w-24 pr-4">ROAS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {channels.map((chan) => {
                const cpc = chan.clicks > 0 ? (chan.spend / chan.clicks).toFixed(2) : '0';
                const cac = chan.customers > 0 ? (chan.spend / chan.customers).toFixed(2) : '0';
                const rev = chan.customers * avgOrderVal;
                const roas = chan.spend > 0 ? (rev / chan.spend).toFixed(1) : '0';
                return (
                  <TableRow key={chan.name}>
                    <TableCell className="font-bold text-foreground text-xs pl-4">{chan.name}</TableCell>
                    <TableCell className="text-right text-muted-foreground font-mono font-medium">${chan.spend.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-foreground font-mono font-bold">{chan.clicks.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-muted-foreground font-mono">{chan.signups.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-foreground font-mono font-bold">{chan.customers.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-muted-foreground font-mono">${cpc}</TableCell>
                    <TableCell className="text-right text-muted-foreground font-mono">${cac}</TableCell>
                    <TableCell className="text-center pr-4">
                      <Badge variant={Number(roas) >= 2.5 ? 'success' : Number(roas) >= 1.5 ? 'warning' : 'secondary'} className="text-[9px] font-black uppercase tracking-wider py-0.5 w-14 justify-center">
                        {roas}x
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};
