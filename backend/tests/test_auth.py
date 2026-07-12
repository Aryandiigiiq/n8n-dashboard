import uuid
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_auth_flow():
    email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    user_data = {
        "name": "Test User",
        "email": email,
        "password": "password123"
    }
    
    # 1. Create user
    create_response = client.post("/users", json=user_data)
    assert create_response.status_code == 200
    
    # 2. Login to get access token
    login_data = {
        "username": email,
        "password": "password123"
    }
    login_response = client.post("/auth/login", data=login_data)
    assert login_response.status_code == 200
    token_info = login_response.json()
    assert "access_token" in token_info
    assert token_info["token_type"] == "bearer"
    
    # 3. Request /me using access token
    headers = {
        "Authorization": f"Bearer {token_info['access_token']}"
    }
    me_response = client.get("/me", headers=headers)
    assert me_response.status_code == 200
    me_data = me_response.json()
    assert me_data["name"] == "Test User"
    assert me_data["email"] == email
    assert "id" in me_data
    # Verify exact keys returned
    assert set(me_data.keys()) == {"id", "name", "email"}
