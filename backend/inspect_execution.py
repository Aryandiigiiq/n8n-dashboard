from app.database.session import SessionLocal
from app.models.execution import WorkflowExecution
from app.models.log import ExecutionLog

db = SessionLocal()
try:
    execution = db.query(WorkflowExecution).order_by(WorkflowExecution.id.desc()).first()
    if execution:
        print(f"Latest Execution ID: {execution.id}")
        print(f"Status: {execution.status}")
        print(f"Trigger Type: {execution.trigger_type}")
        print(f"Input Payload: {execution.input_payload}")
        print(f"Output Payload: {execution.output_payload}")
        print(f"Created At: {execution.created_at}")
        
        logs = db.query(ExecutionLog).filter(ExecutionLog.execution_id == execution.id).all()
        print("\nLogs:")
        for log in logs:
            print(f"[{log.log_level.upper()}] {log.message}")
    else:
        print("No executions found in database.")
finally:
    db.close()
