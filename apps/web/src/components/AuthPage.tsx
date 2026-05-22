import React, { useState } from 'react';
import { Sparkles, Mail, Lock, User, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';

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
      {/* Decorative premium gradient blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[130px] rounded-full -z-10 animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-secondary/20 blur-[120px] rounded-full -z-10" />
      <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-accent/10 blur-[90px] rounded-full -z-10" />

      {/* Main glass card container */}
      <div className="w-full max-w-md p-8 glass-card m-4 relative z-10 border border-white/10 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          {/* Logo / Header */}
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-secondary p-[2px] mb-4 shadow-lg shadow-primary/20 flex items-center justify-center">
            <div className="h-full w-full rounded-[14px] bg-background flex items-center justify-center">
              <Sparkles className="text-primary animate-pulse" size={24} />
            </div>
          </div>
          <h2 className="text-3xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent italic tracking-wider">
            STARTUP OS
          </h2>
          <p className="text-[10px] text-white/30 uppercase tracking-widest font-black mt-1">Autonomous Financial & CMO C-Suite</p>
        </div>

        {/* Tab switchers */}
        <div className="grid grid-cols-2 p-1 bg-white/5 rounded-xl border border-white/5 mb-6">
          <button
            onClick={() => { setIsLogin(true); setError(null); setSuccessMsg(null); }}
            className={`py-2 text-sm font-semibold rounded-lg transition-all ${
              isLogin ? 'bg-primary/20 text-white border border-primary/20 shadow-md shadow-primary/10' : 'text-white/40 hover:text-white/70'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(null); setSuccessMsg(null); }}
            className={`py-2 text-sm font-semibold rounded-lg transition-all ${
              !isLogin ? 'bg-primary/20 text-white border border-primary/20 shadow-md shadow-primary/10' : 'text-white/40 hover:text-white/70'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 flex items-center gap-3 p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-xs font-semibold animate-shake">
            <ShieldAlert size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 flex items-center gap-3 p-3.5 rounded-xl border border-green-500/20 bg-green-500/10 text-green-400 text-xs font-semibold">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-all text-white"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={16} />
              <input
                type="email"
                required
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-all text-white"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={16} />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-all text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 mt-6 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Workspace')}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div className="mt-8 border-t border-white/5 pt-4 text-center">
          <p className="text-[10px] text-white/30">
            Secured by BetterAuth. Data stored in Cloudflare D1.
          </p>
        </div>
      </div>
    </div>
  );
};
