import { and, eq, desc, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { z } from "zod";
import {
  autopilotRules,
  automationRuns,
  inventoryItems,
  supportTickets,
  projects,
  projectTasks,
  workspaceSettings,
} from "../db/schema";
import { AnalysisService } from "./analysis";
import { createAIService } from "./ai";
import type { AppEnv } from "./env";

type Database = import("drizzle-orm/d1").DrizzleD1Database;
type Run = typeof automationRuns.$inferSelect;
const subjectSchema = z.object({
  id: z.string(),
  title: z.string(),
  detail: z.string(),
});

async function executeRun(
  db: Database,
  env: AppEnv,
  run: Run,
  approved = false,
) {
  try {
    const subject = subjectSchema.parse(JSON.parse(run.input));
    if (run.actionType === "auto_task") {
      if (!approved) {
        await db
          .update(automationRuns)
          .set({
            status: "awaiting_approval",
            output: `Create task: ${subject.title}`,
            updatedAt: new Date(),
          })
          .where(eq(automationRuns.id, run.id))
          .run();
        return;
      }
      const now = new Date();
      const projectId = `automation-${run.userId}`;
      await db.batch([
        db
          .insert(projects)
          .values({
            id: projectId,
            userId: run.userId,
            name: "Automation tasks",
            description: "Tasks created by your workspace rules.",
            status: "active",
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoNothing(),
        db
          .insert(projectTasks)
          .values({
            id: run.id,
            userId: run.userId,
            projectId,
            title: subject.title,
            status: "todo",
            hoursLogged: 0,
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoNothing(),
        db
          .update(automationRuns)
          .set({
            status: "completed",
            output: `Created task: ${subject.title}`,
            error: null,
            updatedAt: now,
          })
          .where(eq(automationRuns.id, run.id)),
      ]);
      return;
    }
    const ai = createAIService(env);
    const prompt =
      run.actionType === "ai_reply"
        ? `Draft a support response to this recorded ticket. Do not invent resolutions, promise refunds, or claim delivery. Ticket: ${subject.detail}`
        : `Audit this startup's recorded cash position and suggest three concrete next steps. State any missing data. ${subject.detail}`;
    const output = await ai.generateResponse(
      prompt,
      undefined,
      run.actionType === "ai_reply" ? "operations" : "cfo",
    );
    await db
      .update(automationRuns)
      .set({
        status: "awaiting_approval",
        output,
        error: null,
        updatedAt: new Date(),
      })
      .where(eq(automationRuns.id, run.id))
      .run();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Execution failed";
    await db
      .update(automationRuns)
      .set({ status: "failed", error: message, updatedAt: new Date() })
      .where(eq(automationRuns.id, run.id))
      .run();
  }
}

export async function runAutomation(env: AppEnv, userId: string) {
  const db = drizzle(env.DB);
  await db
    .update(automationRuns)
    .set({
      status: "failed",
      error: "Execution was interrupted. Retry this run.",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(automationRuns.userId, userId),
        eq(automationRuns.status, "running"),
        lt(automationRuns.updatedAt, new Date(Date.now() - 10 * 60_000)),
      ),
    )
    .run();
  const rules = await db
    .select()
    .from(autopilotRules)
    .where(
      and(eq(autopilotRules.userId, userId), eq(autopilotRules.active, true)),
    )
    .all();
  const settings = await db
    .select()
    .from(workspaceSettings)
    .where(eq(workspaceSettings.userId, userId))
    .get();
  let matched = 0;
  let created = 0;
  for (const rule of rules) {
    let subjects: Array<z.infer<typeof subjectSchema>> = [];
    if (rule.triggerType === "low_stock") {
      const items = await db
        .select()
        .from(inventoryItems)
        .where(eq(inventoryItems.userId, userId))
        .all();
      subjects = items
        .filter((item) => item.qty < Number(rule.triggerValue))
        .map((item) => ({
          id: `${item.id}:${item.qty}`,
          title: `Review stock for ${item.name}`,
          detail: `${item.sku}: ${item.qty} items remaining, threshold ${rule.triggerValue}.`,
        }));
    } else if (rule.triggerType === "high_priority_ticket") {
      const tickets = await db
        .select()
        .from(supportTickets)
        .where(
          and(
            eq(supportTickets.userId, userId),
            eq(supportTickets.status, "open"),
            eq(supportTickets.priority, "high"),
          ),
        )
        .all();
      subjects = tickets.map((ticket) => ({
        id: `${ticket.id}:${ticket.updatedAt.toISOString()}`,
        title: `Respond to ${ticket.subject}`,
        detail: `${ticket.customerName}: ${ticket.subject}\n${ticket.description}`,
      }));
    } else if (rule.triggerType === "runway_low") {
      const runway = await new AnalysisService(db).calculateRunwayAndBurn(
        userId,
      );
      if (
        runway.netBurn > 0 &&
        runway.runwayMonths !== "Infinite" &&
        runway.runwayMonths < Number(rule.triggerValue)
      ) {
        subjects = [
          {
            id: new Date().toISOString().slice(0, 10),
            title: "Review cash runway",
            detail: JSON.stringify(runway),
          },
        ];
      }
    }
    for (const subject of subjects) {
      if (created >= 5) break;
      matched++;
      const now = new Date();
      const inserted = await db
        .insert(automationRuns)
        .values({
          id: crypto.randomUUID(),
          userId,
          ruleId: rule.id,
          ruleName: rule.name,
          actionType: rule.actionType,
          subjectId: subject.id,
          dedupeKey: `${userId}:${rule.id}:${rule.triggerType}:${rule.triggerValue}:${rule.actionType}:${subject.id}`,
          status: "running",
          input: JSON.stringify(subject),
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing()
        .returning()
        .all();
      if (!inserted[0]) continue;
      created++;
      await executeRun(db, env, inserted[0], settings?.autonomy === "internal");
      await db
        .update(autopilotRules)
        .set({ lastTriggeredAt: now })
        .where(
          and(
            eq(autopilotRules.id, rule.id),
            eq(autopilotRules.userId, userId),
          ),
        )
        .run();
    }
  }
  return { matched, created };
}

export async function listAutomationRuns(db: Database, userId: string) {
  return db
    .select()
    .from(automationRuns)
    .where(eq(automationRuns.userId, userId))
    .orderBy(desc(automationRuns.createdAt))
    .limit(100)
    .all();
}

export async function reviewRun(
  env: AppEnv,
  userId: string,
  id: string,
  decision: "approve" | "dismiss" | "retry",
) {
  const db = drizzle(env.DB);
  const run = await db
    .select()
    .from(automationRuns)
    .where(and(eq(automationRuns.userId, userId), eq(automationRuns.id, id)))
    .get();
  if (!run) throw new Error("Automation run not found.");
  const expected = decision === "retry" ? "failed" : "awaiting_approval";
  if (run.status !== expected)
    throw new Error(
      `This run is ${run.status} and cannot be ${decision === "retry" ? "retried" : "reviewed"}.`,
    );
  const claimed = await db
    .update(automationRuns)
    .set({
      status: decision === "dismiss" ? "dismissed" : "running",
      error: null,
      attempts: decision === "retry" ? run.attempts + 1 : run.attempts,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(automationRuns.id, id),
        eq(automationRuns.userId, userId),
        eq(automationRuns.status, expected),
      ),
    )
    .returning()
    .all();
  if (!claimed[0])
    throw new Error(
      "Another request already reviewed this run. Refresh the activity list.",
    );
  if (decision === "dismiss") return { success: true };
  if (decision === "approve" && run.actionType !== "auto_task") {
    await db
      .update(automationRuns)
      .set({ status: "approved", updatedAt: new Date() })
      .where(eq(automationRuns.id, id))
      .run();
  } else {
    const settings = await db
      .select()
      .from(workspaceSettings)
      .where(eq(workspaceSettings.userId, userId))
      .get();
    await executeRun(
      db,
      env,
      run,
      decision === "approve" || settings?.autonomy === "internal",
    );
  }
  return { success: true };
}
