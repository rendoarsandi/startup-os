import { DatabaseSync } from "node:sqlite";
import {
  mkdirSync,
  readFileSync,
  readdirSync,
  existsSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";
import { randomBytes } from "node:crypto";
import type { AppEnv } from "./env";
import type { D1Database } from "@cloudflare/workers-types";

let runtimeEnv: AppEnv | undefined;

// Local development uses the D1 statement contract against persistent SQLite.
// Cloudflare builds resolve #runtime-env to env.cloudflare.ts instead.
export function getRuntimeEnv(): AppEnv {
  if (runtimeEnv) return runtimeEnv;
  const directory = resolve(process.env.STARTUP_OS_DATA_DIR || ".data");
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const sqlite = new DatabaseSync(resolve(directory, "startup-os.sqlite"));
  sqlite.exec(
    "PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY)",
  );
  for (const name of readdirSync(resolve("drizzle"))
    .filter((name) => name.endsWith(".sql"))
    .sort()) {
    if (sqlite.prepare("SELECT name FROM _migrations WHERE name = ?").get(name))
      continue;
    sqlite.exec("BEGIN IMMEDIATE");
    try {
      sqlite.exec(readFileSync(resolve("drizzle", name), "utf8"));
      sqlite.prepare("INSERT INTO _migrations (name) VALUES (?)").run(name);
      sqlite.exec("COMMIT");
    } catch (error) {
      sqlite.exec("ROLLBACK");
      throw error;
    }
  }
  function prepare(
    sql: string,
    parameters: Array<string | number | bigint | null | Uint8Array> = [],
  ) {
    return {
      bind(...values: typeof parameters) {
        return prepare(sql, values);
      },
      async first(column?: string) {
        const row = sqlite.prepare(sql).get(...parameters);
        return row ? (column ? row[column] : row) : null;
      },
      execute() {
        return {
          success: true,
          results: sqlite.prepare(sql).all(...parameters),
          meta: {},
        };
      },
      async all() {
        return this.execute();
      },
      async raw(options?: { columnNames?: boolean }) {
        const statement = sqlite.prepare(sql);
        statement.setReturnArrays(true);
        const rows = statement.all(...parameters);
        return options?.columnNames
          ? [statement.columns().map((column) => column.name), ...rows]
          : rows;
      },
      async run() {
        const result = sqlite.prepare(sql).run(...parameters);
        return {
          success: true,
          results: [],
          meta: {
            changes: Number(result.changes),
            last_row_id: Number(result.lastInsertRowid),
          },
        };
      },
    };
  }
  const db = {
    prepare,
    async exec(sql: string) {
      sqlite.exec(sql);
      return { count: 1, duration: 0 };
    },
    async batch(statements: Array<ReturnType<typeof prepare>>) {
      sqlite.exec("BEGIN IMMEDIATE");
      try {
        const results = statements.map((statement) => statement.execute());
        sqlite.exec("COMMIT");
        return results;
      } catch (error) {
        sqlite.exec("ROLLBACK");
        throw error;
      }
    },
  };
  const secretFile = resolve(directory, "auth-secret");
  if (!existsSync(secretFile))
    writeFileSync(secretFile, Buffer.from(randomBytes(32)).toString("hex"), {
      mode: 0o600,
    });
  runtimeEnv = {
    // The adapter implements the subset used by Drizzle/Better Auth locally.
    DB: db as unknown as D1Database,
    BETTER_AUTH_SECRET:
      process.env.BETTER_AUTH_SECRET || readFileSync(secretFile, "utf8"),
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    OPENROUTER_MODEL: process.env.OPENROUTER_MODEL,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL,
    PLAID_CLIENT_ID: process.env.PLAID_CLIENT_ID,
    PLAID_SECRET: process.env.PLAID_SECRET,
    PLAID_ENV: process.env.PLAID_ENV || "sandbox",
  };
  return runtimeEnv;
}
