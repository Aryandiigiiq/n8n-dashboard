from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.api.oauth import router as oauth_router
from app.api.posts import router as posts_router
from app.api.health import router as health_router
from app.api.database import router as database_router
from app.api.users import router as users_router
from app.api.auth import router as auth_router
from app.api.automations import router as automations_router
from app.api.executions import router as executions_router
from app.api.webhooks import router as webhooks_router

app = FastAPI(title="AOS Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)

# Register routers
app.include_router(health_router)
app.include_router(oauth_router)
app.include_router(posts_router)
app.include_router(database_router)
app.include_router(users_router)
app.include_router(auth_router)
app.include_router(automations_router)
app.include_router(executions_router)
app.include_router(webhooks_router)
