import httpx
from app.config import N8N_BASE_URL, N8N_API_KEY

class N8NClient:
    def __init__(self):
        self.base_url = N8N_BASE_URL.rstrip('/')
        self.headers = {
            "X-N8N-API-KEY": N8N_API_KEY,
            "Content-Type": "application/json"
        }

    async def create_workflow(self, workflow_json: dict) -> dict:
        async with httpx.AsyncClient() as client:
            url = f"{self.base_url}/api/v1/workflows"
            response = await client.post(url, json=workflow_json, headers=self.headers)
            # Parse X-Business-Use-Case-Usage headers
            # Handle Estimated-Time-To-Regain-Access pauses if 429/400 Rate limit is hit
            response.raise_for_status()
            return response.json()


    async def update_workflow(self, workflow_id: str, workflow_json: dict) -> dict:
        async with httpx.AsyncClient() as client:
            url = f"{self.base_url}/api/v1/workflows/{workflow_id}"
            response = await client.put(url, json=workflow_json, headers=self.headers)
            response.raise_for_status()
            return response.json()

    async def delete_workflow(self, workflow_id: str) -> bool:
        async with httpx.AsyncClient() as client:
            url = f"{self.base_url}/api/v1/workflows/{workflow_id}"
            response = await client.delete(url, headers=self.headers)
            return response.status_code == 200

    async def trigger_workflow(self, webhook_path: str, payload: dict) -> dict:
        async with httpx.AsyncClient() as client:
            url = f"{self.base_url}/webhook/{webhook_path}"
            response = await client.post(url, json=payload)
            response.raise_for_status()
            return response.json()

    async def activate_workflow(self, workflow_id: str) -> dict:
        async with httpx.AsyncClient() as client:
            url = f"{self.base_url}/api/v1/workflows/{workflow_id}/activate"
            response = await client.post(url, headers=self.headers)
            response.raise_for_status()
            return response.json()

    async def deactivate_workflow(self, workflow_id: str) -> dict:
        async with httpx.AsyncClient() as client:
            url = f"{self.base_url}/api/v1/workflows/{workflow_id}/deactivate"
            response = await client.post(url, headers=self.headers)
            response.raise_for_status()
            return response.json()

    async def execute_workflow(self, workflow_id: str) -> dict:
        async with httpx.AsyncClient() as client:
            url = f"{self.base_url}/api/v1/workflows/{workflow_id}/run"
            response = await client.post(url, headers=self.headers)
            response.raise_for_status()
            return response.json()
