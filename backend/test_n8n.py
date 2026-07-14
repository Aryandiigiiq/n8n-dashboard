import asyncio
import httpx
from app.config import N8N_BASE_URL, N8N_API_KEY

async def test():
    print(f"Testing connection to n8n...")
    print(f"Base URL: {N8N_BASE_URL}")
    print(f"API Key: {N8N_API_KEY[:4]}...{N8N_API_KEY[-4:]}" if N8N_API_KEY else "Empty")
    
    url = f"{N8N_BASE_URL.rstrip('/')}/api/v1/workflows"
    headers = {"X-N8N-API-KEY": N8N_API_KEY}
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers)
            if response.status_code == 200:
                print("💚 SUCCESS: Connected to n8n API successfully!")
                print(f"Workflows Count: {len(response.json().get('data', []))}")
            else:
                print(f"❌ ERROR: Received status code {response.status_code}")
                print(response.text)
        except Exception as e:
            print(f"❌ ERROR: Connection failed. Is n8n running?")
            print(str(e))

if __name__ == "__main__":
    asyncio.run(test())
