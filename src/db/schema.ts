import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull(),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const sessions = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
});

export const accounts = sqliteTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const verifications = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
});

// Financial Tables
export const plaidConnections = sqliteTable('plaid_connection', {
  id: text('id').primaryKey(), // Generated UUID
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  accessToken: text('access_token').notNull(), // Secure Plaid access token
  itemId: text('item_id').notNull(), // Plaid Item ID
  institutionName: text('institution_name'), // e.g. Chase, SVB, BofA
  status: text('status').notNull().default('active'), // 'active', 'error'
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const financialAccounts = sqliteTable('financial_account', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'checking', 'savings', 'credit', etc.
  balance: integer('balance').notNull().default(0), // in cents
  currency: text('currency').notNull().default('USD'),
  plaidAccountId: text('plaid_account_id'),
  plaidConnectionId: text('plaid_connection_id')
    .references(() => plaidConnections.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const transactions = sqliteTable('transaction', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  accountId: text('account_id')
    .notNull()
    .references(() => financialAccounts.id),
  amount: integer('amount').notNull(), // in cents, negative for expense
  category: text('category').notNull(),
  merchant: text('merchant').notNull(),
  description: text('description'),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  plaidTransactionId: text('plaid_transaction_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const budgets = sqliteTable('budget', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  category: text('category').notNull(),
  amount: integer('amount').notNull(), // monthly limit in cents
  period: text('period').notNull().default('monthly'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const marketingCampaigns = sqliteTable('marketing_campaign', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  name: text('name').notNull(),
  status: text('status').notNull().default('active'),
  budget: integer('budget').notNull(), // in cents
  spend: integer('spend').notNull().default(0), // in cents
  conversions: integer('conversions').notNull().default(0),
  roas: integer('roas').notNull().default(0), // multiplied by 100
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const employees = sqliteTable('employee', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  name: text('name').notNull(),
  role: text('role').notNull(),
  department: text('department').notNull(),
  salary: integer('salary').notNull(), // in cents
  status: text('status').notNull().default('active'),
  startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const saasConfigs = sqliteTable('saas_config', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => users.id),
  startingMrr: integer('starting_mrr').notNull().default(0), // in cents
  churnRate: integer('churn_rate').notNull().default(0), // multiplied by 100 (e.g. 250 = 2.50%)
  cac: integer('cac').notNull().default(0), // in cents
  arpu: integer('arpu').notNull().default(0), // in cents
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const invoices = sqliteTable('invoice', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  invoiceNumber: text('invoice_number').notNull(),
  clientName: text('client_name').notNull(),
  type: text('type').notNull().default('sales'), // 'sales' or 'purchase'
  amount: integer('amount').notNull(), // in cents
  status: text('status').notNull().default('unpaid'), // 'paid', 'unpaid', 'overdue'
  issueDate: integer('issue_date', { mode: 'timestamp' }).notNull(),
  dueDate: integer('due_date', { mode: 'timestamp' }).notNull(),
  items: text('items').notNull(), // JSON string representing array of items: { description: string, qty: number, rate: number }
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const crmLeads = sqliteTable('crm_lead', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  company: text('company').notNull(),
  email: text('email'),
  phone: text('phone'),
  value: integer('value').notNull().default(0), // in cents
  status: text('status').notNull().default('lead'), // 'lead', 'contacted', 'proposal', 'won', 'lost'
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const attendance = sqliteTable('attendance', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  employeeId: text('employee_id').notNull().references(() => employees.id),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  status: text('status').notNull().default('present'), // 'present', 'absent', 'late'
  clockIn: text('clock_in'),
  clockOut: text('clock_out'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const leaveRequests = sqliteTable('leave_request', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  employeeId: text('employee_id').notNull().references(() => employees.id),
  type: text('type').notNull(), // 'vacation', 'sick', 'unpaid', 'maternity'
  startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
  endDate: integer('end_date', { mode: 'timestamp' }).notNull(),
  status: text('status').notNull().default('pending'), // 'pending', 'approved', 'rejected'
  reason: text('reason'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const expenseClaims = sqliteTable('expense_claim', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  employeeId: text('employee_id').notNull().references(() => employees.id),
  title: text('title').notNull(),
  amount: integer('amount').notNull(), // in cents
  category: text('category').notNull(), // 'travel', 'meals', 'supplies', 'software', 'other'
  status: text('status').notNull().default('pending'), // 'pending', 'approved', 'rejected'
  date: integer('date', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const inventoryItems = sqliteTable('inventory_item', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  sku: text('sku').notNull(),
  name: text('name').notNull(),
  qty: integer('qty').notNull().default(0),
  rate: integer('rate').notNull(), // unit purchase rate in cents
  warehouse: text('warehouse').notNull().default('Main Warehouse'),
  reorderLevel: integer('reorder_level').notNull().default(10),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => [
  uniqueIndex('inventory_item_user_sku_idx').on(table.userId, table.sku)
]);

export const projects = sqliteTable('project', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status').notNull().default('active'), // 'active', 'completed', 'onhold'
  dueDate: integer('due_date', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const projectTasks = sqliteTable('project_task', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  projectId: text('project_id').notNull().references(() => projects.id),
  title: text('title').notNull(),
  assignedEmployeeId: text('assigned_employee_id').references(() => employees.id),
  status: text('status').notNull().default('todo'), // 'todo', 'inprogress', 'completed'
  hoursLogged: integer('hours_logged').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const supportTickets = sqliteTable('support_ticket', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  customerName: text('customer_name').notNull(),
  subject: text('subject').notNull(),
  description: text('description').notNull(),
  status: text('status').notNull().default('open'), // 'open', 'replied', 'resolved'
  priority: text('priority').notNull().default('medium'), // 'low', 'medium', 'high'
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const autopilotRules = sqliteTable('autopilot_rule', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  triggerType: text('trigger_type').notNull(), // 'runway_low' | 'low_stock' | 'high_priority_ticket' | 'mrr_surge'
  triggerValue: text('trigger_value').notNull(), // stringified threshold value
  actionType: text('action_type').notNull(), // 'ai_audit' | 'auto_task' | 'ai_reply' | 'webhook_alert'
  actionTarget: text('action_target'), // e.g. employeeId, webhookUrl, or empty
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  lastTriggeredAt: integer('last_triggered_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const contracts = sqliteTable('contract', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('draft'), // 'draft', 'active', 'completed', 'terminated'
  value: integer('value').notNull().default(0), // stored in cents (e.g. 500000 = $5,000.00)
  clientId: text('client_id'), // associated client name or ID string
  startDate: integer('start_date', { mode: 'timestamp' }),
  endDate: integer('end_date', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});




