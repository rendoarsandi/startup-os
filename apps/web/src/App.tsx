import { Layout } from './components/Layout'
import { Chat } from './components/Chat'
import { TransactionList } from './components/TransactionList'
import { TransactionModal } from './components/TransactionModal'
import { useState } from 'react'

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <Layout>
      <div className="space-y-8">
        <header>
          <h2 className="text-4xl font-black mb-2">Morning, John</h2>
          <p className="text-white/50 text-lg">Your AI CFO has analyzed 12 new transactions today.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Total Balance" 
            value="$42,590.20" 
            change="+2.5%" 
            isPositive={true} 
          />
          <StatCard 
            title="Monthly Spending" 
            value="$3,240.50" 
            change="-12%" 
            isPositive={true} 
          />
          <StatCard 
            title="AI Savings Goal" 
            value="$1,200.00" 
            change="On Track" 
            isPositive={true} 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="glass-card p-8 min-h-[400px]">
              <h3 className="text-xl font-bold mb-6">Financial Overview</h3>
              <div className="h-64 flex items-center justify-center text-white/10 italic">
                Chart placeholder
              </div>
            </div>

            <div className="lg:col-span-1 space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">Recent Activity</h3>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded-md uppercase tracking-widest font-black transition-colors"
                  >
                    + Add
                  </button>
                  <button className="text-xs text-primary font-bold hover:underline text-[10px] uppercase tracking-widest">View All</button>
                </div>
              </div>
              <TransactionList key={refreshKey} />
            </div>
          </div>

          <div className="space-y-8">
            <div className="glass-card p-8">
              <h3 className="text-xl font-bold mb-6">AI Insights</h3>
              <div className="space-y-4">
                <InsightItem 
                  type="opportunity"
                  message="You could save $45/mo by switching your Netflix plan."
                />
                <InsightItem 
                  type="warning"
                  message="Unexpected $200 charge from 'AWS'. Investigate?"
                />
                <InsightItem 
                  type="success"
                  message="Your investment portfolio is up 5% this week!"
                />
              </div>
            </div>

            <div className="glass-card p-8 bg-gradient-to-br from-primary/20 to-secondary/20 border-primary/30">
              <h3 className="text-xl font-bold mb-2">Ask AI CFO</h3>
              <p className="text-white/60 text-sm mb-6">Get instant answers about your finances using Gemini AI.</p>
              <button className="btn-primary w-full">Start Conversation</button>
            </div>
          </div>
        </div>

        <Chat />
        <TransactionModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => setRefreshKey(prev => prev + 1)}
        />
      </div>
    </Layout>
  )
}

const TransactionItem = ({ merchant, date, amount, category, isPositive }: { merchant: string, date: string, amount: string, category: string, isPositive?: boolean }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center font-bold text-white/20">
        {merchant[0]}
      </div>
      <div>
        <h5 className="font-bold">{merchant}</h5>
        <p className="text-xs text-white/30">{date} • {category}</p>
      </div>
    </div>
    <div className={`font-bold ${isPositive ? 'text-green-400' : 'text-white'}`}>
      {amount}
    </div>
  </div>
)

const StatCard = ({ title, value, change, isPositive }: { title: string, value: string, change: string, isPositive: boolean }) => (
  <div className="glass-card p-6 group hover:border-primary/50 transition-all cursor-default">
    <p className="text-white/50 text-sm font-medium mb-1">{title}</p>
    <div className="flex items-end justify-between">
      <h4 className="text-2xl font-bold">{value}</h4>
      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${isPositive ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}>
        {change}
      </span>
    </div>
  </div>
)

const InsightItem = ({ type, message }: { type: 'opportunity' | 'warning' | 'success', message: string }) => {
  const colors = {
    opportunity: 'text-primary border-primary/20 bg-primary/5',
    warning: 'text-orange-400 border-orange-400/20 bg-orange-400/5',
    success: 'text-green-400 border-green-400/20 bg-green-400/5',
  }

  return (
    <div className={`p-4 rounded-xl border ${colors[type]} flex gap-4 items-center`}>
      <div className={`w-2 h-2 rounded-full shrink-0 ${type === 'opportunity' ? 'bg-primary' : type === 'warning' ? 'bg-orange-400' : 'bg-green-400'}`} />
      <p className="text-sm font-medium opacity-90">{message}</p>
    </div>
  )
}

export default App
