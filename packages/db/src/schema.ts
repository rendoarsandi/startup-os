import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

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

