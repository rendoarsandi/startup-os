import { transactionsCollection, upsertTransactions, invoicesCollection, upsertInvoices } from './db';

export class ConvexClient {
  private ws: WebSocket | null = null;
  private pendingRequests = new Map<string, { resolve: (val: any) => void; reject: (err: any) => void }>();
  private subscriptions = new Map<string, Set<(data: any) => void>>();
  private isConnected = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initWebSocket();
    }
  }

  private initWebSocket() {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/ws`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        // Subscribe to standard collections for live TanStack DB synchronization
        this.sendWsMessage({ type: 'subscribe', table: 'transaction' });
        this.sendWsMessage({ type: 'subscribe', table: 'invoice' });
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'sync') {
            this.handleSyncMessage(msg.table, msg.data);
          } else if (msg.type === 'broadcast') {
            this.handleBroadcastMessage(msg.event, msg.payload);
          } else if (msg.type === 'rpc_result') {
            const pending = this.pendingRequests.get(msg.requestId);
            if (pending) {
              this.pendingRequests.delete(msg.requestId);
              if (msg.error) {
                pending.reject(new Error(msg.error));
              } else {
                pending.resolve(msg.result);
              }
            }
          }
        } catch {
          // Ignore malformed message
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        // Reconnect after 3 seconds
        setTimeout(() => this.initWebSocket(), 3000);
      };

      this.ws.onerror = () => {
        this.isConnected = false;
      };
    } catch {
      this.isConnected = false;
    }
  }

  private sendWsMessage(payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  private handleSyncMessage(table: string, data: any[]) {
    if (table === 'transaction' && Array.isArray(data)) {
      upsertTransactions(data);
    } else if (table === 'invoice' && Array.isArray(data)) {
      upsertInvoices(data);
    }

    const listeners = this.subscriptions.get(table);
    if (listeners) {
      listeners.forEach((fn) => fn(data));
    }
  }

  private handleBroadcastMessage(event: string, payload: any) {
    if (event === 'transactions:changed') {
      if (payload.type === 'insert' || payload.type === 'update') {
        upsertTransactions([payload.data]);
      }
    } else if (event === 'invoices:changed') {
      if (payload.type === 'insert' || payload.type === 'update') {
        upsertInvoices([payload.data]);
      }
    }
  }

  public subscribe(table: string, callback: (data: any[]) => void): () => void {
    if (!this.subscriptions.has(table)) {
      this.subscriptions.set(table, new Set());
      this.sendWsMessage({ type: 'subscribe', table });
    }
    this.subscriptions.get(table)!.add(callback);
    return () => {
      this.subscriptions.get(table)?.delete(callback);
    };
  }

  public async call<Result = any>(functionName: string, args: any = {}): Promise<Result> {
    // If WebSocket is open, send RPC over WebSocket
    if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      return new Promise<Result>((resolve, reject) => {
        this.pendingRequests.set(requestId, { resolve, reject });
        this.sendWsMessage({
          type: 'rpc',
          requestId,
          functionName,
          args,
        });

        // 10s fallback timeout
        setTimeout(() => {
          if (this.pendingRequests.has(requestId)) {
            this.pendingRequests.delete(requestId);
            // Fallback to HTTP POST
            this.callHttp<Result>(functionName, args).then(resolve).catch(reject);
          }
        }, 10000);
      });
    }

    // Fallback to HTTP POST
    return this.callHttp<Result>(functionName, args);
  }

  private async callHttp<Result = any>(functionName: string, args: any = {}): Promise<Result> {
    const res = await fetch('/api/rpc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ functionName, args }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'RPC Failed' }));
      throw new Error(err.error || `RPC error: ${res.statusText}`);
    }

    const json = await res.json();
    return json.data;
  }
}

export const convexClient = new ConvexClient();
