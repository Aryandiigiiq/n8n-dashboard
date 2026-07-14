# PROJECT_CHECKLIST.md

> Master implementation checklist for the n8n-powered Visual Automation Operating System (AOS)

Status Legend

[ ] Not Started
[-] In Progress
[x] Completed

---

# 1. ENVIRONMENT & CONFIGURATION
- [x] Configure n8n API client variables (`N8N_BASE_URL`, `N8N_API_KEY` in `backend/app/config.py`)
- [x] Add Meta credentials and tokens to `backend/.env`
- [x] Apply database auto-migrations or run reset scripts to build the new tables

---

# 2. BACKEND (Visual Orchestration Layer)
- [x] Set up visual builder compilation translation engine (`backend/app/compiler/compiler.py`)
- [x] Drop deprecated templates/variables API routers

## DB Models & Schemas
- [x] `Workspace` model — maps automations and credentials
- [x] `PostAutomation` model — visual graphs linked to Meta post IDs
- [x] `CredentialReference` model — metadata linking to Meta access tokens
- [x] `WorkflowExecution` model — tracks trigger status, inputs, and outputs

## API Routers
- [x] `/auth` — login & JWT verification
- [x] `/posts` — queries Meta post feed metadata
- [x] `/automations` — CRUD visual builder node graphs and publishing triggers
- [x] `/executions` — triggers manual runs
- [x] `/webhooks` — receive callbacks from n8n runs

---

# 3. N8N API CLIENT
- [x] `N8NClient` class (`backend/app/workflow/client.py`)
- [x] `WorkflowService.trigger_execution` — triggers n8n webhooks and logs execution flow

---

# 4. FRONTEND (AOS Dashboard UI)
- [x] Create Axios client `frontend/services/automation.ts`
- [x] Update `dashboard/layout.tsx` navigation sidebar links (Dashboard, Posts Feed, Visual Builder, History, Settings)
- [x] Create **Posts Feed Page** (`dashboard/posts/page.tsx`) — sync and display Meta post cards
- [x] Create **Visual Builder Workspace** (`dashboard/workflows/page.tsx`) — vertical canvas nodes layout (WHEN, IF, THEN, WAIT) and properties configuration panel
- [x] Create **Executions Page** (`dashboard/executions/page.tsx`) — logs terminal
- [x] Create **Settings Page** (`dashboard/settings/page.tsx`) — configure credentials