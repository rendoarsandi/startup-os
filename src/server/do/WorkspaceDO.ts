import { DurableObjectDatabase } from '../runtime/db';
import { api } from '../functions';
import { ServerFunction } from '../runtime/core';

export class WorkspaceDO {
  private ctx: any;
  private env: any;
  private db: DurableObjectDatabase;
  private sockets: Set<any> = new Set();

  constructor(ctx: any, env: any) {
    this.ctx = ctx;
    this.env = env;
    // SQLite storage attached to DO instance if available (Cloudflare DO SQLite)
    const sqlStorage = ctx?.storage?.sql;
    this.db = new DurableObjectDatabase(sqlStorage);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // 1. WebSocket Upgrade for Real-Time Durable Sync
    if (request.headers.get('Upgrade') === 'websocket' || path.endsWith('/ws')) {
      return this.handleWebSocket(request);
    }

    // 2. RPC Execution
    if (path.endsWith('/rpc') || path.endsWith('/rpc/call')) {
      return this.handleRpc(request);
    }

    // 3. Fallback / Health
    return new Response(JSON.stringify({ status: 'WorkspaceDO Active', path }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private handleWebSocket(request: Request): Response {
    // Check WebSocketPair availability (Cloudflare Workers runtime)
    const webSocketPair = (globalThis as any).WebSocketPair;
    if (!webSocketPair) {
      return new Response('WebSockets not supported in current environment', { status: 501 });
    }

    const pair = new webSocketPair();
    const [client, server] = [pair[0], pair[1]];

    if (this.ctx?.acceptWebSocket) {
      this.ctx.acceptWebSocket(server);
    } else {
      server.accept();
    }

    this.sockets.add(server);

    server.addEventListener('message', async (event: any) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'ping') {
          server.send(JSON.stringify({ type: 'pong' }));
        } else if (msg.type === 'subscribe') {
          // Send initial snapshot for requested table
          const tableName = msg.table;
          if (tableName) {
            const data = await this.db.query(tableName).collect();
            server.send(JSON.stringify({
              type: 'sync',
              table: tableName,
              data,
            }));
          }
        } else if (msg.type === 'rpc') {
          try {
            const result = await this.executeFunction(msg.functionName, msg.args, msg.userId);
            server.send(JSON.stringify({
              type: 'rpc_result',
              requestId: msg.requestId,
              result,
            }));
          } catch (err: any) {
            server.send(JSON.stringify({
              type: 'rpc_result',
              requestId: msg.requestId,
              error: err.message || 'RPC execution failed',
            }));
          }
        }
      } catch (err: any) {
        server.send(JSON.stringify({ type: 'error', message: err.message }));
      }
    });

    const closeHandler = () => {
      this.sockets.delete(server);
    };
    server.addEventListener('close', closeHandler);
    server.addEventListener('error', closeHandler);

    return new Response(null, { status: 101, webSocket: client });
  }

  private async handleRpc(request: Request): Promise<Response> {
    try {
      const body = await request.json() as { functionName: string; args?: any; userId?: string };
      const result = await this.executeFunction(body.functionName, body.args || {}, body.userId);
      return new Response(JSON.stringify({ success: true, data: result }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ success: false, error: err.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  public broadcast(event: string, payload: any) {
    const message = JSON.stringify({ type: 'broadcast', event, payload });
    const activeSockets = this.ctx?.getWebSockets ? this.ctx.getWebSockets() : this.sockets;
    for (const socket of activeSockets) {
      try {
        socket.send(message);
      } catch {
        this.sockets.delete(socket);
      }
    }
  }

  public async executeFunction(functionName: string, args: any = {}, userId?: string) {
    const parts = functionName.split('.');
    let fn: ServerFunction | undefined;

    if (parts.length === 2) {
      const [domain, name] = parts;
      fn = (api as any)[domain]?.[name];
    } else {
      fn = (api as any)[functionName];
    }

    if (!fn) {
      throw new Error(`Function '${functionName}' not found in api registry`);
    }

    const authContext = {
      userId: userId || 'default-user',
      getUserIdentity: async () => ({ id: userId || 'default-user' }),
    };

    if (fn._type === 'query') {
      const ctx = {
        db: this.db,
        auth: authContext,
        env: this.env,
      };
      return await fn.handler(ctx, args);
    }

    if (fn._type === 'mutation') {
      const ctx = {
        db: this.db,
        auth: authContext,
        env: this.env,
        broadcast: (event: string, payload: any) => this.broadcast(event, payload),
      };
      return await fn.handler(ctx, args);
    }

    if (fn._type === 'action') {
      const ctx = {
        auth: authContext,
        env: this.env,
        runQuery: async (queryFn: any, queryArgs: any) => {
          return await queryFn.handler({ db: this.db, auth: authContext, env: this.env }, queryArgs);
        },
        runMutation: async (mutFn: any, mutArgs: any) => {
          return await mutFn.handler({
            db: this.db,
            auth: authContext,
            env: this.env,
            broadcast: (e: string, p: any) => this.broadcast(e, p),
          }, mutArgs);
        },
      };
      return await fn.handler(ctx, args);
    }

    throw new Error(`Unknown function type: ${(fn as any)._type}`);
  }

  public getDatabase(): DurableObjectDatabase {
    return this.db;
  }
}
