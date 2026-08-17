import { DurableObjectDatabase } from '../../server/convex/db';
import { WorkspaceDO } from '../../server/do/WorkspaceDO';
import { ConvexFunction } from '../../server/convex/core';

export interface TestContext {
  db: DurableObjectDatabase;
  userId: string;
  env: Record<string, any>;
  query<Args, Result>(fn: ConvexFunction<'query', Args, Result>, args?: Args): Promise<Result>;
  mutation<Args, Result>(fn: ConvexFunction<'mutation', Args, Result>, args?: Args): Promise<Result>;
  action<Args, Result>(fn: ConvexFunction<'action', Args, Result>, args?: Args): Promise<Result>;
}

export function createTestContext(options: { userId?: string; env?: Record<string, any> } = {}): TestContext {
  const userId = options.userId || 'test-user-123';
  const env = options.env || {
    GEMINI_API_KEY: 'test-gemini-key',
    PLAID_CLIENT_ID: 'test-plaid-client',
    PLAID_SECRET: 'test-plaid-secret',
    PLAID_ENV: 'sandbox',
  };

  const db = new DurableObjectDatabase();
  const broadcastEvents: Array<{ event: string; payload: any }> = [];

  const authContext = {
    userId,
    getUserIdentity: async () => ({ id: userId, email: `${userId}@startup.test`, name: 'Test Operator' }),
  };

  return {
    db,
    userId,
    env,
    async query<Args, Result>(fn: ConvexFunction<'query', Args, Result>, args?: Args): Promise<Result> {
      const ctx = { db, auth: authContext, env };
      return await fn.handler(ctx, args as Args);
    },
    async mutation<Args, Result>(fn: ConvexFunction<'mutation', Args, Result>, args?: Args): Promise<Result> {
      const ctx = {
        db,
        auth: authContext,
        env,
        broadcast: (event: string, payload: any) => {
          broadcastEvents.push({ event, payload });
        },
      };
      return await fn.handler(ctx, args as Args);
    },
    async action<Args, Result>(fn: ConvexFunction<'action', Args, Result>, args?: Args): Promise<Result> {
      const ctx = {
        auth: authContext,
        env,
        runQuery: async (queryFn: any, queryArgs: any) => {
          return await queryFn.handler({ db, auth: authContext, env }, queryArgs);
        },
        runMutation: async (mutFn: any, mutArgs: any) => {
          return await mutFn.handler({
            db,
            auth: authContext,
            env,
            broadcast: (e: string, p: any) => broadcastEvents.push({ event: e, payload: p }),
          }, mutArgs);
        },
      };
      return await fn.handler(ctx, args as Args);
    },
  };
}
