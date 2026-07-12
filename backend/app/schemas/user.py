from pydantic import BaseModel
from pydantic import ConfigDict
from datetime import datetime


class UserCreate(BaseModel):

    name: str

    email: str

    password: str


class UserResponse(BaseModel):

    id: int

    name: str

    email: str

    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


class UserMeResponse(BaseModel):

    id: int

    name: str

    email: str

    model_config = ConfigDict(
        from_attributes=True
    )