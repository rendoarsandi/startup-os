import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { setTimeout as delay } from "node:timers/promises";
import { toJSONAsync } from "seroval";

// Exercise a built application against an isolated database, without provider calls.
const directory = mkdtempSync(resolve(tmpdir(), "startup-os-smoke-"));
const origin = "http://localhost:4173";
let output = "";
function launch() {
  const process = spawn(globalThis.process.execPath, ["scripts/serve.mjs"], {
    env: {
      ...globalThis.process.env,
      PORT: "4173",
      BETTER_AUTH_URL: origin,
      STARTUP_OS_DATA_DIR: directory,
      OPENROUTER_API_KEY: "",
      GEMINI_API_KEY: "",
      PLAID_CLIENT_ID: "",
      PLAID_SECRET: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  process.stdout.on("data", (data) => {
    output += data;
  });
  process.stderr.on("data", (data) => {
    output += data;
  });
  return process;
}
let child = launch();
async function stop() {
  const exited = new Promise((resolveExit) => child.once("exit", resolveExit));
  child.kill("SIGTERM");
  await exited;
}
let cookie = "";
async function api(path, method = "GET", data, identity = cookie) {
  const response = await fetch(origin + path, {
    method,
    headers: { origin, cookie: identity, "Content-Type": "application/json" },
    body: method === "GET" ? undefined : JSON.stringify(data || {}),
    signal: AbortSignal.timeout(20_000),
  });
  assert.equal(
    response.ok,
    true,
    `${path}: ${response.status} ${await response.clone().text()}`,
  );
  return response;
}
async function waitUntilReady() {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) throw new Error(output);
    try {
      if (
        (
          await fetch(origin + "/api/health", {
            signal: AbortSignal.timeout(1000),
          })
        ).ok
      ) {
        ready = true;
        break;
      }
    } catch {
      /* Wait for the child to listen. */
    }
    await delay(200);
  }
  assert.ok(ready, output || "Built server did not start");
}
try {
  await waitUntilReady();
  const registration = await api("/api/auth/sign-up/email", "POST", {
    name: "Smoke Founder",
    email: "smoke@startup.local",
    password: "Smoke-integration-password-42",
  });
  cookie = registration.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
  assert.match(cookie, /session_token/);
  assert.deepEqual(await (await api("/api/accounts")).json(), []);
  const account = await (
    await api("/api/accounts", "POST", {
      name: "Operating",
      type: "checking",
      balance: 100000,
    })
  ).json();
  await api("/api/transactions", "POST", {
    accountId: account.id,
    amount: -10000,
    category: "Software",
    merchant: "Manual software",
  });
  assert.equal((await (await api("/api/accounts")).json())[0].balance, 90000);
  await api("/api/operations/inventory", "POST", {
    sku: "SMOKE",
    name: "Laptop",
    qty: 1,
    rate: 10000,
  });
  await api("/api/operations/autopilot", "POST", {
    name: "Restock",
    triggerType: "low_stock",
    triggerValue: "5",
    actionType: "auto_task",
  });
  await api("/api/operations/autopilot/run-checks", "POST");
  const run = (await (await api("/api/automation/runs")).json())[0];
  assert.equal(run.status, "awaiting_approval");
  await api(`/api/automation/runs/${run.id}/review`, "POST", {
    decision: "approve",
  });
  assert.equal(
    (await (await api("/api/operations/tasks")).json())[0].title,
    "Review stock for Laptop",
  );
  assert.equal((await fetch(origin + "/api/accounts")).status, 401);
  const html = await (await api("/app")).text();
  assert.match(html, /Smoke Founder/);
  assert.match(html, /Automation/);
  assert.match(html, /\/assets\/.*\.css/);

  const assetDirectory = resolve("dist/server/assets");
  const functions = readFileSync(
    resolve(
      assetDirectory,
      readdirSync(assetDirectory).find((name) =>
        name.startsWith("server-functions-"),
      ),
    ),
    "utf8",
  );
  const ids = Object.fromEntries(
    [...functions.matchAll(/id: "([^"]+)",\s*name: "([^"]+)"/g)].map(
      (match) => [match[2], match[1]],
    ),
  );
  assert.ok(ids.listAccounts && ids.createAccount);
  const rpcHeaders = {
    origin,
    cookie,
    "x-tsr-serverFn": "true",
    accept: "application/json",
    "Content-Type": "application/json",
  };
  const rpc = await fetch(origin + "/_serverFn/" + ids.listAccounts, {
    headers: rpcHeaders,
  });
  assert.equal(rpc.status, 200);
  assert.match(await rpc.text(), /Operating/);
  const payload = JSON.stringify(
    await toJSONAsync({
      data: { name: "RPC account", type: "cash", balance: 0 },
    }),
  );
  const write = await fetch(origin + "/_serverFn/" + ids.createAccount, {
    method: "POST",
    headers: rpcHeaders,
    body: payload,
  });
  assert.equal(write.status, 200);
  assert.equal((await (await api("/api/accounts")).json()).length, 2);
  const blocked = await fetch(origin + "/_serverFn/" + ids.createAccount, {
    method: "POST",
    headers: {
      ...rpcHeaders,
      origin: "https://attacker.example",
      "sec-fetch-site": "cross-site",
    },
    body: payload,
  });
  assert.equal(blocked.status, 403);
  assert.equal((await (await api("/api/accounts")).json()).length, 2);
  await stop();
  child = launch();
  await waitUntilReady();
  const persisted = await (await api("/api/accounts")).json();
  assert.equal(persisted.length, 2);
  assert.equal(
    persisted.find((account) => account.name === "Operating").balance,
    90000,
  );
  assert.equal((await (await api("/api/operations/tasks")).json()).length, 1);
  console.log(
    "Production smoke passed: signup, restart persistence, ledger, approvals, SSR, Start RPC, and CSRF.",
  );
} finally {
  child.kill("SIGTERM");
  await new Promise((resolveExit) => {
    if (child.exitCode !== null) resolveExit();
    else child.once("exit", resolveExit);
  });
  rmSync(directory, { recursive: true, force: true });
}
