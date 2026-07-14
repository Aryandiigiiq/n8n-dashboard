# Automation Operating System (AOS)

## Vision

Automation Operating System (AOS) is a web application that provides a clean user interface for creating, managing and executing automations powered entirely by n8n.

Unlike traditional automation tools, AOS does not implement integrations directly.

Every integration is delegated to n8n.

The backend only manages:

• Authentication
• Users
• Workspaces
• Workflow execution
• Workflow templates
• Variables
• Credentials
• Logs
• Execution history
• Permissions

Every external service such as:

• Meta
• LinkedIn
• Slack
• Discord
• GitHub
• Gmail
• Sentry
• Notion
• Google Drive
• Stripe
• Shopify
• WhatsApp

is accessed only through n8n.

No platform-specific logic exists inside this repository.

---

## Core Philosophy

Backend owns business logic.

n8n owns integrations.

Frontend owns UI.

---

## Architecture

User

↓

Next.js

↓

FastAPI

↓

Workflow Service

↓

n8n REST API

↓

n8n Workflow

↓

External Services

---

## Features

✓ Authentication

✓ Workspace Management

✓ Workflow Library

✓ Workflow Templates

✓ Variables

✓ Credentials

✓ Executions

✓ Logs

✓ Versioning

✓ Scheduling

✓ Webhooks

✓ AI Assisted Workflow Builder (Future)

---

## Technology

Frontend

Next.js
React
TypeScript
Tailwind

Backend

FastAPI
Python
PostgreSQL
SQLModel

Automation

n8n Cloud

---

## Folder Structure

frontend/

backend/

docs/

n8n/

scripts/

---

## Environment Variables

N8N_BASE_URL

N8N_API_KEY

DATABASE_URL

JWT_SECRET

OPENAI_API_KEY (optional)

---

## Development

Install

Run Backend

Run Frontend

Configure n8n

Import templates

Start development

---

## Development Rules

Never implement Meta APIs.

Never implement OAuth for third-party platforms.

Never call third-party APIs directly.

Everything must go through n8n.

Never duplicate workflow logic.

Keep backend platform independent.

---

## Roadmap

Phase 1
Foundation

Phase 2
Workflow Engine

Phase 3
Template Library

Phase 4
Execution Engine

Phase 5
Scheduling

Phase 6
Monitoring

Phase 7
Marketplace

Phase 8
AI Workflow Generation
---

# Project Rules

1. Dashboard First

Never require users to leave the dashboard to perform common tasks.

---

2. Universal Integrations

The system should not depend on a specific platform.

Everything should work through the Integration Engine.

---

3. Separation of Concerns

- API handles requests
- Services contain business logic
- Models store data
- Integration Engine communicates with external APIs
- n8n executes automations

---

4. No Duplicate Logic

Every shared function should exist only once.

---

5. Platform Independence

Business logic should never reference:

- Instagram
- Facebook
- LinkedIn

directly.

Instead use:

- Integration
- Account
- Post
- Message
- Comment

---

6. Automation

n8n should never contain business logic.

Business logic belongs inside FastAPI.

n8n only executes workflows.

---

7. AI

AI should assist users.

Never replace manual controls.

---

# Long-Term Goal

Build a platform where a user can:

- Connect any supported social platform
- Publish content
- Manage inbox
- Reply to comments
- Run automations
- View analytics
- Generate AI content

without ever opening the native social media platform.

---

# Current Progress

## Backend

- [ ] Setup
- [ ] Authentication
- [ ] Database
- [ ] API
- [ ] Services
- [ ] Integrations
- [ ] n8n

## Frontend

- [ ] Dashboard
- [ ] Accounts
- [ ] Posts
- [ ] Inbox
- [ ] Analytics
- [ ] Settings

## AI

- [ ] Captions
- [ ] Replies
- [ ] Summaries

## Documentation

- [ ] Architecture
- [ ] API
- [ ] Database
- [ ] Integrations

---

# Version

Current Version

```
v0.1.0 (MVP)
```

Next Target

```
v0.2.0

✔ Multiple Platforms

✔ Unified Inbox

✔ Publishing

✔ Analytics

✔ n8n Integration
```