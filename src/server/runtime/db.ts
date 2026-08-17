import { DatabaseWriter, QueryBuilder } from './core';

export interface SqlStorage {
  exec(sql: string, ...params: any[]): { toArray?: () => any[]; [Symbol.iterator]?: () => Iterator<any> } | any[];
}

export class DurableObjectDatabase implements DatabaseWriter {
  private sql?: SqlStorage;
  private memoryStore = new Map<string, Map<string, any>>();
  private isInitialized = false;

  constructor(sqlStorage?: SqlStorage) {
    this.sql = sqlStorage;
  }

  public ensureSchema() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (this.sql) {
      try {
        this.sql.exec(`
          CREATE TABLE IF NOT EXISTS _do_docs (
            table_name TEXT NOT NULL,
            id TEXT NOT NULL,
            data TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            PRIMARY KEY (table_name, id)
          );
          CREATE INDEX IF NOT EXISTS idx_do_table ON _do_docs (table_name);
          CREATE INDEX IF NOT EXISTS idx_do_table_created ON _do_docs (table_name, created_at);
        `);
      } catch (err) {
        console.warn('DO SQLite schema creation warning (ignoring if exists):', err);
      }
    }
  }

  async get<T = any>(table: string, id: string): Promise<T | null> {
    this.ensureSchema();
    if (this.sql) {
      const rows = this.sql.exec(
        `SELECT data FROM _do_docs WHERE table_name = ? AND id = ? LIMIT 1`,
        table,
        id
      );
      const arr = Array.isArray(rows) ? rows : (typeof rows.toArray === 'function' ? rows.toArray() : Array.from(rows));
      if (arr.length > 0) {
        return JSON.parse(arr[0].data) as T;
      }
      return null;
    }

    const tableMap = this.memoryStore.get(table);
    if (!tableMap) return null;
    const item = tableMap.get(id);
    return item ? JSON.parse(JSON.stringify(item)) : null;
  }

  query<T = any>(table: string): QueryBuilder<T> {
    this.ensureSchema();
    let filters: Array<(doc: T) => boolean> = [];
    let sortDirection: 'asc' | 'desc' = 'asc';
    let sortField: keyof T | undefined;

    const builder: QueryBuilder<T> = {
      filter(predicate: (doc: T) => boolean) {
        filters.push(predicate);
        return builder;
      },
      order(direction: 'asc' | 'desc', field?: keyof T) {
        sortDirection = direction;
        sortField = field;
        return builder;
      },
      collect: async () => {
        let items: T[] = [];
        if (this.sql) {
          const rows = this.sql.exec(
            `SELECT data FROM _do_docs WHERE table_name = ? ORDER BY created_at ${sortDirection.toUpperCase()}`,
            table
          );
          const arr = Array.isArray(rows) ? rows : (typeof rows.toArray === 'function' ? rows.toArray() : Array.from(rows));
          items = arr.map((r: any) => JSON.parse(r.data));
        } else {
          const tableMap = this.memoryStore.get(table);
          if (tableMap) {
            items = Array.from(tableMap.values()).map(doc => JSON.parse(JSON.stringify(doc)));
            items.sort((a: any, b: any) => {
              const timeA = a._creationTime || 0;
              const timeB = b._creationTime || 0;
              return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
            });
          }
        }

        for (const predicate of filters) {
          items = items.filter(predicate);
        }

        if (sortField) {
          items.sort((a: any, b: any) => {
            const valA = a[sortField!];
            const valB = b[sortField!];
            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
          });
        }

        return items;
      },
      first: async () => {
        const results = await builder.collect();
        return results.length > 0 ? results[0] : null;
      }
    };

    return builder;
  }

  async insert<T extends Record<string, any>>(table: string, value: T): Promise<T & { id: string; _id: string; _creationTime: number }> {
    this.ensureSchema();
    const id = value.id || value._id || (crypto.randomUUID ? crypto.randomUUID() : `id_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
    const now = Date.now();

    const doc = {
      ...value,
      id,
      _id: id,
      _creationTime: value._creationTime || now,
      createdAt: value.createdAt || new Date(now).toISOString(),
      updatedAt: value.updatedAt || new Date(now).toISOString(),
    };

    const serialized = JSON.stringify(doc);

    if (this.sql) {
      this.sql.exec(
        `INSERT OR REPLACE INTO _do_docs (table_name, id, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
        table,
        id,
        serialized,
        doc._creationTime,
        now
      );
    } else {
      if (!this.memoryStore.has(table)) {
        this.memoryStore.set(table, new Map());
      }
      this.memoryStore.get(table)!.set(id, doc);
    }

    return doc as T & { id: string; _id: string; _creationTime: number };
  }

  async patch<T extends Record<string, any>>(table: string, id: string, value: Partial<T>): Promise<(T & { id: string }) | null> {
    const existing = await this.get<T>(table, id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...value,
      id,
      _id: id,
      updatedAt: new Date().toISOString(),
    };

    const serialized = JSON.stringify(updated);
    const now = Date.now();

    if (this.sql) {
      this.sql.exec(
        `UPDATE _do_docs SET data = ?, updated_at = ? WHERE table_name = ? AND id = ?`,
        serialized,
        now,
        table,
        id
      );
    } else {
      this.memoryStore.get(table)?.set(id, updated);
    }

    return updated as T & { id: string };
  }

  async replace<T extends Record<string, any>>(table: string, id: string, value: T): Promise<T & { id: string }> {
    const updated = {
      ...value,
      id,
      _id: id,
      updatedAt: new Date().toISOString(),
    };

    const serialized = JSON.stringify(updated);
    const now = Date.now();

    if (this.sql) {
      this.sql.exec(
        `INSERT OR REPLACE INTO _do_docs (table_name, id, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
        table,
        id,
        serialized,
        now,
        now
      );
    } else {
      if (!this.memoryStore.has(table)) {
        this.memoryStore.set(table, new Map());
      }
      this.memoryStore.get(table)!.set(id, updated);
    }

    return updated as T & { id: string };
  }

  async delete(table: string, id: string): Promise<boolean> {
    this.ensureSchema();
    if (this.sql) {
      this.sql.exec(
        `DELETE FROM _do_docs WHERE table_name = ? AND id = ?`,
        table,
        id
      );
      return true;
    }

    const tableMap = this.memoryStore.get(table);
    if (!tableMap) return false;
    return tableMap.delete(id);
  }

  public clearMemory() {
    this.memoryStore.clear();
  }
}
