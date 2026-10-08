import { DurableObject } from "cloudflare:workers";
import type { AppEnv } from "../env";
import { runAutomation } from "../automation";
import { drizzle } from "drizzle-orm/d1";
import { and, eq } from "drizzle-orm";
import { autopilotRules } from "../../db/schema";
import { z } from "zod";

// Internal binding only. HTTP/server functions establish identity before calling it.
export class AutomationCoordinator extends DurableObject<AppEnv> {
  async fetch(request: Request): Promise<Response> {
    if (
      new URL(request.url).pathname !== "/schedule" ||
      request.method !== "POST"
    )
      return new Response("Not found", { status: 404 });
    const { userId } = z
      .object({ userId: z.string().min(1) })
      .parse(await request.json());
    const stored = await this.ctx.storage.get<string>("userId");
    if (stored && stored !== userId)
      return new Response("Workspace mismatch", { status: 403 });
    await this.ctx.storage.put("userId", userId);
    if ((await this.ctx.storage.getAlarm()) === null)
      await this.ctx.storage.setAlarm(Date.now() + 60_000);
    return Response.json({ scheduled: true });
  }

  async alarm() {
    const userId = await this.ctx.storage.get<string>("userId");
    if (!userId) return;
    const active = await drizzle(this.env.DB)
      .select({ id: autopilotRules.id })
      .from(autopilotRules)
      .where(
        and(eq(autopilotRules.userId, userId), eq(autopilotRules.active, true)),
      )
      .limit(1)
      .get();
    if (!active) return;
    try {
      await runAutomation(this.env, userId);
    } finally {
      await this.ctx.storage.setAlarm(Date.now() + 15 * 60_000);
    }
  }
}
