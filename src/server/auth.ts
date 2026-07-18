import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema";

const PBKDF2_ITERATIONS = 600_000;

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function fromHex(value: string): Uint8Array {
  if (!/^[0-9a-f]+$/i.test(value) || value.length % 2 !== 0) {
    throw new Error("Invalid password hash encoding");
  }

  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < bytes.length; index++) {
    bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

async function derivePasswordHash(password: string, salt: Uint8Array): Promise<string> {
  const passwordBytes = new TextEncoder().encode(password);
  const key = await crypto.subtle.importKey(
    "raw",
    passwordBytes.buffer as ArrayBuffer,
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt.buffer as ArrayBuffer, iterations: PBKDF2_ITERATIONS },
    key,
    256,
  );
  return toHex(new Uint8Array(bits));
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
          const salt = crypto.getRandomValues(new Uint8Array(16));
          const hash = await derivePasswordHash(password, salt);
          return `pbkdf2-sha256:${PBKDF2_ITERATIONS}:${toHex(salt)}:${hash}`;
        },
        verify: async ({ hash: storedHash, password }) => {
          try {
            const [algorithm, iterations, salt, expectedHash] = storedHash.split(":");
            if (algorithm !== "pbkdf2-sha256" || iterations !== String(PBKDF2_ITERATIONS) || !salt || !expectedHash) {
              return false;
            }
            const candidateHash = await derivePasswordHash(password, fromHex(salt));
            return candidateHash === expectedHash;
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
      url,
    ],
  });
};
