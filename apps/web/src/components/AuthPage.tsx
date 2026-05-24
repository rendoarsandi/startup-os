import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface AuthPageProps {
  onAuthSuccess: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/sign-in/email' : '/api/auth/sign-up/email';
      const body = isLogin ? { email, password } : { email, password, name };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || (isLogin ? 'Failed to sign in' : 'Failed to sign up'));
      }

      if (isLogin) {
        onAuthSuccess();
      } else {
        setSuccessMsg('Account created successfully! Logging you in...');
        // Automatically sign in after signup
        const loginRes = await fetch('/api/auth/sign-in/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });
        if (loginRes.ok) {
          onAuthSuccess();
        } else {
          setIsLogin(true);
          setSuccessMsg(null);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Dynamic premium nebula glows */}
      <div className="nebula-glow top-[-20%] right-[-10%] w-[60%] h-[60%] bg-primary/25 animate-pulse duration-[8000ms]" />
      <div className="nebula-glow bottom-[-15%] left-[-15%] w-[50%] h-[50%] bg-secondary/20" />
      <div className="nebula-glow top-[30%] left-[25%] w-[400px] h-[400px] bg-accent/15" />

      {/* Main container */}
      <div className="w-full max-w-md p-10 glass-card m-4 relative z-10 shadow-[0_16px_36px_rgba(0,0,0,0.5)] border border-border animate-in fade-in duration-500">
        <div className="flex flex-col items-center mb-8 text-center">
          {/* Logo / Header */}
          <div className="h-16 w-16 rounded-xl border border-border p-2 mb-5 bg-[#0d0f17] flex items-center justify-center">
            <img 
              src="/logo.png" 
              alt="Startup OS Logo" 
              className="w-full h-full object-contain" 
            />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wider">
            STARTUP OS
          </h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1.5">Autonomous C-Suite ERP system</p>
        </div>

        {/* Tab switchers */}
        <div className="grid grid-cols-2 p-1 bg-white/5 rounded-lg border border-border mb-6">
          <button
            onClick={() => { setIsLogin(true); setError(null); setSuccessMsg(null); }}
            className={`py-2.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              isLogin 
                ? 'bg-primary/15 text-white border border-primary/20 font-extrabold' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(null); setSuccessMsg(null); }}
            className={`py-2.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              !isLogin 
                ? 'bg-primary/15 text-white border border-primary/20 font-extrabold' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-5 flex items-center gap-3 p-4 rounded-xl border border-red-500/25 bg-red-500/10 text-red-400 text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-300">
            <ShieldAlert size={16} className="shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-5 flex items-center gap-3 p-4 rounded-xl border border-green-500/25 bg-green-500/10 text-green-400 text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-300">
            <CheckCircle2 size={16} className="shrink-0 text-green-400" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4.5">
          {!isLogin && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider pl-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-all text-white placeholder-white/20"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider pl-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={16} />
              <input
                type="email"
                required
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-all text-white placeholder-white/20"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider pl-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={16} />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-all text-white placeholder-white/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-6 py-3.5 font-bold cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Workspace')}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div className="mt-8 border-t border-white/5 pt-4 text-center">
          <p className="text-[9px] text-white/30 tracking-wider uppercase font-semibold">
            Secured by BetterAuth • Data stored in Cloudflare D1
          </p>
        </div>
      </div>
    </div>
  );
};
