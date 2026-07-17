import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { cn } from '../utils/cn';

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
    <div className="relative min-h-screen w-screen flex items-center justify-center overflow-hidden bg-background text-foreground">
      {/* Decorative glows */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-15%] w-[50%] h-[50%] bg-accent/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Main card */}
      <Card className="w-full max-w-md border-border bg-card/60 backdrop-blur-md relative z-10 shadow-2xl animate-in fade-in duration-500">
        <CardHeader className="flex flex-col items-center pb-6 text-center">
          <div className="h-14 w-14 rounded-lg border border-border p-2 mb-4 bg-black/20 flex items-center justify-center">
            <img 
              src="/logo.png" 
              alt="Startup OS Logo" 
              className="w-full h-full object-contain" 
            />
          </div>
          <CardTitle className="text-xl font-black tracking-widest text-foreground">
            STARTUP OS
          </CardTitle>
          <CardDescription className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mt-1.5">
            Autonomous C-Suite ERP system
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Tab switcher */}
          <div className="grid w-full grid-cols-2 rounded-lg bg-black/25 border border-border p-1 text-muted-foreground">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(null); setSuccessMsg(null); }}
              className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer hover:text-foreground/80 active:scale-[0.98]",
                isLogin 
                  ? "bg-primary/10 text-foreground shadow-sm font-extrabold" 
                  : "text-muted-foreground"
              )}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(null); setSuccessMsg(null); }}
              className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer hover:text-foreground/80 active:scale-[0.98]",
                !isLogin 
                  ? "bg-primary/10 text-foreground shadow-sm font-extrabold" 
                  : "text-muted-foreground"
              )}
            >
              Create Account
            </button>
          </div>

          {/* Messages */}
          {error && (
            <div className="flex items-center gap-3 p-3.5 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive text-xs font-semibold animate-in fade-in duration-200">
              <ShieldAlert size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="flex items-center gap-3 p-3.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-semibold animate-in fade-in duration-200">
              <CheckCircle2 size={14} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1.5 animate-in fade-in duration-200">
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider pl-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={14} />
                  <Input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider pl-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={14} />
                <Input
                  type="email"
                  required
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider pl-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={14} />
                <Input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-4 font-bold h-11"
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Workspace')}
              {!loading && <ArrowRight size={14} className="ml-1.5" />}
            </Button>
          </form>

          <div className="border-t border-border/40 pt-4 text-center">
            <p className="text-[9px] text-muted-foreground tracking-wider uppercase font-semibold">
              Secured by BetterAuth • Data stored in Cloudflare D1
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
