from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.health import router as health_router
from app.api.database import router as database_router
from app.api.users import router as users_router
from app.api.auth import router as auth_router
from app.api.integrations import router as integrations_router
from app.api.posts import router as posts_router
from app.api.schedules import router as schedules_router
from app.api.media import router as media_router
from app.api.messages import router as messages_router
from app.api.comments import router as comments_router
from app.api.notifications import router as notifications_router
from app.config import APP_NAME, APP_VERSION
from app.database.base import Base
from app.database.session import engine
from app.integrations.core.meta_connector import MetaConnector
from app.integrations.registry.integration_registry import IntegrationRegistry
from fastapi.staticfiles import StaticFiles
import os

IntegrationRegistry.register(MetaConnector())

Base.metadata.create_all(bind=engine)
app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads folder exists
os.makedirs("uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="uploads"), name="static")

app.include_router(health_router)
app.include_router(database_router)
app.include_router(users_router)
app.include_router(auth_router)
app.include_router(integrations_router)
app.include_router(posts_router)
app.include_router(schedules_router)
app.include_router(media_router)
app.include_router(messages_router)
app.include_router(comments_router)
app.include_router(notifications_router)

from app.services.publish_service import PublishService
from app.services.publishing_queue_service import PublishingQueueService
from app.database.session import SessionLocal

@app.on_event("startup")
def startup_event():
    PublishService.start_scheduler_thread()

@app.get("/")
def root():
    return {
        "message": "SMOS Backend Running"
    }