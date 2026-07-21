# Original User Request

## Initial Request — 2026-07-19T07:51:54Z

Add a Contract Lifecycle Management (CLM) feature set to the Startup OS project. The new module will manage corporate agreements, client contracts, and vendor/employee agreements, seamlessly integrating them with the existing CRM pipeline, CFO billing, and CHRO workspaces.

Working directory: /data/data/com.termux/files/home/startup-os
Integrity mode: development

## Requirements

### R1. Legal/Ops CLM Dashboard
Implement a dedicated Contract Lifecycle Management (CLM) dashboard within the Startup OS framework. The interface must adhere to the design system in `DESIGN.md` (Cosmic Obsidian theme, glassmorphic cards, Outfit typography, and custom micro-animations). The dashboard must display all corporate contracts with robust filtering, search, and status tracking (Draft, Sent, Signed).

### R2. Contract Template Generation & Signing Simulation
Implement a template engine supporting three standard templates: Client Service Agreement, Non-Disclosure Agreement (NDA), and Employment Agreement. The user must be able to customize parameters (parties, value, dates) and preview the document. Provide a digital signature simulator where users can type or draw their signature to transition the contract to the "Signed" status.

### R3. Cross-Workspace Integrations
* **CMO / Sales CRM Integration:** Allow generating a Client Service Agreement directly from the Sales CRM Pipeline (`CRMPipeline`) when a lead is in the "Proposal Sent" or "Closed Won" stage. Automatically populate the client name and opportunity value.
* **CFO / Billing Integration:** When a revenue-generating contract is signed, automatically create a draft invoice or sync the transaction/revenue record to the CFO budget tracker or transactions.
* **CHRO / HR Integration:** When an Employment Agreement is signed, link it to the CHRO onboarding workspace or employee record.

### R4. Database & API Endpoints
Define a `contracts` table schema in the SQLite database to store metadata (contract name, type, parties, value, status, signatures, timestamps). Provide corresponding server-side API endpoints (`/api/contracts`) to support list, retrieve, create, and update actions.

## Acceptance Criteria

### UI/UX & Styling
- [ ] Legal/Ops workspace or CLM view exists, accessible from the main navigation sidebar.
- [ ] UI fully implements the Cosmic Obsidian theme: Jet-Black backgrounds, glassmorphic card styles (`.glass-card`), and glowing accents.
- [ ] Interactive buttons, inputs, and transitions have smooth, responsive animations.

### Contract Operations & Simulator
- [ ] Users can create a new contract from one of the three templates (Client Agreement, NDA, Employment Agreement).
- [ ] Document preview displays structured contract text containing custom fields (names, dates, dollar amounts).
- [ ] Signature canvas/textbox allows signing the contract, which updates status to `Signed` and persists the signature data.

### Integrations
- [ ] CRM pipeline cards have an action to generate a contract, pre-filling customer information.
- [ ] CFO dashboard shows contracts or transactions sync'd from the CLM.
- [ ] CHRO workspace shows employee agreements sync'd from the CLM.

### Testing & Quality
- [ ] Automated unit or integration tests exist verifying CLM CRUD operations and integration states.
- [ ] Application builds without any TypeScript or bundling errors (`npm run build`).
