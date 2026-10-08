import type {
  D1Database,
  DurableObjectNamespace,
} from "@cloudflare/workers-types";

export interface AppEnv {
  DB: D1Database;
  WORKSPACE_DO?: DurableObjectNamespace;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL?: string;
  OPENROUTER_API_KEY?: string;
  OPENROUTER_MODEL?: string;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  PLAID_CLIENT_ID?: string;
  PLAID_SECRET?: string;
  PLAID_ENV?: string;
}
