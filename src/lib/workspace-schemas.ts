import { z } from "zod";
export const settingsSchema = z.object({
  companyName: z.string().trim().max(160),
  companyDescription: z.string().trim().max(4000),
  autonomy: z.enum(["review", "internal"]),
});
export const ruleSchema = z
  .object({
    id: z.string().min(1).optional(),
    name: z.string().trim().min(1).max(160),
    triggerType: z.enum(["runway_low", "low_stock", "high_priority_ticket"]),
    triggerValue: z.string().max(20),
    actionType: z.enum(["auto_task", "ai_audit", "ai_reply"]),
    active: z.boolean().default(true),
  })
  .superRefine((rule, ctx) => {
    if (
      rule.triggerType !== "high_priority_ticket" &&
      (!Number.isFinite(Number(rule.triggerValue)) ||
        Number(rule.triggerValue) <= 0)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["triggerValue"],
        message: "Enter a positive threshold.",
      });
    }
    if (
      rule.actionType === "ai_reply" &&
      rule.triggerType !== "high_priority_ticket"
    )
      ctx.addIssue({
        code: "custom",
        message: "Support drafts require a high-priority ticket trigger.",
      });
    if (rule.actionType === "ai_audit" && rule.triggerType !== "runway_low")
      ctx.addIssue({
        code: "custom",
        message: "Cash audits require a runway trigger.",
      });
  });
