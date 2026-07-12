from app.auth.password import hash_password
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate


class UserService:

    @staticmethod
    def create_user(
        db: Session,
        data: UserCreate
    ):

        user = User(
            name=data.name,
            email=data.email,
            password=hash_password(data.password)
        )

        db.add(user)

        db.commit()

        db.refresh(user)

        return user

    @staticmethod
    def get_users(
        db: Session
    ):

        return db.query(User).all()