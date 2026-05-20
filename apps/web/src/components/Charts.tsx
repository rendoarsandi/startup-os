import { useTransactions } from '../hooks/useTransactions';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
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
          formatter={(value: number) => [`$${value.toFixed(2)}`, 'Spending']}
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
              formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
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
