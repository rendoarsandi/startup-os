import { vi } from 'vitest';
import { handleApiRequest } from '../../server/dispatcher';

export interface ContractRecord {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: 'draft' | 'active' | 'completed' | 'terminated';
  value: number; // in cents
  client_id: string | null;
  start_date: number | null;
  end_date: number | null;
  created_at: number;
  updated_at: number;
}

export class MockD1Database {
  public tables: Record<string, Record<string, unknown>[]> = {
    contract: [],
    invoice: [],
    employee: [],
    crm_lead: [],
  };

  constructor(initialData: ContractRecord[] = []) {
    this.tables.contract = [...initialData] as unknown as Record<string, unknown>[];
  }

  get store(): ContractRecord[] {
    return this.tables.contract as unknown as ContractRecord[];
  }

  set store(value: ContractRecord[]) {
    this.tables.contract = value as unknown as Record<string, unknown>[];
  }

  public clear() {
    for (const key in this.tables) {
      this.tables[key] = [];
    }
  }

  prepare(sql: string) {
    let boundParams: unknown[] = [];
    const normalizedSql = sql.replace(/\s+/g, ' ').replace(/`/g, '').trim();

    const executeQuery = (mode: 'run' | 'all' | 'get') => {
      return this.execute(normalizedSql, boundParams, mode);
    };

    return {
      bind(...params: unknown[]) {
        boundParams = params;
        return this;
      },
      async run() {
        return executeQuery('run');
      },
      async all() {
        return executeQuery('all');
      },
      async get() {
        return executeQuery('get');
      },
      raw: vi.fn().mockImplementation(async () => {
        const res = await executeQuery('all');
        return (res as { results?: unknown[] }).results 
          ? (res as { results: unknown[] }).results.map((r) => Object.values(r as Record<string, unknown>)) 
          : [];
      }),
      first: vi.fn().mockImplementation(async () => {
        return executeQuery('get');
      }),
    };
  }

  private execute(sql: string, params: unknown[], mode: 'run' | 'all' | 'get') {
    // 1. INSERT INTO
    if (sql.startsWith('INSERT INTO') || sql.startsWith('insert into')) {
      const insertMatch = sql.match(/INSERT INTO\s+(\w+)/i);
      const tableName = insertMatch ? insertMatch[1].replace(/['"`]/g, '').toLowerCase() : 'contract';
      if (!this.tables[tableName]) {
        this.tables[tableName] = [];
      }
      
      const colsMatch = sql.match(/INSERT INTO\s+\w+\s*\(([^)]+)\)/i);
      if (!colsMatch) throw new Error(`MockD1: Malformed INSERT statement: ${sql}`);
      const columns = colsMatch[1].split(',').map(c => c.trim().replace(/['"`]/g, ''));
      
      const newRecord: Record<string, unknown> = {};
      columns.forEach((col, idx) => {
        newRecord[col] = params[idx];
      });
      
      this.tables[tableName].push(newRecord);
      return { success: true, meta: { changes: 1 } };
    }

    // 2. SELECT FROM
    if (sql.includes('FROM') || sql.includes('from')) {
      const fromMatch = sql.match(/FROM\s+(\w+)/i);
      const tableName = fromMatch ? fromMatch[1].replace(/['"`]/g, '').toLowerCase() : 'contract';
      if (!this.tables[tableName]) {
        this.tables[tableName] = [];
      }
      let filtered = [...this.tables[tableName]];
      
      if (sql.includes('WHERE') || sql.includes('where')) {
        const whereClause = sql.split(/WHERE/i)[1].split(/LIMIT|ORDER/i)[0].trim();
        
        // Match specific Drizzle-generated SQL patterns for contracts
        if (tableName === 'contract' && whereClause === 'user_id = ?') {
          const userId = params[0];
          filtered = filtered.filter(item => item.user_id === userId);
        } else if (
          tableName === 'contract' && (
            whereClause === '(contract.id = ? and contract.user_id = ?)' || 
            whereClause === 'contract.id = ? and contract.user_id = ?' || 
            whereClause === 'id = ? and user_id = ?'
          )
        ) {
          const contractId = params[0];
          const userId = params[1];
          filtered = filtered.filter(item => item.id === contractId && item.user_id === userId);
        } else {
          // General parser fallback
          const conditions = whereClause.replace(/[()]/g, '').split(/\s+and\s+/i);
          let paramIdx = 0;
          for (const condition of conditions) {
            const parts = condition.split('=');
            if (parts.length === 2) {
              const colRaw = parts[0].trim();
              const colName = colRaw.includes('.') ? colRaw.split('.')[1] : colRaw;
              const valPlaceholder = parts[1].trim();
              if (valPlaceholder === '?') {
                const val = params[paramIdx++];
                filtered = filtered.filter(item => item[colName] === val);
              }
            }
          }
        }
      }

      if (sql.includes('LIMIT 1') || sql.includes('limit 1')) {
        const result = filtered[0] || null;
        if (mode === 'get') return result;
        const arr = [result].filter(Boolean);
        Object.defineProperty(arr, 'results', {
          value: arr,
          writable: true,
          enumerable: true,
          configurable: true
        });
        Object.defineProperty(arr, 'success', {
          value: true,
          writable: true,
          enumerable: true,
          configurable: true
        });
        return arr;
      }

      if (mode === 'get') return filtered[0] || null;
      const arr = filtered;
      Object.defineProperty(arr, 'results', {
        value: filtered,
        writable: true,
        enumerable: true,
        configurable: true
      });
      Object.defineProperty(arr, 'success', {
        value: true,
        writable: true,
        enumerable: true,
        configurable: true
      });
      return arr;
    }

    // 3. UPDATE
    if (sql.startsWith('UPDATE') || sql.startsWith('update')) {
      const updateMatch = sql.match(/UPDATE\s+(\w+)/i);
      const tableName = updateMatch ? updateMatch[1].replace(/['"`]/g, '').toLowerCase() : 'contract';
      if (!this.tables[tableName]) {
        this.tables[tableName] = [];
      }
      
      const setPart = sql.split(/SET/i)[1].split(/WHERE/i)[0].trim();
      const wherePart = sql.split(/WHERE/i)[1].trim();

      const setColumns = setPart.split(',').map(item => item.split('=')[0].trim().replace(/['"`]/g, ''));
      const numSetFields = setColumns.length;

      const updateValues = params.slice(0, numSetFields);
      const whereParams = params.slice(numSetFields);

      const conditions = wherePart.replace(/[()]/g, '').split(/\s+and\s+/i);

      let changes = 0;
      this.tables[tableName] = this.tables[tableName].map(item => {
        let match = true;
        let paramIdx = 0;
        for (const condition of conditions) {
          const parts = condition.split('=');
          if (parts.length === 2) {
            const colRaw = parts[0].trim();
            const colName = colRaw.includes('.') ? colRaw.split('.')[1] : colRaw;
            const valPlaceholder = parts[1].trim();
            if (valPlaceholder === '?') {
              const val = whereParams[paramIdx++];
              if (item[colName] !== val) {
                match = false;
                break;
              }
            }
          }
        }

        if (match) {
          changes++;
          const updatedItem = { ...item };
          setColumns.forEach((col, idx) => {
            updatedItem[col] = updateValues[idx];
          });
          return updatedItem;
        }
        return item;
      });

      return { success: true, meta: { changes } };
    }

    // Fallback for migrations or other table inquiries
    if (mode === 'all') {
      const arr: unknown[] = [];
      Object.defineProperty(arr, 'results', {
        value: arr,
        writable: true,
        enumerable: true,
        configurable: true
      });
      Object.defineProperty(arr, 'success', {
        value: true,
        writable: true,
        enumerable: true,
        configurable: true
      });
      return arr;
    }
    return null;
  }
}

export interface TestEnv {
  DB: MockD1Database;
  TEST_USER_ID: string | null;
  BETTER_AUTH_URL?: string;
  BETTER_AUTH_SECRET?: string;
}

export async function dispatchRequest(
  env: TestEnv,
  path: string,
  method: 'GET' | 'POST' | 'PUT',
  body?: unknown
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  const request = new Request(`http://localhost${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  return await handleApiRequest(request, env);
}

export async function apiGetContracts(env: TestEnv): Promise<Response> {
  return await dispatchRequest(env, '/api/contracts', 'GET');
}

export async function apiGetContractById(env: TestEnv, id: string): Promise<Response> {
  return await dispatchRequest(env, `/api/contracts/${id}`, 'GET');
}

export async function apiCreateContract(env: TestEnv, payload: unknown): Promise<Response> {
  return await dispatchRequest(env, '/api/contracts', 'POST', payload);
}

export async function apiUpdateContract(env: TestEnv, id: string, payload: unknown): Promise<Response> {
  return await dispatchRequest(env, `/api/contracts/${id}`, 'PUT', payload);
}
