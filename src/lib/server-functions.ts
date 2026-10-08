import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { Effect } from "effect";
import { z } from "zod";
import { getRuntimeEnv } from "#runtime-env";
import { getAuth } from "../server/auth";
import { authenticated } from "../server/middleware";
import { invoke } from "../server/invoke";
import * as schema from "../server/schemas";
import type * as tables from "../db/schema";
import { settingsSchema, ruleSchema } from "./workspace-schemas";
import type { AnalysisService } from "../server/analysis";
import type { ParsedInvoiceResult } from "../server/ai";
import { getOpenRouterModel } from "../server/ai";

type Wire<T> = T extends Date
  ? string
  : T extends object
    ? { [K in keyof T]: Wire<T[K]> }
    : T;
export const getSession = createServerFn({ method: "GET" }).handler(
  async () => {
    const request = getRequest();
    const env = getRuntimeEnv();
    const session = await getAuth(
      env.DB,
      env.BETTER_AUTH_URL || new URL(request.url).origin,
      env.BETTER_AUTH_SECRET,
    ).api.getSession({ headers: request.headers });
    return session
      ? {
          user: {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
          },
        }
      : null;
  },
);

export const listAccounts = createServerFn({ method: "GET" })
  .middleware([authenticated])
  .handler(({ context }) =>
    invoke<Wire<typeof tables.financialAccounts.$inferSelect>[]>(
      context,
      "/api/accounts",
    ),
  );

export const listTransactions = createServerFn({ method: "GET" })
  .middleware([authenticated])
  .handler(({ context }) =>
    invoke<Wire<typeof tables.transactions.$inferSelect>[]>(
      context,
      "/api/transactions",
    ),
  );

export const listBudgets = createServerFn({ method: "GET" })
  .middleware([authenticated])
  .handler(({ context }) =>
    invoke<Wire<typeof tables.budgets.$inferSelect>[]>(context, "/api/budgets"),
  );

export const listInvoices = createServerFn({ method: "GET" })
  .middleware([authenticated])
  .handler(({ context }) =>
    invoke<Wire<typeof tables.invoices.$inferSelect>[]>(
      context,
      "/api/cfo/invoices",
    ),
  );

export const listEmployees = createServerFn({ method: "GET" })
  .middleware([authenticated])
  .handler(({ context }) =>
    invoke<Wire<typeof tables.employees.$inferSelect>[]>(
      context,
      "/api/hr/employees",
    ),
  );

export const listAttendance = createServerFn({ method: "GET" })
  .middleware([authenticated])
  .handler(({ context }) =>
    invoke<Wire<typeof tables.attendance.$inferSelect>[]>(
      context,
      "/api/hr/attendance",
    ),
  );

export const listLeaves = createServerFn({ method: "GET" })
  .middleware([authenticated])
  .handler(({ context }) =>
    invoke<Wire<typeof tables.leaveRequests.$inferSelect>[]>(
      context,
      "/api/hr/leaves",
    ),
  );

export const listExpenses = createServerFn({ method: "GET" })
  .middleware([authenticated])
  .handler(({ context }) =>
    invoke<Wire<typeof tables.expenseClaims.$inferSelect>[]>(
      context,
      "/api/hr/expenses",
    ),
  );

export const listLeads = createServerFn({ method: "GET" })
  .middleware([authenticated])
  .handler(({ context }) =>
    invoke<Wire<typeof tables.crmLeads.$inferSelect>[]>(
      context,
      "/api/marketing/crm",
    ),
  );

export const listCampaigns = createServerFn({ method: "GET" })
  .middleware([authenticated])
  .handler(({ context }) =>
    invoke<Wire<typeof tables.marketingCampaigns.$inferSelect>[]>(
      context,
      "/api/marketing/campaigns",
    ),
  );

export const listInventory = createServerFn({ method: "GET" })
  .middleware([authenticated])
  .handler(({ context }) =>
    invoke<Wire<typeof tables.inventoryItems.$inferSelect>[]>(
      context,
      "/api/operations/inventory",
    ),
  );

export const listProjects = createServerFn({ method: "GET" })
  .middleware([authenticated])
  .handler(({ context }) =>
    invoke<Wire<typeof tables.projects.$inferSelect>[]>(
      context,
      "/api/operations/projects",
    ),
  );

export const listTasks = createServerFn({ method: "GET" })
  .middleware([authenticated])
  .handler(({ context }) =>
    invoke<Wire<typeof tables.projectTasks.$inferSelect>[]>(
      context,
      "/api/operations/tasks",
    ),
  );

export const listTickets = createServerFn({ method: "GET" })
  .middleware([authenticated])
  .handler(({ context }) =>
    invoke<Wire<typeof tables.supportTickets.$inferSelect>[]>(
      context,
      "/api/operations/tickets",
    ),
  );

export const listRules = createServerFn({ method: "GET" })
  .middleware([authenticated])
  .handler(({ context }) =>
    invoke<Wire<typeof tables.autopilotRules.$inferSelect>[]>(
      context,
      "/api/operations/autopilot",
    ),
  );

export const listRuns = createServerFn({ method: "GET" })
  .middleware([authenticated])
  .handler(({ context }) =>
    invoke<Wire<typeof tables.automationRuns.$inferSelect>[]>(
      context,
      "/api/automation/runs",
    ),
  );

export const createAccount = createServerFn({ method: "POST" })
  .middleware([authenticated])
  .validator((input: typeof schema.CreateAccountSchema.Type) =>
    Effect.runPromise(schema.decodeCreateAccount(input)),
  )
  .handler(({ context, data }) =>
    invoke<{ success?: boolean; id?: string }>(
      context,
      "/api/accounts",
      "POST",
      data,
    ),
  );

export const createTransaction = createServerFn({ method: "POST" })
  .middleware([authenticated])
  .validator((input: typeof schema.CreateTransactionSchema.Type) =>
    Effect.runPromise(schema.decodeCreateTransaction(input)),
  )
  .handler(({ context, data }) =>
    invoke<{ success?: boolean; id?: string }>(
      context,
      "/api/transactions",
      "POST",
      data,
    ),
  );

export const createBudget = createServerFn({ method: "POST" })
  .middleware([authenticated])
  .validator((input: typeof schema.CreateBudgetSchema.Type) =>
    Effect.runPromise(schema.decodeCreateBudget(input)),
  )
  .handler(({ context, data }) =>
    invoke<{ success?: boolean; id?: string }>(
      context,
      "/api/budgets",
      "POST",
      data,
    ),
  );

export const createInvoice = createServerFn({ method: "POST" })
  .middleware([authenticated])
  .validator((input: typeof schema.CreateInvoiceSchema.Type) =>
    Effect.runPromise(schema.decodeCreateInvoice(input)),
  )
  .handler(({ context, data }) =>
    invoke<{ success?: boolean; id?: string }>(
      context,
      "/api/cfo/invoices",
      "POST",
      data,
    ),
  );

export const saveSaasConfig = createServerFn({ method: "POST" })
  .middleware([authenticated])
  .validator((input: typeof schema.SaasConfigSchema.Type) =>
    Effect.runPromise(schema.decodeSaasConfig(input)),
  )
  .handler(({ context, data }) =>
    invoke<{ success?: boolean; id?: string }>(
      context,
      "/api/cfo/saas-config",
      "POST",
      data,
    ),
  );

export const parseInvoice = createServerFn({ method: "POST" })
  .middleware([authenticated])
  .validator((input: typeof schema.ParseInvoiceSchema.Type) =>
    Effect.runPromise(schema.decodeParseInvoice(input)),
  )
  .handler(({ context, data }) =>
    invoke<ParsedInvoiceResult>(
      context,
      "/api/cfo/parse-invoice",
      "POST",
      data,
    ),
  );

export const parseInvoiceDocument = createServerFn({ method: "POST" })
  .middleware([authenticated])
  .validator((input: typeof schema.ParseInvoiceSecureSchema.Type) =>
    Effect.runPromise(schema.decodeParseInvoiceSecure(input)),
  )
  .handler(({ context, data }) =>
    invoke<ParsedInvoiceResult>(
      context,
      "/api/cfo/parse-invoice-secure",
      "POST",
      data,
    ),
  );

export const saveEmployee = createServerFn({ method: "POST" })
  .middleware([authenticated])
  .validator((input: typeof schema.EmployeeSchema.Type) =>
    Effect.runPromise(schema.decodeEmployee(input)),
  )
  .handler(({ context, data }) =>
    invoke<{ success?: boolean; id?: string }>(
      context,
      "/api/hr/employees",
      "POST",
      data,
    ),
  );

export const generateDocument = createServerFn({ method: "POST" })
  .middleware([authenticated])
  .validator((input: typeof schema.GenerateDocSchema.Type) =>
    Effect.runPromise(schema.decodeGenerateDoc(input)),
  )
  .handler(({ context, data }) =>
    invoke<{ document: string }>(context, "/api/hr/generate-doc", "POST", data),
  );

export const clockIn = createServerFn({ method: "POST" })
  .middleware([authenticated])
  .validator((input: typeof schema.ClockInSchema.Type) =>
    Effect.runPromise(schema.decodeClockIn(input)),
  )
  .handler(({ context, data }) =>
    invoke<{ success?: boolean; id?: string }>(
      context,
      "/api/hr/attendance/clock-in",
      "POST",
      data,
    ),
  );

export const clockOut = createServerFn({ method: "POST" })
  .middleware([authenticated])
  .validator((input: typeof schema.ClockOutSchema.Type) =>
    Effect.runPromise(schema.decodeClockOut(input)),
  )
  .handler(({ context, data }) =>
    invoke<{ success?: boolean; id?: string }>(
      context,
      "/api/hr/attendance/clock-out",
      "POST",
      data,
    ),
  );

export const createLeave = createServerFn({ method: "POST" })
  .middleware([authenticated])
  .validator((input: typeof schema.LeaveRequestSchema.Type) =>
    Effect.runPromise(schema.decodeLeaveRequest(input)),
  )
  .handler(({ context, data }) =>
    invoke<{ success?: boolean; id?: string }>(
      context,
      "/api/hr/leaves",
      "POST",
      data,
    ),
  );

export const createExpense = createServerFn({ method: "POST" })
  .middleware([authenticated])
  .validator((input: typeof schema.ExpenseClaimSchema.Type) =>
    Effect.runPromise(schema.decodeExpenseClaim(input)),
  )
  .handler(({ context, data }) =>
    invoke<{ success?: boolean; id?: string }>(
      context,
      "/api/hr/expenses",
      "POST",
      data,
    ),
  );

export const createLead = createServerFn({ method: "POST" })
  .middleware([authenticated])
  .validator((input: typeof schema.CrmLeadSchema.Type) =>
    Effect.runPromise(schema.decodeCrmLead(input)),
  )
  .handler(({ context, data }) =>
    invoke<{ success?: boolean; id?: string }>(
      context,
      "/api/marketing/crm",
      "POST",
      data,
    ),
  );

export const saveCampaign = createServerFn({ method: "POST" })
  .middleware([authenticated])
  .validator((input: typeof schema.CreateCampaignSchema.Type) =>
    Effect.runPromise(schema.decodeCreateCampaign(input)),
  )
  .handler(({ context, data }) =>
    invoke<{ success?: boolean; id?: string }>(
      context,
      "/api/marketing/campaigns",
      "POST",
      data,
    ),
  );

export const generateIdeas = createServerFn({ method: "POST" })
  .middleware([authenticated])
  .validator((input: typeof schema.GenerateIdeasSchema.Type) =>
    Effect.runPromise(schema.decodeGenerateIdeas(input)),
  )
  .handler(({ context, data }) =>
    invoke<{ ideas: string }>(
      context,
      "/api/marketing/generate-ideas",
      "POST",
      data,
    ),
  );

export const saveInventory = createServerFn({ method: "POST" })
  .middleware([authenticated])
  .validator((input: typeof schema.InventoryItemSchema.Type) =>
    Effect.runPromise(schema.decodeInventoryItem(input)),
  )
  .handler(({ context, data }) =>
    invoke<{ success?: boolean; id?: string }>(
      context,
      "/api/operations/inventory",
      "POST",
      data,
    ),
  );

export const createProject = createServerFn({ method: "POST" })
  .middleware([authenticated])
  .validator((input: typeof schema.ProjectSchema.Type) =>
    Effect.runPromise(schema.decodeProject(input)),
  )
  .handler(({ context, data }) =>
    invoke<Wire<typeof tables.projects.$inferSelect>>(
      context,
      "/api/operations/projects",
      "POST",
      data,
    ),
  );

export const createTask = createServerFn({ method: "POST" })
  .middleware([authenticated])
  .validator((input: typeof schema.ProjectTaskSchema.Type) =>
    Effect.runPromise(schema.decodeProjectTask(input)),
  )
  .handler(({ context, data }) =>
    invoke<{ success?: boolean; id?: string }>(
      context,
      "/api/operations/tasks",
      "POST",
      data,
    ),
  );

export const createTicket = createServerFn({ method: "POST" })
  .middleware([authenticated])
  .validator((input: typeof schema.SupportTicketSchema.Type) =>
    Effect.runPromise(schema.decodeSupportTicket(input)),
  )
  .handler(({ context, data }) =>
    invoke<{ success?: boolean; id?: string }>(
      context,
      "/api/operations/tickets",
      "POST",
      data,
    ),
  );

export const exchangeBankToken = createServerFn({ method: "POST" })
  .middleware([authenticated])
  .validator((input: typeof schema.PlaidExchangeTokenSchema.Type) =>
    Effect.runPromise(schema.decodePlaidExchangeToken(input)),
  )
  .handler(({ context, data }) =>
    invoke<{ success: boolean; itemId: string }>(
      context,
      "/api/plaid/exchange-token",
      "POST",
      data,
    ),
  );

export const sendChat = createServerFn({ method: "POST" })
  .middleware([authenticated])
  .validator((input: typeof schema.ChatSchema.Type) =>
    Effect.runPromise(schema.decodeChat(input)),
  )
  .handler(({ context, data }) =>
    invoke<{ response: string }>(context, "/api/chat", "POST", data),
  );

export const updateInvoiceStatus = createServerFn({ method: "POST" })
  .middleware([authenticated])
  .validator(
    async (input: {
      id: string;
      payload: typeof schema.UpdateInvoiceStatusSchema.Type;
    }) => ({
      id: z.string().min(1).parse(input.id),
      payload: await Effect.runPromise(
        schema.decodeUpdateInvoiceStatus(input.payload),
      ),
    }),
  )
  .handler(({ context, data }) =>
    invoke<{ success: boolean }>(
      context,
      "/api/cfo/invoices/" + encodeURIComponent(data.id) + "/status",
      "PUT",
      data.payload,
    ),
  );

export const updateLead = createServerFn({ method: "POST" })
  .middleware([authenticated])
  .validator(
    async (input: {
      id: string;
      payload: typeof schema.CrmLeadSchema.Type;
    }) => ({
      id: z.string().min(1).parse(input.id),
      payload: await Effect.runPromise(schema.decodeCrmLead(input.payload)),
    }),
  )
  .handler(({ context, data }) =>
    invoke<{ success: boolean }>(
      context,
      "/api/marketing/crm/" + encodeURIComponent(data.id) + "",
      "PUT",
      data.payload,
    ),
  );

export const updateLeaveStatus = createServerFn({ method: "POST" })
  .middleware([authenticated])
  .validator(
    async (input: {
      id: string;
      payload: typeof schema.UpdateLeaveStatusSchema.Type;
    }) => ({
      id: z.string().min(1).parse(input.id),
      payload: await Effect.runPromise(
        schema.decodeUpdateLeaveStatus(input.payload),
      ),
    }),
  )
  .handler(({ context, data }) =>
    invoke<{ success: boolean }>(
      context,
      "/api/hr/leaves/" + encodeURIComponent(data.id) + "/status",
      "PUT",
      data.payload,
    ),
  );

export const updateExpenseStatus = createServerFn({ method: "POST" })
  .middleware([authenticated])
  .validator(
    async (input: {
      id: string;
      payload: typeof schema.UpdateExpenseStatusSchema.Type;
    }) => ({
      id: z.string().min(1).parse(input.id),
      payload: await Effect.runPromise(
        schema.decodeUpdateExpenseStatus(input.payload),
      ),
    }),
  )
  .handler(({ context, data }) =>
    invoke<{ success: boolean }>(
      context,
      "/api/hr/expenses/" + encodeURIComponent(data.id) + "/status",
      "PUT",
      data.payload,
    ),
  );

export const updateTaskStatus = createServerFn({ method: "POST" })
  .middleware([authenticated])
  .validator(
    async (input: {
      id: string;
      payload: typeof schema.UpdateTaskStatusSchema.Type;
    }) => ({
      id: z.string().min(1).parse(input.id),
      payload: await Effect.runPromise(
        schema.decodeUpdateTaskStatus(input.payload),
      ),
    }),
  )
  .handler(({ context, data }) =>
    invoke<{ success: boolean }>(
      context,
      "/api/operations/tasks/" + encodeURIComponent(data.id) + "/status",
      "PUT",
      data.payload,
    ),
  );

export const logTaskHours = createServerFn({ method: "POST" })
  .middleware([authenticated])
  .validator(
    async (input: {
      id: string;
      payload: typeof schema.LogTaskHoursSchema.Type;
    }) => ({
      id: z.string().min(1).parse(input.id),
      payload: await Effect.runPromise(
        schema.decodeLogTaskHours(input.payload),
      ),
    }),
  )
  .handler(({ context, data }) =>
    invoke<{ success: boolean }>(
      context,
      "/api/operations/tasks/" + encodeURIComponent(data.id) + "/log-hours",
      "POST",
      data.payload,
    ),
  );

export const updateTicketStatus = createServerFn({ method: "POST" })
  .middleware([authenticated])
  .validator(
    async (input: {
      id: string;
      payload: typeof schema.UpdateTicketStatusSchema.Type;
    }) => ({
      id: z.string().min(1).parse(input.id),
      payload: await Effect.runPromise(
        schema.decodeUpdateTicketStatus(input.payload),
      ),
    }),
  )
  .handler(({ context, data }) =>
    invoke<{ success: boolean }>(
      context,
      "/api/operations/tickets/" + encodeURIComponent(data.id) + "/status",
      "PUT",
      data.payload,
    ),
  );

export const getRunway = createServerFn({ method: "GET" })
  .middleware([authenticated])
  .handler(({ context }) =>
    invoke<Awaited<ReturnType<AnalysisService["calculateRunwayAndBurn"]>>>(
      context,
      "/api/cfo/runway",
    ),
  );
export const getSaasConfig = createServerFn({ method: "GET" })
  .middleware([authenticated])
  .handler(({ context }) =>
    invoke<{
      startingMrr: number;
      churnRate: number;
      cac: number;
      arpu: number;
    }>(context, "/api/cfo/saas-config"),
  );
export const getSettings = createServerFn({ method: "GET" })
  .middleware([authenticated])
  .handler(({ context }) =>
    invoke<z.infer<typeof settingsSchema>>(context, "/api/workspace/settings"),
  );
export const saveSettings = createServerFn({ method: "POST" })
  .middleware([authenticated])
  .validator(settingsSchema)
  .handler(({ context, data }) =>
    invoke<z.infer<typeof settingsSchema>>(
      context,
      "/api/workspace/settings",
      "PUT",
      data,
    ),
  );
export const getIntegrations = createServerFn({ method: "GET" })
  .middleware([authenticated])
  .handler(({ context }) =>
    invoke<{
      ai: boolean;
      provider: string | null;
      model: string;
      banking: boolean;
      scheduled: boolean;
      delivery: boolean;
    }>(context, "/api/workspace/integrations"),
  );
export const getModelDetails = createServerFn({ method: "GET" })
  .middleware([authenticated])
  .handler(async ({ context }) => {
    const model = await getOpenRouterModel(context.env);
    return model;
  });
export const saveRule = createServerFn({ method: "POST" })
  .middleware([authenticated])
  .validator(ruleSchema)
  .handler(({ context, data }) =>
    invoke<Wire<typeof tables.autopilotRules.$inferSelect>>(
      context,
      "/api/operations/autopilot",
      "POST",
      data,
    ),
  );
export const toggleRule = createServerFn({ method: "POST" })
  .middleware([authenticated])
  .validator(z.object({ id: z.string().min(1), active: z.boolean() }))
  .handler(({ context, data }) =>
    invoke<{ success: boolean }>(
      context,
      "/api/operations/autopilot/" + encodeURIComponent(data.id) + "/toggle",
      "PUT",
      { active: data.active },
    ),
  );
export const deleteRule = createServerFn({ method: "POST" })
  .middleware([authenticated])
  .validator(z.object({ id: z.string().min(1) }))
  .handler(({ context, data }) =>
    invoke<{ success: boolean }>(
      context,
      "/api/operations/autopilot/" + encodeURIComponent(data.id),
      "DELETE",
    ),
  );
export const runChecks = createServerFn({ method: "POST" })
  .middleware([authenticated])
  .handler(({ context }) =>
    invoke<{ matched: number; created: number }>(
      context,
      "/api/operations/autopilot/run-checks",
      "POST",
    ),
  );
export const reviewRun = createServerFn({ method: "POST" })
  .middleware([authenticated])
  .validator(
    z.object({
      id: z.string().min(1),
      decision: z.enum(["approve", "dismiss", "retry"]),
    }),
  )
  .handler(({ context, data }) =>
    invoke<{ success: boolean }>(
      context,
      "/api/automation/runs/" + encodeURIComponent(data.id) + "/review",
      "POST",
      { decision: data.decision },
    ),
  );
export const createBankLink = createServerFn({ method: "POST" })
  .middleware([authenticated])
  .handler(({ context }) =>
    invoke<{ linkToken: string }>(
      context,
      "/api/plaid/create-link-token",
      "POST",
    ),
  );
export const syncBank = createServerFn({ method: "POST" })
  .middleware([authenticated])
  .handler(({ context }) =>
    invoke<{
      success: boolean;
      accountsSynced: number;
      newTransactionsSynced: number;
    }>(context, "/api/plaid/sync-transactions", "POST"),
  );
