import { drizzle } from "drizzle-orm/d1";
import { getAuth } from "./auth";
import type { AppEnv } from "./env";
import { handleCfoRoutes } from "./routes/cfo";
import { handleMarketingRoutes } from "./routes/marketing";
import { handleHrRoutes } from "./routes/hr";
import { handleOperationsRoutes } from "./routes/operations";
import { handleContractsRoutes } from "./routes/contracts";
import { handlePlaidRoutes } from "./routes/plaid";
import { handleChatRoutes } from "./routes/chat";
import { handleWorkspaceRoutes } from "./routes/workspace";
import { jsonResponse, ValidationError } from "./utils";
export { ValidationError, jsonResponse, matchRoute } from "./utils";
export const businessHandlers = [
  handleWorkspaceRoutes,
  handleCfoRoutes,
  handleMarketingRoutes,
  handleHrRoutes,
  handleOperationsRoutes,
  handleContractsRoutes,
  handlePlaidRoutes,
  handleChatRoutes,
];
export async function handleApiRequest(
  request: Request,
  env?: AppEnv,
): Promise<Response> {
  const { pathname: path, origin } = new URL(request.url);
  if (path === "/api/health") return jsonResponse({ status: "OK" });
  if (!env?.DB || !env.BETTER_AUTH_SECRET)
    return jsonResponse(
      { error: "Database and authentication must be configured." },
      503,
    );
  try {
    const auth = getAuth(
      env.DB,
      env.BETTER_AUTH_URL || origin,
      env.BETTER_AUTH_SECRET,
    );
    if (path.startsWith("/api/auth/")) return await auth.handler(request);
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return jsonResponse({ error: "Unauthorized" }, 401);
    const requestOrigin = request.headers.get("origin");
    if (
      request.method !== "GET" &&
      request.method !== "HEAD" &&
      requestOrigin !== origin
    ) {
      return jsonResponse({ error: "A same-origin request is required." }, 403);
    }
    const db = drizzle(env.DB);
    for (const handler of businessHandlers) {
      const response = await handler(
        request,
        path,
        request.method,
        db,
        session.user.id,
        env,
      );
      if (response) return response;
    }
    return jsonResponse({ error: "Not Found" }, 404);
  } catch (error) {
    if (error instanceof ValidationError)
      return jsonResponse({ error: error.message }, 400);
    console.error("API request failed", error);
    return jsonResponse(
      { error: "The request could not be completed. Please try again." },
      500,
    );
  }
}
