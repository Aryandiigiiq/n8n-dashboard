from sqlalchemy.orm import Session
from app.models.execution import WorkflowExecution
from app.models.automation import PostAutomation
from app.models.log import ExecutionLog
from app.workflow.client import N8NClient
from datetime import datetime

class WorkflowService:
    @staticmethod
    def get_or_create_user_workspace(db: Session, user_id: int):
        from app.models.workspace import Workspace
        from app.models.credential import CredentialReference
        ws = db.query(Workspace).filter(Workspace.owner_id == user_id).first()
        if not ws:
            ws = Workspace(name="Default Workspace", owner_id=user_id)
            db.add(ws)
            db.commit()
            db.refresh(ws)

        # Auto-seed default credentials using META_ACCESS_TOKEN if none exist
        cred = db.query(CredentialReference).filter(
            CredentialReference.workspace_id == ws.id
        ).first()
        if not cred:
            import os
            meta_token = os.getenv("META_ACCESS_TOKEN")
            if meta_token:
                cred = CredentialReference(
                    workspace_id=ws.id,
                    platform="instagram",
                    account_id="instagram_me",
                    account_name="Instagram (Auto)",
                    page_id="instagram_page",
                    page_access_token=meta_token,
                    user_access_token=meta_token
                )
                db.add(cred)
                db.commit()
                db.refresh(ws)
        return ws

    @staticmethod
    async def trigger_execution(db: Session, workspace_id: int, automation_id: int, input_payload: dict) -> WorkflowExecution:
        automation = db.query(PostAutomation).filter(PostAutomation.id == automation_id).first()
        if not automation:
            raise Exception("Post Automation not found")

        execution = WorkflowExecution(
            workspace_id=workspace_id,
            automation_id=automation_id,
            status="running",
            trigger_type="manual",
            input_payload=input_payload
        )
        db.add(execution)
        db.commit()
        db.refresh(execution)

        client = N8NClient()
        try:
            # Matches trigger-xxx webhook path
            webhook_path = f"trigger-{automation.id}"
            response = await client.trigger_workflow(webhook_path, {
                "execution_id": execution.id,
                "variables": input_payload
            })
            
            execution.n8n_execution_id = response.get("executionId")
            execution.output_payload = response
            execution.status = "success"
            execution.finished_at = datetime.utcnow()
        except Exception as e:
            execution.status = "failed"
            execution.finished_at = datetime.utcnow()
            log = ExecutionLog(
                execution_id=execution.id,
                log_level="error",
                message=f"Failed to trigger n8n: {str(e)}"
            )
            db.add(log)

        db.commit()
        db.refresh(execution)
        return execution
