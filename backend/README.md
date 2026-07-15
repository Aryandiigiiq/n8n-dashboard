# AOS Backend - Automation Operating System

The backend of **Automation Operating System (AOS)** is a lightweight orchestration layer built with **FastAPI**, **SQLAlchemy**, and **PostgreSQL**. Its primary responsibility is to act as a bridge between the user interface and **n8n**, the underlying automation runner. 

The backend manages authentication, database models, credentials metadata, and compiles visual drag-and-drop automation graphs into native **n8n** webhook-triggered workflows. It does **not** call third-party platforms (like Instagram, Facebook, or Slack) directly; all integration logic is delegated to n8n.

---

## 🏗️ Architecture

```
User (Browser) ──> Next.js Dashboard (Frontend)
                         │
                         ▼ (REST API / JWT)
                   FastAPI (Backend)
                         │
                         ├─> PostgreSQL (Database)
                         │
                         ▼ (n8n REST API)
                    n8n Server
                         │
                         ▼
                External Services (Instagram Graph API, Slack, etc.)
```

---

## 🛠️ Prerequisites

To run the backend locally, you will need:
- **Python 3.11+**
- **PostgreSQL 15+** (locally installed or run via Docker)
- An **n8n** instance (Cloud or self-hosted) with REST API enabled.

---

## ⚙️ Environment Variables

Create a `.env` file in the `backend/` directory. Here is a description of the required variables:

| Variable | Description | Example / Default |
|----------|-------------|-------------------|
| `APP_NAME` | The application name. | `SMOS` |
| `APP_VERSION` | Current application version. | `0.1.0` |
| `DEBUG` | Toggle debug mode (true/false). | `True` |
| `DATABASE_URL` | PostgreSQL connection string. | `postgresql://postgres:password@localhost:5432/soms_db` |
| `JWT_SECRET` | Secret key used for signing JWT login tokens. | `your-super-secret-key` |
| `JWT_ALGORITHM` | Algorithm used for JWT encoding. | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Lifetime of a session JWT. | `60` |
| `N8N_BASE_URL` | The base URL of your n8n instance. | `https://n8n.example.com` or `http://localhost:5678` |
| `N8N_API_KEY` | n8n REST API authentication key. | `your-n8n-api-key` |
| `META_APP_ID` | Meta Developer App ID. | `898628632648131` |
| `META_APP_SECRET` | Meta Developer App Secret. | `6af4...855` |
| `META_ACCESS_TOKEN` | System/Page Meta Access token for APIs. | `IGAAM...ZDZD` |

---

## 🚀 Setup & Installation (Local)

Follow these steps to run the backend service on your local machine:

### 1. Clone & Navigate to Backend
```bash
cd backend
```

### 2. Create and Activate Virtual Environment
* **Windows (PowerShell):**
  ```powershell
  python -m venv venv
  .\venv\Scripts\Activate.ps1
  ```
* **macOS / Linux:**
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```

### 3. Install Dependencies
You can install the dependencies via:
```bash
pip install -r requirements.txt
```
*Note: If the `requirements.txt` file contains absolute path mappings specific to local setups, you can install the core packages directly:*
```bash
pip install fastapi uvicorn sqlalchemy psycopg2-binary python-dotenv PyJWT bcrypt pydantic requests
```

### 4. Create local database
Ensure PostgreSQL is running and you have created a database matching your `DATABASE_URL` (e.g., `soms_db`).

### 5. Running Database Seed Script
The project includes a `seed_data.py` script. Running this script drops any existing database tables, regenerates them, and inserts mock data for testing. See details below under the **Seeding Database** section.
```bash
python seed_data.py
```

### 6. Run the FastAPI Server
Launch the development server using Uvicorn:
```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
Open [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) in your browser to view the interactive Swagger API documentation.

---

## 🐳 Running with Docker / Docker Compose

If you prefer to run the entire stack (PostgreSQL + Backend + Frontend) using Docker Compose, navigate to the root directory and run:

```bash
docker compose up --build
```

The database container (`smos_db`) will initialize automatically. The backend will wait for PostgreSQL and start listening on port `8000`.

---

## 🌱 Seeding the Database (`seed_data.py`)

The seeding script `seed_data.py` is essential to set up an operational database with default configuration and test records. 

### What the Seed Script Does:
1. **Drops all tables** to ensure a clean slate.
2. **Recreates tables** based on SQLAlchemy/SQLModel definitions.
3. **Creates a Default User** with:
   - **Email:** `aryangoel129@gmail.com` (can be customized)
   - **Password:** `MultimanH` (can be customized)
4. **Creates a Default Workspace** owned by the newly created user.
5. **Seeds Meta credentials metadata** linked to the workspace (to simulate connected Instagram Graph accounts).
6. **Seeds 3 Mock Instagram Post Automations** pre-configured with visual graph structures:
   - **Post 1 (Catalog Request):** Comments containing `"catalog"` trigger a direct message response: *"Hi! Here is our summer collection catalog link..."*
   - **Post 2 (Discount Code):** Comments containing `"discount"` trigger a DM: *"Your code is FLASH25!..."*
   - **Post 3 (Help/Support):** Comments containing `"help"` trigger a support message.

### How to Run the Seed Command:

* **Locally:**
  Ensure your virtual environment is active and run:
  ```bash
  python seed_data.py [custom_email] [custom_password]
  ```
  *(Omitting arguments defaults the user to `aryangoel129@gmail.com` with password `MultimanH`)*

* **Using Docker Compose:**
  If running the project inside Docker Compose containers, execute the script inside the backend container using:
  ```bash
  docker compose exec backend python seed_data.py
  ```
  Or to specify custom credentials inside Docker:
  ```bash
  docker compose exec backend python seed_data.py user@example.com MySecurePassword123
  ```

---

## 📂 Directory Structure

```
backend/
├── app/
│   ├── api/            # Route controllers (Auth, Automations, Posts, Webhooks)
│   ├── auth/           # Password hashing & JWT generation/verification
│   ├── compiler/       # compiler.py translates visual graphs into n8n JSON
│   ├── core/           # App configuration, security settings
│   ├── database/       # Database sessions & DeclarativeBase setup
│   ├── models/         # SQLAlchemy models (User, PostAutomation, Workspace, etc.)
│   ├── n8n/            # Files representing compiled templates
│   ├── schemas/        # Pydantic schemas for request/response serialization
│   ├── services/       # Core business logic (WorkflowService, AuthService)
│   ├── utils/          # Helper modules
│   └── main.py         # App entry point; registers CORS & API routers
├── scripts/            # Helper bash scripts
├── seed_data.py        # Database recreate & mock data injection script
├── requirements.txt    # Python dependencies file
└── Dockerfile          # Multi-stage production container setup
```

---

## ⚙️ Compilation & n8n Workflows

The `WorkflowCompiler` (in `app/compiler/compiler.py`) translates sequences created on the frontend visual canvas:
- **`incoming_event`** ➔ Compiled into an **n8n Webhook Node** listening to incoming event payloads from social webhooks.
- **`if_condition`** ➔ Compiled into an **n8n If Node** comparing the incoming `$json.body.message` using dynamic operators (e.g., `contains`, `equals`).
- **`send_request`** ➔ Compiled into an **n8n HTTP Request Node** calling the backend `/webhooks/callback` API, which executes downstream behaviors (like sending an Instagram DM).
- **`delay`** ➔ Compiled into an **n8n Wait Node** to delay downstream execution by a configured duration.
- **`store_value`** ➔ Compiled into an **n8n Set Node** to save execution context variables.

---

## 🔌 API Endpoints Reference

The backend exposes several routers to manage dashboard state:

* **Authentication (`/auth`)**
  - `POST /auth/login` - Exchange email and password for a JWT.
  - `GET /auth/me` - Authenticate current user using Authorization header.
* **Posts Feed (`/posts`)**
  - `GET /posts` - List posts fetched from the Meta credentials.
  - `POST /posts/sync` - Manually trigger sync of posts from Instagram to the local DB.
* **Automations Builder (`/automations`)**
  - `GET /automations` - List workspace automations.
  - `GET /automations/{id}` - Fetch single automation node graph details.
  - `POST /automations` - Create or update an automation and its canvas graph.
  - `POST /automations/{id}/publish` - Compile the graph, register the webhook on n8n, and mark it as active.
  - `POST /automations/{id}/deactivate` - Disable the automation, deleting the n8n webhook registry.
* **Callback Webhooks (`/webhooks`)**
  - `POST /webhooks/callback` - Hook endpoints hit by executing n8n nodes to log execution steps in real-time.
* **Executions Logs (`/executions`)**
  - `GET /executions` - Query status logs of automated executions.
