from dotenv import load_dotenv
import os

load_dotenv()

APP_NAME = os.getenv("APP_NAME", "SMOS")
APP_VERSION = os.getenv("APP_VERSION", "0.1.0")
DEBUG = os.getenv("DEBUG", "False").lower() == "true"

DATABASE_URL = os.getenv("DATABASE_URL")

JWT_SECRET = os.getenv("JWT_SECRET", "your-super-secret-key")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

META_CLIENT_ID = os.getenv("META_APP_ID", os.getenv("META_CLIENT_ID", "mock-meta-client-id"))
META_CLIENT_SECRET = os.getenv("META_APP_SECRET", os.getenv("META_CLIENT_SECRET", "mock-meta-client-secret"))
META_REDIRECT_URI = os.getenv("META_REDIRECT_URI", "http://localhost:3000/dashboard/accounts")

N8N_BASE_URL = os.getenv("N8N_BASE_URL", "http://localhost:5678")
N8N_API_KEY = os.getenv("N8N_API_KEY", "")
