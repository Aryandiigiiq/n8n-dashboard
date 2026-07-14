from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.execution import WorkflowExecution
from app.models.log import ExecutionLog
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

from typing import Optional, Union

class WebhookCallbackPayload(BaseModel):
    execution_id: Optional[Union[int, str]] = None
    status: str  # success, failed
    output: dict


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
