import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema";

import type { D1Database } from '@cloudflare/workers-types';

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

async function derivePasswordHash(password: string, salt: Uint8Array, iterations: number): Promise<string> {
  // Standard PBKDF2, preserving existing hashes without workerd's native cap.
  return toHex(await pbkdf2Async(sha256, new TextEncoder().encode(password), salt, { c: iterations, dkLen: 32 }));
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
          const hash = await derivePasswordHash(password, salt, PBKDF2_ITERATIONS);
          return `pbkdf2-sha256:${PBKDF2_ITERATIONS}:${toHex(salt)}:${hash}`;
        },
        verify: async ({ hash: storedHash, password }) => {
          try {
            const [algorithm, iterationsStr, salt, expectedHash] = storedHash.split(":");
            if (algorithm !== "pbkdf2-sha256" || !iterationsStr || !salt || !expectedHash) {
              return false;
            }
            const iterations = Number.parseInt(iterationsStr, 10);
            if (Number.isNaN(iterations) || iterations <= 0 || iterations > 1_000_000) {
              return false;
            }
            const candidateHash = await derivePasswordHash(password, fromHex(salt), iterations);
            const candidate = fromHex(candidateHash);
            const expected = fromHex(expectedHash);
            if (candidate.length !== expected.length) return false;
            let mismatch = 0;
            for (let i = 0; i < candidate.length; i++) mismatch |= candidate[i] ^ expected[i];
            return mismatch === 0;
          } catch {
            return false;
          }
        },
      },
    },
    baseURL: url,
    trustedOrigins: [
      url,
    ],
  });
};
