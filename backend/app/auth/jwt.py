from datetime import datetime, timedelta, timezone
from typing import Any

from jose import jwt

from app.config import JWT_SECRET, JWT_ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

def create_access_token(data: dict[str, Any]) -> str:
    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        JWT_SECRET,
        algorithm=JWT_ALGORITHM
    )

    return encoded_jwt

def decode_access_token(token: str) -> dict[str, Any]:
    return jwt.decode(
        token,
        JWT_SECRET,
        algorithms=[JWT_ALGORITHM]
    )

def generate_oauth_state(user_id: int, provider: str) -> str:
    import time
    to_encode = {
        "user_id": user_id,
        "provider": provider,
        "exp": int(time.time() + 600)  # 10 minutes expiry
    }
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_oauth_state(state: str, user_id: int, provider: str) -> bool:
    try:
        payload = jwt.decode(state, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload.get("user_id") == user_id and payload.get("provider") == provider
    except Exception:
        return False