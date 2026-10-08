import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';

let SQLModule: any = null;
let cachedStatements: string[] | null = null;

export async function createRealSqliteD1() {
  if (!SQLModule) {
    SQLModule = await initSqlJs();
  }
  const db: SqlJsDatabase = new SQLModule.Database();

  if (!cachedStatements) {
    cachedStatements = fs.readdirSync(path.resolve('drizzle')).filter(name => name.endsWith('.sql')).sort().flatMap(name => fs.readFileSync(path.resolve('drizzle', name), 'utf8').split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean));
  }

  for (const stmt of cachedStatements) {
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
        execute() {
          const stmt = db.prepare(sql);
          stmt.bind(boundValues);
          const results: any[] = [];
          while (stmt.step()) {
            results.push(stmt.getAsObject());
          }
          stmt.free();
          return { results, success: true, meta: { duration: 0, changes: 0 } };
        },
        async all() { return this.execute(); },
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
    async batch(statements: any[]) {
      db.run('BEGIN');
      try { const results = statements.map(statement => statement.execute()); db.run('COMMIT'); return results; }
      catch (error) { db.run('ROLLBACK'); throw error; }
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
