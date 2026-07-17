import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Landmark, Rocket, Building, Zap, CheckCircle2, ShieldAlert, Sparkles, Link2 } from 'lucide-react';

interface PlaidLinkProps {
  onSuccess?: () => void;
}

const INSTITUTIONS = [
  {
    key: 'chase',
    name: 'Chase Bank',
    desc: 'Chase Business Checking, Savings & Ink Credit Card',
    colors: {
      border: 'border-blue-500/20 hover:border-blue-500/50',
      bg: 'bg-blue-500/5 hover:bg-blue-500/10',
      icon: 'text-blue-400',
    },
    icon: <Landmark size={22} />,
  },
  {
    key: 'svb',
    name: 'Silicon Valley Bank',
    desc: 'SVB Operating Checking & MM Savings',
    colors: {
      border: 'border-emerald-500/20 hover:border-emerald-500/50',
      bg: 'bg-emerald-500/5 hover:bg-emerald-500/10',
      icon: 'text-emerald-400',
    },
    icon: <Rocket size={22} />,
  },
  {
    key: 'bofa',
    name: 'Bank of America',
    desc: 'BofA Business Checking & Business Credit Card',
    colors: {
      border: 'border-rose-500/20 hover:border-rose-500/50',
      bg: 'bg-rose-500/5 hover:bg-rose-500/10',
      icon: 'text-rose-400',
    },
    icon: <Building size={22} />,
  },
  {
    key: 'mercury',
    name: 'Mercury',
    desc: 'Mercury Modern Startup Checking & Treasury',
    colors: {
      border: 'border-amber-500/20 hover:border-amber-500/50',
      bg: 'bg-amber-500/5 hover:bg-amber-500/10',
      icon: 'text-amber-400',
    },
    icon: <Zap size={22} />,
  },
];

export function PlaidLinkButton({ onSuccess }: PlaidLinkProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedInst, setSelectedInst] = useState<typeof INSTITUTIONS[0] | null>(null);
  const [authStep, setAuthStep] = useState<'idle' | 'authenticating' | 'exchanging' | 'success'>('idle');
  const [linked, setLinked] = useState(false);

  const exchangeMutation = useMutation({
    mutationFn: async ({ publicToken, institutionName }: { publicToken: string; institutionName: string }) => {
      const res = await fetch('/api/plaid/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicToken, institutionName }),
      });
      if (!res.ok) {
        throw new Error('Failed to exchange token with server');
      }
      return res.json();
    },
    onSuccess: () => {
      setAuthStep('success');
      setTimeout(() => {
        setLinked(true);
        setIsOpen(false);
        onSuccess?.();
        // Reset state
        setSelectedInst(null);
        setAuthStep('idle');
      }, 1200);
    },
    onError: () => {
      setAuthStep('idle');
      setSelectedInst(null);
    }
  });

  const handleSelectInstitution = (inst: typeof INSTITUTIONS[0]) => {
    setSelectedInst(inst);
    setAuthStep('authenticating');

    // Simulate Plaid integration flow
    setTimeout(() => {
      setAuthStep('exchanging');
      setTimeout(() => {
        exchangeMutation.mutate({
          publicToken: `mock_public_token_${inst.key}`,
          institutionName: inst.name,
        });
      }, 1000);
    }, 1200);
  };

  if (linked) {
    return (
      <div className="text-center py-6 px-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 shadow-[0_4px_24px_rgba(16,185,129,0.06)] animate-in fade-in duration-300">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3 shadow-inner">
          <CheckCircle2 size={24} className="text-emerald-400 animate-pulse" />
        </div>
        <p className="text-emerald-400 font-bold text-sm">Bank Pipeline Connected</p>
        <p className="text-white/30 text-[10px] mt-1 max-w-[200px] mx-auto uppercase tracking-wider font-semibold">
          Active Sandbox Synchronization
        </p>
        <button 
          onClick={() => setLinked(false)}
          className="mt-4 text-xs font-bold text-primary hover:text-white transition-colors cursor-pointer"
        >
          Disconnect & Connect New Bank
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsOpen(true)}
        className="btn-primary w-full h-12 text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer"
      >
        <Link2 size={16} /> Link Business Accounts
      </button>
      <p className="text-white/20 text-[10px] text-center font-semibold tracking-wider uppercase">
        Secured by Plaid Link Sandbox
      </p>

      {/* Modal backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="glass-card w-full max-w-lg overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.8)] relative animate-in zoom-in-95 duration-300">
            {/* Ambient gradients */}
            <div className="absolute -top-12 -left-12 w-28 h-28 rounded-full bg-primary/10 blur-xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-28 h-28 rounded-full bg-secondary/10 blur-xl pointer-events-none" />

            {/* Header */}
            <div className="p-6 border-b border-white/[0.06] flex justify-between items-center relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-inner">
                  <Sparkles size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Link Bank Account</h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-black mt-0.5">Plaid Sandbox Portal</p>
                </div>
              </div>
              {authStep === 'idle' && (
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all cursor-pointer font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Content */}
            <div className="p-6 relative z-10">
              {authStep === 'idle' && (
                <div className="grid grid-cols-1 gap-2.5">
                  {INSTITUTIONS.map((inst) => (
                    <button
                      key={inst.key}
                      onClick={() => handleSelectInstitution(inst)}
                      className={`flex items-start gap-4 p-4 border rounded-xl transition-all duration-300 text-left cursor-pointer ${inst.colors.bg} ${inst.colors.border}`}
                    >
                      <div className={`w-10 h-10 rounded-xl border border-white/5 bg-white/5 flex items-center justify-center shadow-inner ${inst.colors.icon}`}>
                        {inst.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-extrabold text-white text-sm tracking-tight">{inst.name}</h4>
                        <p className="text-xs text-white/40 mt-0.5 font-medium leading-relaxed">{inst.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {authStep !== 'idle' && selectedInst && (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 rounded-full border-2 border-white/5 border-t-primary animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center text-2xl text-white">
                      {selectedInst.icon}
                    </div>
                  </div>

                  <h4 className="font-extrabold text-white text-base mb-1.5">
                    {authStep === 'authenticating' && `Connecting to ${selectedInst.name}...`}
                    {authStep === 'exchanging' && `Exchanging secure keys...`}
                    {authStep === 'success' && `Authentication Successful!`}
                  </h4>

                  <p className="text-xs text-white/40 max-w-xs font-medium leading-relaxed">
                    {authStep === 'authenticating' && 'Setting up secure tokens inside simulated sandbox. This simulates true Plaid OAuth protocol.'}
                    {authStep === 'exchanging' && 'Importing ledger items, credit facilities, and initializing live account feeds.'}
                    {authStep === 'success' && 'Connection built. Instantiating AI model indexing for new transactions.'}
                  </p>
                </div>
              )}

              {exchangeMutation.error && (
                <div className="mt-4 p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl flex items-center gap-2.5 text-rose-400">
                  <ShieldAlert size={16} />
                  <p className="text-xs font-semibold">{(exchangeMutation.error as Error).message}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
