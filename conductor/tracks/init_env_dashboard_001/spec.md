# Track Specification: Initialize full-stack Cloudflare environment and core dashboard UI

## Overview
This track sets up the foundational Cloudflare infrastructure and builds the core UI for the AI CFO dashboard. It covers initial scaffolding for the React+Vite frontend and Hono backend, database provisioning with D1, authentication setup with BetterAuth, and laying out the basic dashboard structure.

## Functional Requirements
- **Frontend Scaffolding:** React, Vite, Tailwind CSS v4, and routing setup.
- **Backend Scaffolding:** Hono server configured to run on Cloudflare Workers.
- **Database Provisioning:** Setup Cloudflare D1 and Drizzle ORM schemas for basic user records.
- **Authentication:** Implement login/signup using BetterAuth.
- **Dashboard Layout:** Create the main dashboard shell with placeholders for charts and recent transactions.

## Out of Scope
- Actual AI integration with Google Gemini (deferred to a later track).
- Live bank feed integration.
- Advanced cash flow projections algorithms.
