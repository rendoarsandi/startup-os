import React, { useState } from 'react';
import { Card, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import { useQuery } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { 
  Users, DollarSign, Award, Landmark, 
  Calculator, Plus, Minus
} from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  salary: number; // in cents
}

interface DeptSummary {
  name: string;
  count: number;
  avgSalary: number;
  outflow: number;
}

export const HRBoardroom: React.FC = () => {
  // Query actual employees list from API to calculate baseline stats dynamically
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await fetch('/api/hr/employees');
      if (!res.ok) throw new Error('Failed to fetch employees');
      return res.json();
    }
  });

  // Simulator State
  const [simDept, setSimDept] = useState<string>('Engineering');
  const [simCount, setSimCount] = useState<number>(3);
  const [simSalary, setSimSalary] = useState<number>(120000); // annual salary in USD

  // Default mock base employees if database is empty
  const baseEmployees: Employee[] = [
    { id: '1', name: 'Alice Smith', role: 'VP Engineering', department: 'Engineering', salary: 18000000 },
    { id: '2', name: 'Bob Jones', role: 'Staff Frontend Engineer', department: 'Engineering', salary: 14500000 },
    { id: '3', name: 'Charlie Brown', role: 'Senior Designer', department: 'Product', salary: 12000000 },
    { id: '4', name: 'Diana Prince', role: 'Product Manager', department: 'Product', salary: 13000000 },
    { id: '5', name: 'Evan Wright', role: 'Growth Specialist', department: 'Marketing', salary: 9500000 },
  ];

  const activeEmployees = employees.length > 0 ? employees : baseEmployees;

  // Compute departmental summaries
  const deptMap: { [key: string]: { count: number; totalSalary: number } } = {};
  activeEmployees.forEach(emp => {
    const dept = emp.department || 'Unassigned';
    if (!deptMap[dept]) {
      deptMap[dept] = { count: 0, totalSalary: 0 };
    }
    deptMap[dept].count += 1;
    deptMap[dept].totalSalary += emp.salary;
  });

  const deptSummaries: DeptSummary[] = Object.keys(deptMap).map(name => ({
    name,
    count: deptMap[name].count,
    avgSalary: Math.round(deptMap[name].totalSalary / deptMap[name].count / 100),
    outflow: Math.round(deptMap[name].totalSalary / 100 / 12)
  }));

  // Summary Metrics
  const totalHeadcount = activeEmployees.length;
  const totalPayrollCents = activeEmployees.reduce((sum, e) => sum + e.salary, 0);
  const avgSalaryUSD = totalHeadcount > 0 ? Math.round(totalPayrollCents / totalHeadcount / 100) : 0;
  const monthlyPayrollOutflow = Math.round(totalPayrollCents / 100 / 12);

  // Simulation calculations
  const simAddedOutflowMonthly = Math.round((simCount * simSalary) / 12);
  const simNewTotalHeadcount = totalHeadcount + simCount;
  const simNewMonthlyOutflow = monthlyPayrollOutflow + simAddedOutflowMonthly;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <header>
        <h2 className="text-3xl font-bold mb-1.5 text-foreground tracking-tight">
          People Ops Boardroom
        </h2>
        <p className="text-muted-foreground text-sm font-medium">Verify employee salary bands, corporate headcount distributions, and run recruitment budget projections.</p>
      </header>

      {/* Corporate Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 hover:border-emerald-500/20 transition-all cursor-default relative overflow-hidden group">
          <div className="absolute -right-3 -top-3 w-14 h-14 rounded-full bg-emerald-500/5 group-hover:scale-105 transition-transform flex items-center justify-center border border-border/30">
            <Users size={18} className="text-emerald-400" />
          </div>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2">Corporate Headcount</p>
          <h4 className="text-2xl font-black tracking-tight text-foreground">{totalHeadcount} Employees</h4>
          <Badge variant="success" className="text-[9px] font-black uppercase tracking-wider mt-3.5">
            Active Roster
          </Badge>
          <p className="text-[9px] text-muted-foreground/60 mt-2.5 uppercase tracking-widest font-black">All active full-time roles</p>
        </Card>

        <Card className="p-5 hover:border-emerald-500/20 transition-all cursor-default relative overflow-hidden group">
          <div className="absolute -right-3 -top-3 w-14 h-14 rounded-full bg-emerald-500/5 group-hover:scale-105 transition-transform flex items-center justify-center border border-border/30">
            <DollarSign size={18} className="text-emerald-400" />
          </div>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2">Average Base Pay</p>
          <h4 className="text-2xl font-black tracking-tight text-foreground">${avgSalaryUSD.toLocaleString()} USD</h4>
          <Badge variant="success" className="text-[9px] font-black uppercase tracking-wider mt-3.5">
            Avg Salary
          </Badge>
          <p className="text-[9px] text-muted-foreground/60 mt-2.5 uppercase tracking-widest font-black">Per annum base pay average</p>
        </Card>

        <Card className="p-5 hover:border-emerald-500/20 transition-all cursor-default relative overflow-hidden group">
          <div className="absolute -right-3 -top-3 w-14 h-14 rounded-full bg-emerald-500/5 group-hover:scale-105 transition-transform flex items-center justify-center border border-border/30">
            <Landmark size={18} className="text-emerald-400" />
          </div>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2">Monthly Outflow</p>
          <h4 className="text-2xl font-black tracking-tight text-foreground">${monthlyPayrollOutflow.toLocaleString()} / mo</h4>
          <Badge variant="outline" className="text-[9px] font-black uppercase tracking-wider mt-3.5 text-emerald-400 border-emerald-500/20 bg-emerald-500/5">
            Fully Funded
          </Badge>
          <p className="text-[9px] text-muted-foreground/60 mt-2.5 uppercase tracking-widest font-black">Monthly cash payroll total</p>
        </Card>

        <Card className="p-5 hover:border-emerald-500/20 transition-all cursor-default relative overflow-hidden group">
          <div className="absolute -right-3 -top-3 w-14 h-14 rounded-full bg-emerald-500/5 group-hover:scale-105 transition-transform flex items-center justify-center border border-border/30">
            <Award size={18} className="text-emerald-400" />
          </div>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2">Hiring NPS Score</p>
          <h4 className="text-2xl font-black tracking-tight text-foreground">78 / 100</h4>
          <Badge variant="success" className="text-[9px] font-black uppercase tracking-wider mt-3.5">
            Excellent
          </Badge>
          <p className="text-[9px] text-muted-foreground/60 mt-2.5 uppercase tracking-widest font-black">Quarterly candidate score</p>
        </Card>
      </div>

      {/* Department Summaries & Expansion Forecaster */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Breakdowns table */}
        <Card className="lg:col-span-2 p-6 flex flex-col justify-between">
          <div>
            <CardTitle className="text-sm font-bold mb-1">Corporate Department Breakdown</CardTitle>
            <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-black mb-5">Department headcount allocation</p>
          </div>

          <div className="border border-border rounded-lg overflow-hidden bg-black/10">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Department Name</TableHead>
                  <TableHead className="text-right w-24">Employees</TableHead>
                  <TableHead className="text-right w-32">Avg Salary (Annum)</TableHead>
                  <TableHead className="text-right w-32 pr-4">Monthly Outflow</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deptSummaries.map((dept) => (
                  <TableRow key={dept.name}>
                    <TableCell className="font-bold text-foreground text-xs pl-4">{dept.name}</TableCell>
                    <TableCell className="text-right text-foreground font-mono font-bold">{dept.count} FTE</TableCell>
                    <TableCell className="text-right text-muted-foreground font-mono">${dept.avgSalary.toLocaleString()} USD</TableCell>
                    <TableCell className="text-right font-bold text-foreground font-mono pr-4">${dept.outflow.toLocaleString()} / mo</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Headcount Simulator */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Calculator size={14} />
              </div>
              <CardTitle className="text-sm font-bold">Hiring Projector</CardTitle>
            </div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-black mt-1 mb-5">Simulate cost of expanding the team</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Expansion Department</label>
              <select 
                value={simDept}
                onChange={(e) => setSimDept(e.target.value)}
                className="w-full text-xs h-9 font-bold tracking-wider rounded-lg border border-border bg-black/10 px-2 uppercase text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="Engineering">Engineering</option>
                <option value="Product">Product</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
                <option value="People & Culture">People & Culture</option>
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-muted-foreground uppercase">Number of Hires</span>
                <span className="text-emerald-400 font-black">{simCount} FTE</span>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 rounded-md" 
                  onClick={() => setSimCount(c => Math.max(1, c - 1))}
                >
                  <Minus size={12} />
                </Button>
                <Slider 
                  min={1}
                  max={20}
                  step={1}
                  value={[simCount]}
                  onValueChange={(val) => setSimCount(val[0])}
                  className="flex-1"
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 rounded-md" 
                  onClick={() => setSimCount(c => Math.min(20, c + 1))}
                >
                  <Plus size={12} />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-muted-foreground uppercase">Average Annual Salary</span>
                <span className="text-emerald-400 font-black">${simSalary.toLocaleString()} USD</span>
              </div>
              <Slider 
                min={40000}
                max={250000}
                step={5000}
                value={[simSalary]}
                onValueChange={(val) => setSimSalary(val[0])}
                className="py-1"
              />
            </div>

            <div className="border-t border-border pt-4 mt-2 space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Additional Outflow</span>
                <span className="text-xs font-mono font-black text-foreground">+${simAddedOutflowMonthly.toLocaleString()} / mo</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Projected Headcount</span>
                <span className="text-xs font-mono font-black text-foreground">{simNewTotalHeadcount} FTE</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-border/40">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Projected Outflow</span>
                <span className="text-xs font-mono font-black text-foreground">${simNewMonthlyOutflow.toLocaleString()} / mo</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
