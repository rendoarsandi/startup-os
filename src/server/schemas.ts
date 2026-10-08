import * as S from "effect/Schema";

// ==========================================
// Generic Helper Types
// ==========================================
export const NumericValue = S.Finite;
const Money = S.Number.pipe(S.int(), S.between(0, Number.MAX_SAFE_INTEGER));
const SignedMoney = S.Number.pipe(S.int(), S.between(-Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER));
const Label = S.String.pipe(S.minLength(1), S.maxLength(160), S.pattern(/\S/));
const DateValue = S.String.pipe(S.filter(value => Number.isFinite(Date.parse(value)), { message: () => 'Enter a valid date.' }));

// ==========================================
// Accounts Endpoints Schemas
// ==========================================
export const CreateAccountSchema = S.Struct({
  name: Label,
  type: S.Literal("checking", "savings", "credit", "cash", "investment", "other"),
  balance: S.optional(SignedMoney),
  currency: S.optional(S.Literal("USD")),
});

export const SaasConfigSchema = S.Struct({
  startingMrr: Money,
  churnRate: S.Number.pipe(S.between(0, 10000)),
  cac: Money,
  arpu: Money,
});

// ==========================================
// Transactions Endpoints Schemas
// ==========================================
export const CreateTransactionSchema = S.Struct({
  accountId: Label,
  amount: SignedMoney,
  category: S.optional(S.String),
  merchant: S.optional(S.String),
  description: S.optional(S.String),
  date: S.optional(S.Union(DateValue, S.Finite.pipe(S.filter(value => Number.isFinite(new Date(value).getTime()))))),
});

export const CreateBudgetSchema = S.Struct({
  category: Label,
  amount: Money,
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
  clientName: Label,
  type: S.optional(S.Literal("sales", "purchase")),
  amount: Money,
  status: S.optional(S.Literal("paid", "unpaid", "overdue")),
  issueDate: S.optional(DateValue),
  dueDate: S.optional(DateValue),
  items: S.optional(S.Union(S.String, S.Array(S.Any))),
});

export const ParseInvoiceSchema = S.Struct({
  text: S.String,
});

export const ParseInvoiceSecureSchema = S.Struct({
  fileBase64: S.String.pipe(S.minLength(1), S.maxLength(10_000_000)),
  mimeType: S.Literal("image/jpeg", "image/png", "image/webp", "application/pdf"),
});

export const UpdateInvoiceStatusSchema = S.Struct({
  status: S.Literal("paid", "unpaid", "overdue"),
});

// ==========================================
// CRM Endpoints Schemas
// ==========================================
export const CrmLeadSchema = S.Struct({
  name: Label,
  company: S.String,
  email: S.optional(S.NullOr(S.String)),
  phone: S.optional(S.NullOr(S.String)),
  value: S.optional(Money),
  status: S.optional(S.Literal("lead", "contacted", "proposal", "won", "lost")),
});

// ==========================================
// Marketing Campaigns Schemas
// ==========================================
export const CreateCampaignSchema = S.Struct({
  id: S.optional(S.String),
  name: Label,
  status: S.optional(S.Literal("active", "paused")),
  budget: S.optional(Money),
  spend: S.optional(Money),
  conversions: S.optional(Money),
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
  name: Label,
  role: Label,
  department: Label,
  salary: Money,
  status: S.optional(S.Literal("active", "onboarding", "inactive")),
  startDate: S.optional(DateValue),
});

export const GenerateDocSchema = S.Struct({
  docType: S.String,
  title: Label,
  department: Label,
  salary: S.Union(S.String, S.Number),
  details: S.optional(S.String),
});

export const ClockInSchema = S.Struct({
  employeeId: Label,
  status: S.optional(S.Literal("present", "late")),
});

export const ClockOutSchema = S.Struct({
  employeeId: Label,
});

export const LeaveRequestSchema = S.Struct({
  employeeId: Label,
  type: S.Literal("vacation", "sick", "unpaid", "maternity"),
  startDate: DateValue,
  endDate: DateValue,
  reason: S.optional(S.NullOr(S.String)),
});

export const UpdateLeaveStatusSchema = S.Struct({
  status: S.Literal("pending", "approved", "rejected"),
});

export const ExpenseClaimSchema = S.Struct({
  employeeId: Label,
  title: Label,
  amount: Money,
  category: S.Literal("travel", "meals", "supplies", "software", "other"),
  date: S.optional(DateValue),
});

export const UpdateExpenseStatusSchema = S.Struct({
  status: S.Literal("pending", "approved", "rejected"),
});

// ==========================================
// Operations & Project Management Schemas
// ==========================================
export const InventoryItemSchema = S.Struct({
  sku: Label,
  name: S.optional(S.String),
  qty: S.optional(Money),
  rate: S.optional(Money),
  warehouse: S.optional(S.String),
  reorderLevel: S.optional(Money),
});

export const ProjectSchema = S.Struct({
  name: Label,
  description: S.optional(S.NullOr(S.String)),
  status: S.optional(S.Literal("active", "completed", "on_hold")),
  dueDate: S.optional(S.NullOr(DateValue)),
});

export const ProjectTaskSchema = S.Struct({
  projectId: Label,
  title: Label,
  assignedEmployeeId: S.optional(S.NullOr(S.String)),
});

export const UpdateTaskStatusSchema = S.Struct({
  status: S.Literal("todo", "in_progress", "done"),
});

export const LogTaskHoursSchema = S.Struct({
  hours: S.Finite.pipe(S.between(0, 10000)),
});

export const SupportTicketSchema = S.Struct({
  customerName: Label,
  subject: Label,
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
  title: Label,
  description: S.optional(S.NullOr(S.String)),
  status: S.optional(S.Literal("draft", "active", "completed", "terminated")),
  value: S.optional(Money), // stored in cents
  clientId: S.optional(S.NullOr(S.String)),
  startDate: S.optional(S.NullOr(S.String)), // expects ISO format date-time string
  endDate: S.optional(S.NullOr(S.String)),
});

export const UpdateContractSchema = S.Struct({
  title: S.optional(S.String),
  description: S.optional(S.NullOr(S.String)),
  status: S.optional(S.Literal("draft", "active", "completed", "terminated")),
  value: S.optional(Money),
  clientId: S.optional(S.NullOr(S.String)),
  startDate: S.optional(S.NullOr(S.String)),
  endDate: S.optional(S.NullOr(S.String)),
});

// ==========================================
// Autopilot Schemas
// ==========================================
export const AutopilotRuleSchema = S.Struct({
  id: S.optional(S.String),
  name: Label,
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
  message: S.String.pipe(S.minLength(1), S.maxLength(16000)),
  history: S.optional(S.Array(S.Struct({ role: S.Literal("user", "model"), parts: S.Array(S.Struct({ text: S.String.pipe(S.maxLength(16000)) })) })).pipe(S.maxItems(30))),
  role: S.optional(S.Literal("cfo", "marketer", "hr", "operations")),
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

