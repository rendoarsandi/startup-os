# Startup OS - Agent Guidelines & Command Rules

Welcome, Startup OS AI Agents and Developers. This file lists the absolute rules for command execution and package management in this codebase.

---

## ⚠️ The Exclusive Package Manager Rule

- **DO NOT** use `npm`, `npm install`, `npm uninstall`, or standard node package deletions on this codebase.
- **ALWAYS** use `bun` (e.g., `bun add`, `bun install`, `bun remove`, `bun run`) for all package modifications, installations, removals, and script executions.

---

## 🤖 Core Autonomous AI Agent Architecture

Startup OS is a next-generation AI-native ERP system that automates operations through specialized, collaborative C-Suite AI Agents:
- 💼 **AI CFO (Finance Agent):** Handles cashflow operations, ledger logs, invoices, and Runway projections.
- 📈 **AI CMO (Growth Agent):** Manages CRM pipelines, campaign brainstorming, and funnel analyses.
- 👥 **AI CHRO (Talent Agent):** Oversees roster logs, daily clock-in/out attendance, leave approvals, and expense claims.
- 📦 **AI COO (Operations Agent):** Directs stock quantities, project allocation, tasks assignees, and support tickets.
