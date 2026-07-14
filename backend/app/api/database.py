from fastapi import APIRouter
from sqlalchemy import text

from app.database.session import SessionLocal

router = APIRouter()


@router.get("/database/health")
def database_health():

    db = SessionLocal()

    try:

        db.execute(text("SELECT 1"))

        return {
            "database": "connected"
        }

    except Exception as e:

        return {
            "database": "error",
            "message": str(e)
        }

    finally:
        db.close()