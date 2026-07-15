# AOS Frontend - Automation Operating System

The frontend of **Automation Operating System (AOS)** is a responsive, modern web application dashboard built with **Next.js (App Router)**, **React**, **TypeScript**, and **Tailwind CSS**. 

It provides an interactive, visual workflow builder to construct automation sequences (such as trigger-filter-action pipelines) and monitor real-time execution logs for social media posts.

---

## 🚀 Key Features

* **Secure Authentication**: Authentication views integrated with JWT authentication on the backend.
* **Posts Feed Panel**: Displays all Instagram/Facebook posts, shows engagement metrics (likes, comments), and indicates active automation status.
* **Visual Sequence Builder**: A vertical node canvas allowing users to sequence triggers (`WHEN new_comment`), filters (`IF comment contains keyword`), actions (`THEN send_dm`), and delays (`WAIT 5 minutes`).
* **Real-time Executions Console**: A log terminal rendering execution flow steps, timestamped triggers, and webhook response payloads.
* **Settings Panel**: Interface for configuring platform API credentials and workspace variables.

---

## 🛠️ Prerequisites

To run the frontend client locally, you need:
- **Node.js** (v18.0.0 or higher recommended)
- **npm** (or `yarn` / `pnpm` / `bun`)

---

## ⚙️ Environment Variables

The frontend relies on a single environment variable to communicate with the backend. Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

* **`NEXT_PUBLIC_API_URL`**: Points to the running FastAPI backend server (default: `http://localhost:8000`).

---

## 🚀 Setup & Installation (Local)

Follow these steps to run the frontend application on your local machine:

### 1. Navigate to Frontend
```bash
cd frontend
```

### 2. Install Node Packages
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to interact with the dashboard.

---

## 🏗️ Production Build

To compile a production bundle and run the server locally:

```bash
# 1. Build the next.js bundle
npm run build

# 2. Run the production node server
npm run start
```

---

## 🐳 Running with Docker / Docker Compose

If using Docker to containerize the services, you can run the entire system from the project root:

```bash
docker compose up --build
```

The frontend container is configured to build using `node:18-alpine` and serves on port `3000` (mapped to `http://localhost:3000` on the host machine).

---

## 📂 Folder Structure

```
frontend/
├── app/
│   ├── login/           # Auth login page view
│   ├── dashboard/       # Core layout with sidebar navigation
│   │   ├── accounts/    # Connect Meta & Social accounts
│   │   ├── content/     # AI Caption/Reply copy generator
│   │   ├── executions/  # Automation run history logs terminal
│   │   ├── posts/       # Posts Grid feed & active cards list
│   │   ├── settings/    # Variables & API keys configuration
│   │   ├── workflows/   # Drag-and-drop Visual sequence builder page
│   │   ├── layout.tsx   # Sidebar shell layout
│   │   └── page.tsx     # Main dashboard homepage metrics summary
│   ├── globals.css      # Tailwind core CSS configurations
│   ├── layout.tsx       # HTML wrapper layout
│   └── page.tsx         # Root router redirecting to dashboard
├── components/          # Reusable UI widgets & Auth guards
│   ├── accounts/        # Component modules for account grids
│   ├── content/         # Components for copy generation forms
│   ├── LoginForm.tsx    # Sign-in block
│   └── ProtectedRoute.tsx # HOC client-side route guard using cookies/localStorage
├── services/            # Axios API wrappers
│   ├── api.ts           # Axios client client interceptors injection
│   ├── auth.ts          # Auth services login/user state
│   ├── automation.ts    # Posts & Automations details CRUD queries
│   └── workflow.ts      # n8n trigger & status syncing requests
├── contexts/            # Global context state variables
├── hooks/               # Custom React hooks
├── public/              # Static image assets, icons, and favicons
└── types/               # TypeScript interfaces for API objects
```

---

## 🔗 Integration Services

The frontend communicates with FastAPI using Axios client calls defined in the `services/` directory:
* **`api.ts`**: Sets up the instance base URL and attaches authorization headers (`Bearer <token>`) retrieved from cookies or storage.
* **`auth.ts`**: Handles authentication workflows (`login`, `getCurrentUser`, `logout`).
* **`automation.ts`**: Handles fetching synced posts, pulling individual node graphs, compiling canvas configurations, and toggling active automation flows.
* **`workflow.ts`**: Orchestrates manual triggers and syncing compiled workflows.
