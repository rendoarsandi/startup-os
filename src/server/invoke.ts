import { businessHandlers } from "./dispatcher";
import type { AppEnv } from "./env";
import type { DrizzleD1Database } from "drizzle-orm/d1";

export interface BusinessContext {
  env: AppEnv;
  db: DrizzleD1Database;
  user: { id: string };
}

// REST and Start server functions share one business implementation and database.
// This creates no network request and never accepts identity from the browser.
export async function invoke<T>(
  ctx: BusinessContext,
  path: string,
  method = "GET",
  input?: unknown,
): Promise<T> {
  const request = new Request(`https://workspace.internal${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: method === "GET" ? undefined : JSON.stringify(input ?? {}),
  });
  for (const handler of businessHandlers) {
    const response = await handler(
      request,
      path,
      method,
      ctx.db,
      ctx.user.id,
      ctx.env,
    );
    if (!response) continue;
    const data = await response.json();
    if (!response.ok)
      throw new Error(
        (data && typeof data === "object" && "error" in data
          ? String(data.error)
          : "") || "The operation could not be completed.",
      );
    return data as T;
  }
  throw new Error("This operation is not available.");
}
