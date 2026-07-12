# Social Media Operating System (SMOS)

> A universal social media management dashboard built with FastAPI, Next.js and n8n.

---

# Vision

SMOS is an internal platform that allows a team to manage multiple social media platforms from a single dashboard.

Instead of opening Instagram, Facebook, LinkedIn, YouTube or other platforms separately, every operation should be possible directly from this dashboard.

The dashboard should become the single place for:

- Connecting accounts
- Publishing content
- Managing comments
- Replying to inbox messages
- Running automations
- Viewing analytics
- AI assisted content creation

n8n is used only as the automation engine.

The dashboard controls everything.

---

# Design Goals

- Universal
- Platform Independent
- Simple
- Fast
- Modular
- Easy to Extend
- Internal Tool
- AI Ready

---

# Technology Stack

## Backend

- Python
- FastAPI
- SQLAlchemy / SQLModel
- PostgreSQL

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

## Automation

- n8n

## AI

- OpenAI
- Gemini

---

# Project Structure

```
n8n-dashboard/

backend/
frontend/
n8n/
docs/

README.md
```

---

# Backend

Responsible for

- API
- Authentication
- Database
- Business Logic
- Integrations
- AI
- n8n
- Analytics

```
backend/

app/

api/

auth/

database/

models/

services/

integrations/

n8n/

ai/

utils/

main.py
```

---

# Frontend

Responsible for

- Dashboard
- UI
- User Interaction

```
frontend/

app/

components/

hooks/

services/

utils/

types/

public/
```

---

# n8n

Responsible for

- Workflow Storage
- Automation Execution
- Workflow Templates

```
n8n/

workflows/

templates/

exports/

logs/
```

---

# Documentation

```
docs/

architecture/

api/

database/

integrations/
```

---

# Folder Responsibilities

---

# api/

Contains all API endpoints.

Examples

```
/auth

/accounts

/posts

/messages

/comments

/analytics

/automation

/settings

/webhooks
```

Status

```
[ ]
```

---

# auth/

Responsible for

- Login
- JWT
- OAuth
- Sessions

Status

```
[ ]
```

---

# database/

Responsible for

- Database Connection
- ORM
- Sessions
- Base Model

Status

```
[ ]
```

---

# models/

Contains database models.

Current Models

- User
- Account
- Post
- Message
- Comment
- Automation
- Analytics
- Variable
- Integration

Status

```
[ ]
```

---

# services/

Contains business logic.

Examples

- Account Service
- Post Service
- Message Service
- Analytics Service
- Automation Service

Status

```
[ ]
```

---

# integrations/

Responsible for connecting every platform.

Everything should be configurable.

No platform-specific business logic should exist outside this module.

Structure

```
integrations/

engine/

registry/

runtime/

templates/

validators/
```

Status

```
[ ]
```

---

# integrations/engine/

Core engine.

Responsible for

- OAuth
- HTTP Requests
- Token Refresh
- API Calls
- Media Upload
- Webhooks
- Response Mapping

Status

```
[ ]
```

---

# integrations/registry/

Keeps track of

- Installed Integrations
- Available Integrations
- Capabilities

Status

```
[ ]
```

---

# integrations/runtime/

Responsible for

- Loading Integrations
- Executing Requests
- Parsing Responses

Status

```
[ ]
```

---

# integrations/templates/

Contains JSON templates.

Examples

- Meta
- LinkedIn
- Twitter
- YouTube
- Blank Connector

Status

```
[ ]
```

---

# integrations/validators/

Responsible for

- OAuth Validation
- API Validation
- Mapping Validation

Status

```
[ ]
```

---

# n8n/

Responsible for

- Deploy Workflows
- Execute Workflows
- Workflow Logs
- Execution Status

Status

```
[ ]
```

---

# ai/

Responsible for

- Caption Generation
- Reply Generation
- Summaries

Status

```
[ ]
```

---

# utils/

Contains shared helper functions.

Status

```
[ ]
```

---

# Dashboard Features

## Dashboard

Shows

- Connected Accounts
- Recent Posts
- Scheduled Posts
- Running Automations
- Notifications
- Analytics Overview

---

## Accounts

Responsible for

- Connect Account
- Disconnect Account
- Sync Account
- Account Health

---

## Posts

Responsible for

- Create Post
- Edit Post
- Delete Post
- Schedule Post
- Publish Post

---

## Inbox

Responsible for

- Messages
- Conversations
- Replies

---

## Comments

Responsible for

- View Comments
- Reply
- Hide
- Delete

---

## Automation

Responsible for

- Execute Workflow
- Enable Workflow
- Disable Workflow
- Logs

---

## Analytics

Responsible for

- Followers
- Reach
- Engagement
- Views
- CTR
- Growth

---

## Settings

Responsible for

- Integrations
- API Keys
- Users
- General Settings

---

# Database Models

```
User

Integration

Account

Post

Message

Comment

Automation

Variable

Analytics
```

---

# Future Integrations

The system should support

- Instagram
- Facebook
- Threads
- LinkedIn
- WhatsApp
- Twitter / X
- YouTube
- TikTok
- Pinterest
- Reddit
- Discord
- Snapchat

without changing the dashboard.

---

# Development Roadmap

## Phase 1

Foundation

```
[ ] FastAPI

[ ] Database

[ ] Authentication

[ ] Frontend Setup
```

---

## Phase 2

Integrations

```
[ ] Meta

[ ] LinkedIn

[ ] Twitter

[ ] WhatsApp
```

---

## Phase 3

Content

```
[ ] Posts

[ ] Scheduling

[ ] Publishing
```

---

## Phase 4

Inbox

```
[ ] Messages

[ ] Comments

[ ] Replies
```

---

## Phase 5

Automation

```
[ ] n8n

[ ] Workflow Execution

[ ] Logs
```

---

## Phase 6

Analytics

```
[ ] Dashboard

[ ] Reports

[ ] KPIs
```

---

## Phase 7

AI

```
[ ] Captions

[ ] Replies

[ ] Summaries
```

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