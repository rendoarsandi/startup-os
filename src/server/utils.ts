import { Cause, Effect, Exit, Option } from 'effect';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export async function runEffectHandler<A, E, R>(
  program: Effect.Effect<A, E, R>,
  context?: any
): Promise<A> {
  const exit = await Effect.runPromiseExit(
    context ? Effect.provide(program, context) : (program as Effect.Effect<A, E, never>)
  );
  if (Exit.isSuccess(exit)) {
    return exit.value;
  }
  const failure = Cause.failureOption(exit.cause);
  if (Option.isSome(failure)) {
    throw failure.value;
  }
  throw Cause.squash(exit.cause);
}

export async function getValidatedBody<T>(
  request: Request,
  decoder: (input: unknown) => Effect.Effect<T, unknown, never>,
): Promise<T> {
  const program = Effect.tryPromise({
    try: () => request.json(),
    catch: () => new ValidationError("Invalid JSON payload"),
  }).pipe(
    Effect.flatMap(decoder),
    Effect.mapError((error) => error instanceof ValidationError
      ? error
      : new ValidationError(error instanceof Error ? error.message : "Validation failed")),
  );

  const exit = await Effect.runPromiseExit(program);
  if (Exit.isSuccess(exit)) return exit.value;

  const failure = Cause.failureOption(exit.cause);
  if (Option.isSome(failure)) throw failure.value;
  throw Cause.squash(exit.cause);
}

export function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export function matchRoute(path: string, pattern: string): Record<string, string> | null {
  const pathParts = path.split('/').filter(Boolean);
  const patternParts = pattern.split('/').filter(Boolean);
  if (pathParts.length !== patternParts.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = pathParts[i];
    } else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }
  return params;
}
