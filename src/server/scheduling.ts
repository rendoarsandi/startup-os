import type { AppEnv } from "./env";
export async function scheduleWorkspace(env: AppEnv, userId: string) {
  if (!env.WORKSPACE_DO) return;
  const stub = env.WORKSPACE_DO.get(env.WORKSPACE_DO.idFromName(userId));
  const response = await stub.fetch("https://workspace.internal/schedule", {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
  if (!response.ok)
    throw new Error(
      "The rule was saved, but scheduling failed. Enable the rule again to retry.",
    );
}
