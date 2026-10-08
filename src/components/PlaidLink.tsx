import { useState } from 'react'
import { usePlaidLink } from 'react-plaid-link'
import { useMutation } from '@tanstack/react-query'
import * as api from '../lib/server-functions'
import { Button } from './ui/button'

export function PlaidLinkButton({ onSuccess }: { onSuccess?: () => void }) {
  const [token, setToken] = useState<string | null>(null)
  const create = useMutation({ mutationFn: () => api.createBankLink(), onSuccess: result => setToken(result.linkToken) })
  const exchange = useMutation({ mutationFn: (data: { publicToken: string; institutionName?: string }) => api.exchangeBankToken({ data }), onSuccess: () => { setToken(null); onSuccess?.() } })
  const { open, ready, error } = usePlaidLink({ token, onSuccess: (publicToken, metadata) => { if (publicToken) exchange.mutate({ publicToken, institutionName: metadata.institution?.name ?? undefined }) }, onExit: () => setToken(null) })
  return <div className="space-y-3"><p className="text-sm text-muted-foreground">Connect a bank securely through Plaid to import accounts and transactions.</p>{token ? <Button onClick={() => open()} disabled={!ready || exchange.isPending}>{exchange.isPending ? 'Importing your accounts…' : 'Continue to your bank'}</Button> : <Button onClick={() => create.mutate()} disabled={create.isPending}>{create.isPending ? 'Preparing connection…' : 'Connect bank'}</Button>}{(create.error || exchange.error || error) && <p role="alert" className="text-sm text-destructive">{create.error?.message || exchange.error?.message || error?.message || 'Could not open your bank connection. Try again.'}</p>}</div>
}
