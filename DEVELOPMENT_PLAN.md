# DEVELOPMENT_PLAN.md

# Social Media Operating System (SMOS)

Version: v0.1.0

---

# Purpose

This document is the master blueprint of the project.

It explains:

- System architecture
- Folder responsibilities
- Build order
- Data flow
- Module dependencies
- Development roadmap
- Best practices

This file should always answer:

> "What should I build next?"

---

# Overall Vision

The platform should allow users to completely manage every supported social media platform from a single dashboard.

The primary goal of Version 1 is to remove the need for users to open individual social media platforms.

Users should be able to:

- Connect accounts
- Manage connected accounts
- Create posts
- Edit posts
- Save drafts
- Schedule posts
- Publish posts
- Manage media
- View inbox
- Reply to comments
- Reply to messages
- Manage platform settings

The platform must support adding new social media platforms without modifying existing business logic.

Automation, AI and Analytics are Version 2 features.

n8n is responsible only for workflow execution after the Social Media Operating System is complete.

FastAPI remains the source of truth for all business logic.

# High Level Architecture

                     User
                       │
                       ▼
             Next.js Dashboard
                       │
             REST API / WebSocket
                       │
                       ▼
                FastAPI Backend
                       │
 ┌───────────────┬───────────────┬───────────────┐
 │               │               │               │
 ▼               ▼               ▼               ▼
Database    Integration      AI Engine      n8n Engine
(Postgres)     Engine        (OpenAI)       (Automation)

                       │
                       ▼
           Social Media Platforms

Instagram

Facebook

LinkedIn

Threads

YouTube

TikTok

Twitter/X

WhatsApp

Pinterest

Snapchat

etc.

---

# Request Flow

Example

Publish Post

User

↓

Frontend

↓

Backend API

↓

Post Service

↓

Integration Engine

↓

Platform Connector

↓

Platform API

↓

Response Mapper

↓

Database

↓

Frontend

Every feature should follow this flow.

---

# Project Build Order

Never build randomly.

Always build from the bottom upward.

Order
1. Project Setup

2. Database

3. Authentication

4. Core Models

5. Services

6. Integration Engine

7. Platform Management

8. Content Management

9. Engagement Management

10. Workspace & Settings

11. Production Hardening

12. Automation (n8n)

13. Analytics

14. AI

15. Documentation
---

# Backend Architecture

backend/

Purpose

Contains every business rule of the application.

Nothing outside backend should contain business logic.

Flow

API

↓

Service

↓

Integration Engine

↓

Database

↓

Response

---

## api/

Purpose

Only receives requests.

Responsibilities

- Validation
- Authentication
- Call services
- Return responses

Never

- Database logic
- Platform logic
- AI logic

---

## auth/

Purpose

Authentication layer.

Responsibilities

- Login
- Register
- JWT
- OAuth
- Sessions
- Roles
- Permissions

---

## database/

Purpose

Database configuration.

Responsibilities

- PostgreSQL connection
- SQLAlchemy
- Sessions
- Migrations
- Base models

---

## models/

Purpose

Represents database tables.

Every entity in the system has a model.

Examples

User

Account

Post

Message

Comment

Analytics

Automation

Variable

Integration

---

## schemas/

Purpose

API request and response validation.

Contains

Request Models

Response Models

DTOs

Validation

---

## services/

Purpose

Business logic.

This is the heart of the application.

Examples

PostService

AccountService

AnalyticsService

AutomationService

Every API endpoint should call a service.

---

## integrations/

Purpose

Universal connector framework.

The rest of the application must never know which platform it is talking to.

Instead of:

publish_to_instagram()

Everything becomes:

publish_post()

The Integration Engine decides where to send it.

Subfolders

engine/
Core communication logic.

registry/
Lists available integrations and their capabilities.

runtime/
Loads connectors and executes requests.

templates/
Connector templates and configuration.

validators/
OAuth, payload, and response validation.

This architecture allows new platforms to be added without changing the rest of the system.

---

## ai/

Purpose

AI assistance only.

Responsibilities

Caption generation

Reply suggestions

Hashtag suggestions

Summaries

Future recommendations

AI should assist users—not replace manual control.

---

## n8n/

Purpose

Workflow execution only.

Never place business logic in n8n.

Correct Flow

Backend

↓

n8n

↓

Workflow

↓

Backend callback

---

# Frontend Architecture

frontend/

Purpose

User Interface.

Should never contain business logic.

Responsibilities

- Dashboard
- Forms
- Tables
- Graphs
- Settings
- Authentication UI

The frontend only communicates with the backend.

---

## app/

Contains routes/pages.

---

## components/

Reusable UI components.

Example

Sidebar

Header

Post Editor

Charts

Dialogs

Cards

Buttons

---

## hooks/

Reusable React logic.

Authentication

Fetching

Caching

Pagination

---

## services/

Frontend API layer.

Never call fetch() directly inside components.

Always go through services.

---

## types/

Shared TypeScript interfaces.

---

## utils/

Frontend helper functions.

---

# Database Layer

Recommended implementation order

1. User

↓

2. Integration

↓

3. Account

↓

4. Post

↓

5. Message

↓

6. Comment

↓

7. Automation

↓

8. Analytics

↓

9. Variables

Build relationships only after all models exist.

---

# Integration Engine

Goal

Support unlimited platforms.

Connector Flow

Connector

↓

OAuth

↓

Access Token

↓

API Request

↓

Response Mapper

↓

Unified Response

All platform-specific behavior must remain inside connectors.

---

# AI Architecture

Prompt

↓

OpenAI / Gemini

↓

Structured Output

↓

Backend Validation

↓

Frontend

AI must never write directly to the database.

---

# n8n Architecture

Backend creates workflow.

↓

n8n executes workflow.

↓

Workflow calls backend.

↓

Backend updates database.

n8n should never modify business entities directly.

---

# Development Phases

Phase 1 – Foundation

Goal

Running backend, frontend, authentication and database.

Exit

User can securely log in.



Phase 2 – Core Backend

Goal

Complete backend architecture.

Includes

Models

Schemas

Services

CRUD

Validation

Exit

All backend APIs functional.



Phase 3 – Integration Engine

Goal

Universal connector architecture.

Includes

Registry

Runtime

Connector interfaces

OAuth framework

Connector templates

Meta reference connector

Exit

One platform connects successfully.



Phase 4 – Platform Management

Goal

Manage every connected platform.

Includes

Connect

Disconnect

Refresh tokens

Sync

Platform health

Account management

Exit

Multiple platforms managed from dashboard.



Phase 5 – Content Management

Goal

Manage content.

Includes

Posts

Drafts

Media

Scheduling

Publishing

Calendar

Exit

Posts can be created, scheduled and published.



Phase 6 – Engagement

Goal

Manage communication.

Includes

Inbox

Messages

Comments

Replies

Notifications

Exit

Unified inbox fully operational.



Phase 7 – Workspace

Goal

Manage system configuration.

Includes

Settings

Users

Roles

Permissions

Media Library

Exit

System fully configurable.



Phase 8 – Production

Goal

Production readiness.

Includes

Logging

Caching

Background jobs

Performance

Testing

Security

Exit

Production deployment ready.



Phase 9 – Automation

Goal

Workflow execution.

Includes

n8n

Workflows

Triggers

Callbacks

Exit

Automations execute correctly.



Phase 10 – Analytics

Goal

Reporting.

Includes

KPIs

Charts

Reports

Exit

Analytics dashboard operational.



Phase 11 – AI

Goal

Assistance.

Includes

Captions

Replies

Summaries

Recommendations

Exit

AI assists throughout the dashboard.

# Coding Rules

- API only handles HTTP.
- Services contain business logic.
- Models only define data.
- Integrations communicate with external APIs.
- n8n executes workflows only.
- AI only provides assistance.
- Frontend never contains business logic.
- Never duplicate logic.
- Everything must remain platform-independent.

---

Implementation Workflow

Every development phase must follow:

Audit

↓

implementation_status.md

↓

Implementation

↓

current-progress.md

↓

project_checklist.md

↓

Manual Verification

↓

Next Phase

Never skip verification.

Never mark work complete unless implemented.

Never continue to the next phase until exit criteria are satisfied.

# Definition of Done

A feature is complete only when:

- Code implemented
- Tested
- API documented
- UI connected
- Error handling added
- Logging added
- Unit tests written
- Integrated with the dashboard
- Checklist updated
- Documentation updated

---

# Current Milestone
Milestone A

Complete Social Media Operating System

Target

Users should be able to manage every supported platform completely from this dashboard.

Everything except Automation, AI and Analytics.



Milestone B

Automation Layer

Target

n8n executes workflows using backend APIs.



Milestone C

Intelligence Layer

Target

Analytics and AI assist users without replacing manual control.