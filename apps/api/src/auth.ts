import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@ai-cfo/db";

export const getAuth = (db: D1Database, url: string) => {
  return betterAuth({
    database: drizzleAdapter(drizzle(db), {
      provider: "sqlite",
      schema: schema,
    }),
    emailAndPassword: {
      enabled: true,
    },
    baseURL: url,
  });
};
