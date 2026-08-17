export type FunctionType = 'query' | 'mutation' | 'action';

export interface DatabaseReader {
  get<T = any>(table: string, id: string): Promise<T | null>;
  query<T = any>(table: string): QueryBuilder<T>;
}

export interface QueryBuilder<T = any> {
  filter(predicate: (doc: T) => boolean): QueryBuilder<T>;
  order(direction: 'asc' | 'desc', field?: keyof T): QueryBuilder<T>;
  collect(): Promise<T[]>;
  first(): Promise<T | null>;
}

export interface DatabaseWriter extends DatabaseReader {
  insert<T extends Record<string, any>>(table: string, value: T): Promise<T & { id: string; _id: string; _creationTime: number }>;
  patch<T extends Record<string, any>>(table: string, id: string, value: Partial<T>): Promise<(T & { id: string }) | null>;
  replace<T extends Record<string, any>>(table: string, id: string, value: T): Promise<T & { id: string }>;
  delete(table: string, id: string): Promise<boolean>;
}

export interface AuthContext {
  userId: string | null;
  getUserIdentity(): Promise<{ id: string; email?: string; name?: string } | null>;
}

export interface QueryCtx {
  db: DatabaseReader;
  auth: AuthContext;
  env: Record<string, any>;
}

export interface MutationCtx {
  db: DatabaseWriter;
  auth: AuthContext;
  env: Record<string, any>;
  broadcast(event: string, payload: any): void;
}

export interface ActionCtx {
  auth: AuthContext;
  env: Record<string, any>;
  runQuery<Args, Result>(queryFn: ConvexFunction<'query', Args, Result>, args?: Args): Promise<Result>;
  runMutation<Args, Result>(mutationFn: ConvexFunction<'mutation', Args, Result>, args?: Args): Promise<Result>;
}

export interface ConvexFunction<TType extends FunctionType = FunctionType, Args = any, Result = any> {
  _type: TType;
  argsValidator?: (args: unknown) => Args;
  handler: (ctx: any, args: Args) => Promise<Result>;
}

export function query<Args = any, Result = any>(definition: {
  args?: (args: unknown) => Args;
  handler: (ctx: QueryCtx, args: Args) => Promise<Result>;
}): ConvexFunction<'query', Args, Result> {
  return {
    _type: 'query',
    argsValidator: definition.args,
    handler: definition.handler,
  };
}

export function mutation<Args = any, Result = any>(definition: {
  args?: (args: unknown) => Args;
  handler: (ctx: MutationCtx, args: Args) => Promise<Result>;
}): ConvexFunction<'mutation', Args, Result> {
  return {
    _type: 'mutation',
    argsValidator: definition.args,
    handler: definition.handler,
  };
}

export function action<Args = any, Result = any>(definition: {
  args?: (args: unknown) => Args;
  handler: (ctx: ActionCtx, args: Args) => Promise<Result>;
}): ConvexFunction<'action', Args, Result> {
  return {
    _type: 'action',
    argsValidator: definition.args,
    handler: definition.handler,
  };
}
