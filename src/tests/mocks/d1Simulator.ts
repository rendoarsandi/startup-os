import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';

let SQLModule: any = null;

export async function createRealSqliteD1() {
  if (!SQLModule) {
    SQLModule = await initSqlJs();
  }
  const db: SqlJsDatabase = new SQLModule.Database();

  // Execute real DDL schema migrations from drizzle files
  const migration0Path = path.resolve(process.cwd(), 'drizzle/0000_striped_falcon.sql');
  const migration1Path = path.resolve(process.cwd(), 'drizzle/0001_overrated_stephen_strange.sql');

  const migration0 = fs.readFileSync(migration0Path, 'utf-8');
  const migration1 = fs.readFileSync(migration1Path, 'utf-8');

  const statements = (migration0 + '\n' + migration1)
    .split('--> statement-breakpoint')
    .map(s => s.trim())
    .filter(Boolean);

  for (const stmt of statements) {
    db.run(stmt);
  }

  // Real D1 adapter wrapping real sql.js C-WASM SQLite engine
  return {
    sqlite: db,
    prepare(sql: string) {
      let boundValues: any[] = [];
      return {
        bind(...values: any[]) {
          boundValues = values.map(v => v instanceof Date ? v.getTime() : (v === undefined ? null : v));
          return this;
        },
        async first(colName?: string) {
          const stmt = db.prepare(sql);
          stmt.bind(boundValues);
          let row: any = null;
          if (stmt.step()) {
            row = stmt.getAsObject();
          }
          stmt.free();
          if (!row) return null;
          return colName ? row[colName] : row;
        },
        async run() {
          db.run(sql, boundValues);
          const changes = db.getRowsModified();
          return { success: true, meta: { changes, duration: 0 } };
        },
        async all() {
          const stmt = db.prepare(sql);
          stmt.bind(boundValues);
          const results: any[] = [];
          while (stmt.step()) {
            results.push(stmt.getAsObject());
          }
          stmt.free();
          return { results, success: true, meta: { duration: 0, changes: 0 } };
        },
        async raw(options?: { columnNames?: boolean }) {
          const stmt = db.prepare(sql);
          stmt.bind(boundValues);
          const rows: any[] = [];
          if (options?.columnNames) {
            rows.push(stmt.getColumnNames());
          }
          while (stmt.step()) {
            rows.push(stmt.get());
          }
          stmt.free();
          return rows;
        }
      };
    },
    async exec(query: string) {
      db.run(query);
      return { count: 1, duration: 0 };
    }
  };
}

export function createD1Simulator() {
  throw new Error("createD1Simulator is deprecated. Use createRealSqliteD1() for real SQLite DB execution.");
}
