from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.workspace import Workspace
from app.models.automation import PostAutomation
from app.compiler.compiler import WorkflowCompiler
from app.workflow.client import N8NClient
from pydantic import BaseModel
from typing import Dict, Any, Optional
import httpx

router = APIRouter(prefix="/automations", tags=["Automations"])

class AutomationCreate(BaseModel):
    post_id: str
    permalink: str
    platform: str
    post_thumbnail: Optional[str] = None
    post_caption: Optional[str] = None
    visual_graph: Dict[str, Any]

class AutomationResponse(BaseModel):
    id: int
    workspace_id: int
    post_id: str
    permalink: str
    platform: str
    post_thumbnail: Optional[str]
    post_caption: Optional[str]
    n8n_workflow_id: Optional[str]
    is_active: bool
    visual_graph: Dict[str, Any]
    class Config:
        from_attributes = True

def get_or_create_workspace(db: Session, user_id: int) -> Workspace:
    ws = db.query(Workspace).filter(Workspace.owner_id == user_id).first()
    if not ws:
        ws = Workspace(name="Default Workspace", owner_id=user_id)
        db.add(ws)
        db.commit()
        db.refresh(ws)
    return ws

@router.post("", response_model=AutomationResponse)
def create_automation(
    data: AutomationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
        ws = get_or_create_workspace(db, current_user.id)
    
        # Check if a PostAutomation record already exists for this post
        auto = db.query(PostAutomation).filter(
            PostAutomation.workspace_id == ws.id,
            PostAutomation.post_id == data.post_id
        ).first()
        
        if auto:
            auto.permalink = data.permalink
            auto.platform = data.platform
            auto.post_thumbnail = data.post_thumbnail
            auto.post_caption = data.post_caption
            auto.visual_graph = data.visual_graph
        else:
            auto = PostAutomation(
                workspace_id=ws.id,
                post_id=data.post_id,
                permalink=data.permalink,
                platform=data.platform,
                post_thumbnail=data.post_thumbnail,
                post_caption=data.post_caption,
                visual_graph=data.visual_graph,
                is_active=False
            )
            db.add(auto)
                
        db.commit()

        db.refresh(auto)
        return auto

@router.get("", response_model=list[AutomationResponse])
def list_automations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ws = get_or_create_workspace(db, current_user.id)
    return db.query(PostAutomation).filter(PostAutomation.workspace_id == ws.id).all()

@router.put("/{auto_id}", response_model=AutomationResponse)
def update_automation(
    auto_id: int,
    data: AutomationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ws = get_or_create_workspace(db, current_user.id)
    auto = db.query(PostAutomation).filter(
        PostAutomation.id == auto_id,
        PostAutomation.workspace_id == ws.id
    ).first()
    if not auto:
        raise HTTPException(status_code=404, detail="Automation not found")
    
    auto.post_id = data.post_id
    auto.permalink = data.permalink
    auto.platform = data.platform
    auto.post_thumbnail = data.post_thumbnail
    auto.post_caption = data.post_caption
    auto.visual_graph = data.visual_graph
    db.commit()
    db.refresh(auto)
    return auto
    
@router.post("/{auto_id}/publish", response_model=AutomationResponse)
async def publish_automation(
    auto_id: int,
    activate: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ws = get_or_create_workspace(db, current_user.id)
    auto = db.query(PostAutomation).filter(
        PostAutomation.id == auto_id,
        PostAutomation.workspace_id == ws.id
    ).first()
    if not auto:
        raise HTTPException(status_code=404, detail="Automation not found")

    n8n_json = WorkflowCompiler.compile_graph(auto.id, auto.visual_graph, name=auto.post_caption)

    client = N8NClient()
    try:
        # Strip active key from creation request payload as it is read-only
        post_json = n8n_json.copy()
        if "active" in post_json:
            del post_json["active"]

        updated = False
        if auto.n8n_workflow_id:
            try:
                await client.update_workflow(auto.n8n_workflow_id, post_json)
                updated = True
            except Exception as e:
                if not (hasattr(e, "response") and getattr(e.response, "status_code", None) == 404):
                    raise

        if not updated:
            res = await client.create_workflow(post_json)
            auto.n8n_workflow_id = str(res.get("id"))
        
        # Use dedicated POST activate/deactivate routes to toggle activation state
        if activate:
            await client.activate_workflow(auto.n8n_workflow_id)
        else:
            try:
                await client.deactivate_workflow(auto.n8n_workflow_id)
            except Exception:
                pass
            
        auto.is_active = activate
        db.commit()
        db.refresh(auto)
        return auto
            
        db.commit()
        db.refresh(auto)
        return auto
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to publish to n8n: {str(e)}")

@router.post("/{auto_id}/execute")
async def execute_automation(
    auto_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ws = get_or_create_workspace(db, current_user.id)
    auto = db.query(PostAutomation).filter(
        PostAutomation.id == auto_id,
        PostAutomation.workspace_id == ws.id
    ).first()
    
    if not auto or not auto.n8n_workflow_id:
        raise HTTPException(status_code=404, detail="Workflow not found on n8n")
    
    client = N8NClient()
    try:
        # Execute workflow via its webhook test-mode path endpoint
        webhook_path = f"trigger-{auto.id}"
        async with httpx.AsyncClient() as hc:
            url = f"{client.base_url}/webhook-test/{webhook_path}"
            res = await hc.post(url, json={
                "execution_id": "manual_test_run",
                "body": {"message": "catalog"}
            })
        return {"status": "success", "response": res.json() if res.status_code == 200 else res.text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to execute workflow: {str(e)}")
