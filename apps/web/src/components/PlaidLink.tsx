import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';

interface PlaidLinkProps {
  onSuccess?: () => void;
}

export function PlaidLinkButton({ onSuccess }: PlaidLinkProps) {
  const [linked, setLinked] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const tokenRes = await fetch('/api/plaid/create-link-token', { method: 'POST' });
      if (!tokenRes.ok) {
        throw new Error('Failed to connect bank');
      }
      const tokenData = await tokenRes.json() as any;
      if (tokenData.error) {
        throw new Error('Configure PLAID_CLIENT_ID and PLAID_SECRET to enable bank linking.');
      }
      return tokenData;
    },
    onSuccess: (tokenData) => {
      // Step 2: In production, this would open Plaid Link
      // For now, simulate a successful sandbox connection
      console.log('Link token received:', tokenData.linkToken);
      
      // Simulate Plaid Link flow in sandbox
      setLinked(true);
      onSuccess?.();
    },
  });

  const handleLink = () => {
    mutation.mutate();
  };

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
        disabled={mutation.isPending}
        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {mutation.isPending ? (
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
      {mutation.error && (
        <p className="text-orange-400/80 text-xs text-center">{(mutation.error as Error).message}</p>
      )}
      <p className="text-white/20 text-[10px] text-center">
        Powered by Plaid • Sandbox Mode
      </p>
    </div>
  );
}
