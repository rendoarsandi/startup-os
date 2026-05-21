import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';

interface PlaidLinkProps {
  onSuccess?: () => void;
}

const INSTITUTIONS = [
  {
    key: 'chase',
    name: 'Chase Bank',
    desc: 'Chase Business Checking, Savings & Ink Credit Card',
    bgColor: 'bg-blue-600/10 hover:bg-blue-600/20 border-blue-500/30 hover:border-blue-500/60 text-blue-400',
    icon: '🏦',
  },
  {
    key: 'svb',
    name: 'Silicon Valley Bank',
    desc: 'SVB Operating Checking & MM Savings',
    bgColor: 'bg-emerald-600/10 hover:bg-emerald-600/20 border-emerald-500/30 hover:border-emerald-500/60 text-emerald-400',
    icon: '🚀',
  },
  {
    key: 'bofa',
    name: 'Bank of America',
    desc: 'BofA Business Checking & Business Credit Card',
    bgColor: 'bg-red-600/10 hover:bg-red-600/20 border-red-500/30 hover:border-red-500/60 text-red-400',
    icon: '🏢',
  },
  {
    key: 'mercury',
    name: 'Mercury',
    desc: 'Mercury Modern Startup Checking & Treasury',
    bgColor: 'bg-zinc-800 hover:bg-zinc-700/50 border-zinc-700 hover:border-zinc-500 text-zinc-300',
    icon: '⚡',
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
      }, 1000);
    },
    onError: () => {
      setAuthStep('idle');
      setSelectedInst(null);
    }
  });

  const handleSelectInstitution = (inst: typeof INSTITUTIONS[0]) => {
    setSelectedInst(inst);
    setAuthStep('authenticating');

    // Micro-animated auth simulation steps
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
      <div className="text-center py-4 bg-green-500/5 border border-green-500/20 rounded-xl p-4">
        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3 animate-bounce">
          <span className="text-green-400 text-xl font-bold">✓</span>
        </div>
        <p className="text-green-400 font-semibold text-sm">Bank Connected Successfully</p>
        <p className="text-white/30 text-xs mt-1">Simulated sandbox credentials active</p>
        <button 
          onClick={() => setLinked(false)}
          className="mt-3 text-xs text-blue-400 hover:text-blue-300 underline"
        >
          Link another account
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsOpen(true)}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        🏦 Link Bank Account
      </button>
      <p className="text-white/20 text-[10px] text-center">
        Powered by Plaid • Interactive Sandbox Mode
      </p>

      {/* Modal backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200">
            
            {/* Header */}
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white">Link Bank via Plaid</h3>
                <p className="text-xs text-zinc-400 mt-1">Select an institution to simulate connection</p>
              </div>
              {authStep === 'idle' && (
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-zinc-500 hover:text-white text-lg font-semibold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Content */}
            <div className="p-6">
              {authStep === 'idle' && (
                <div className="grid grid-cols-1 gap-3">
                  {INSTITUTIONS.map((inst) => (
                    <button
                      key={inst.key}
                      onClick={() => handleSelectInstitution(inst)}
                      className={`flex items-start gap-4 p-4 border rounded-xl transition-all duration-200 text-left ${inst.bgColor}`}
                    >
                      <span className="text-3xl mt-1">{inst.icon}</span>
                      <div>
                        <h4 className="font-semibold text-white text-sm">{inst.name}</h4>
                        <p className="text-xs text-zinc-400 mt-1">{inst.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {authStep !== 'idle' && selectedInst && (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 rounded-full border-4 border-zinc-800 border-t-blue-500 animate-spin"></div>
                    <span className="absolute inset-0 flex items-center justify-center text-2xl">
                      {selectedInst.icon}
                    </span>
                  </div>

                  <h4 className="font-bold text-white text-base mb-1">
                    {authStep === 'authenticating' && `Connecting to ${selectedInst.name}...`}
                    {authStep === 'exchanging' && `Securely exchanging sandbox credentials...`}
                    {authStep === 'success' && `Connected!`}
                  </h4>

                  <p className="text-xs text-zinc-400 max-w-xs">
                    {authStep === 'authenticating' && 'Establishing secure handshake via simulated Plaid Link environment.'}
                    {authStep === 'exchanging' && 'Configuring financial account mapping and auto-importing historical transactions.'}
                    {authStep === 'success' && 'Your banking data has been linked and categorized.'}
                  </p>
                </div>
              )}

              {exchangeMutation.error && (
                <div className="mt-4 p-3 bg-red-950/20 border border-red-900/30 rounded-lg text-center">
                  <p className="text-xs text-red-400">{(exchangeMutation.error as Error).message}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
