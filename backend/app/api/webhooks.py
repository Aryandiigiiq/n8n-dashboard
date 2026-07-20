from fastapi import APIRouter, Depends, HTTPException, Query, Request, BackgroundTasks
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from app.database.session import SessionLocal, get_db
from app.models.execution import WorkflowExecution
from app.models.log import ExecutionLog
from app.services.sync_engine import sync_platform_metrics  # <-- IMPORTED sync helper
from pydantic import BaseModel
from datetime import datetime
import os

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

from typing import Optional, Union

class WebhookCallbackPayload(BaseModel):
    execution_id: Optional[Union[int, str]] = None
    status: str  # success, failed
    output: dict

# ─── 1. VERIFY METADATA SUBSCRIPTION (GET Endpoint) ───
@router.get("/meta")
def verify_meta_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
    hub_verify_token: str = Query(None, alias="hub.verify_token")
):
    # Retrieve verify token from environment variable
    verify_token = os.getenv("META_VERIFY_TOKEN", "my_verify_token")
    if hub_verify_token != verify_token:
        raise HTTPException(status_code=403, detail="Verify token mismatch")
    # Return raw text challenge back to Meta
    return PlainTextResponse(content=hub_challenge)

# ─── 2. RECEIVE REAL-TIME UPDATES (POST Endpoint) ───
@router.post("/meta")
async def receive_meta_webhook(request: Request, background_tasks: BackgroundTasks):
    payload = await request.json()
    print(f"Received Meta Webhook Payload: {payload}")
    
    # Offload the database sync to a background task so we return 200 OK fast
    background_tasks.add_task(trigger_automatic_sync)
    return {"status": "received"}

async def trigger_automatic_sync():
    """Runs the sync engine to pull latest likes and comments into the DB"""
    try:
        await sync_platform_metrics()
    except Exception as e:
        print(f"Webhook automated sync failed: {e}")

# ─── 3. RESTORED AUTOMATION CALLBACK FOR N8N (DO NOT DELETE) ───
@router.post("/callback")
def execution_callback(data: WebhookCallbackPayload, db: Session = Depends(get_db)):
    execution = db.query(WorkflowExecution).filter(WorkflowExecution.id == data.execution_id).first()
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")

    execution.status = data.status
    execution.finished_at = datetime.now()
    execution.output_payload = data.output

    log = ExecutionLog(
        execution_id=execution.id,
        log_level="info" if data.status == "success" else "error",
        message=f"Received completion callback with status: {data.status}"
    )
    db.add(log)
    db.commit()
    return {"message": "Execution status updated successfully"}
