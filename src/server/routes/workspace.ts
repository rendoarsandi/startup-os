import { and, eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { z } from "zod";
import {
  workspaceSettings,
  autopilotRules,
  supportTickets,
  projectTasks,
} from "../../db/schema";
import { jsonResponse, matchRoute, ValidationError } from "../utils";
import { runAutomation, reviewRun, listAutomationRuns } from "../automation";
import type { AppEnv } from "../env";
import { scheduleWorkspace } from "../scheduling";

import { settingsSchema, ruleSchema } from "../../lib/workspace-schemas";

async function body<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  try {
    return schema.parse(await request.json());
  } catch (error) {
    throw new ValidationError({
      message: error instanceof Error ? error.message : "Invalid input.",
    });
  }
}

export async function handleWorkspaceRoutes(
  request: Request,
  path: string,
  method: string,
  db: DrizzleD1Database,
  userId: string,
  env: AppEnv,
): Promise<Response | null> {
  if (path === "/api/workspace/settings") {
    if (method === "GET") {
      const settings = await db
        .select()
        .from(workspaceSettings)
        .where(eq(workspaceSettings.userId, userId))
        .get();
      return jsonResponse(
        settings || {
          companyName: "",
          companyDescription: "",
          autonomy: "review",
        },
      );
    }
    if (method === "PUT") {
      const settings = await body(request, settingsSchema);
      await db
        .insert(workspaceSettings)
        .values({ ...settings, userId, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: workspaceSettings.userId,
          set: { ...settings, updatedAt: new Date() },
        })
        .run();
      return jsonResponse(settings);
    }
  }
  if (path === "/api/workspace/integrations" && method === "GET") {
    return jsonResponse({
      ai: Boolean(env.OPENROUTER_API_KEY || env.GEMINI_API_KEY),
      provider: env.OPENROUTER_API_KEY
        ? "OpenRouter"
        : env.GEMINI_API_KEY
          ? "Gemini"
          : null,
      model: env.OPENROUTER_API_KEY
        ? env.OPENROUTER_MODEL || "openai/gpt-4.1-mini"
        : env.GEMINI_MODEL || "gemini-2.5-flash",
      banking: Boolean(env.PLAID_CLIENT_ID && env.PLAID_SECRET),
      scheduled: Boolean(env.WORKSPACE_DO),
      delivery: false,
    });
  }
  if (path === "/api/operations/autopilot") {
    if (method === "GET")
      return jsonResponse(
        await db
          .select()
          .from(autopilotRules)
          .where(eq(autopilotRules.userId, userId))
          .all(),
      );
    if (method === "POST") {
      const rule = await body(request, ruleSchema);
      const now = new Date();
      if (rule.id) {
        const updated = await db
          .update(autopilotRules)
          .set({ ...rule, updatedAt: now })
          .where(
            and(
              eq(autopilotRules.id, rule.id),
              eq(autopilotRules.userId, userId),
            ),
          )
          .returning()
          .get();
        if (updated?.active) await scheduleWorkspace(env, userId);
        return updated
          ? jsonResponse(updated)
          : jsonResponse({ error: "Rule not found." }, 404);
      }
      const created = {
        ...rule,
        id: crypto.randomUUID(),
        userId,
        createdAt: now,
        updatedAt: now,
      };
      await db.insert(autopilotRules).values(created).run();
      if (created.active) await scheduleWorkspace(env, userId);
      return jsonResponse(created, 201);
    }
  }
  const toggle = matchRoute(path, "/api/operations/autopilot/:id/toggle");
  if (toggle && (method === "PUT" || method === "PATCH")) {
    const data = await body(request, z.object({ active: z.boolean() }));
    const updated = await db
      .update(autopilotRules)
      .set({ active: data.active, updatedAt: new Date() })
      .where(
        and(
          eq(autopilotRules.id, toggle.id),
          eq(autopilotRules.userId, userId),
        ),
      )
      .returning()
      .get();
    if (updated?.active) await scheduleWorkspace(env, userId);
    return updated
      ? jsonResponse(updated)
      : jsonResponse({ error: "Rule not found." }, 404);
  }
  const remove = matchRoute(path, "/api/operations/autopilot/:id");
  if (remove && method === "DELETE") {
    const deleted = await db
      .delete(autopilotRules)
      .where(
        and(
          eq(autopilotRules.id, remove.id),
          eq(autopilotRules.userId, userId),
        ),
      )
      .returning()
      .get();
    return deleted
      ? jsonResponse({ success: true })
      : jsonResponse({ error: "Rule not found." }, 404);
  }
  if (path === "/api/operations/autopilot/run-checks" && method === "POST")
    return jsonResponse(await runAutomation(env, userId));
  if (path === "/api/automation/runs" && method === "GET")
    return jsonResponse(await listAutomationRuns(db, userId));
  const review = matchRoute(path, "/api/automation/runs/:id/review");
  if (review && method === "POST") {
    const { decision } = await body(
      request,
      z.object({ decision: z.enum(["approve", "dismiss", "retry"]) }),
    );
    try {
      return jsonResponse(await reviewRun(env, userId, review.id, decision));
    } catch (error) {
      return jsonResponse(
        { error: error instanceof Error ? error.message : "Review failed." },
        409,
      );
    }
  }
  const ticketStatus = matchRoute(path, "/api/operations/tickets/:id/status");
  if (ticketStatus && method === "PUT") {
    const data = await body(
      request,
      z.object({ status: z.enum(["open", "replied", "resolved"]) }),
    );
    const updated = await db
      .update(supportTickets)
      .set({ status: data.status, updatedAt: new Date() })
      .where(
        and(
          eq(supportTickets.id, ticketStatus.id),
          eq(supportTickets.userId, userId),
        ),
      )
      .returning()
      .get();
    return updated
      ? jsonResponse(updated)
      : jsonResponse({ error: "Ticket not found." }, 404);
  }
  const taskStatus = matchRoute(path, "/api/operations/tasks/:id/status");
  if (taskStatus && method === "PUT") {
    const data = await body(
      request,
      z.object({ status: z.enum(["todo", "in_progress", "done"]) }),
    );
    const updated = await db
      .update(projectTasks)
      .set({ status: data.status, updatedAt: new Date() })
      .where(
        and(
          eq(projectTasks.id, taskStatus.id),
          eq(projectTasks.userId, userId),
        ),
      )
      .returning()
      .get();
    return updated
      ? jsonResponse(updated)
      : jsonResponse({ error: "Task not found." }, 404);
  }
  return null;
}
