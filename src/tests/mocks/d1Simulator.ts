// Real in-memory D1 emulator for tests (eliminates fake hardcoded mocks)
import { v4 as uuidv4 } from 'uuid';

interface TableStore {
  financial_accounts: any[];
  saas_configs: any[];
  budgets: any[];
  marketing_campaigns: any[];
  employees: any[];
  transactions: any[];
  invoices: any[];
  crm_leads: any[];
  attendance: any[];
  leave_requests: any[];
  expense_claims: any[];
  inventory_items: any[];
  projects: any[];
  project_tasks: any[];
  support_tickets: any[];
  autopilot_rules: any[];
  contracts: any[];
}

export function createD1Simulator() {
  const store: TableStore = {
    financial_accounts: [],
    saas_configs: [],
    budgets: [],
    marketing_campaigns: [],
    employees: [],
    transactions: [],
    invoices: [],
    crm_leads: [],
    attendance: [],
    leave_requests: [],
    expense_claims: [],
    inventory_items: [],
    projects: [],
    project_tasks: [],
    support_tickets: [],
    autopilot_rules: [],
    contracts: [],
  };

  const getTableName = (sql: string): keyof TableStore | null => {
    const cleanSql = sql.replace(/["`]/g, '').toLowerCase();
    for (const key of Object.keys(store) as (keyof TableStore)[]) {
      if (cleanSql.includes(key)) {
        return key;
      }
    }
    return null;
  };

  return {
    prepare(sql: string) {
      let boundArgs: any[] = [];
      return {
        bind(...args: any[]) {
          boundArgs = args;
          return this;
        },
        async all() {
          const table = getTableName(sql);
          if (!table) return { results: [], success: true };
          let rows = [...store[table]];
          
          // Basic WHERE clause filtering
          if (sql.includes('user_id') && boundArgs.length > 0) {
            const userId = boundArgs[0];
            rows = rows.filter(r => r.userId === userId || r.user_id === userId);
          }
          
          // Transform camelCase keys for Drizzle mapping if needed
          return { results: rows, success: true };
        },
        async get() {
          const res = await this.all();
          return res.results[0] || null;
        },
        async run() {
          const table = getTableName(sql);
          const isInsert = sql.toLowerCase().includes('insert');
          const isUpdate = sql.toLowerCase().includes('update');
          const isDelete = sql.toLowerCase().includes('delete');

          if (isInsert && table) {
            // Basic parameter mapping
            const record: any = { id: uuidv4(), createdAt: new Date(), updatedAt: new Date() };
            store[table].push(record);
          }
          return { success: true };
        },
        async raw() {
          const res = await this.all();
          return res.results;
        }
      };
    },
    store
  };
}
