# Implement:

# login()

# Responsibilities:

# Find user by email
# Verify password
# Generate JWT
# Return token

from app.auth.jwt import create_access_token
from app.auth.password import verify_password
from app.models.user import User
from sqlalchemy.orm import Session
from fastapi import HTTPException

class AuthService:
    @staticmethod
    def login(db: Session, email: str, password: str) -> dict:
        # 1. Find user by email
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # 2. Verify password
        if not verify_password(password, user.password):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # 3. Generate JWT
        access_token = create_access_token({"id": user.id, "name": user.name})

        # 4. Return token
        return {"access_token": access_token, "token_type": "bearer"}