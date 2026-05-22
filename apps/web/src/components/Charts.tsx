import { useTransactions } from '../hooks/useTransactions';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const COLORS = [
  '#00E5FF', // Cyber Cyan
  '#9D4EDD', // Amethyst Purple
  '#FF5E36', // Hyper Coral
  '#00FF87', // Emerald Mint
  '#FF007F', // Neon Hot Pink
  '#00E5FF', // Cyber Teal
  '#FFB703', // Solar Gold
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#A855F7', // Lavender
];

const categoryIcons: Record<string, string> = {
  Food: '🍔', Transport: '🚗', Housing: '🏠', Utilities: '💡',
  Entertainment: '🎮', Healthcare: '🏥', Savings: '💰',
  Personal: '👤', Insurance: '🛡️', Income: '💵', Other: '📦',
};

const customTooltipStyle: React.CSSProperties = {
  background: 'rgba(8, 7, 16, 0.75)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '16px',
  color: 'white',
  fontSize: '11px',
  fontFamily: 'Outfit, sans-serif',
  fontWeight: 600,
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
  padding: '12px 16px',
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
      <AreaChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00E5FF" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#9D4EDD" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis 
          dataKey="date" 
          axisLine={false} 
          tickLine={false}
          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'Outfit' }}
        />
        <YAxis 
          axisLine={false} 
          tickLine={false}
          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'Outfit' }}
          tickFormatter={(v) => `$${v}`}
        />
        <Tooltip 
          contentStyle={customTooltipStyle}
          formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Spending']}
        />
        <Area 
          type="monotone" 
          dataKey="amount" 
          stroke="#00E5FF" 
          strokeWidth={2}
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
      <div className="w-36 h-36 shrink-0 relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={displayData}
              cx="50%"
              cy="50%"
              innerRadius={42}
              outerRadius={62}
              paddingAngle={4}
              dataKey="value"
              strokeWidth={0}
            >
              {displayData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={customTooltipStyle}
              formatter={(value: any) => [`$${Number(value).toFixed(2)}`, '']}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] text-white/35 font-bold uppercase tracking-wider">Total</span>
          <span className="text-sm font-black text-white/90 leading-tight">
            ${displayData.reduce((sum, item) => sum + item.value, 0).toFixed(0)}
          </span>
        </div>
      </div>
      <div className="flex-1 space-y-2 max-h-[144px] overflow-y-auto pr-1">
        {displayData.slice(0, 5).map((item, i) => (
          <div key={item.name} className="flex items-center gap-3">
            <div 
              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-[0_0_6px_rgba(255,255,255,0.05)]" 
              style={{ background: COLORS[i % COLORS.length] }} 
            />
            <span className="text-xs text-white/50 flex-1 font-semibold">
              {categoryIcons[item.name] || '📦'} {item.name}
            </span>
            <span className="text-xs font-bold text-white/80">${item.value.toFixed(0)}</span>
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
      <AreaChart data={displayData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="runwayGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9D4EDD" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#9D4EDD" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis 
          dataKey="month" 
          axisLine={false} 
          tickLine={false}
          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'Outfit' }}
        />
        <YAxis 
          axisLine={false} 
          tickLine={false}
          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'Outfit' }}
          tickFormatter={(v) => `$${v.toLocaleString()}`}
        />
        <Tooltip 
          contentStyle={customTooltipStyle}
          formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Projected Cash']}
        />
        <Area 
          type="monotone" 
          dataKey="balance" 
          stroke="#9D4EDD" 
          strokeWidth={2}
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
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
        <defs>
          <linearGradient id="baselineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF5E36" stopOpacity={0.12} />
            <stop offset="100%" stopColor="#FF5E36" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="scenarioGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00FF87" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#00FF87" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis 
          dataKey="month" 
          axisLine={false} 
          tickLine={false}
          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'Outfit' }}
        />
        <YAxis 
          axisLine={false} 
          tickLine={false}
          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'Outfit' }}
          tickFormatter={(v) => `$${v.toLocaleString()}`}
        />
        <Tooltip 
          contentStyle={customTooltipStyle}
          formatter={(value: any, name: any) => [
            `$${Number(value).toLocaleString()}`, 
            name === 'baseline' ? 'Baseline Cash' : 'Simulated Cash'
          ]}
        />
        <Area 
          name="baseline"
          type="monotone" 
          dataKey="baseline" 
          stroke="#FF5E36" 
          strokeWidth={2}
          strokeDasharray="4 4"
          fill="url(#baselineGrad)" 
        />
        <Area 
          name="scenario"
          type="monotone" 
          dataKey="scenario" 
          stroke="#00FF87" 
          strokeWidth={2.5}
          fill="url(#scenarioGrad)" 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

