from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.database.session import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.schemas.schedule import ScheduleResponse, ScheduleUpdate
from app.services.schedule_service import ScheduleService

router = APIRouter(
    prefix="/schedules",
    tags=["Schedules"]
)

@router.get("", response_model=list[ScheduleResponse])
def get_schedules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return ScheduleService.get_user_schedules(db, current_user.id)

@router.put("/{schedule_id}/reschedule", response_model=ScheduleResponse)
def reschedule(
    schedule_id: int,
    new_date: datetime,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return ScheduleService.reschedule_item(db, schedule_id, current_user.id, new_date)

@router.delete("/{schedule_id}")
def cancel_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ScheduleService.cancel_schedule_item(db, schedule_id, current_user.id)
    return {"message": "Scheduled task cancelled successfully"}
