import * as S from "effect/Schema";

// ==========================================
// Generic Helper Types
// ==========================================
export const NumericValue = S.Finite;

// ==========================================
// Accounts Endpoints Schemas
// ==========================================
export const CreateAccountSchema = S.Struct({
  name: S.String,
  type: S.Literal("checking", "savings", "credit", "cash", "investment", "other"),
  balance: S.optional(S.Number),
  currency: S.optional(S.String),
});

export const SaasConfigSchema = S.Struct({
  startingMrr: NumericValue,
  churnRate: NumericValue,
  cac: NumericValue,
  arpu: NumericValue,
});

// ==========================================
// Transactions Endpoints Schemas
// ==========================================
export const CreateTransactionSchema = S.Struct({
  accountId: S.String,
  amount: S.Number,
  category: S.optional(S.String),
  merchant: S.optional(S.String),
  description: S.optional(S.String),
  date: S.optional(S.Union(S.String, S.Number)),
});

export const CreateBudgetSchema = S.Struct({
  category: S.String,
  amount: S.Number,
  period: S.optional(S.Literal("monthly", "quarterly", "annual")),
});

// ==========================================
// Plaid Endpoints Schemas
// ==========================================
export const PlaidExchangeTokenSchema = S.Struct({
  publicToken: S.String,
  institutionName: S.optional(S.String),
});

// ==========================================
// Invoice Endpoints Schemas
// ==========================================
export const CreateInvoiceSchema = S.Struct({
  invoiceNumber: S.optional(S.String),
  clientName: S.String,
  type: S.optional(S.Literal("sales", "purchase")),
  amount: NumericValue,
  status: S.optional(S.Literal("paid", "unpaid", "overdue")),
  issueDate: S.optional(S.String),
  dueDate: S.optional(S.String),
  items: S.optional(S.Union(S.String, S.Array(S.Any))),
});

export const ParseInvoiceSchema = S.Struct({
  text: S.String,
});

export const ParseInvoiceSecureSchema = S.Struct({
  fileBase64: S.String,
  mimeType: S.String,
});

export const UpdateInvoiceStatusSchema = S.Struct({
  status: S.Literal("paid", "unpaid", "overdue"),
});

// ==========================================
// CRM Endpoints Schemas
// ==========================================
export const CrmLeadSchema = S.Struct({
  name: S.String,
  company: S.String,
  email: S.optional(S.NullOr(S.String)),
  phone: S.optional(S.NullOr(S.String)),
  value: S.optional(NumericValue),
  status: S.optional(S.Literal("lead", "contacted", "proposal", "won", "lost")),
});

// ==========================================
// Marketing Campaigns Schemas
// ==========================================
export const CreateCampaignSchema = S.Struct({
  id: S.optional(S.String),
  name: S.String,
  status: S.optional(S.Literal("active", "paused")),
  budget: S.optional(NumericValue),
  spend: S.optional(NumericValue),
  conversions: S.optional(NumericValue),
  roas: S.optional(NumericValue),
});

export const GenerateIdeasSchema = S.Struct({
  productDescription: S.String,
  targetAudience: S.String,
});

// ==========================================
// HR Employees & Attendance Schemas
// ==========================================
export const EmployeeSchema = S.Struct({
  id: S.optional(S.String),
  name: S.String,
  role: S.String,
  department: S.String,
  salary: NumericValue,
  status: S.optional(S.Literal("active", "onboarding", "inactive")),
  startDate: S.optional(S.String),
});

export const GenerateDocSchema = S.Struct({
  docType: S.String,
  title: S.String,
  department: S.String,
  salary: S.Union(S.String, S.Number),
  details: S.optional(S.String),
});

export const ClockInSchema = S.Struct({
  employeeId: S.String,
  status: S.optional(S.Literal("present", "late")),
});

export const ClockOutSchema = S.Struct({
  employeeId: S.String,
});

export const LeaveRequestSchema = S.Struct({
  employeeId: S.String,
  type: S.Literal("vacation", "sick", "unpaid", "maternity"),
  startDate: S.String,
  endDate: S.String,
  reason: S.optional(S.NullOr(S.String)),
});

export const UpdateLeaveStatusSchema = S.Struct({
  status: S.Literal("pending", "approved", "rejected"),
});

export const ExpenseClaimSchema = S.Struct({
  employeeId: S.String,
  title: S.String,
  amount: NumericValue,
  category: S.Literal("travel", "meals", "supplies", "software", "other"),
  date: S.optional(S.String),
});

export const UpdateExpenseStatusSchema = S.Struct({
  status: S.Literal("pending", "approved", "rejected"),
});

// ==========================================
// Operations & Project Management Schemas
// ==========================================
export const InventoryItemSchema = S.Struct({
  sku: S.String,
  name: S.optional(S.String),
  qty: S.optional(NumericValue),
  rate: S.optional(NumericValue),
  warehouse: S.optional(S.String),
  reorderLevel: S.optional(NumericValue),
});

export const ProjectSchema = S.Struct({
  name: S.String,
  description: S.optional(S.NullOr(S.String)),
  status: S.optional(S.Literal("active", "completed", "onhold")),
  dueDate: S.optional(S.NullOr(S.String)),
});

export const ProjectTaskSchema = S.Struct({
  projectId: S.String,
  title: S.String,
  assignedEmployeeId: S.optional(S.NullOr(S.String)),
});

export const UpdateTaskStatusSchema = S.Struct({
  status: S.Literal("todo", "inprogress", "completed"),
});

export const LogTaskHoursSchema = S.Struct({
  hours: S.NonNegative,
});

export const SupportTicketSchema = S.Struct({
  customerName: S.String,
  subject: S.String,
  description: S.String,
  priority: S.optional(S.Literal("low", "medium", "high")),
});

export const UpdateTicketStatusSchema = S.Struct({
  status: S.Literal("open", "replied", "resolved"),
});

// ==========================================
// Contracts Schemas
// ==========================================
export const CreateContractSchema = S.Struct({
  title: S.String,
  description: S.optional(S.NullOr(S.String)),
  status: S.optional(S.Literal("draft", "active", "completed", "terminated")),
  value: S.optional(NumericValue), // stored in cents
  clientId: S.optional(S.NullOr(S.String)),
  startDate: S.optional(S.NullOr(S.String)), // expects ISO format date-time string
  endDate: S.optional(S.NullOr(S.String)),
});

export const UpdateContractSchema = S.Struct({
  title: S.optional(S.String),
  description: S.optional(S.NullOr(S.String)),
  status: S.optional(S.Literal("draft", "active", "completed", "terminated")),
  value: S.optional(NumericValue),
  clientId: S.optional(S.NullOr(S.String)),
  startDate: S.optional(S.NullOr(S.String)),
  endDate: S.optional(S.NullOr(S.String)),
});

// ==========================================
// Autopilot Schemas
// ==========================================
export const AutopilotRuleSchema = S.Struct({
  id: S.optional(S.String),
  name: S.String,
  triggerType: S.Literal("runway_low", "low_stock", "high_priority_ticket", "mrr_surge"),
  triggerValue: S.String,
  actionType: S.Literal("ai_audit", "auto_task", "ai_reply", "webhook_alert"),
  actionTarget: S.optional(S.String),
  active: S.optional(S.Boolean),
  lastTriggeredAt: S.optional(S.NullOr(S.String)),
});

export const AutopilotToggleSchema = S.Struct({
  active: S.Boolean,
});

// ==========================================
// AI Chat Schema
// ==========================================
export const ChatSchema = S.Struct({
  message: S.String,
  history: S.optional(S.Array(S.Any)),
  role: S.optional(S.String),
  activeScenario: S.optional(S.Any),
});

// ==========================================
// Decoders
// ==========================================
export const decodeCreateAccount = S.decodeUnknown(CreateAccountSchema);
export const decodeSaasConfig = S.decodeUnknown(SaasConfigSchema);
export const decodeCreateTransaction = S.decodeUnknown(CreateTransactionSchema);
export const decodeCreateBudget = S.decodeUnknown(CreateBudgetSchema);
export const decodePlaidExchangeToken = S.decodeUnknown(PlaidExchangeTokenSchema);
export const decodeCreateInvoice = S.decodeUnknown(CreateInvoiceSchema);
export const decodeParseInvoice = S.decodeUnknown(ParseInvoiceSchema);
export const decodeParseInvoiceSecure = S.decodeUnknown(ParseInvoiceSecureSchema);
export const decodeUpdateInvoiceStatus = S.decodeUnknown(UpdateInvoiceStatusSchema);
export const decodeCrmLead = S.decodeUnknown(CrmLeadSchema);
export const decodeCreateCampaign = S.decodeUnknown(CreateCampaignSchema);
export const decodeGenerateIdeas = S.decodeUnknown(GenerateIdeasSchema);
export const decodeEmployee = S.decodeUnknown(EmployeeSchema);
export const decodeGenerateDoc = S.decodeUnknown(GenerateDocSchema);
export const decodeClockIn = S.decodeUnknown(ClockInSchema);
export const decodeClockOut = S.decodeUnknown(ClockOutSchema);
export const decodeLeaveRequest = S.decodeUnknown(LeaveRequestSchema);
export const decodeUpdateLeaveStatus = S.decodeUnknown(UpdateLeaveStatusSchema);
export const decodeExpenseClaim = S.decodeUnknown(ExpenseClaimSchema);
export const decodeUpdateExpenseStatus = S.decodeUnknown(UpdateExpenseStatusSchema);
export const decodeInventoryItem = S.decodeUnknown(InventoryItemSchema);
export const decodeProject = S.decodeUnknown(ProjectSchema);
export const decodeProjectTask = S.decodeUnknown(ProjectTaskSchema);
export const decodeUpdateTaskStatus = S.decodeUnknown(UpdateTaskStatusSchema);
export const decodeLogTaskHours = S.decodeUnknown(LogTaskHoursSchema);
export const decodeSupportTicket = S.decodeUnknown(SupportTicketSchema);
export const decodeUpdateTicketStatus = S.decodeUnknown(UpdateTicketStatusSchema);
export const decodeAutopilotRule = S.decodeUnknown(AutopilotRuleSchema);
export const decodeAutopilotToggle = S.decodeUnknown(AutopilotToggleSchema);
export const decodeChat = S.decodeUnknown(ChatSchema);
export const decodeCreateContract = S.decodeUnknown(CreateContractSchema);
export const decodeUpdateContract = S.decodeUnknown(UpdateContractSchema);

