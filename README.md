# Startup OS

An AI-assisted operations workspace for a founder or small startup team. Record finances, leads, people, inventory, projects, and support tickets; delegate recurring checks; review proposed tasks and AI drafts; keep a durable history of outcomes.

The working architecture is **TanStack Start + Router + Query + Form**, **Cloudflare D1 + Drizzle**, and **Durable Object alarms** for scheduled automation. OpenRouter uses the official **`@openrouter/sdk`** on the server. An optional Gemini provider uses TanStack AI. There is no Convex dependency: the original code contained a custom Convex-like document runtime, which duplicated D1 and has been removed.

## Run locally

Use Node 22.16 or newer and npm. On Linux/macOS/Windows:

```sh
npm ci
cp .env.example .env
npm run dev
```

On Android/Termux, Cloudflare's native `workerd` binary is unsupported. Use `npm ci --ignore-scripts` and the same `npm run dev` command. The Node development backend stores SQLite data and a generated authentication secret in `.data/`; migrations apply automatically. This provides persistent local records without emulating Cloudflare. Scheduled alarms require the Cloudflare runtime; use **Run checks** locally.

Open `http://localhost:3000/app`, create your account, and enter your company context in **Workspace settings**. New accounts start empty. Add a manual financial account or configure Plaid before using the ledger. Create a rule, add matching records, run checks, and review its result. Internal task creation defaults to requiring approval; the workspace setting can allow it automatically. AI drafts always require review.

Set `OPENROUTER_API_KEY` and optionally `OPENROUTER_MODEL` in `.env`; restart the server after changing credentials. `openai/gpt-4.1-mini` is the default model. Optional `GEMINI_API_KEY` is used when OpenRouter is absent. Keys remain on the server. Plaid requires real server credentials and its Link flow; missing credentials never generate fictional accounts.

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run smoke
npm start
```

The production Node server is useful for local verification. Cloudflare deployment uses `npm run build:cloudflare` on a supported desktop/CI system.

## Deploy to Cloudflare

On a supported system, authenticate with `npx wrangler login`, create the database with `npx wrangler d1 create startup-os-db`, and copy its ID into `wrangler.jsonc`. Apply migrations with `npm run db:migrate:remote`. Set `BETTER_AUTH_SECRET` and `OPENROUTER_API_KEY` using `npx wrangler secret put <name>`, and set `BETTER_AUTH_URL` to your deployed HTTPS origin in Wrangler's `vars`. Banking also needs `PLAID_CLIENT_ID`, `PLAID_SECRET`, and the correct `PLAID_ENV`. Run `npm run deploy` to build and deploy the server and assets together. Authentication hashing requires a suitable paid Workers CPU budget.

For an existing deployment, back up D1 and export any business documents from the old `WorkspaceDO` before deploying. The Durable Object rename preserves its storage but does not import those documents into D1; reconcile and import verified records separately. Local Node and local Cloudflare development use separate databases.

## Current product boundaries

- One founder account owns one workspace. Shared membership and invitations are not implemented.
- Automation supports low stock, low cash runway, and open high-priority tickets. It can create internal tasks, draft support replies, and prepare cash audits. Runs are deduplicated, reviewed, and retryable; failed executions stay visible.
- Customer replies and marketing ideas are drafts. Email delivery, payroll, payments, ads, refunds, and third-party task execution need dedicated connectors; the application does not claim they happened.
- Finance uses USD integer cents. Credit/investment accounts are excluded from available cash. Forecasts show limited-record estimates; MRR/churn must be entered explicitly. Planning sandbox values are simulations.
- Banking imports up to 90 days of posted transactions with pagination and deduplication. Existing transactions in that window can be refreshed. Full historical backfill, transaction-removal webhooks, and institution-specific recovery need further work.

These boundaries are deliberate and visible in the interface. The migration establishes a working foundation; it does not make every prototype screen or external business workflow a finished service.
