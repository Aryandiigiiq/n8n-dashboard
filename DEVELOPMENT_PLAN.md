Vision

Build a modern Automation Operating System powered entirely by n8n.

Backend is only an orchestration layer.

No platform integrations are implemented in this project.

Core Principles

Everything goes through n8n.

Backend never calls Meta.

Backend never calls LinkedIn.

Backend never calls Slack.

Backend never calls GitHub.

Backend never performs workflow logic.

n8n performs every automation.

High Level Architecture
User

↓

Frontend

↓

REST API

↓

FastAPI

↓

Workflow Service

↓

n8n REST API

↓

Workflow

↓

External Systems
Responsibilities

Frontend

Only UI

Backend

Authentication

Workflow execution

Templates

Variables

Permissions

History

Logs

Database

Stores

Users

Workspaces

Templates

Variables

Execution History

Credentials Metadata

Never stores third-party tokens.

n8n stores credentials.

Folder Responsibilities

backend/

auth/

workflow/

templates/

executions/

history/

variables/

logs/

webhooks/

frontend/

dashboard/

workflow/

templates/

executions/

settings/

docs/

n8n/

Workflow Execution

Every button follows

User

↓

Button

↓

Backend

↓

Execute Workflow

↓

n8n

↓

External Service

↓

Backend Callback

↓

Database

↓

Frontend
Workflow Templates

Examples

Comment Auto Reply

Lead Capture

GitHub Issue Creator

Sentry Error Processor

Slack Notification

Email Automation

CRM Sync

Social Publishing

Invoice Generator

Document Processing

Variables

Each workflow receives

JSON variables

Example

{
  "keyword":"refund",
  "reply":"Please DM us.",
  "delay":5
}
Webhooks

n8n

↓

Backend

↓

Execution Status

↓

Logs

↓

Frontend

Database Models

User

Workspace

WorkflowTemplate

WorkflowExecution

WorkflowVariable

WorkflowVersion

Webhook

CredentialReference

ExecutionLog

AuditLog

Role

Permission

API

/auth

/workflows

/templates

/executions

/logs

/history

/settings

/webhooks

Development Order
Phase 1

Foundation

Authentication

Database

Users

Settings

Environment

Phase 2

Workflow Management

CRUD

Import

Export

Execute

Stop

Retry

Clone

Version

Phase 3

Variables

Forms

Input Validation

Schema Builder

Secrets

Phase 4

Execution Engine

Execution Queue

Status

History

Logs

Retry

Phase 5

Scheduling

Cron

Timers

Recurring Jobs

Delayed Execution

Phase 6

Monitoring

Dashboard

Statistics

Alerts

Notifications

Phase 7

Marketplace

Workflow Templates

Import

Export

Sharing

Categories

Phase 8

AI

Workflow Generation

Prompt to Workflow

Workflow Optimization

Suggestions

Documentation Generation

Coding Rules

✓ No platform logic

✓ No Meta SDK

✓ No LinkedIn SDK

✓ No OAuth for external services

✓ No platform connectors

✓ Everything through n8n

✓ Thin backend

✓ Stateless APIs

✓ Reusable workflow execution

✓ Every feature must be configurable

✓ Never hardcode workflow IDs

✓ Workflow IDs must come from templates

Definition of Done

A feature is complete only if:

Backend implemented
Frontend connected
n8n workflow tested
Execution logged
Retry supported
Errors handled
Documentation updated
Manual verification completed