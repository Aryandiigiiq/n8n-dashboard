Building a scalable, production-grade SaaS dashboard that integrates with Meta and Instagram Graph APIs is a complex architectural undertaking.
Below is the comprehensive technical architecture and implementation guide addressing your 42 requirements.
Disclaimer: Information regarding Meta Graph API, Webhooks, Access Tokens, App Review, Permissions, Rate Limits, and n8n node capabilities is derived directly from the provided source documentation. System architecture design (Next.js/FastAPI folder structures, specific PostgreSQL schemas, caching strategies, and event-driven pub/sub mechanisms) represent industry best practices and are not derived from the provided sources.
Phase 1: Meta App Configuration & Identity
To allow users to connect their accounts, you must configure a Meta App and establish an OAuth 2.0 flow.
1. Meta App Creation & Business Verification (1, 8) You must register as a Meta Developer and create an App in the App Dashboard
. Select the "Instagram API with Facebook Login" use case, as this allows your app to serve professional accounts linked to Facebook Pages
. Because your app serves businesses you do not own, you must connect a verified Meta Business Portfolio
 and complete Business Verification to gain "Advanced Access"
.
2. Required Permissions & App Review (6, 7) To fetch accounts, media, comments, and insights, you must request the following permissions during OAuth:
instagram_basic, instagram_manage_insights, instagram_manage_comments, pages_show_list, pages_read_engagement
.
App Review: Because you are requesting data from users outside your App Role, you must submit your app for Meta App Review
. You will need to provide specific use-case descriptions and screencasts demonstrating how a user logs in and how your dashboard uses this data
.
3. OAuth Flow & Token Lifecycle (2, 3, 4, 5, 24)
OAuth Flow: Initiate a redirect to the Facebook OAuth dialog with your client_id, redirect_uri, scope, and a state parameter (for CSRF protection)
. The user logs in and grants permissions.
Code Exchange: Meta redirects back to your Next.js/FastAPI backend with a code. Exchange this via a server-to-server GET request using your client_secret to get a User Access Token
.
Short to Long-Lived Tokens: The initial token is short-lived (1-2 hours)
. Immediately exchange it for a long-lived token (lasts ~60 days) via a server-side API call
. Note: Meta does not use traditional "Refresh Tokens"; you continuously exchange valid long-lived tokens for new ones before expiration
.
Token Expiration: If a token expires, the API throws an OAuthException (Code 190). Your FastAPI backend must catch this, mark the user's connection as invalid in PostgreSQL, and prompt the user to re-authenticate via the frontend
.
Phase 2: Graph API Object Hierarchy & Endpoints
Graph API Versioning (26): Always prepend the API version (e.g., v25.0) to your URLs to ensure stability. Versions are guaranteed to work for at least two years
.
Relationship Hierarchy (9, 10, 11, 12): A User manages Facebook Pages. A Facebook Page is linked to an Instagram Professional Account
. The IG Account owns IG Media (Reels, Stories, Posts), which in turn own Comments
.
Endpoint Documentation (13, 14, 15)
All requests go to https://graph.facebook.com/v25.0/
. Pagination is cursor-based; responses include paging.next and paging.previous containing after and before cursors
.
A. Fetch Accounts & Pages
HTTP Method: GET
URL: /{user-id}/accounts (or /me/accounts)
Permissions: pages_show_list
Request Params: fields=id,name,instagram_business_account, access_token
Example Response: { "data": [{ "id": "PAGE_ID", "name": "My Page", "instagram_business_account": {"id": "IG_ID"} }] }
Common Errors: Code 10 (Permission Denied)
.
Best Practices: Store the mapping between the User, Page ID, and IG Account ID in your database.
B. Fetch Media (Posts, Reels, Stories)
HTTP Method: GET
URL: /{ig_user_id}/media
Permissions: instagram_basic, pages_read_engagement
Request Params: fields=id,caption,media_type,media_url,timestamp, after={cursor}
Example Response: { "data": [{ "id": "MEDIA_ID", "media_type": "VIDEO", "media_url": "..." }], "paging": {"cursors": {"after": "..."}} }
Common Errors: Rate Limit (Code 32/17)
.
Best Practices: Cache media URLs locally, as Meta's CDN URLs can expire
.
C. Fetch Comments & Replies
HTTP Method: GET
URL: /{ig_media_id}/comments (For replies: /{ig_comment_id}/replies)
Permissions: instagram_manage_comments
Request Params: fields=id,text,timestamp,from
Best Practices: Do not poll this endpoint; rely on Webhooks for comment synchronization to avoid rate limits
.
D. Fetch Insights
HTTP Method: GET
URL: /{ig_media_id}/insights
Permissions: instagram_manage_insights
Request Params: metric=impressions,reach,engagement, period=lifetime
Example Response: { "data": [{ "name": "impressions", "values": [{"value": 1500}] }] }
Common Errors: Error Code 10 ("Not enough viewers for the media to show insights") for Stories with < 5 views
.
Best Practices: Insights data can be delayed up to 48 hours
. Store insights historically in your database.
Phase 3: Synchronization, Webhooks, & Automation (n8n)
To synchronize thousands of accounts efficiently (34), polling is highly discouraged due to strict rate limits. You must use an Event-Driven Architecture (32) utilizing Webhooks (17, 33).
Webhook Setup & Verification (18, 19, 20):
Setup: Configure n8n with a Webhook node. It must respond to a GET verification request containing hub.challenge and hub.verify_token
.
Payload Structure: Webhooks arrive as POST requests. They contain an entry array detailing the changes (e.g., comments, story_insights)
.
Verification: Validate the payload's HMAC SHA-256 signature via the X-Hub-Signature-256 header using your App Secret
.
Retries & Behavior: Your n8n webhook must quickly return a 200 OK HTTP status. If it fails or times out, Meta will retry with decreasing frequency for up to 36 hours
.
Handling Incremental Sync & Updates (16, 35, 36, 37):
Edited Captions/Media Updates: Subscribe to the feed webhook. When a post changes, process the JSON payload in n8n, map it to your DB via the PostgreSQL node, and run an UPDATE based on the Media ID.
Deleted Posts: If a webhook indicates a deletion, or if a standard Graph API fetch returns a null object, soft-delete the record in your database.
Story Insights: Stories expire in 24 hours. Subscribe to the story_insights webhook to receive final metrics right before expiration
.
n8n vs. FastAPI Interaction (30, 31, 38):
FastAPI (Backend): Handles user OAuth flows, JWT generation, secure token storage, and serving synchronous API requests to the Next.js frontend.
n8n (Automation): Acts as your asynchronous worker. It receives Meta Webhooks, validates them, and pushes data to PostgreSQL
. For historical syncing, FastAPI can enqueue a job, triggering a scheduled n8n workflow (via the Schedule Trigger) to paginate through older media using the HTTP Request Node
.
Phase 4: Resiliency, Rate Limits & Security
Rate Limiting & Retries (22, 23, 42):
Business Use Case (BUC) Limits: Operations are limited per ad account/Page based on engagement/active ads
. Watch the X-Business-Use-Case-Usage response header
. It provides % of CPU and call count used
.
Throttling: If you hit limits (Error Code 17 or 32)
, Meta provides estimated_time_to_regain_access. Your n8n or Python retry logic must parse this and implement exponential backoff combined with a circuit breaker to pause requests
.
Pitfall Avoidance: Do not fetch data concurrently for the same Page/User. Use Batch Requests
 where you can send up to 50 operations in a single HTTP call to reduce network latency.
Security Best Practices (25):
Never expose App Secrets or Long-Lived Tokens in the Next.js frontend
.
Store Long-Lived tokens securely in PostgreSQL using encryption at rest.
Ensure Webhooks are protected by HTTPS (TLS/SSL) and strict HMAC signature validation
.
Phase 5: Proposed Software Architecture & Data Model
(Note: The following architectural schemas, folder structures, and deployment topologies reflect industry-standard engineering practices and extend beyond the provided Meta documentation).
27 & 28. Recommended PostgreSQL Data Model:
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR UNIQUE,
    meta_user_id VARCHAR UNIQUE,
    long_lived_token VARCHAR, -- Encrypted
    token_expires_at TIMESTAMP
);

CREATE TABLE pages (
    id VARCHAR PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    name VARCHAR,
    ig_account_id VARCHAR UNIQUE
);

CREATE TABLE media (
    id VARCHAR PRIMARY KEY,
    ig_account_id VARCHAR REFERENCES pages(ig_account_id),
    media_type VARCHAR, -- IMAGE, VIDEO, REEL
    media_url TEXT,
    caption TEXT,
    posted_at TIMESTAMP
);

CREATE TABLE insights (
    media_id VARCHAR REFERENCES media(id),
    metric_name VARCHAR,
    metric_value INT,
    recorded_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (media_id, metric_name)
);
29. Caching Strategy:
Implement Redis between FastAPI and PostgreSQL. Cache high-read, low-churn data like standard Dashboard Metrics and Page Profiles. Invalidate the cache when an n8n webhook workflow processes an update from Meta.
39 & 41. High-Level System Architecture & Deployment:
Frontend: Next.js deployed on Vercel/CDN.
Backend: FastAPI deployed in Docker containers on AWS ECS or EKS.
Automation: n8n self-hosted via Docker
 (connected to the same VPC as your database) to securely receive webhooks and handle heavy background syncing.
Message Broker: Use RabbitMQ or AWS SQS. When n8n receives a webhook, it places the event in a queue. FastAPI background workers consume the queue to ensure no data is dropped during traffic spikes.
Database: AWS RDS PostgreSQL (Multi-AZ for production) + AWS ElastiCache (Redis).
40. Recommended Folder Structure:
/saas-dashboard-mono
├── /frontend               # Next.js, React, Tailwind
│   ├── /components         # UI components (Charts, Tables)
│   ├── /pages              # Dashboard routing
│   └── /hooks              # Data fetching (SWR/React Query)
├── /backend                # FastAPI
│   ├── /api                # Endpoints (auth, metrics, triggers)
│   ├── /services           # Meta OAuth logic, Token encryption
│   ├── /models             # SQLAlchemy DB schemas
│   └── /celery_tasks       # Fallback async workers
└── /n8n                    # Automation
    ├── /workflows          # Exported n8n JSON schemas (Webhooks, Cron)
    └── docker-compose.yml  # n8n deployment config
By strictly utilizing Meta's Webhooks via n8n for data ingestion, and reserving FastAPI for UI serving and OAuth flow management, your architecture will elegantly scale to support thousands of concurrent Instagram professional accounts while staying safely within Meta's stringent API limits.

To build a modular, scalable commercial social media management platform (similar to Buffer, Sprout Social, or Hootsuite), the architecture must decouple synchronous user operations from asynchronous platform interactions.
In this design, FastAPI serves as the synchronous API for your Next.js frontend (managing local state, database reads, and triggering jobs). n8n acts as the asynchronous worker (handling rate limits, retries, historical syncing, and webhook ingestion).
To support future integrations (LinkedIn, X, TikTok), the API utilizes generic /api/v1/{platform}/* routing.
Here is the exact backend API specification.
1. Generate OAuth Connection URL
Initiates the connection process for any supported platform.
Endpoint: /api/v1/auth/{platform}/connect
Method: GET
Request body: None
Response: { "auth_url": "https://www.facebook.com/v25.0/dialog/oauth?client_id=...&redirect_uri=...&scope=...&state=..." }
Validation: Validate {platform} against an Enum (e.g., meta, linkedin, tiktok).
Authentication: Bearer Token (FastAPI JWT for logged-in user).
Database tables affected: None directly.
Meta endpoint it calls: Generates the URL for https://www.facebook.com/v25.0/dialog/oauth
.
n8n workflow triggered: None.
Error handling: Return 400 Bad Request if platform is unsupported.
Retry logic: N/A (Frontend redirect).
2. Handle OAuth Callback & Token Exchange
Exchanges the authorization code for a short-lived token, then immediately upgrades it to a long-lived token.
Endpoint: /api/v1/auth/{platform}/callback
Method: POST
Request body: { "code": "string", "state": "string", "redirect_uri": "string" }
Response: { "message": "Connection successful", "platform_user_id": "string" }
Validation: Verify state matches the CSRF token generated in step 1. Ensure code is present
.
Authentication: Bearer Token (FastAPI JWT).
Database tables affected: users (Updates long_lived_token, meta_user_id, token_expires_at).
Meta endpoint it calls:
GET /v25.0/oauth/access_token (Short-lived exchange)
.
GET /v25.0/oauth/access_token?grant_type=fb_exchange_token (Long-lived upgrade).
n8n workflow triggered: Triggers Onboarding_Initial_Sync_Workflow via n8n Webhook Node to begin fetching the user's Pages and IG Accounts asynchronously.
Error handling: Catch OAuthException (Code 190)
. Return 401 Unauthorized if token exchange fails.
Retry logic: If network failure during server-to-server token exchange, implement up to 3 immediate retries with exponential backoff.
3. List Connected Accounts & Pages
Retrieves the user's connected social media accounts for the dashboard UI.
Endpoint: /api/v1/accounts
Method: GET
Request body: None
Response: { "data": [{ "account_id": "string", "platform": "meta", "name": "My IG Page", "profile_pic": "url" }] }
Validation: Optional query parameter ?platform=meta to filter.
Authentication: Bearer Token (FastAPI JWT).
Database tables affected: Reads from pages and users tables.
Meta endpoint it calls: None directly. FastAPI queries the local PostgreSQL database, which is kept up-to-date by n8n.
n8n workflow triggered: None.
Error handling: Return 404 Not Found if no accounts are connected.
Retry logic: N/A (Database read).
4. Publish or Schedule Content
Creates a post or schedules it for later across single or multiple platforms.
Endpoint: /api/v1/content/publish
Method: POST
Request body:
Response: { "message": "Content scheduled", "post_ids": ["uuid-1", "uuid-2"] }
Validation: Validate schedule_at is in the future. Validate media_url formats. Ensure caption does not exceed platform limits.
Authentication: Bearer Token (FastAPI JWT).
Database tables affected: media (Inserts records with status SCHEDULED or PUBLISHING).
Meta endpoint it calls: If publishing immediately via n8n: POST /v25.0/{ig-user-id}/media (creates container) followed by POST /v25.0/{ig-user-id}/media_publish (publishes container)
.
n8n workflow triggered: Pushes payload to n8n's Content_Publisher_Workflow. If schedule_at is present, n8n queues the job until the specified time using a Schedule Trigger or Wait node
.
Error handling: Return 400 Bad Request for invalid media formats. If Meta rejects the container (e.g., copyright violation), update DB status to FAILED.
Retry logic: Passed to n8n. n8n HTTP Request node configured to retry up to 5 times for 500-level server errors, but fails immediately for 400-level authentication errors.
5. Fetch Dashboard Insights (Analytics)
Returns time-series data for the dashboard charts (Reach, Impressions, Likes).
Endpoint: /api/v1/analytics/insights
Method: GET
Request body: None (Query params: ?account_id=...&start_date=...&end_date=...&metrics=reach,impressions)
Response: { "data": [ { "date": "2026-07-01", "impressions": 1500, "reach": 1200 } ] }
Validation: Ensure date ranges do not exceed 2 years (Meta's retention limit)
.
Authentication: Bearer Token (FastAPI JWT).
Database tables affected: Reads from insights table.
Meta endpoint it calls: None. (Querying Meta synchronously on dashboard load will cause BUC Rate Limit Error 80002
). FastAPI reads directly from PostgreSQL/Redis cache.
n8n workflow triggered: None.
Error handling: 400 Bad Request for invalid date ranges.
Retry logic: N/A (Local DB read).
6. Trigger Historical Data Sync
Triggers a backfill of historical posts, comments, and insights.
Endpoint: /api/v1/accounts/{account_id}/sync
Method: POST
Request body: { "sync_type": "historical", "days_back": 90 }
Response: { "message": "Historical sync started", "job_id": "uuid" }
Validation: Verify account_id belongs to the logged-in user. Limit days_back to prevent database bloat.
Authentication: Bearer Token (FastAPI JWT).
Database tables affected: None synchronously. n8n will asynchronously populate media, insights, and comments tables.
Meta endpoint it calls: n8n will asynchronously call GET /v25.0/{ig_account_id}/media
 and paginate using the after cursor, then call GET /v25.0/{ig_media_id}/insights
 for each item.
n8n workflow triggered: Historical_Backfill_Workflow (FastAPI sends a webhook to n8n containing the user's long_lived_token and account_id).
Error handling: If n8n rejects the webhook, return 503 Service Unavailable.
Retry logic: Within the n8n workflow, the HTTP Request node must utilize the Pagination setting
. If it hits a rate limit (Code 32, 17, or 80002)
, n8n must pause execution based on the estimated_time_to_regain_access found in the X-Business-Use-Case-Usage HTTP header
 before retrying.
7. Interact with Comments (Reply / Delete)
Allows users to reply to or delete comments directly from your dashboard.
Endpoint: /api/v1/content/comments/{comment_id}
Method: POST (for reply) or DELETE
Request body (for reply): { "message": "Thanks for your feedback!" }
Response: { "message": "Comment posted", "comment_id": "new-uuid" }
Validation: Ensure message is not empty and under platform character limits.
Authentication: Bearer Token (FastAPI JWT).
Database tables affected: comments (Insert new reply or mark comment as deleted).
Meta endpoint it calls:
POST: POST /v25.0/{comment_id}/replies
DELETE: DELETE /v25.0/{comment_id}
n8n workflow triggered: Comment_Action_Workflow. (FastAPI acts as a proxy, passing the command to n8n to ensure retries and rate limit safety).
Error handling: Meta Code 10 (Permission Denied) if the user lacks instagram_manage_comments
.
Retry logic: n8n handles standard 500-level HTTP retries. Do not retry 400-level permission errors.
Inbound Webhook Architecture (n8n Managed)
To keep the platform's database synchronized without exhausting Meta's API Rate limits via polling, FastAPI will not expose inbound webhook endpoints. Instead, Webhooks are handled entirely by n8n.
Meta -> n8n Webhook Node: Configure n8n with a Webhook node set to GET (for verification) and POST (for payloads)
.
Workflow: Incoming_Meta_Event_Router:
Validates the X-Hub-Signature-256 using the App Secret via an n8n Crypto node
.
Checks the changes.field property
.
If comments, push directly to PostgreSQL.
If story_insights, update PostgreSQL record before the 24-hour expiration
.
Response: n8n must immediately return a 200 OK to Meta before processing the payload to prevent Meta from assuming a timeout and retrying
.