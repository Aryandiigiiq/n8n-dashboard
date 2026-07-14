from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.workspace import Workspace
from app.models.execution import WorkflowExecution
from app.schemas.workflow import ExecutionTrigger, ExecutionResponse
from app.workflow.service import WorkflowService

router = APIRouter(prefix="/executions", tags=["Executions"])

@router.post("", response_model=ExecutionResponse)
async def trigger_execution(
    data: ExecutionTrigger,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ws = db.query(Workspace).filter(Workspace.owner_id == current_user.id).first()
    if not ws:
        raise HTTPException(status_code=400, detail="User workspace not found")
    
    try:
        execution = await WorkflowService.trigger_execution(
            db, workspace_id=ws.id, automation_id=data.automation_id, input_payload=data.variables
        )
        return execution
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("", response_model=list[ExecutionResponse])
def get_executions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ws = db.query(Workspace).filter(Workspace.owner_id == current_user.id).first()
    if not ws:
        return []
    return db.query(WorkflowExecution).filter(WorkflowExecution.workspace_id == ws.id).all()
