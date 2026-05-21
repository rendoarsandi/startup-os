import { useTransactions } from '../hooks/useTransactions';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = [
  '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#f43f5e',
  '#6366f1', '#ec4899', '#14b8a6', '#f97316', '#a855f7',
];

const categoryIcons: Record<string, string> = {
  Food: '🍔', Transport: '🚗', Housing: '🏠', Utilities: '💡',
  Entertainment: '🎮', Healthcare: '🏥', Savings: '💰',
  Personal: '👤', Insurance: '🛡️', Income: '💵', Other: '📦',
};

export function SpendingTrendChart() {
  const { transactions } = useTransactions();

  // Group transactions by date for the area chart
  const dailySpending = transactions
    .filter((t: any) => t.amount < 0)
    .reduce((acc: Record<string, number>, t: any) => {
      const date = new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      acc[date] = (acc[date] || 0) + Math.abs(t.amount) / 100;
      return acc;
    }, {});

  const chartData = Object.entries(dailySpending)
    .map(([date, amount]) => ({ date, amount }))
    .slice(-14); // Last 14 days

  // If no data, show demo data
  const displayData = chartData.length > 0 ? chartData : [
    { date: 'May 1', amount: 120 },
    { date: 'May 3', amount: 85 },
    { date: 'May 5', amount: 200 },
    { date: 'May 7', amount: 45 },
    { date: 'May 9', amount: 160 },
    { date: 'May 11', amount: 90 },
    { date: 'May 13', amount: 240 },
    { date: 'May 15', amount: 110 },
    { date: 'May 17', amount: 75 },
    { date: 'May 19', amount: 190 },
  ];

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={displayData}>
        <defs>
          <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis 
          dataKey="date" 
          axisLine={false} 
          tickLine={false}
          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
        />
        <YAxis 
          axisLine={false} 
          tickLine={false}
          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
          tickFormatter={(v) => `$${v}`}
        />
        <Tooltip 
          contentStyle={{ 
            background: 'rgba(15,15,25,0.95)', 
            border: '1px solid rgba(255,255,255,0.1)', 
            borderRadius: '12px',
            color: 'white',
            fontSize: '13px',
          }}
          formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Spending']}
        />
        <Area 
          type="monotone" 
          dataKey="amount" 
          stroke="#8b5cf6" 
          strokeWidth={2.5}
          fill="url(#spendGradient)" 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CategoryBreakdownChart() {
  const { transactions } = useTransactions();

  const categoryData = transactions
    .filter((t: any) => t.amount < 0)
    .reduce((acc: Record<string, number>, t: any) => {
      const cat = t.category || 'Other';
      acc[cat] = (acc[cat] || 0) + Math.abs(t.amount) / 100;
      return acc;
    }, {});

  const chartData = Object.entries(categoryData)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Demo data if empty
  const displayData = chartData.length > 0 ? chartData : [
    { name: 'Food', value: 450 },
    { name: 'Transport', value: 280 },
    { name: 'Entertainment', value: 180 },
    { name: 'Utilities', value: 150 },
    { name: 'Healthcare', value: 90 },
  ];

  return (
    <div className="flex items-center gap-6">
      <div className="w-40 h-40 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={displayData}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={70}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {displayData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ 
                background: 'rgba(15,15,25,0.95)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '12px',
                color: 'white',
                fontSize: '13px',
              }}
              formatter={(value: any) => [`$${Number(value).toFixed(2)}`, '']}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 space-y-2">
        {displayData.slice(0, 5).map((item, i) => (
          <div key={item.name} className="flex items-center gap-3">
            <div 
              className="w-2.5 h-2.5 rounded-full shrink-0" 
              style={{ background: COLORS[i % COLORS.length] }} 
            />
            <span className="text-sm text-white/60 flex-1">
              {categoryIcons[item.name] || '📦'} {item.name}
            </span>
            <span className="text-sm font-semibold">${item.value.toFixed(0)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RunwayProjectionChart({ projections = [] }: { projections: { month: string; balance: number }[] }) {
  const chartData = projections.map(p => ({
    month: p.month,
    balance: Math.round(p.balance / 100)
  }));

  // Default demo projections if empty
  const displayData = chartData.length > 0 ? chartData : [
    { month: 'May', balance: 42590 },
    { month: 'Jun', balance: 35000 },
    { month: 'Jul', balance: 28000 },
    { month: 'Aug', balance: 21000 },
    { month: 'Sep', balance: 14000 },
    { month: 'Oct', balance: 7000 },
    { month: 'Nov', balance: 0 },
  ];

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={displayData}>
        <defs>
          <linearGradient id="runwayGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis 
          dataKey="month" 
          axisLine={false} 
          tickLine={false}
          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
        />
        <YAxis 
          axisLine={false} 
          tickLine={false}
          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
          tickFormatter={(v) => `$${v.toLocaleString()}`}
        />
        <Tooltip 
          contentStyle={{ 
            background: 'rgba(15,15,25,0.95)', 
            border: '1px solid rgba(255,255,255,0.1)', 
            borderRadius: '12px',
            color: 'white',
            fontSize: '13px',
          }}
          formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Projected Cash']}
        />
        <Area 
          type="monotone" 
          dataKey="balance" 
          stroke="#f59e0b" 
          strokeWidth={2.5}
          fill="url(#runwayGradient)" 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ComparativeRunwayChart({ 
  baselineProjections = [], 
  scenarioProjections = [] 
}: { 
  baselineProjections: { month: string; balance: number }[],
  scenarioProjections: { month: string; balance: number }[]
}) {
  // Combine baseline and scenario data by month
  const chartData = baselineProjections.map((bp, idx) => {
    const sp = scenarioProjections[idx] || bp;
    return {
      month: bp.month,
      baseline: Math.round(bp.balance / 100),
      scenario: Math.round(sp.balance / 100)
    };
  });

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="baselineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="scenarioGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis 
          dataKey="month" 
          axisLine={false} 
          tickLine={false}
          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
        />
        <YAxis 
          axisLine={false} 
          tickLine={false}
          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
          tickFormatter={(v) => `$${v.toLocaleString()}`}
        />
        <Tooltip 
          contentStyle={{ 
            background: 'rgba(15,15,25,0.95)', 
            border: '1px solid rgba(255,255,255,0.1)', 
            borderRadius: '12px',
            color: 'white',
            fontSize: '13px',
          }}
          formatter={(value: any, name: any) => [
            `$${Number(value).toLocaleString()}`, 
            name === 'baseline' ? 'Baseline Cash Balance' : 'Simulated Cash Balance'
          ]}
        />
        <Legend 
          verticalAlign="top"
          height={36}
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, opacity: 0.8, color: '#fff' }}
        />
        <Area 
          name="baseline"
          type="monotone" 
          dataKey="baseline" 
          stroke="#f59e0b" 
          strokeWidth={2}
          strokeDasharray="4 4"
          fill="url(#baselineGrad)" 
        />
        <Area 
          name="scenario"
          type="monotone" 
          dataKey="scenario" 
          stroke="#10b981" 
          strokeWidth={3}
          fill="url(#scenarioGrad)" 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

