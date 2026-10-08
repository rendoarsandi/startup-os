import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import App from "../App";
import { sessionOptions } from "../lib/query-options";

export const Route = createFileRoute("/app")({
  validateSearch: z.object({
    role: z.enum(["cfo", "marketer", "hr", "operations"]).catch("cfo"),
    view: z
      .enum([
        "automation",
        "settings",
        "ai-boardroom",
        "dashboard",
        "overview",
        "invoices",
        "ledger",
        "budgets",
        "forecasting",
        "saas-economics",
        "crm",
        "campaigns",
        "funnel",
        "boardroom",
        "roster",
        "documents",
        "attendance",
        "leaves",
        "expenses",
        "inventory",
        "projects",
        "tickets",
      ])
      .catch("automation"),
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(sessionOptions),
  component: App,
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] }),
});
