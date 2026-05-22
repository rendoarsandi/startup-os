import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@ai-cfo/db";

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export const getAuth = (db: D1Database, url: string, secret?: string) => {
  return betterAuth({
    database: drizzleAdapter(drizzle(db), {
      provider: "sqlite",
      schema: {
        ...schema,
        user: schema.users,
        session: schema.sessions,
        account: schema.accounts,
        verification: schema.verifications,
      },
    }),
    secret: secret,
    emailAndPassword: {
      enabled: true,
      password: {
        hash: async (password: string) => {
          const salt = crypto.randomUUID();
          const hash = await sha256(password + salt);
          return `${salt}:${hash}`;
        },
        verify: async ({ hash: storedHash, password }) => {
          try {
            const [salt, hash] = storedHash.split(":");
            if (!salt || !hash) return false;
            const candidateHash = await sha256(password + salt);
            return hash === candidateHash;
          } catch {
            return false;
          }
        },
      },
    },
    baseURL: url,
    trustedOrigins: [
      "https://ai-cfo-web.pages.dev",
      "https://*.pages.dev",
      "http://localhost:5173",
    ],
  });
};


