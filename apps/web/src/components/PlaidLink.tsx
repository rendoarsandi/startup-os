import { useState, useCallback } from 'react';

interface PlaidLinkProps {
  onSuccess?: () => void;
}

export function PlaidLinkButton({ onSuccess }: PlaidLinkProps) {
  const [loading, setLoading] = useState(false);
  const [linked, setLinked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLink = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Get link token from our API
      const tokenRes = await fetch('/api/plaid/create-link-token', { method: 'POST' });
      const tokenData = await tokenRes.json() as any;
      
      if (tokenData.error) {
        setError('Configure PLAID_CLIENT_ID and PLAID_SECRET to enable bank linking.');
        setLoading(false);
        return;
      }

      // Step 2: In production, this would open Plaid Link
      // For now, simulate a successful sandbox connection
      console.log('Link token received:', tokenData.linkToken);
      
      // Simulate Plaid Link flow in sandbox
      setLinked(true);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Failed to connect bank');
    } finally {
      setLoading(false);
    }
  }, [onSuccess]);

  if (linked) {
    return (
      <div className="text-center py-4">
        <div className="w-12 h-12 rounded-full bg-green-400/10 flex items-center justify-center mx-auto mb-3">
          <span className="text-green-400 text-xl">✓</span>
        </div>
        <p className="text-green-400 font-semibold text-sm">Bank Connected</p>
        <p className="text-white/30 text-xs mt-1">Sandbox mode active</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleLink}
        disabled={loading}
        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? (
          <>
            <span className="animate-spin">⏳</span>
            Connecting...
          </>
        ) : (
          <>
            🏦 Link Bank Account
          </>
        )}
      </button>
      {error && (
        <p className="text-orange-400/80 text-xs text-center">{error}</p>
      )}
      <p className="text-white/20 text-[10px] text-center">
        Powered by Plaid • Sandbox Mode
      </p>
    </div>
  );
}
