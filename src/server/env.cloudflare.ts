import { env } from "cloudflare:workers";
import type { AppEnv } from "./env";

export function getRuntimeEnv(): AppEnv {
  return env as AppEnv;
}
