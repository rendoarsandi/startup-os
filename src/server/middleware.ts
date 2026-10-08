import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { drizzle } from "drizzle-orm/d1";
import { getRuntimeEnv } from "#runtime-env";
import { getAuth } from "./auth";

export const authenticated = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const request = getRequest();
    const env = getRuntimeEnv();
    const auth = getAuth(
      env.DB,
      env.BETTER_AUTH_URL || new URL(request.url).origin,
      env.BETTER_AUTH_SECRET,
    );
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session)
      throw new Error("Your session has expired. Sign in to continue.");
    return next({ context: { env, db: drizzle(env.DB), user: session.user } });
  },
);
