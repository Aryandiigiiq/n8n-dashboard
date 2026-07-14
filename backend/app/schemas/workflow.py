from datetime import datetime
from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime

class TemplateCreate(BaseModel):
    name: str
    description: Optional[str] = None
    workflow_json: dict

class TemplateResponse(BaseModel):
    id: int
    workspace_id: int
    name: str
    description: Optional[str]
    n8n_workflow_id: Optional[str]
    class Config:
        from_attributes = True

class VariableCreate(BaseModel):
    name: str
    value: Any

class VariableResponse(BaseModel):
    id: int
    workspace_id: int
    name: str
    value: Any
    class Config:
        from_attributes = True

class ExecutionTrigger(BaseModel):
    automation_id: int
    variables: dict

class ExecutionResponse(BaseModel):
    id: int
    workspace_id: int
    automation_id: int
    n8n_execution_id: Optional[str]
    status: str
    trigger_type: str
    created_at: datetime
    class Config:
        from_attributes = True
