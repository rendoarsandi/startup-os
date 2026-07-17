import * as S from "@effect/schema/Schema";

// ==========================================
// Generic Helper Types
// ==========================================
export const NumericValue = S.Union(S.Number, S.String);

// ==========================================
// Accounts Endpoints Schemas
// ==========================================
export const CreateAccountSchema = S.Struct({
  name: S.String,
  type: S.String,
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
  period: S.optional(S.String),
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
  type: S.optional(S.String),
  amount: NumericValue,
  status: S.optional(S.String),
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
  status: S.String,
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
  status: S.optional(S.String),
});

// ==========================================
// Marketing Campaigns Schemas
// ==========================================
export const CreateCampaignSchema = S.Struct({
  id: S.optional(S.String),
  name: S.String,
  status: S.optional(S.String),
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
  status: S.optional(S.String),
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
  status: S.optional(S.String),
});

export const ClockOutSchema = S.Struct({
  employeeId: S.String,
});

export const LeaveRequestSchema = S.Struct({
  employeeId: S.String,
  type: S.String,
  startDate: S.String,
  endDate: S.String,
  reason: S.optional(S.NullOr(S.String)),
});

export const UpdateLeaveStatusSchema = S.Struct({
  status: S.String,
});

export const ExpenseClaimSchema = S.Struct({
  employeeId: S.String,
  title: S.String,
  amount: NumericValue,
  category: S.String,
  date: S.optional(S.String),
});

export const UpdateExpenseStatusSchema = S.Struct({
  status: S.String,
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
  status: S.optional(S.String),
  dueDate: S.optional(S.NullOr(S.String)),
});

export const ProjectTaskSchema = S.Struct({
  projectId: S.String,
  title: S.String,
  assignedEmployeeId: S.optional(S.NullOr(S.String)),
});

export const UpdateTaskStatusSchema = S.Struct({
  status: S.String,
});

export const LogTaskHoursSchema = S.Struct({
  hours: NumericValue,
});

export const SupportTicketSchema = S.Struct({
  customerName: S.String,
  subject: S.String,
  description: S.String,
  priority: S.optional(S.String),
});

export const UpdateTicketStatusSchema = S.Struct({
  status: S.String,
});

// ==========================================
// Autopilot Schemas
// ==========================================
export const AutopilotRuleSchema = S.Struct({
  id: S.optional(S.String),
  name: S.String,
  triggerType: S.String,
  triggerValue: S.String,
  actionType: S.String,
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
export const decodeCreateAccount = S.decodeUnknownSync(CreateAccountSchema);
export const decodeSaasConfig = S.decodeUnknownSync(SaasConfigSchema);
export const decodeCreateTransaction = S.decodeUnknownSync(CreateTransactionSchema);
export const decodeCreateBudget = S.decodeUnknownSync(CreateBudgetSchema);
export const decodePlaidExchangeToken = S.decodeUnknownSync(PlaidExchangeTokenSchema);
export const decodeCreateInvoice = S.decodeUnknownSync(CreateInvoiceSchema);
export const decodeParseInvoice = S.decodeUnknownSync(ParseInvoiceSchema);
export const decodeParseInvoiceSecure = S.decodeUnknownSync(ParseInvoiceSecureSchema);
export const decodeUpdateInvoiceStatus = S.decodeUnknownSync(UpdateInvoiceStatusSchema);
export const decodeCrmLead = S.decodeUnknownSync(CrmLeadSchema);
export const decodeCreateCampaign = S.decodeUnknownSync(CreateCampaignSchema);
export const decodeGenerateIdeas = S.decodeUnknownSync(GenerateIdeasSchema);
export const decodeEmployee = S.decodeUnknownSync(EmployeeSchema);
export const decodeGenerateDoc = S.decodeUnknownSync(GenerateDocSchema);
export const decodeClockIn = S.decodeUnknownSync(ClockInSchema);
export const decodeClockOut = S.decodeUnknownSync(ClockOutSchema);
export const decodeLeaveRequest = S.decodeUnknownSync(LeaveRequestSchema);
export const decodeUpdateLeaveStatus = S.decodeUnknownSync(UpdateLeaveStatusSchema);
export const decodeExpenseClaim = S.decodeUnknownSync(ExpenseClaimSchema);
export const decodeUpdateExpenseStatus = S.decodeUnknownSync(UpdateExpenseStatusSchema);
export const decodeInventoryItem = S.decodeUnknownSync(InventoryItemSchema);
export const decodeProject = S.decodeUnknownSync(ProjectSchema);
export const decodeProjectTask = S.decodeUnknownSync(ProjectTaskSchema);
export const decodeUpdateTaskStatus = S.decodeUnknownSync(UpdateTaskStatusSchema);
export const decodeLogTaskHours = S.decodeUnknownSync(LogTaskHoursSchema);
export const decodeSupportTicket = S.decodeUnknownSync(SupportTicketSchema);
export const decodeUpdateTicketStatus = S.decodeUnknownSync(UpdateTicketStatusSchema);
export const decodeAutopilotRule = S.decodeUnknownSync(AutopilotRuleSchema);
export const decodeAutopilotToggle = S.decodeUnknownSync(AutopilotToggleSchema);
export const decodeChat = S.decodeUnknownSync(ChatSchema);
